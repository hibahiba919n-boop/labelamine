import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { and, count, eq, ne } from 'drizzle-orm';
import { db } from '../db/index.ts';
import { users } from '../db/schema.ts';
import { isSupabaseServerConfigured, supabaseAdmin } from '../lib/supabase-admin.ts';

export interface AdminUserRecord {
  id: number;
  uid: string;
  email: string;
  displayName: string | null;
  role: string;
  isActive: boolean;
}

export interface AuthRequest extends Request {
  adminUser?: AdminUserRecord;
}

// Per-process secret fallback when SESSION_SECRET env var is unset
const EPHEMERAL_SECRET = crypto.randomBytes(32).toString('hex');
function getSessionSecret(): string {
  return process.env.SESSION_SECRET || EPHEMERAL_SECRET;
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const parts = storedHash.split(':');
  if (parts.length !== 2) return false;
  const [salt, expectedHex] = parts;
  if (!salt || !expectedHex) return false;
  const derived = crypto.scryptSync(password, salt, 64);
  const expected = Buffer.from(expectedHex, 'hex');
  if (derived.length !== expected.length) return false;
  return crypto.timingSafeEqual(derived, expected);
}

interface SessionPayload {
  sub: number;
  email: string;
  role: string;
  exp: number;
}

export function signSessionToken(user: {
  id: number;
  email: string;
  role: string;
}): string {
  const payload: SessionPayload = {
    sub: user.id,
    email: user.email,
    role: user.role,
    exp: Date.now() + 8 * 60 * 60 * 1000, // 8 hours
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto
    .createHmac('sha256', getSessionSecret())
    .update(encoded)
    .digest('base64url');
  return `${encoded}.${sig}`;
}

function verifySessionToken(token: string): SessionPayload | null {
  const dotIdx = token.indexOf('.');
  if (dotIdx <= 0) return null;
  const encoded = token.slice(0, dotIdx);
  const providedSig = token.slice(dotIdx + 1);
  if (!encoded || !providedSig) return null;

  const expectedSig = crypto
    .createHmac('sha256', getSessionSecret())
    .update(encoded)
    .digest('base64url');

  const bufA = Buffer.from(providedSig);
  const bufB = Buffer.from(expectedSig);
  if (bufA.length !== bufB.length || !crypto.timingSafeEqual(bufA, bufB)) {
    return null;
  }

  try {
    const parsed = JSON.parse(
      Buffer.from(encoded, 'base64url').toString('utf8')
    ) as SessionPayload;
    if (!parsed || typeof parsed.sub !== 'number' || parsed.exp <= Date.now()) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function mapRowToAdmin(row: Record<string, unknown>): AdminUserRecord {
  return {
    id: Number(row.id),
    uid: String(row.uid),
    email: String(row.email),
    displayName: (row.display_name ?? row.displayName ?? null) as string | null,
    role: String(row.role),
    isActive: Boolean(row.is_active ?? row.isActive),
  };
}

export async function getAuthStatus(): Promise<{
  mode: 'supabase' | 'local';
  needsBootstrap: boolean;
}> {
  if (isSupabaseServerConfigured && supabaseAdmin) {
    const { count: totalAdmins, error } = await supabaseAdmin
      .from('users')
      .select('id', { count: 'exact', head: true });
    if (error) {
      throw error;
    }
    return {
      mode: 'supabase',
      needsBootstrap: (totalAdmins ?? 0) === 0,
    };
  }

  const [{ total }] = await db
    .select({ total: count() })
    .from(users)
    .where(
      and(
        eq(users.role, 'super_admin'),
        eq(users.isActive, true),
        ne(users.passwordHash, '')
      )
    );
  return {
    mode: 'local',
    needsBootstrap: Number(total) === 0,
  };
}

export async function bootstrapFirstAdmin(input: {
  email: string;
  displayName: string;
  password: string;
}): Promise<{
  mode: 'supabase' | 'local';
  token?: string;
  user: AdminUserRecord;
}> {
  const emailLower = input.email.toLowerCase().trim();
  const displayName = input.displayName.trim();

  if (isSupabaseServerConfigured && supabaseAdmin) {
    const { count: existingCount, error: countErr } = await supabaseAdmin
      .from('users')
      .select('id', { count: 'exact', head: true });
    if (countErr) throw countErr;
    if ((existingCount ?? 0) > 0) {
      throw new Error('BOOTSTRAP_LOCKED');
    }

    // Create Supabase Auth user (or locate if already created in Supabase dashboard)
    let authUid = '';
    const { data: createdAuth, error: createAuthErr } =
      await supabaseAdmin.auth.admin.createUser({
        email: emailLower,
        password: input.password,
        email_confirm: true,
        user_metadata: { display_name: displayName },
      });

    if (!createAuthErr && createdAuth.user) {
      authUid = createdAuth.user.id;
    } else if (
      createAuthErr &&
      createAuthErr.message.toLowerCase().includes('already')
    ) {
      const { data: listRes } = await supabaseAdmin.auth.admin.listUsers();
      const matched = (listRes?.users || []).find(
        (u) => (u.email || '').toLowerCase() === emailLower
      );
      if (!matched) throw createAuthErr;
      authUid = matched.id;
    } else if (createAuthErr) {
      throw createAuthErr;
    }

    const { data: inserted, error: insertErr } = await supabaseAdmin
      .from('users')
      .insert({
        uid: authUid,
        email: emailLower,
        display_name: displayName,
        role: 'super_admin',
        is_active: true,
      })
      .select('id, uid, email, display_name, role, is_active')
      .single();

    if (insertErr) throw insertErr;
    return {
      mode: 'supabase',
      user: mapRowToAdmin(inserted as Record<string, unknown>),
    };
  }

  // Local / Cloud SQL preview atomic claim
  const result = await db.transaction(async (tx) => {
    const [{ total }] = await tx
      .select({ total: count() })
      .from(users)
      .where(
        and(
          eq(users.role, 'super_admin'),
          eq(users.isActive, true),
          ne(users.passwordHash, '')
        )
      );

    if (Number(total) > 0) {
      throw new Error('BOOTSTRAP_LOCKED');
    }

    const passwordHash = hashPassword(input.password);
    const [created] = await tx
      .insert(users)
      .values({
        uid: `local:${crypto.randomUUID()}`,
        email: emailLower,
        displayName,
        role: 'super_admin',
        passwordHash,
        isActive: true,
      })
      .onConflictDoUpdate({
        target: users.email,
        set: {
          displayName,
          role: 'super_admin',
          passwordHash,
          isActive: true,
        },
      })
      .returning({
        id: users.id,
        uid: users.uid,
        email: users.email,
        displayName: users.displayName,
        role: users.role,
        isActive: users.isActive,
      });

    return created;
  });

  const adminUser = mapRowToAdmin(result as unknown as Record<string, unknown>);
  const token = signSessionToken({
    id: adminUser.id,
    email: adminUser.email,
    role: adminUser.role,
  });

  return {
    mode: 'local',
    token,
    user: adminUser,
  };
}

export async function loginLocalAdmin(input: {
  email: string;
  password: string;
}): Promise<{ token: string; user: AdminUserRecord } | null> {
  if (isSupabaseServerConfigured) {
    return null;
  }

  const emailLower = input.email.toLowerCase().trim();
  const [row] = await db
    .select()
    .from(users)
    .where(eq(users.email, emailLower))
    .limit(1);

  if (!row || !row.passwordHash) {
    return null;
  }

  if (!verifyPassword(input.password, row.passwordHash)) {
    return null;
  }

  if (!row.isActive) {
    throw new Error('ACCOUNT_DISABLED');
  }

  const adminUser = mapRowToAdmin(row as unknown as Record<string, unknown>);
  const token = signSessionToken({
    id: adminUser.id,
    email: adminUser.email,
    role: adminUser.role,
  });

  return { token, user: adminUser };
}

export const requireAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentification requise.' });
  }

  const token = authHeader.slice('Bearer '.length).trim();
  if (!token) {
    return res.status(401).json({ error: 'Jeton de session manquant.' });
  }

  try {
    if (isSupabaseServerConfigured && supabaseAdmin) {
      const { data: userData, error: authErr } =
        await supabaseAdmin.auth.getUser(token);
      if (authErr || !userData.user) {
        return res.status(401).json({ error: 'Session expirée ou invalide.' });
      }

      const sbUser = userData.user;
      const email = (sbUser.email || '').toLowerCase().trim();
      const displayName =
        (sbUser.user_metadata?.display_name as string | undefined) ||
        (sbUser.user_metadata?.full_name as string | undefined) ||
        email.split('@')[0] ||
        'Administrateur';

      if (!email) {
        return res.status(403).json({ error: 'Adresse e-mail non vérifiée.' });
      }

      let { data: existing } = await supabaseAdmin
        .from('users')
        .select('id, uid, email, display_name, role, is_active')
        .eq('uid', sbUser.id)
        .maybeSingle();

      if (!existing) {
        const { data: byEmail } = await supabaseAdmin
          .from('users')
          .select('id, uid, email, display_name, role, is_active')
          .eq('email', email)
          .maybeSingle();

        if (byEmail) {
          const { data: updated, error: updErr } = await supabaseAdmin
            .from('users')
            .update({
              uid: sbUser.id,
              display_name: byEmail.display_name || displayName,
            })
            .eq('id', byEmail.id)
            .select('id, uid, email, display_name, role, is_active')
            .single();
          if (updErr) throw updErr;
          existing = updated;
        } else {
          const { count: totalAdmins } = await supabaseAdmin
            .from('users')
            .select('id', { count: 'exact', head: true });
          const envAdmins = (process.env.ADMIN_EMAILS || '')
            .split(',')
            .map((e) => e.trim().toLowerCase())
            .filter(Boolean);

          if ((totalAdmins ?? 0) === 0 || envAdmins.includes(email)) {
            const { data: created, error: createErr } = await supabaseAdmin
              .from('users')
              .insert({
                uid: sbUser.id,
                email,
                display_name: displayName,
                role: 'super_admin',
                is_active: true,
              })
              .select('id, uid, email, display_name, role, is_active')
              .single();
            if (createErr) throw createErr;
            existing = created;
          } else {
            return res.status(403).json({
              error:
                "Accès refusé. Ce compte n'est pas autorisé dans l'administration du laboratoire.",
            });
          }
        }
      }

      const adminUser = mapRowToAdmin(existing as Record<string, unknown>);
      if (!adminUser.isActive) {
        return res.status(403).json({
          error: 'Ce compte administrateur est actuellement désactivé.',
        });
      }

      req.adminUser = adminUser;
      return next();
    }

    // Local preview mode (HMAC-SHA256 Bearer token verified against Cloud SQL PostgreSQL)
    const payload = verifySessionToken(token);
    if (!payload) {
      return res.status(401).json({ error: 'Session expirée ou invalide.' });
    }

    const [row] = await db
      .select({
        id: users.id,
        uid: users.uid,
        email: users.email,
        displayName: users.displayName,
        role: users.role,
        isActive: users.isActive,
      })
      .from(users)
      .where(eq(users.id, payload.sub))
      .limit(1);

    if (!row) {
      return res.status(401).json({ error: 'Compte administrateur introuvable.' });
    }

    const adminUser = mapRowToAdmin(row as unknown as Record<string, unknown>);
    if (!adminUser.isActive) {
      return res.status(403).json({
        error: 'Ce compte administrateur est actuellement désactivé.',
      });
    }

    req.adminUser = adminUser;
    return next();
  } catch (error) {
    console.error('Admin auth verification error:', error);
    return res.status(401).json({ error: 'Session expirée ou invalide.' });
  }
};

export const requireRoles = (allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.adminUser || !allowedRoles.includes(req.adminUser.role)) {
      return res.status(403).json({
        error: 'Droits insuffisants pour cette action.',
      });
    }
    return next();
  };
};
