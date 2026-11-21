import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import multer from 'multer';
import { z } from 'zod';
import { createServer as createViteServer } from 'vite';
import { ensureSeeded } from './src/db/seed.ts';
import {
  createContactMessage,
  createExamination,
  createGalleryPhoto,
  createHomeSampling,
  createJobPosition,
  createRecruitmentApplication,
  createSpecialty,
  deleteAdminUser,
  deleteExamination,
  deleteGalleryPhoto,
  deleteJobPosition,
  deleteSpecialty,
  getAdminOverviewData,
  getApplicationCv,
  getSettingsBundle,
  listAdminUsers,
  listContactMessages,
  listExaminations,
  listGallery,
  listHomeSampling,
  listJobPositions,
  listRecruitmentApplications,
  listSpecialties,
  logActivity,
  updateAdminUser,
  updateContactMessage,
  updateExamination,
  updateGalleryPhoto,
  updateHomeSampling,
  updateJobPosition,
  updateRecruitmentApplication,
  updateSpecialty,
  upsertAdminUser,
  upsertSetting,
} from './src/db/repository.ts';
import { isSupabaseServerConfigured, supabaseAdmin } from './src/lib/supabase-admin.ts';
import {
  AuthRequest,
  bootstrapFirstAdmin,
  getAuthStatus,
  hashPassword,
  loginLocalAdmin,
  requireAdmin,
  requireRoles,
} from './src/middleware/auth.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.set('trust proxy', 1);
app.use(express.json({ limit: '2mb' }));

// Security headers
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Simple sliding-window rate limiter
const rateStore = new Map<string, number[]>();
function rateLimit(maxRequests: number, windowMs: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const key = `${req.path}:${ip}`;
    const now = Date.now();
    const recent = (rateStore.get(key) || []).filter((ts) => now - ts < windowMs);
    if (recent.length >= maxRequests) {
      return res.status(429).json({
        error:
          'Trop de requêtes envoyées. Veuillez patienter quelques minutes avant de réessayer.',
      });
    }
    recent.push(now);
    rateStore.set(key, recent);
    return next();
  };
}

// Validation schemas
const authBootstrapSchema = z.object({
  email: z.string().trim().email('Adresse e-mail invalide').max(160),
  displayName: z.string().trim().min(2, 'Nom complet requis').max(120),
  password: z
    .string()
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères.')
    .max(128),
});

const authLoginSchema = z.object({
  email: z.string().trim().email('Adresse e-mail invalide').max(160),
  password: z.string().min(1, 'Mot de passe requis').max(128),
});

const homeSamplingSchema = z.object({
  patientName: z.string().trim().min(2, 'Nom complet requis').max(120),
  phone: z
    .string()
    .trim()
    .min(8, 'Numéro de téléphone invalide')
    .max(30)
    .regex(/^[+0-9\s().-]+$/, 'Format de numéro invalide'),
  address: z.string().trim().min(5, 'Adresse complète requise').max(280),
  requestedDate: z.string().trim().min(4, 'Date souhaitée requise').max(40),
  preferredTime: z.string().trim().min(2, 'Créneau souhaité requis').max(60),
  additionalInfo: z.string().trim().max(1000).optional().default(''),
  website: z.string().optional().default(''),
});

const contactSchema = z.object({
  senderName: z.string().trim().min(2, 'Nom complet requis').max(120),
  phone: z.string().trim().max(30).optional().default(''),
  email: z
    .string()
    .trim()
    .email('Adresse e-mail invalide')
    .optional()
    .or(z.literal('')),
  subject: z.string().trim().min(2, 'Objet requis').max(160),
  message: z.string().trim().min(5, 'Message trop court').max(2000),
  website: z.string().optional().default(''),
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
});

const recruitmentApplySchema = z.object({
  positionId: z.string().optional().default(''),
  positionTitle: z.string().trim().min(2, 'Poste visé requis').max(160),
  applicantName: z.string().trim().min(2, 'Nom complet requis').max(120),
  email: z.string().trim().email('Adresse e-mail invalide').max(160),
  phone: z
    .string()
    .trim()
    .min(8, 'Numéro de téléphone invalide')
    .max(30)
    .regex(/^[+0-9\s().-]+$/, 'Format de numéro invalide'),
  message: z.string().trim().max(2000).optional().default(''),
  website: z.string().optional().default(''),
});

const specialtySchema = z.object({
  slug: z
    .string()
    .trim()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9-]+$/, 'Slug invalide'),
  name: z.string().trim().min(2).max(120),
  shortDescription: z.string().trim().min(4).max(300),
  fullDescription: z.string().trim().min(4).max(2000),
  iconName: z.string().trim().min(2).max(40).default('FlaskConical'),
  imageUrl: z.string().trim().max(500).optional().default(''),
  isPublished: z.boolean().default(true),
  sortOrder: z.number().int().min(0).max(999).default(0),
});

const examinationSchema = z.object({
  specialtyId: z.number().int().positive().nullable().optional(),
  code: z.string().trim().min(2).max(30),
  name: z.string().trim().min(2).max(180),
  sampleType: z.string().trim().min(2).max(160),
  preparation: z.string().trim().min(2).max(500),
  fastingRequired: z.boolean().default(false),
  turnaroundTime: z.string().trim().min(2).max(120),
  notes: z.string().trim().max(500).optional().default(''),
  isPublished: z.boolean().default(true),
});

const gallerySchema = z.object({
  title: z.string().trim().min(2).max(160),
  caption: z.string().trim().min(2).max(400),
  category: z.string().trim().min(2).max(60),
  imageUrl: z
    .string()
    .trim()
    .min(2)
    .max(500)
    .refine(
      (url) =>
        url.startsWith('/assets/') ||
        url.startsWith('/src/assets/') ||
        url.startsWith('https://'),
      'URL image non autorisée'
    ),
  isAuthentic: z.boolean().default(true),
  isPublished: z.boolean().default(true),
  sortOrder: z.number().int().min(0).max(999).default(0),
});

const jobPositionSchema = z.object({
  title: z.string().trim().min(2).max(160),
  department: z.string().trim().min(2).max(120),
  contractType: z.string().trim().min(2).max(80),
  description: z.string().trim().min(5).max(1500),
  isOpen: z.boolean().default(true),
});

const requestUpdateSchema = z.object({
  status: z.string().trim().min(2).max(40),
  internalNotes: z.string().trim().max(2000).optional().default(''),
});

const adminAccountSchema = z.object({
  email: z.string().trim().email('Adresse e-mail invalide'),
  displayName: z.string().trim().min(2).max(120),
  role: z.enum(['super_admin', 'admin', 'editor']),
  password: z
    .string()
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères.')
    .max(128)
    .optional()
    .or(z.literal('')),
});

function sanitizeFilename(name: string): string {
  const base = path.basename(name).replace(/[^a-zA-Z0-9._-]/g, '_');
  return base || 'cv_candidat.pdf';
}

function isPdfBuffer(buf: Buffer): boolean {
  if (buf.length < 5) return false;
  return (
    buf[0] === 0x25 && // %
    buf[1] === 0x50 && // P
    buf[2] === 0x44 && // D
    buf[3] === 0x46 && // F
    buf[4] === 0x2d // -
  );
}

// ==========================================
// SEO Endpoints (sitemap.xml & robots.txt)
// ==========================================
app.get('/robots.txt', (req, res) => {
  const baseUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
  res
    .type('text/plain')
    .send(
      `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/\nSitemap: ${baseUrl}/sitemap.xml\n`
    );
});

app.get('/sitemap.xml', (req, res) => {
  const baseUrl = (
    process.env.APP_URL || `${req.protocol}://${req.get('host')}`
  ).replace(/\/$/, '');
  const routes = [
    '/',
    '/laboratoire',
    '/specialites',
    '/examens',
    '/prelevement-domicile',
    '/contact',
    '/nous-rejoindre',
  ];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes
  .map(
    (route) => `  <url>
    <loc>${baseUrl}${route}</loc>
    <changefreq>weekly</changefreq>
    <priority>${route === '/' ? '1.0' : '0.8'}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;
  res.type('application/xml').send(xml);
});

// ==========================================
// Admin Authentication Endpoints
// ==========================================
app.get('/api/auth/config', async (_req, res) => {
  try {
    const status = await getAuthStatus();
    return res.json(status);
  } catch (error) {
    console.error('Auth config check error:', error);
    return res.status(500).json({
      error: "Impossible de vérifier la configuration d'authentification.",
    });
  }
});

app.post(
  '/api/auth/bootstrap',
  rateLimit(6, 15 * 60 * 1000),
  async (req, res) => {
    try {
      const parsed = authBootstrapSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: parsed.error.issues[0]?.message || 'Données invalides.',
        });
      }

      const result = await bootstrapFirstAdmin({
        email: parsed.data.email,
        displayName: parsed.data.displayName,
        password: parsed.data.password,
      });

      await logActivity(
        'admin',
        `Compte Super Administrateur initial configuré : ${result.user.email}`,
        result.user.email
      );

      return res.status(201).json(result);
    } catch (error) {
      if (error instanceof Error && error.message === 'BOOTSTRAP_LOCKED') {
        return res.status(403).json({
          error:
            "Un compte Super Administrateur est déjà configuré. Utilisez la connexion habituelle.",
        });
      }
      console.error('Auth bootstrap error:', error);
      return res.status(500).json({
        error: "Impossible d'initialiser le compte Super Administrateur.",
      });
    }
  }
);

app.post(
  '/api/auth/login',
  rateLimit(12, 15 * 60 * 1000),
  async (req, res) => {
    try {
      if (isSupabaseServerConfigured) {
        return res.status(400).json({
          error:
            'La connexion s’effectue directement via Supabase Authentication.',
        });
      }

      const parsed = authLoginSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: parsed.error.issues[0]?.message || 'Identifiants invalides.',
        });
      }

      const session = await loginLocalAdmin(parsed.data);
      if (!session) {
        return res.status(401).json({
          error: 'Adresse e-mail ou mot de passe incorrect.',
        });
      }

      return res.json(session);
    } catch (error) {
      if (error instanceof Error && error.message === 'ACCOUNT_DISABLED') {
        return res.status(403).json({
          error: 'Ce compte administrateur est actuellement désactivé.',
        });
      }
      console.error('Auth login error:', error);
      return res.status(500).json({
        error: 'Erreur lors de la vérification des identifiants.',
      });
    }
  }
);

// ==========================================
// Public API Routes
// ==========================================
app.get('/api/public/bootstrap', async (_req, res) => {
  try {
    await ensureSeeded();
    const [settings, specRows, examRows, galleryRows, positionRows] =
      await Promise.all([
        getSettingsBundle(),
        listSpecialties(true),
        listExaminations(true),
        listGallery(true),
        listJobPositions(true),
      ]);

    return res.json({
      settings,
      specialties: specRows,
      examinations: examRows,
      gallery: galleryRows,
      positions: positionRows,
    });
  } catch (error) {
    console.error('Bootstrap fetch error:', error);
    return res.status(500).json({
      error:
        'Impossible de charger les données du laboratoire pour le moment.',
    });
  }
});

app.post(
  '/api/public/home-sampling',
  rateLimit(8, 10 * 60 * 1000),
  async (req, res) => {
    try {
      await ensureSeeded();
      const parsed = homeSamplingSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: parsed.error.issues[0]?.message || 'Données invalides.',
        });
      }
      if (parsed.data.website) {
        return res.status(201).json({ ok: true });
      }

      const created = await createHomeSampling({
        patientName: parsed.data.patientName,
        phone: parsed.data.phone,
        address: parsed.data.address,
        requestedDate: parsed.data.requestedDate,
        preferredTime: parsed.data.preferredTime,
        additionalInfo: parsed.data.additionalInfo,
      });

      await logActivity(
        'sampling',
        `Nouvelle demande de prélèvement à domicile — ${parsed.data.patientName} (${parsed.data.requestedDate})`,
        parsed.data.patientName
      );

      return res.status(201).json({
        id: created.id,
        message:
          'Votre demande de prélèvement à domicile a bien été enregistrée. Le secrétariat du laboratoire vous contactera pour confirmer le passage.',
      });
    } catch (error) {
      console.error('Home sampling submission error:', error);
      return res.status(500).json({
        error:
          "Erreur lors de l'enregistrement de la demande. Veuillez réessayer ou appeler le +213 797 10 84 42.",
      });
    }
  }
);

app.post(
  '/api/public/contact',
  rateLimit(8, 10 * 60 * 1000),
  async (req, res) => {
    try {
      await ensureSeeded();
      const parsed = contactSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: parsed.error.issues[0]?.message || 'Données invalides.',
        });
      }
      if (parsed.data.website) {
        return res.status(201).json({ ok: true });
      }

      const created = await createContactMessage({
        senderName: parsed.data.senderName,
        phone: parsed.data.phone,
        email: parsed.data.email || '',
        subject: parsed.data.subject,
        message: parsed.data.message,
      });

      await logActivity(
        'contact',
        `Nouveau message de contact — ${parsed.data.senderName} : ${parsed.data.subject}`,
        parsed.data.senderName
      );

      return res.status(201).json({
        id: created.id,
        message:
          'Votre message a bien été transmis aux Laboratoires El Amine. Notre équipe vous répondra dans les meilleurs délais.',
      });
    } catch (error) {
      console.error('Contact submission error:', error);
      return res.status(500).json({
        error: "Erreur lors de l'envoi du message.",
      });
    }
  }
);

app.post(
  '/api/public/recruitment/apply',
  rateLimit(6, 15 * 60 * 1000),
  upload.single('cv'),
  async (req, res) => {
    try {
      await ensureSeeded();
      const settings = await getSettingsBundle();
      if (!settings.recruitment.enabled) {
        return res.status(403).json({
          error: 'Le module de recrutement est actuellement fermé.',
        });
      }

      const parsed = recruitmentApplySchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: parsed.error.issues[0]?.message || 'Données invalides.',
        });
      }
      if (parsed.data.website) {
        return res.status(201).json({ ok: true });
      }

      const file = req.file;
      if (!file) {
        return res
          .status(400)
          .json({ error: 'Veuillez joindre votre CV au format PDF.' });
      }

      const ext = path.extname(file.originalname).toLowerCase();
      if (
        file.mimetype !== 'application/pdf' ||
        ext !== '.pdf' ||
        !isPdfBuffer(file.buffer)
      ) {
        return res.status(400).json({
          error:
            'Format non valide : seul le format PDF authentique (max 5 Mo) est accepté.',
        });
      }

      const positionIdNum = parsed.data.positionId
        ? Number(parsed.data.positionId)
        : null;
      const safePositionId =
        positionIdNum && Number.isInteger(positionIdNum) && positionIdNum > 0
          ? positionIdNum
          : null;

      const created = await createRecruitmentApplication(
        {
          positionId: safePositionId,
          positionTitle: parsed.data.positionTitle,
          applicantName: parsed.data.applicantName,
          email: parsed.data.email,
          phone: parsed.data.phone,
          message: parsed.data.message,
          cvFilename: sanitizeFilename(file.originalname),
          cvSize: file.size,
        },
        file.buffer
      );

      await logActivity(
        'recruitment',
        `Nouvelle candidature reçue — ${parsed.data.applicantName} (${parsed.data.positionTitle})`,
        parsed.data.applicantName
      );

      return res.status(201).json({
        id: created.id,
        message: 'Votre candidature et votre CV ont bien été enregistrés.',
      });
    } catch (error) {
      console.error('Recruitment application error:', error);
      return res.status(500).json({
        error: "Erreur lors de l'envoi de votre candidature.",
      });
    }
  }
);

// ==========================================
// Protected Admin API Routes
// ==========================================
app.get('/api/admin/me', requireAdmin, async (req: AuthRequest, res) => {
  return res.json({ user: req.adminUser });
});

app.get('/api/admin/overview', requireAdmin, async (_req, res) => {
  try {
    await ensureSeeded();
    const overview = await getAdminOverviewData();
    return res.json(overview);
  } catch (error) {
    console.error('Admin overview error:', error);
    return res
      .status(500)
      .json({ error: 'Erreur lors du chargement du tableau de bord.' });
  }
});

// Requests management
app.get('/api/admin/requests/sampling', requireAdmin, async (_req, res) => {
  try {
    const rows = await listHomeSampling();
    return res.json(rows);
  } catch (error) {
    console.error('Fetch sampling requests error:', error);
    return res
      .status(500)
      .json({ error: 'Erreur lors de la récupération des demandes.' });
  }
});

app.patch(
  '/api/admin/requests/sampling/:id',
  requireAdmin,
  async (req: AuthRequest, res) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ error: 'Identifiant invalide.' });
      }
      const parsed = requestUpdateSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: 'Données invalides.' });
      }

      const updated = await updateHomeSampling(
        id,
        parsed.data.status,
        parsed.data.internalNotes
      );
      if (!updated) {
        return res.status(404).json({ error: 'Demande introuvable.' });
      }

      await logActivity(
        'sampling',
        `Demande domicile #${id} (${updated.patientName}) passée en "${parsed.data.status}"`,
        req.adminUser?.email
      );
      return res.json(updated);
    } catch (error) {
      console.error('Update sampling request error:', error);
      return res
        .status(500)
        .json({ error: 'Impossible de mettre à jour la demande.' });
    }
  }
);

app.get('/api/admin/requests/contact', requireAdmin, async (_req, res) => {
  try {
    const rows = await listContactMessages();
    return res.json(rows);
  } catch (error) {
    console.error('Fetch contact messages error:', error);
    return res
      .status(500)
      .json({ error: 'Erreur lors de la récupération des messages.' });
  }
});

app.patch(
  '/api/admin/requests/contact/:id',
  requireAdmin,
  async (req: AuthRequest, res) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ error: 'Identifiant invalide.' });
      }
      const parsed = requestUpdateSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: 'Données invalides.' });
      }

      const updated = await updateContactMessage(
        id,
        parsed.data.status,
        parsed.data.internalNotes
      );
      if (!updated) {
        return res.status(404).json({ error: 'Message introuvable.' });
      }

      await logActivity(
        'contact',
        `Message #${id} (${updated.senderName}) marqué "${parsed.data.status}"`,
        req.adminUser?.email
      );
      return res.json(updated);
    } catch (error) {
      console.error('Update contact message error:', error);
      return res
        .status(500)
        .json({ error: 'Impossible de mettre à jour le message.' });
    }
  }
);

// Recruitment management
app.get(
  '/api/admin/recruitment/applications',
  requireAdmin,
  async (_req, res) => {
    try {
      const rows = await listRecruitmentApplications();
      return res.json(rows);
    } catch (error) {
      console.error('Fetch recruitment applications error:', error);
      return res
        .status(500)
        .json({ error: 'Erreur lors du chargement des candidatures.' });
    }
  }
);

app.patch(
  '/api/admin/recruitment/applications/:id',
  requireAdmin,
  async (req: AuthRequest, res) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ error: 'Identifiant invalide.' });
      }
      const parsed = requestUpdateSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: 'Données invalides.' });
      }
      const updated = await updateRecruitmentApplication(
        id,
        parsed.data.status,
        parsed.data.internalNotes
      );

      if (!updated) {
        return res.status(404).json({ error: 'Candidature introuvable.' });
      }

      await logActivity(
        'recruitment',
        `Candidature #${id} (${updated.applicantName}) passée à "${parsed.data.status}"`,
        req.adminUser?.email
      );
      return res.json(updated);
    } catch (error) {
      console.error('Update recruitment application error:', error);
      return res
        .status(500)
        .json({ error: 'Impossible de mettre à jour la candidature.' });
    }
  }
);

app.get(
  '/api/admin/recruitment/applications/:id/cv',
  requireAdmin,
  async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ error: 'Identifiant invalide.' });
      }
      const cv = await getApplicationCv(id);
      if (!cv) {
        return res.status(404).json({ error: 'CV introuvable.' });
      }

      res.setHeader('Content-Type', cv.mimeType);
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${sanitizeFilename(cv.filename)}"`
      );
      return res.send(cv.buffer);
    } catch (error) {
      console.error('Download CV error:', error);
      return res
        .status(500)
        .json({ error: 'Erreur lors du téléchargement du CV.' });
    }
  }
);

app.post(
  '/api/admin/recruitment/positions',
  requireAdmin,
  async (req: AuthRequest, res) => {
    try {
      const parsed = jobPositionSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: parsed.error.issues[0]?.message || 'Données invalides.',
        });
      }
      const created = await createJobPosition(parsed.data);
      await logActivity(
        'recruitment',
        `Poste créé : ${created.title}`,
        req.adminUser?.email
      );
      return res.status(201).json(created);
    } catch (error) {
      console.error('Create job position error:', error);
      return res
        .status(500)
        .json({ error: 'Erreur lors de la création du poste.' });
    }
  }
);

app.patch(
  '/api/admin/recruitment/positions/:id',
  requireAdmin,
  async (req: AuthRequest, res) => {
    try {
      const id = Number(req.params.id);
      const parsed = jobPositionSchema.partial().safeParse(req.body);
      if (!Number.isInteger(id) || id <= 0 || !parsed.success) {
        return res.status(400).json({ error: 'Requête invalide.' });
      }
      const updated = await updateJobPosition(id, parsed.data);
      if (!updated) return res.status(404).json({ error: 'Poste introuvable.' });
      return res.json(updated);
    } catch (error) {
      console.error('Update job position error:', error);
      return res
        .status(500)
        .json({ error: 'Erreur lors de la mise à jour du poste.' });
    }
  }
);

app.delete(
  '/api/admin/recruitment/positions/:id',
  requireAdmin,
  async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ error: 'Identifiant invalide.' });
      }
      await deleteJobPosition(id);
      return res.json({ ok: true });
    } catch (error) {
      console.error('Delete job position error:', error);
      return res.status(500).json({ error: 'Erreur lors de la suppression.' });
    }
  }
);

// Content & Settings Management
app.put('/api/admin/settings/:key', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const key = String(req.params.key);
    if (!['general', 'homepage', 'about', 'hours', 'recruitment'].includes(key)) {
      return res.status(400).json({ error: 'Section de paramètres inconnue.' });
    }

    const payload = req.body;
    if (!payload || typeof payload !== 'object') {
      return res.status(400).json({ error: 'Contenu invalide.' });
    }

    const updated = await upsertSetting(key, payload);
    await logActivity(
      'content',
      `Paramètres "${key}" mis à jour`,
      req.adminUser?.email
    );
    return res.json(updated);
  } catch (error) {
    console.error('Update settings error:', error);
    return res.status(500).json({ error: 'Erreur lors de la sauvegarde.' });
  }
});

// Specialties CRUD
app.post('/api/admin/specialties', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const parsed = specialtySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: parsed.error.issues[0]?.message || 'Données invalides.',
      });
    }
    const created = await createSpecialty({
      ...parsed.data,
      imageUrl: parsed.data.imageUrl || null,
    });
    await logActivity(
      'content',
      `Spécialité ajoutée : ${created.name}`,
      req.adminUser?.email
    );
    return res.status(201).json(created);
  } catch (error) {
    console.error('Create specialty error:', error);
    return res
      .status(500)
      .json({ error: 'Impossible de créer la spécialité.' });
  }
});

app.patch(
  '/api/admin/specialties/:id',
  requireAdmin,
  async (req: AuthRequest, res) => {
    try {
      const id = Number(req.params.id);
      const parsed = specialtySchema.partial().safeParse(req.body);
      if (!Number.isInteger(id) || id <= 0 || !parsed.success) {
        return res.status(400).json({ error: 'Données invalides.' });
      }
      const updated = await updateSpecialty(id, parsed.data);
      if (!updated) {
        return res.status(404).json({ error: 'Spécialité introuvable.' });
      }
      await logActivity(
        'content',
        `Spécialité modifiée : ${updated.name}`,
        req.adminUser?.email
      );
      return res.json(updated);
    } catch (error) {
      console.error('Update specialty error:', error);
      return res
        .status(500)
        .json({ error: 'Impossible de modifier la spécialité.' });
    }
  }
);

app.delete(
  '/api/admin/specialties/:id',
  requireAdmin,
  async (req: AuthRequest, res) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ error: 'Identifiant invalide.' });
      }
      await deleteSpecialty(id);
      await logActivity(
        'content',
        `Spécialité #${id} supprimée`,
        req.adminUser?.email
      );
      return res.json({ ok: true });
    } catch (error) {
      console.error('Delete specialty error:', error);
      return res
        .status(500)
        .json({ error: 'Impossible de supprimer la spécialité.' });
    }
  }
);

// Examinations CRUD
app.post('/api/admin/examinations', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const parsed = examinationSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: parsed.error.issues[0]?.message || 'Données invalides.',
      });
    }
    const created = await createExamination({
      specialtyId: parsed.data.specialtyId ?? null,
      code: parsed.data.code,
      name: parsed.data.name,
      sampleType: parsed.data.sampleType,
      preparation: parsed.data.preparation,
      fastingRequired: parsed.data.fastingRequired,
      turnaroundTime: parsed.data.turnaroundTime,
      notes: parsed.data.notes || null,
      isPublished: parsed.data.isPublished,
    });
    await logActivity(
      'content',
      `Examen ajouté : ${created.name}`,
      req.adminUser?.email
    );
    return res.status(201).json(created);
  } catch (error) {
    console.error('Create examination error:', error);
    return res.status(500).json({ error: "Impossible d'ajouter l'examen." });
  }
});

app.patch(
  '/api/admin/examinations/:id',
  requireAdmin,
  async (req: AuthRequest, res) => {
    try {
      const id = Number(req.params.id);
      const parsed = examinationSchema.partial().safeParse(req.body);
      if (!Number.isInteger(id) || id <= 0 || !parsed.success) {
        return res.status(400).json({ error: 'Données invalides.' });
      }
      const updated = await updateExamination(id, parsed.data);
      if (!updated) {
        return res.status(404).json({ error: 'Examen introuvable.' });
      }
      await logActivity(
        'content',
        `Examen modifié : ${updated.name}`,
        req.adminUser?.email
      );
      return res.json(updated);
    } catch (error) {
      console.error('Update examination error:', error);
      return res
        .status(500)
        .json({ error: "Impossible de modifier l'examen." });
    }
  }
);

app.delete(
  '/api/admin/examinations/:id',
  requireAdmin,
  async (req: AuthRequest, res) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ error: 'Identifiant invalide.' });
      }
      await deleteExamination(id);
      await logActivity(
        'content',
        `Examen #${id} supprimé`,
        req.adminUser?.email
      );
      return res.json({ ok: true });
    } catch (error) {
      console.error('Delete examination error:', error);
      return res
        .status(500)
        .json({ error: "Impossible de supprimer l'examen." });
    }
  }
);

// Gallery CRUD
app.post('/api/admin/gallery', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const parsed = gallerySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: parsed.error.issues[0]?.message || 'Données invalides.',
      });
    }
    const created = await createGalleryPhoto(parsed.data);
    await logActivity(
      'content',
      `Photo ajoutée à la galerie : ${created.title}`,
      req.adminUser?.email
    );
    return res.status(201).json(created);
  } catch (error) {
    console.error('Create gallery photo error:', error);
    return res
      .status(500)
      .json({ error: "Impossible d'ajouter la photographie." });
  }
});

app.patch('/api/admin/gallery/:id', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);
    const parsed = gallerySchema.partial().safeParse(req.body);
    if (!Number.isInteger(id) || id <= 0 || !parsed.success) {
      return res.status(400).json({ error: 'Données invalides.' });
    }
    const updated = await updateGalleryPhoto(id, parsed.data);
    if (!updated) {
      return res.status(404).json({ error: 'Photographie introuvable.' });
    }
    return res.json(updated);
  } catch (error) {
    console.error('Update gallery photo error:', error);
    return res
      .status(500)
      .json({ error: 'Impossible de modifier la photographie.' });
  }
});

app.delete(
  '/api/admin/gallery/:id',
  requireAdmin,
  async (req: AuthRequest, res) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ error: 'Identifiant invalide.' });
      }
      await deleteGalleryPhoto(id);
      return res.json({ ok: true });
    } catch (error) {
      console.error('Delete gallery photo error:', error);
      return res
        .status(500)
        .json({ error: 'Impossible de supprimer la photographie.' });
    }
  }
);

// Admin Accounts & Roles (super_admin only)
app.get('/api/admin/users', requireAdmin, async (_req, res) => {
  try {
    const rows = await listAdminUsers();
    return res.json(rows);
  } catch (error) {
    console.error('List admin users error:', error);
    return res
      .status(500)
      .json({ error: 'Erreur lors du chargement des administrateurs.' });
  }
});

app.post(
  '/api/admin/users',
  requireAdmin,
  requireRoles(['super_admin']),
  async (req: AuthRequest, res) => {
    try {
      const parsed = adminAccountSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: parsed.error.issues[0]?.message || 'Données invalides.',
        });
      }

      const emailLower = parsed.data.email.toLowerCase().trim();
      const rawPassword = parsed.data.password || '';
      let supabaseUid: string | undefined;
      let passwordHash: string | undefined;

      if (isSupabaseServerConfigured && supabaseAdmin) {
        if (rawPassword) {
          const { data: createdAuth, error: authErr } =
            await supabaseAdmin.auth.admin.createUser({
              email: emailLower,
              password: rawPassword,
              email_confirm: true,
              user_metadata: { display_name: parsed.data.displayName },
            });
          if (!authErr && createdAuth.user) {
            supabaseUid = createdAuth.user.id;
          } else if (
            authErr &&
            authErr.message.toLowerCase().includes('already')
          ) {
            const { data: listRes } = await supabaseAdmin.auth.admin.listUsers();
            const matched = (listRes?.users || []).find(
              (u) => (u.email || '').toLowerCase() === emailLower
            );
            if (matched) supabaseUid = matched.id;
          } else if (authErr) {
            return res.status(400).json({ error: authErr.message });
          }
        }
      } else if (rawPassword) {
        passwordHash = hashPassword(rawPassword);
      }

      const created = await upsertAdminUser({
        email: emailLower,
        displayName: parsed.data.displayName,
        role: parsed.data.role,
        passwordHash,
        supabaseUid,
      });

      await logActivity(
        'admin',
        `Compte administrateur configuré : ${emailLower} (${parsed.data.role})`,
        req.adminUser?.email
      );
      return res.status(201).json(created);
    } catch (error) {
      console.error('Add admin user error:', error);
      return res
        .status(500)
        .json({ error: 'Impossible d’ajouter cet administrateur.' });
    }
  }
);

app.patch(
  '/api/admin/users/:id',
  requireAdmin,
  requireRoles(['super_admin']),
  async (req: AuthRequest, res) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ error: 'ID invalide.' });
      }
      if (req.adminUser?.id === id && req.body.isActive === false) {
        return res.status(400).json({
          error: 'Vous ne pouvez pas désactiver votre propre compte.',
        });
      }

      const updateFields: Partial<{
        role: string;
        isActive: boolean;
        displayName: string;
      }> = {};
      if (
        typeof req.body.role === 'string' &&
        ['super_admin', 'admin', 'editor'].includes(req.body.role)
      ) {
        updateFields.role = req.body.role;
      }
      if (typeof req.body.isActive === 'boolean') {
        updateFields.isActive = req.body.isActive;
      }
      if (
        typeof req.body.displayName === 'string' &&
        req.body.displayName.trim()
      ) {
        updateFields.displayName = req.body.displayName.trim();
      }

      const updated = await updateAdminUser(id, updateFields);
      if (!updated) return res.status(404).json({ error: 'Compte introuvable.' });
      return res.json(updated);
    } catch (error) {
      console.error('Update admin user error:', error);
      return res
        .status(500)
        .json({ error: 'Erreur lors de la mise à jour du compte.' });
    }
  }
);

app.delete(
  '/api/admin/users/:id',
  requireAdmin,
  requireRoles(['super_admin']),
  async (req: AuthRequest, res) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ error: 'ID invalide.' });
      }
      if (req.adminUser?.id === id) {
        return res.status(400).json({
          error: 'Vous ne pouvez pas supprimer votre propre compte.',
        });
      }
      await deleteAdminUser(id);
      return res.json({ ok: true });
    } catch (error) {
      console.error('Delete admin user error:', error);
      return res
        .status(500)
        .json({ error: 'Erreur lors de la suppression du compte.' });
    }
  }
);

// ==========================================
// Vite Dev Middleware / Production Static
// ==========================================
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

if (!process.env.VERCEL) {
  startServer();
}

export default app;
