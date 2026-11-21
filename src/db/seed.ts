import { count } from 'drizzle-orm';
import { db } from './index.js';
import {
  examinations,
  galleryPhotos,
  jobPositions,
  siteSettings,
  specialties,
} from './schema.js';
import { isSupabaseServerConfigured, supabaseAdmin } from '../lib/supabase-admin.js';

let seedPromise: Promise<void> | null = null;

export const DEFAULT_SETTINGS = {
  general: {
    labName: "Laboratoires d'analyses médicales El Amine",
    shortName: 'Laboratoire El Amine',
    address: 'W3FF+4FG, Mostaganem, Algérie',
    city: 'Mostaganem',
    country: 'Algérie',
    phone: '+213 797 10 84 42',
    phoneRaw: '+213797108442',
    whatsapp: '+213797108442',
    email: 'labelamine27@gmail.com',
    resultsPlatformUrl: 'https://resultat.bmlabserver.com/',
    googleMapsUrl:
      'https://www.google.com/maps/place/%D9%85%D8%AE%D8%AA%D8%A8%D8%B1+%D8%A7%D9%84%D8%AA%D8%AD%D8%A7%D9%84%D9%8A%D9%84+%D8%A7%D9%84%D8%B7%D8%A8%D9%8A%D8%A9+%D8%A7%D9%84%D8%A3%D9%85%D9%8A%D9%86/@35.9228102,0.0711436,17z',
    latitude: 35.9228102,
    longitude: 0.0737185,
    facebookUrl: 'https://www.facebook.com/lab.elamine27/reels/?locale=fr_FR',
    instagramUrl: 'https://www.instagram.com/lab_elamine/',
  },
  homepage: {
    heroKicker: 'Biologie médicale · Mostaganem',
    heroTitle: 'Votre santé mérite une attention particulière.',
    heroSubtitle:
      "Les Laboratoires d'analyses médicales El Amine vous accompagnent avec rigueur, écoute et précision diagnostique pour l'ensemble de vos examens médicaux à Mostaganem.",
    heroImageUrl: '/src/assets/images/hero_clinical_lab_1795208041572.jpg',
    introTitle: 'Une prise en charge biologique rigoureuse et humaine.',
    introBody:
      "Inauguré le 4 juillet 2021 à Mostaganem, notre laboratoire met la précision analytique et le confort du patient au cœur de chaque étape, du prélèvement jusqu'à la remise sécurisée de vos résultats.",
    whyChooseItems: [
      {
        number: '01',
        title: 'Accueil & salles de prélèvement dédiées',
        description:
          "Des espaces de prélèvement climatisés, calmes et équipés pour assurer le confort des adultes, des enfants et des personnes à mobilité réduite.",
      },
      {
        number: '02',
        title: 'Prélèvement à domicile sur Mostaganem',
        description:
          "Une équipe mobile intervient sur rendez-vous à votre domicile tout en garantissant la chaîne de conservation pré-analytique.",
      },
      {
        number: '03',
        title: 'Consultation des résultats en ligne',
        description:
          "Accédez à vos comptes rendus d'analyses à distance via notre plateforme dédiée BM Lab Server dès leur validation.",
      },
      {
        number: '04',
        title: 'Accompagnement personnalisé',
        description:
          'Des consignes claires de préparation pré-analytique et une disponibilité directe par téléphone et WhatsApp pour répondre à vos questions.',
      },
    ],
    resultsBannerTitle: 'Consultez vos résultats en toute confidentialité',
    resultsBannerText:
      "Vos comptes rendus d'examens sont accessibles directement sur la plateforme sécurisée dédiée aux patients du laboratoire.",
  },
  about: {
    headline: 'À propos des Laboratoires El Amine',
    lead: "Un établissement de biologie médicale implanté à Mostaganem, guidé par l'exigence de fiabilité diagnostique et le respect du patient.",
    historyTitle: 'Inauguration et ancrage à Mostaganem',
    historyText:
      "Les Laboratoires d'analyses médicales El Amine ont été officiellement inaugurés le dimanche 4 juillet 2021 (24 Dhou al-Qi'dah 1442) en présence de M. le Wali de Mostaganem, Aïssa Boulahia. Depuis son ouverture, le laboratoire s'engage aux côtés des patients et des praticiens de la wilaya.",
    missionTitle: 'Notre mission et nos valeurs',
    missionText:
      "Fournir des analyses biologiques fiables dans le respect strict des bonnes pratiques pré-analytiques, tout en offrant un accueil chaleureux, confidentiel et accessible.",
    visionText:
      "Développer une biologie médicale de proximité réactive, alliant écoute clinique, prélèvements confortables sur site ou à domicile, et transmission numérique simplifiée des comptes rendus.",
    values: [
      {
        title: 'Précision & rigueur',
        description:
          "Contrôle attentif de chaque phase pré-analytique et analytique afin d'appuyer le diagnostic médical.",
      },
      {
        title: 'Confidentialité & éthique',
        description:
          'Respect absolu du secret médical, de la dignité des patients et de la sécurité des dossiers.',
      },
      {
        title: 'Proximité & accessibilité',
        description:
          'Prélèvements sur place sans contrainte inutile et service de déplacement à domicile à Mostaganem.',
      },
    ],
  },
  hours: {
    notice:
      "Horaires d'ouverture à confirmer par l'administration du laboratoire. Merci de nous contacter au +213 797 10 84 42 avant tout déplacement spécifique.",
    schedule: [
      { day: 'Samedi — Mercredi', hours: 'À confirmer (Administration)', isOpen: true },
      { day: 'Jeudi', hours: 'À confirmer (Administration)', isOpen: true },
      { day: 'Vendredi', hours: 'À confirmer / Permanence sur appel', isOpen: false },
    ],
  },
  recruitment: {
    enabled: true,
    introTitle: 'Rejoindre Laboratoires El Amine',
    introText:
      'Vous êtes biologiste, technicien(ne) de laboratoire, infirmier(ère) préleveur(se) ou agent d’accueil médical ? Transmettez votre candidature directement à notre direction.',
  },
};

const DEFAULT_SPECIALTIES = [
  {
    slug: 'biochimie-clinique',
    name: 'Biochimie clinique',
    shortDescription:
      'Exploration métabolique, bilan rénal, hépatique, lipidique et glycémique.',
    fullDescription:
      'La biochimie clinique regroupe le dosage des constituants biochimiques du sang et des liquides biologiques (glycémie, créatinine, bilan lipidique, enzymes hépatiques, ionogramme). Pôle à valider et ajuster selon le plateau technique actif.',
    iconName: 'FlaskConical',
    imageUrl: '/src/assets/images/specialty_biochemistry_lab_1795208040675.jpg',
    isPublished: true,
    sortOrder: 1,
  },
  {
    slug: 'hematologie',
    name: 'Hématologie',
    shortDescription:
      'Numération formule sanguine (NFS), groupage sanguin et exploration cellulaire.',
    fullDescription:
      "Étude quantitative et morphologique des cellules sanguines (globules rouges, leucocytes, plaquettes) pour le dépistage des anémies, infections et troubles hématologiques. Pôle à confirmer par la direction du laboratoire.",
    iconName: 'Droplets',
    imageUrl: '/src/assets/images/specialty_biochemistry_lab_1795208040675.jpg',
    isPublished: true,
    sortOrder: 2,
  },
  {
    slug: 'hemostase',
    name: 'Hémostase',
    shortDescription:
      'Bilan de coagulation pré-opératoire et suivi des traitements anticoagulants (TP, INR, TCA).',
    fullDescription:
      "Évaluation des mécanismes de la coagulation sanguine, indispensable avant toute intervention chirurgicale ou dans le cadre du suivi thérapeutique.",
    iconName: 'Activity',
    imageUrl: '/src/assets/images/hero_clinical_lab_1795208041572.jpg',
    isPublished: true,
    sortOrder: 3,
  },
  {
    slug: 'immunologie',
    name: 'Immunologie',
    shortDescription:
      'Sérologies infectieuses, marqueurs inflammatoires et bilans immunitaires.',
    fullDescription:
      "Recherche et quantification d'anticorps, d'antigènes et de marqueurs de l'immunité et de l'inflammation.",
    iconName: 'ShieldCheck',
    imageUrl: '/src/assets/images/specialty_microbiology_lab_1795208040563.jpg',
    isPublished: true,
    sortOrder: 4,
  },
  {
    slug: 'hormonologie',
    name: 'Hormonologie',
    shortDescription:
      'Dosages endocriniens : bilan thyroïdien, fertilité et métabolisme hormonal.',
    fullDescription:
      'Exploration des grandes fonctions endocriniennes (TSH, T3/T4 libres, hormones de la reproduction, cortisol, marqueurs endocriniens).',
    iconName: 'Sparkles',
    imageUrl: '/src/assets/images/specialty_biochemistry_lab_1795208040675.jpg',
    isPublished: true,
    sortOrder: 5,
  },
  {
    slug: 'microbiologie',
    name: 'Microbiologie',
    shortDescription:
      'Examens bactériologiques (ECBU, prélèvements) et antibiogrammes.',
    fullDescription:
      "Identification des agents bactériens et réalisation d'antibiogrammes pour orienter avec précision la prise en charge anti-infectieuse.",
    iconName: 'Microscope',
    imageUrl: '/src/assets/images/specialty_microbiology_lab_1795208040563.jpg',
    isPublished: true,
    sortOrder: 6,
  },
  {
    slug: 'parasitologie',
    name: 'Parasitologie',
    shortDescription:
      'Recherche et identification des parasites sur selles et prélèvements biologiques.',
    fullDescription:
      'Examens parasitologiques des selles et prélèvements spécialisés par observation microscopique directe et techniques de concentration.',
    iconName: 'Search',
    imageUrl: '/src/assets/images/specialty_microbiology_lab_1795208040563.jpg',
    isPublished: true,
    sortOrder: 7,
  },
  {
    slug: 'virologie',
    name: 'Virologie',
    shortDescription:
      'Sérologies virales et dépistages biologiques ciblés.',
    fullDescription:
      'Dépistage et suivi sérologique des infections virales courantes selon les protocoles confirmés par le laboratoire.',
    iconName: 'Stethoscope',
    imageUrl: '/src/assets/images/hero_clinical_lab_1795208041572.jpg',
    isPublished: true,
    sortOrder: 8,
  },
  {
    slug: 'biologie-moleculaire',
    name: 'Biologie moléculaire',
    shortDescription:
      'Détection ciblée par amplification génique selon disponibilité.',
    fullDescription:
      'Analyses par biologie moléculaire sur validation préalable du laboratoire pour les indications cliniques spécialisées.',
    iconName: 'Dna',
    imageUrl: '/src/assets/images/hero_clinical_lab_1795208041572.jpg',
    isPublished: true,
    sortOrder: 9,
  },
];

const DEFAULT_GALLERY = [
  {
    title: 'Façade du laboratoire El Amine à Mostaganem',
    caption:
      'Photographie réelle de la façade principale des Laboratoires d’analyses médicales El Amine.',
    category: 'façade',
    imageUrl: '/assets/aistudio/labamin4_6c39a0ed.jfif',
    isAuthentic: true,
    isPublished: true,
    sortOrder: 1,
  },
  {
    title: 'Salle de prélèvement — Espace 1',
    caption:
      'Photographie réelle d’une salle de prélèvement équipée pour le confort du patient.',
    category: 'salles_prélèvement',
    imageUrl: '/assets/aistudio/labamin_86331eca.webp',
    isAuthentic: true,
    isPublished: true,
    sortOrder: 2,
  },
  {
    title: 'Salle de prélèvement — Espace 2',
    caption:
      'Photographie réelle de notre second espace de prélèvement avec tensiomètre et pèse-personne médical.',
    category: 'salles_prélèvement',
    imageUrl: '/assets/aistudio/labamin9_699d9337.webp',
    isAuthentic: true,
    isPublished: true,
    sortOrder: 3,
  },
  {
    title: 'Équipe El Amine en mission de santé publique',
    caption:
      'Photographie réelle d’une équipe du laboratoire El Amine lors d’une intervention de dépistage sur le terrain.',
    category: 'équipe',
    imageUrl: '/assets/aistudio/labamin1_a1013821.jfif',
    isAuthentic: true,
    isPublished: true,
    sortOrder: 4,
  },
  {
    title: 'Inauguration officielle — 4 juillet 2021',
    caption:
      'Plaque inaugurale officielle en présence du Wali de Mostaganem, M. Aïssa Boulahia.',
    category: 'histoire',
    imageUrl: '/assets/aistudio/labamin5_93928b1f.jfif',
    isAuthentic: true,
    isPublished: true,
    sortOrder: 5,
  },
];

function buildDefaultExaminations(specMap: Map<string, number>) {
  return [
    {
      specialtyId: specMap.get('biochimie-clinique') ?? null,
      code: 'BIO-GLY',
      name: 'Glycémie à jeun',
      sampleType: 'Sang veineux (tube fluoré ou sec)',
      preparation: 'Jeûne de 8 à 12 heures recommandé (eau autorisée).',
      fastingRequired: true,
      turnaroundTime: 'Délai confirmé à l’accueil',
      notes: 'Paramètre modifiable depuis le tableau de bord administrateur.',
      isPublished: true,
    },
    {
      specialtyId: specMap.get('biochimie-clinique') ?? null,
      code: 'BIO-LIP',
      name: 'Bilan lipidique complet (CT, HDL, LDL, TG)',
      sampleType: 'Sang veineux (tube sec)',
      preparation: 'Jeûne strict de 12 heures recommandé.',
      fastingRequired: true,
      turnaroundTime: 'Délai confirmé à l’accueil',
      notes: 'Paramètre modifiable depuis le tableau de bord administrateur.',
      isPublished: true,
    },
    {
      specialtyId: specMap.get('biochimie-clinique') ?? null,
      code: 'BIO-CRE',
      name: 'Créatininémie et estimation du DFG',
      sampleType: 'Sang veineux (tube sec ou hépariné)',
      preparation: 'Aucune préparation particulière requise.',
      fastingRequired: false,
      turnaroundTime: 'Délai confirmé à l’accueil',
      notes: '',
      isPublished: true,
    },
    {
      specialtyId: specMap.get('hematologie') ?? null,
      code: 'HEM-NFS',
      name: 'Numération Formule Sanguine (NFS)',
      sampleType: 'Sang total (tube EDTA)',
      preparation: 'Aucune préparation particulière requise.',
      fastingRequired: false,
      turnaroundTime: 'Délai confirmé à l’accueil',
      notes: '',
      isPublished: true,
    },
    {
      specialtyId: specMap.get('hematologie') ?? null,
      code: 'HEM-GRP',
      name: 'Groupage sanguin ABO / Rhésus',
      sampleType: 'Sang total (tube EDTA)',
      preparation: 'Présenter une pièce d’identité lors du prélèvement.',
      fastingRequired: false,
      turnaroundTime: 'Délai confirmé à l’accueil',
      notes: '',
      isPublished: true,
    },
    {
      specialtyId: specMap.get('hemostase') ?? null,
      code: 'HST-TP',
      name: 'Taux de Prothrombine (TP) & INR',
      sampleType: 'Plasma citraté (tube bleu)',
      preparation:
        'Mentionner tout traitement anticoagulant en cours lors du prélèvement.',
      fastingRequired: false,
      turnaroundTime: 'Délai confirmé à l’accueil',
      notes: '',
      isPublished: true,
    },
    {
      specialtyId: specMap.get('hormonologie') ?? null,
      code: 'HOR-TSH',
      name: 'TSH ultrasensible (Bilan thyroïdien)',
      sampleType: 'Sang veineux (tube sec)',
      preparation:
        'Prélèvement recommandé le matin ; signaler tout traitement thyroïdien.',
      fastingRequired: false,
      turnaroundTime: 'Délai confirmé à l’accueil',
      notes: '',
      isPublished: true,
    },
    {
      specialtyId: specMap.get('immunologie') ?? null,
      code: 'IMM-CRP',
      name: 'Protéine C-Réactive (CRP)',
      sampleType: 'Sang veineux (tube sec)',
      preparation: 'Aucune préparation particulière requise.',
      fastingRequired: false,
      turnaroundTime: 'Délai confirmé à l’accueil',
      notes: '',
      isPublished: true,
    },
    {
      specialtyId: specMap.get('microbiologie') ?? null,
      code: 'MIC-ECBU',
      name: 'Examen Cytobactériologique des Urines (ECBU)',
      sampleType: 'Urines en flacon stérile',
      preparation:
        'Recueil des urines du matin après toilette locale soigneuse, avant toute antibiothérapie.',
      fastingRequired: false,
      turnaroundTime: 'Délai confirmé à l’accueil',
      notes: '',
      isPublished: true,
    },
    {
      specialtyId: specMap.get('parasitologie') ?? null,
      code: 'PAR-EPS',
      name: 'Examen parasitologique des selles',
      sampleType: 'Selles fraîches en flacon stérile',
      preparation: 'Acheminement rapide au laboratoire après recueil.',
      fastingRequired: false,
      turnaroundTime: 'Délai confirmé à l’accueil',
      notes: '',
      isPublished: true,
    },
    {
      specialtyId: specMap.get('virologie') ?? null,
      code: 'VIR-SER',
      name: 'Bilan sérologique viral (HBs, HCV, HIV)',
      sampleType: 'Sang veineux (tube sec)',
      preparation: 'Confidentialité stricte. Aucune préparation requise.',
      fastingRequired: false,
      turnaroundTime: 'Délai confirmé à l’accueil',
      notes: '',
      isPublished: true,
    },
    {
      specialtyId: specMap.get('biologie-moleculaire') ?? null,
      code: 'MOL-PCR',
      name: 'Tests par biologie moléculaire (PCR)',
      sampleType: 'Selon l’indication prescrite',
      preparation:
        'Contacter le laboratoire au +213 797 10 84 42 pour confirmation.',
      fastingRequired: false,
      turnaroundTime: 'Délai confirmé à l’accueil',
      notes: '',
      isPublished: true,
    },
  ];
}

const DEFAULT_JOB_POSITIONS = [
  {
    title: 'Technicien(ne) de laboratoire en biologie médicale',
    department: 'Plateau technique',
    contractType: 'Temps plein',
    description:
      'Participation aux analyses de routine, gestion pré-analytique et contrôle qualité interne sous supervision du biologiste responsable.',
    isOpen: true,
  },
  {
    title: 'Infirmier(ère) préleveur(se)',
    department: 'Prélèvements & Domicile',
    contractType: 'Temps plein',
    description:
      'Accueil et réalisation des prélèvements au laboratoire et à domicile sur Mostaganem dans le respect des protocoles d’hygiène.',
    isOpen: true,
  },
];

async function runSupabaseSeed() {
  if (!supabaseAdmin) return;

  const { count: settingsCount, error: settingsErr } = await supabaseAdmin
    .from('site_settings')
    .select('id', { count: 'exact', head: true });
  if (settingsErr) throw settingsErr;

  if ((settingsCount ?? 0) === 0) {
    const entries = Object.entries(DEFAULT_SETTINGS).map(([key, data]) => ({
      key,
      data,
    }));
    const { error: upsertErr } = await supabaseAdmin
      .from('site_settings')
      .upsert(entries, { onConflict: 'key', ignoreDuplicates: true });
    if (upsertErr) throw upsertErr;
  }

  const { count: specCount, error: specErr } = await supabaseAdmin
    .from('specialties')
    .select('id', { count: 'exact', head: true });
  if (specErr) throw specErr;

  if ((specCount ?? 0) === 0) {
    const { data: insertedSpecs } = await supabaseAdmin
      .from('specialties')
      .upsert(
        DEFAULT_SPECIALTIES.map((s) => ({
          slug: s.slug,
          name: s.name,
          short_description: s.shortDescription,
          full_description: s.fullDescription,
          icon_name: s.iconName,
          image_url: s.imageUrl,
          is_published: s.isPublished,
          sort_order: s.sortOrder,
        })),
        { onConflict: 'slug', ignoreDuplicates: true }
      )
      .select('id, slug');

    const specMap = new Map<string, number>();
    for (const s of insertedSpecs || []) {
      specMap.set(s.slug as string, s.id as number);
    }

    const { count: examCount } = await supabaseAdmin
      .from('examinations')
      .select('id', { count: 'exact', head: true });

    if ((examCount ?? 0) === 0) {
      const exams = buildDefaultExaminations(specMap).map((e) => ({
        specialty_id: e.specialtyId,
        code: e.code,
        name: e.name,
        sample_type: e.sampleType,
        preparation: e.preparation,
        fasting_required: e.fastingRequired,
        turnaround_time: e.turnaroundTime,
        notes: e.notes,
        is_published: e.isPublished,
      }));
      await supabaseAdmin.from('examinations').insert(exams);
    }
  }

  const { count: galleryCount } = await supabaseAdmin
    .from('gallery_photos')
    .select('id', { count: 'exact', head: true });

  if ((galleryCount ?? 0) === 0) {
    await supabaseAdmin.from('gallery_photos').insert(
      DEFAULT_GALLERY.map((g) => ({
        title: g.title,
        caption: g.caption,
        category: g.category,
        image_url: g.imageUrl,
        is_authentic: g.isAuthentic,
        is_published: g.isPublished,
        sort_order: g.sortOrder,
      }))
    );
  }

  const { count: jobsCount } = await supabaseAdmin
    .from('job_positions')
    .select('id', { count: 'exact', head: true });

  if ((jobsCount ?? 0) === 0) {
    await supabaseAdmin.from('job_positions').insert(
      DEFAULT_JOB_POSITIONS.map((j) => ({
        title: j.title,
        department: j.department,
        contract_type: j.contractType,
        description: j.description,
        is_open: j.isOpen,
      }))
    );
  }
}

async function runDrizzleSeed() {
  const [{ total: settingsCount }] = await db
    .select({ total: count() })
    .from(siteSettings);

  if (Number(settingsCount) === 0) {
    for (const [key, data] of Object.entries(DEFAULT_SETTINGS)) {
      await db
        .insert(siteSettings)
        .values({ key, data })
        .onConflictDoNothing({ target: siteSettings.key });
    }
  }

  const [{ total: specCount }] = await db
    .select({ total: count() })
    .from(specialties);

  if (Number(specCount) === 0) {
    const insertedSpecs = await db
      .insert(specialties)
      .values(DEFAULT_SPECIALTIES)
      .onConflictDoNothing({ target: specialties.slug })
      .returning();

    const specMap = new Map<string, number>();
    for (const s of insertedSpecs) {
      specMap.set(s.slug, s.id);
    }

    const [{ total: examCount }] = await db
      .select({ total: count() })
      .from(examinations);

    if (Number(examCount) === 0) {
      await db.insert(examinations).values(buildDefaultExaminations(specMap));
    }
  }

  const [{ total: galleryCount }] = await db
    .select({ total: count() })
    .from(galleryPhotos);

  if (Number(galleryCount) === 0) {
    await db.insert(galleryPhotos).values(DEFAULT_GALLERY);
  }

  const [{ total: jobsCount }] = await db
    .select({ total: count() })
    .from(jobPositions);

  if (Number(jobsCount) === 0) {
    await db.insert(jobPositions).values(DEFAULT_JOB_POSITIONS);
  }
}

export async function ensureSeeded(): Promise<void> {
  if (!seedPromise) {
    const runner = isSupabaseServerConfigured ? runSupabaseSeed() : runDrizzleSeed();
    seedPromise = runner.catch((err) => {
      seedPromise = null;
      throw err;
    });
  }
  return seedPromise;
}
