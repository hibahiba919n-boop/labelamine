import { asc, count, desc, eq } from 'drizzle-orm';
import { db } from './index.ts';
import {
  activityLogs,
  contactMessages,
  examinations,
  galleryPhotos,
  homeSamplingRequests,
  jobPositions,
  recruitmentApplications,
  siteSettings,
  specialties,
  users,
} from './schema.ts';
import { DEFAULT_SETTINGS } from './seed.ts';
import { isSupabaseServerConfigured, supabaseAdmin } from '../lib/supabase-admin.ts';
import {
  ActivityLogItem,
  AdminUserItem,
  ContactMessageItem,
  Examination,
  GalleryPhoto,
  HomeSamplingRequestItem,
  JobPosition,
  RecruitmentApplicationItem,
  SiteSettingsBundle,
  Specialty,
} from '../types/lab.ts';

function mapSpecialty(row: Record<string, unknown>): Specialty {
  return {
    id: Number(row.id),
    slug: String(row.slug),
    name: String(row.name),
    shortDescription: String(row.short_description ?? row.shortDescription ?? ''),
    fullDescription: String(row.full_description ?? row.fullDescription ?? ''),
    iconName: String(row.icon_name ?? row.iconName ?? 'FlaskConical'),
    imageUrl: (row.image_url ?? row.imageUrl ?? null) as string | null,
    isPublished: Boolean(row.is_published ?? row.isPublished ?? true),
    sortOrder: Number(row.sort_order ?? row.sortOrder ?? 0),
  };
}

function mapExamination(row: Record<string, unknown>): Examination {
  const rawSpecId = row.specialty_id ?? row.specialtyId;
  return {
    id: Number(row.id),
    specialtyId: rawSpecId == null ? null : Number(rawSpecId),
    code: String(row.code),
    name: String(row.name),
    sampleType: String(row.sample_type ?? row.sampleType ?? ''),
    preparation: String(row.preparation ?? ''),
    fastingRequired: Boolean(row.fasting_required ?? row.fastingRequired ?? false),
    turnaroundTime: String(row.turnaround_time ?? row.turnaroundTime ?? ''),
    notes: (row.notes ?? null) as string | null,
    isPublished: Boolean(row.is_published ?? row.isPublished ?? true),
  };
}

function mapGallery(row: Record<string, unknown>): GalleryPhoto {
  return {
    id: Number(row.id),
    title: String(row.title),
    caption: String(row.caption),
    category: String(row.category ?? 'installations'),
    imageUrl: String(row.image_url ?? row.imageUrl ?? ''),
    isAuthentic: Boolean(row.is_authentic ?? row.isAuthentic ?? true),
    isPublished: Boolean(row.is_published ?? row.isPublished ?? true),
    sortOrder: Number(row.sort_order ?? row.sortOrder ?? 0),
  };
}

function mapPosition(row: Record<string, unknown>): JobPosition {
  return {
    id: Number(row.id),
    title: String(row.title),
    department: String(row.department),
    contractType: String(row.contract_type ?? row.contractType ?? ''),
    description: String(row.description ?? ''),
    isOpen: Boolean(row.is_open ?? row.isOpen ?? true),
  };
}

function mapSampling(row: Record<string, unknown>): HomeSamplingRequestItem {
  return {
    id: Number(row.id),
    patientName: String(row.patient_name ?? row.patientName ?? ''),
    phone: String(row.phone ?? ''),
    address: String(row.address ?? ''),
    requestedDate: String(row.requested_date ?? row.requestedDate ?? ''),
    preferredTime: String(row.preferred_time ?? row.preferredTime ?? ''),
    additionalInfo: (row.additional_info ?? row.additionalInfo ?? null) as string | null,
    status: String(row.status ?? 'nouveau'),
    internalNotes: (row.internal_notes ?? row.internalNotes ?? null) as string | null,
    createdAt: new Date(String(row.created_at ?? row.createdAt ?? new Date())).toISOString(),
    updatedAt: new Date(String(row.updated_at ?? row.updatedAt ?? new Date())).toISOString(),
  };
}

function mapContact(row: Record<string, unknown>): ContactMessageItem {
  return {
    id: Number(row.id),
    senderName: String(row.sender_name ?? row.senderName ?? ''),
    phone: (row.phone ?? null) as string | null,
    email: (row.email ?? null) as string | null,
    subject: String(row.subject ?? ''),
    message: String(row.message ?? ''),
    status: String(row.status ?? 'nouveau'),
    internalNotes: (row.internal_notes ?? row.internalNotes ?? null) as string | null,
    createdAt: new Date(String(row.created_at ?? row.createdAt ?? new Date())).toISOString(),
    updatedAt: new Date(String(row.updated_at ?? row.updatedAt ?? new Date())).toISOString(),
  };
}

function mapApplication(row: Record<string, unknown>): RecruitmentApplicationItem {
  const rawPosId = row.position_id ?? row.positionId;
  return {
    id: Number(row.id),
    positionId: rawPosId == null ? null : Number(rawPosId),
    positionTitle: String(row.position_title ?? row.positionTitle ?? ''),
    applicantName: String(row.applicant_name ?? row.applicantName ?? ''),
    email: String(row.email ?? ''),
    phone: String(row.phone ?? ''),
    message: (row.message ?? null) as string | null,
    cvFilename: String(row.cv_filename ?? row.cvFilename ?? 'cv.pdf'),
    cvMimeType: String(row.cv_mime_type ?? row.cvMimeType ?? 'application/pdf'),
    cvSize: Number(row.cv_size ?? row.cvSize ?? 0),
    status: String(row.status ?? 'reçu'),
    internalNotes: (row.internal_notes ?? row.internalNotes ?? null) as string | null,
    createdAt: new Date(String(row.created_at ?? row.createdAt ?? new Date())).toISOString(),
  };
}

function mapActivity(row: Record<string, unknown>): ActivityLogItem {
  return {
    id: Number(row.id),
    type: String(row.type),
    summary: String(row.summary),
    actor: (row.actor ?? null) as string | null,
    createdAt: new Date(String(row.created_at ?? row.createdAt ?? new Date())).toISOString(),
  };
}

function mapAdminUser(row: Record<string, unknown>): AdminUserItem {
  return {
    id: Number(row.id),
    uid: String(row.uid),
    email: String(row.email),
    displayName: (row.display_name ?? row.displayName ?? null) as string | null,
    role: String(row.role ?? 'admin'),
    isActive: Boolean(row.is_active ?? row.isActive ?? true),
    createdAt: new Date(String(row.created_at ?? row.createdAt ?? new Date())).toISOString(),
  };
}

export async function getSettingsBundle(): Promise<SiteSettingsBundle> {
  const map: Record<string, unknown> = {};
  if (isSupabaseServerConfigured && supabaseAdmin) {
    const { data, error } = await supabaseAdmin.from('site_settings').select('key, data');
    if (error) throw error;
    for (const row of data || []) {
      map[String(row.key)] = row.data;
    }
  } else {
    const rows = await db.select().from(siteSettings);
    for (const row of rows) {
      map[row.key] = row.data;
    }
  }

  return {
    general: { ...DEFAULT_SETTINGS.general, ...(map.general as object) },
    homepage: { ...DEFAULT_SETTINGS.homepage, ...(map.homepage as object) },
    about: { ...DEFAULT_SETTINGS.about, ...(map.about as object) },
    hours: { ...DEFAULT_SETTINGS.hours, ...(map.hours as object) },
    recruitment: { ...DEFAULT_SETTINGS.recruitment, ...(map.recruitment as object) },
  };
}

export async function upsertSetting(key: string, payload: unknown) {
  if (isSupabaseServerConfigured && supabaseAdmin) {
    const { data, error } = await supabaseAdmin
      .from('site_settings')
      .upsert(
        { key, data: payload, updated_at: new Date().toISOString() },
        { onConflict: 'key' }
      )
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  const [updated] = await db
    .insert(siteSettings)
    .values({ key, data: payload, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: siteSettings.key,
      set: { data: payload, updatedAt: new Date() },
    })
    .returning();
  return updated;
}

export async function logActivity(type: string, summary: string, actor = 'Visiteur') {
  try {
    if (isSupabaseServerConfigured && supabaseAdmin) {
      await supabaseAdmin.from('activity_logs').insert({ type, summary, actor });
      return;
    }
    await db.insert(activityLogs).values({ type, summary, actor });
  } catch (err) {
    console.error('Failed to record activity log:', err);
  }
}

export async function listSpecialties(onlyPublished: boolean): Promise<Specialty[]> {
  if (isSupabaseServerConfigured && supabaseAdmin) {
    let query = supabaseAdmin
      .from('specialties')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('id', { ascending: true });
    if (onlyPublished) query = query.eq('is_published', true);
    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map((r) => mapSpecialty(r as Record<string, unknown>));
  }

  const rows = onlyPublished
    ? await db
        .select()
        .from(specialties)
        .where(eq(specialties.isPublished, true))
        .orderBy(asc(specialties.sortOrder), asc(specialties.id))
    : await db
        .select()
        .from(specialties)
        .orderBy(asc(specialties.sortOrder), asc(specialties.id));
  return rows.map((r) => mapSpecialty(r as unknown as Record<string, unknown>));
}

export async function createSpecialty(input: Omit<Specialty, 'id'>): Promise<Specialty> {
  if (isSupabaseServerConfigured && supabaseAdmin) {
    const { data, error } = await supabaseAdmin
      .from('specialties')
      .insert({
        slug: input.slug,
        name: input.name,
        short_description: input.shortDescription,
        full_description: input.fullDescription,
        icon_name: input.iconName,
        image_url: input.imageUrl || '',
        is_published: input.isPublished,
        sort_order: input.sortOrder,
      })
      .select()
      .single();
    if (error) throw error;
    return mapSpecialty(data as Record<string, unknown>);
  }

  const [created] = await db
    .insert(specialties)
    .values({ ...input, imageUrl: input.imageUrl || '' })
    .returning();
  return mapSpecialty(created as unknown as Record<string, unknown>);
}

export async function updateSpecialty(
  id: number,
  input: Partial<Omit<Specialty, 'id'>>
): Promise<Specialty | null> {
  if (isSupabaseServerConfigured && supabaseAdmin) {
    const patch: Record<string, unknown> = {};
    if (input.slug !== undefined) patch.slug = input.slug;
    if (input.name !== undefined) patch.name = input.name;
    if (input.shortDescription !== undefined) patch.short_description = input.shortDescription;
    if (input.fullDescription !== undefined) patch.full_description = input.fullDescription;
    if (input.iconName !== undefined) patch.icon_name = input.iconName;
    if (input.imageUrl !== undefined) patch.image_url = input.imageUrl;
    if (input.isPublished !== undefined) patch.is_published = input.isPublished;
    if (input.sortOrder !== undefined) patch.sort_order = input.sortOrder;

    const { data, error } = await supabaseAdmin
      .from('specialties')
      .update(patch)
      .eq('id', id)
      .select()
      .maybeSingle();
    if (error) throw error;
    return data ? mapSpecialty(data as Record<string, unknown>) : null;
  }

  const [updated] = await db
    .update(specialties)
    .set(input)
    .where(eq(specialties.id, id))
    .returning();
  return updated ? mapSpecialty(updated as unknown as Record<string, unknown>) : null;
}

export async function deleteSpecialty(id: number): Promise<void> {
  if (isSupabaseServerConfigured && supabaseAdmin) {
    const { error } = await supabaseAdmin.from('specialties').delete().eq('id', id);
    if (error) throw error;
    return;
  }
  await db.delete(specialties).where(eq(specialties.id, id));
}

export async function listExaminations(onlyPublished: boolean): Promise<Examination[]> {
  if (isSupabaseServerConfigured && supabaseAdmin) {
    let query = supabaseAdmin
      .from('examinations')
      .select('*')
      .order('name', { ascending: true });
    if (onlyPublished) query = query.eq('is_published', true);
    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map((r) => mapExamination(r as Record<string, unknown>));
  }

  const rows = onlyPublished
    ? await db
        .select()
        .from(examinations)
        .where(eq(examinations.isPublished, true))
        .orderBy(asc(examinations.name))
    : await db.select().from(examinations).orderBy(asc(examinations.name));
  return rows.map((r) => mapExamination(r as unknown as Record<string, unknown>));
}

export async function createExamination(input: Omit<Examination, 'id'>): Promise<Examination> {
  if (isSupabaseServerConfigured && supabaseAdmin) {
    const { data, error } = await supabaseAdmin
      .from('examinations')
      .insert({
        specialty_id: input.specialtyId ?? null,
        code: input.code,
        name: input.name,
        sample_type: input.sampleType,
        preparation: input.preparation,
        fasting_required: input.fastingRequired,
        turnaround_time: input.turnaroundTime,
        notes: input.notes || '',
        is_published: input.isPublished,
      })
      .select()
      .single();
    if (error) throw error;
    return mapExamination(data as Record<string, unknown>);
  }

  const [created] = await db
    .insert(examinations)
    .values({ ...input, notes: input.notes || '' })
    .returning();
  return mapExamination(created as unknown as Record<string, unknown>);
}

export async function updateExamination(
  id: number,
  input: Partial<Omit<Examination, 'id'>>
): Promise<Examination | null> {
  if (isSupabaseServerConfigured && supabaseAdmin) {
    const patch: Record<string, unknown> = {};
    if (input.specialtyId !== undefined) patch.specialty_id = input.specialtyId;
    if (input.code !== undefined) patch.code = input.code;
    if (input.name !== undefined) patch.name = input.name;
    if (input.sampleType !== undefined) patch.sample_type = input.sampleType;
    if (input.preparation !== undefined) patch.preparation = input.preparation;
    if (input.fastingRequired !== undefined) patch.fasting_required = input.fastingRequired;
    if (input.turnaroundTime !== undefined) patch.turnaround_time = input.turnaroundTime;
    if (input.notes !== undefined) patch.notes = input.notes;
    if (input.isPublished !== undefined) patch.is_published = input.isPublished;

    const { data, error } = await supabaseAdmin
      .from('examinations')
      .update(patch)
      .eq('id', id)
      .select()
      .maybeSingle();
    if (error) throw error;
    return data ? mapExamination(data as Record<string, unknown>) : null;
  }

  const [updated] = await db
    .update(examinations)
    .set(input)
    .where(eq(examinations.id, id))
    .returning();
  return updated ? mapExamination(updated as unknown as Record<string, unknown>) : null;
}

export async function deleteExamination(id: number): Promise<void> {
  if (isSupabaseServerConfigured && supabaseAdmin) {
    const { error } = await supabaseAdmin.from('examinations').delete().eq('id', id);
    if (error) throw error;
    return;
  }
  await db.delete(examinations).where(eq(examinations.id, id));
}

export async function listGallery(onlyPublished: boolean): Promise<GalleryPhoto[]> {
  if (isSupabaseServerConfigured && supabaseAdmin) {
    let query = supabaseAdmin
      .from('gallery_photos')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('id', { ascending: true });
    if (onlyPublished) query = query.eq('is_published', true);
    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map((r) => mapGallery(r as Record<string, unknown>));
  }

  const rows = onlyPublished
    ? await db
        .select()
        .from(galleryPhotos)
        .where(eq(galleryPhotos.isPublished, true))
        .orderBy(asc(galleryPhotos.sortOrder), asc(galleryPhotos.id))
    : await db
        .select()
        .from(galleryPhotos)
        .orderBy(asc(galleryPhotos.sortOrder), asc(galleryPhotos.id));
  return rows.map((r) => mapGallery(r as unknown as Record<string, unknown>));
}

export async function createGalleryPhoto(input: Omit<GalleryPhoto, 'id'>): Promise<GalleryPhoto> {
  if (isSupabaseServerConfigured && supabaseAdmin) {
    const { data, error } = await supabaseAdmin
      .from('gallery_photos')
      .insert({
        title: input.title,
        caption: input.caption,
        category: input.category,
        image_url: input.imageUrl,
        is_authentic: input.isAuthentic,
        is_published: input.isPublished,
        sort_order: input.sortOrder,
      })
      .select()
      .single();
    if (error) throw error;
    return mapGallery(data as Record<string, unknown>);
  }

  const [created] = await db.insert(galleryPhotos).values(input).returning();
  return mapGallery(created as unknown as Record<string, unknown>);
}

export async function updateGalleryPhoto(
  id: number,
  input: Partial<Omit<GalleryPhoto, 'id'>>
): Promise<GalleryPhoto | null> {
  if (isSupabaseServerConfigured && supabaseAdmin) {
    const patch: Record<string, unknown> = {};
    if (input.title !== undefined) patch.title = input.title;
    if (input.caption !== undefined) patch.caption = input.caption;
    if (input.category !== undefined) patch.category = input.category;
    if (input.imageUrl !== undefined) patch.image_url = input.imageUrl;
    if (input.isAuthentic !== undefined) patch.is_authentic = input.isAuthentic;
    if (input.isPublished !== undefined) patch.is_published = input.isPublished;
    if (input.sortOrder !== undefined) patch.sort_order = input.sortOrder;

    const { data, error } = await supabaseAdmin
      .from('gallery_photos')
      .update(patch)
      .eq('id', id)
      .select()
      .maybeSingle();
    if (error) throw error;
    return data ? mapGallery(data as Record<string, unknown>) : null;
  }

  const [updated] = await db
    .update(galleryPhotos)
    .set(input)
    .where(eq(galleryPhotos.id, id))
    .returning();
  return updated ? mapGallery(updated as unknown as Record<string, unknown>) : null;
}

export async function deleteGalleryPhoto(id: number): Promise<void> {
  if (isSupabaseServerConfigured && supabaseAdmin) {
    const { error } = await supabaseAdmin.from('gallery_photos').delete().eq('id', id);
    if (error) throw error;
    return;
  }
  await db.delete(galleryPhotos).where(eq(galleryPhotos.id, id));
}

export async function listJobPositions(onlyOpen: boolean): Promise<JobPosition[]> {
  if (isSupabaseServerConfigured && supabaseAdmin) {
    let query = supabaseAdmin
      .from('job_positions')
      .select('*')
      .order('created_at', { ascending: false });
    if (onlyOpen) query = query.eq('is_open', true);
    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map((r) => mapPosition(r as Record<string, unknown>));
  }

  const rows = onlyOpen
    ? await db
        .select()
        .from(jobPositions)
        .where(eq(jobPositions.isOpen, true))
        .orderBy(desc(jobPositions.createdAt))
    : await db.select().from(jobPositions).orderBy(desc(jobPositions.createdAt));
  return rows.map((r) => mapPosition(r as unknown as Record<string, unknown>));
}

export async function createJobPosition(input: Omit<JobPosition, 'id'>): Promise<JobPosition> {
  if (isSupabaseServerConfigured && supabaseAdmin) {
    const { data, error } = await supabaseAdmin
      .from('job_positions')
      .insert({
        title: input.title,
        department: input.department,
        contract_type: input.contractType,
        description: input.description,
        is_open: input.isOpen,
      })
      .select()
      .single();
    if (error) throw error;
    return mapPosition(data as Record<string, unknown>);
  }

  const [created] = await db.insert(jobPositions).values(input).returning();
  return mapPosition(created as unknown as Record<string, unknown>);
}

export async function updateJobPosition(
  id: number,
  input: Partial<Omit<JobPosition, 'id'>>
): Promise<JobPosition | null> {
  if (isSupabaseServerConfigured && supabaseAdmin) {
    const patch: Record<string, unknown> = {};
    if (input.title !== undefined) patch.title = input.title;
    if (input.department !== undefined) patch.department = input.department;
    if (input.contractType !== undefined) patch.contract_type = input.contractType;
    if (input.description !== undefined) patch.description = input.description;
    if (input.isOpen !== undefined) patch.is_open = input.isOpen;

    const { data, error } = await supabaseAdmin
      .from('job_positions')
      .update(patch)
      .eq('id', id)
      .select()
      .maybeSingle();
    if (error) throw error;
    return data ? mapPosition(data as Record<string, unknown>) : null;
  }

  const [updated] = await db
    .update(jobPositions)
    .set(input)
    .where(eq(jobPositions.id, id))
    .returning();
  return updated ? mapPosition(updated as unknown as Record<string, unknown>) : null;
}

export async function deleteJobPosition(id: number): Promise<void> {
  if (isSupabaseServerConfigured && supabaseAdmin) {
    const { error } = await supabaseAdmin.from('job_positions').delete().eq('id', id);
    if (error) throw error;
    return;
  }
  await db.delete(jobPositions).where(eq(jobPositions.id, id));
}

export async function createHomeSampling(input: {
  patientName: string;
  phone: string;
  address: string;
  requestedDate: string;
  preferredTime: string;
  additionalInfo: string;
}): Promise<{ id: number }> {
  if (isSupabaseServerConfigured && supabaseAdmin) {
    const { data, error } = await supabaseAdmin
      .from('home_sampling_requests')
      .insert({
        patient_name: input.patientName,
        phone: input.phone,
        address: input.address,
        requested_date: input.requestedDate,
        preferred_time: input.preferredTime,
        additional_info: input.additionalInfo,
        status: 'nouveau',
      })
      .select('id')
      .single();
    if (error) throw error;
    return { id: Number(data.id) };
  }

  const [created] = await db
    .insert(homeSamplingRequests)
    .values({ ...input, status: 'nouveau' })
    .returning({ id: homeSamplingRequests.id });
  return { id: created.id };
}

export async function listHomeSampling(): Promise<HomeSamplingRequestItem[]> {
  if (isSupabaseServerConfigured && supabaseAdmin) {
    const { data, error } = await supabaseAdmin
      .from('home_sampling_requests')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map((r) => mapSampling(r as Record<string, unknown>));
  }

  const rows = await db
    .select()
    .from(homeSamplingRequests)
    .orderBy(desc(homeSamplingRequests.createdAt));
  return rows.map((r) => mapSampling(r as unknown as Record<string, unknown>));
}

export async function updateHomeSampling(
  id: number,
  status: string,
  internalNotes: string
): Promise<HomeSamplingRequestItem | null> {
  if (isSupabaseServerConfigured && supabaseAdmin) {
    const { data, error } = await supabaseAdmin
      .from('home_sampling_requests')
      .update({
        status,
        internal_notes: internalNotes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .maybeSingle();
    if (error) throw error;
    return data ? mapSampling(data as Record<string, unknown>) : null;
  }

  const [updated] = await db
    .update(homeSamplingRequests)
    .set({ status, internalNotes, updatedAt: new Date() })
    .where(eq(homeSamplingRequests.id, id))
    .returning();
  return updated ? mapSampling(updated as unknown as Record<string, unknown>) : null;
}

export async function createContactMessage(input: {
  senderName: string;
  phone: string;
  email: string;
  subject: string;
  message: string;
}): Promise<{ id: number }> {
  if (isSupabaseServerConfigured && supabaseAdmin) {
    const { data, error } = await supabaseAdmin
      .from('contact_messages')
      .insert({
        sender_name: input.senderName,
        phone: input.phone,
        email: input.email,
        subject: input.subject,
        message: input.message,
        status: 'nouveau',
      })
      .select('id')
      .single();
    if (error) throw error;
    return { id: Number(data.id) };
  }

  const [created] = await db
    .insert(contactMessages)
    .values({ ...input, status: 'nouveau' })
    .returning({ id: contactMessages.id });
  return { id: created.id };
}

export async function listContactMessages(): Promise<ContactMessageItem[]> {
  if (isSupabaseServerConfigured && supabaseAdmin) {
    const { data, error } = await supabaseAdmin
      .from('contact_messages')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map((r) => mapContact(r as Record<string, unknown>));
  }

  const rows = await db
    .select()
    .from(contactMessages)
    .orderBy(desc(contactMessages.createdAt));
  return rows.map((r) => mapContact(r as unknown as Record<string, unknown>));
}

export async function updateContactMessage(
  id: number,
  status: string,
  internalNotes: string
): Promise<ContactMessageItem | null> {
  if (isSupabaseServerConfigured && supabaseAdmin) {
    const { data, error } = await supabaseAdmin
      .from('contact_messages')
      .update({
        status,
        internal_notes: internalNotes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .maybeSingle();
    if (error) throw error;
    return data ? mapContact(data as Record<string, unknown>) : null;
  }

  const [updated] = await db
    .update(contactMessages)
    .set({ status, internalNotes, updatedAt: new Date() })
    .where(eq(contactMessages.id, id))
    .returning();
  return updated ? mapContact(updated as unknown as Record<string, unknown>) : null;
}

export async function createRecruitmentApplication(
  input: {
    positionId: number | null;
    positionTitle: string;
    applicantName: string;
    email: string;
    phone: string;
    message: string;
    cvFilename: string;
    cvSize: number;
  },
  pdfBuffer: Buffer
): Promise<{ id: number }> {
  if (isSupabaseServerConfigured && supabaseAdmin) {
    const storagePath = `applications/${Date.now()}_${Math.random()
      .toString(36)
      .slice(2, 10)}_${input.cvFilename}`;

    let storedPath = '';
    let fallbackBase64 = '';

    const { error: uploadErr } = await supabaseAdmin.storage
      .from('cv-uploads')
      .upload(storagePath, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: false,
      });

    if (!uploadErr) {
      storedPath = storagePath;
    } else {
      console.warn(
        'Supabase Storage cv-uploads upload fallback to DB base64:',
        uploadErr.message
      );
      fallbackBase64 = pdfBuffer.toString('base64');
    }

    const { data, error } = await supabaseAdmin
      .from('recruitment_applications')
      .insert({
        position_id: input.positionId,
        position_title: input.positionTitle,
        applicant_name: input.applicantName,
        email: input.email,
        phone: input.phone,
        message: input.message,
        cv_filename: input.cvFilename,
        cv_mime_type: 'application/pdf',
        cv_size: input.cvSize,
        cv_base64: fallbackBase64,
        cv_storage_path: storedPath,
        status: 'reçu',
      })
      .select('id')
      .single();
    if (error) throw error;
    return { id: Number(data.id) };
  }

  const [created] = await db
    .insert(recruitmentApplications)
    .values({
      positionId: input.positionId,
      positionTitle: input.positionTitle,
      applicantName: input.applicantName,
      email: input.email,
      phone: input.phone,
      message: input.message,
      cvFilename: input.cvFilename,
      cvMimeType: 'application/pdf',
      cvSize: input.cvSize,
      cvBase64: pdfBuffer.toString('base64'),
      status: 'reçu',
    })
    .returning({ id: recruitmentApplications.id });
  return { id: created.id };
}

export async function listRecruitmentApplications(): Promise<
  RecruitmentApplicationItem[]
> {
  if (isSupabaseServerConfigured && supabaseAdmin) {
    const { data, error } = await supabaseAdmin
      .from('recruitment_applications')
      .select(
        'id, position_id, position_title, applicant_name, email, phone, message, cv_filename, cv_mime_type, cv_size, status, internal_notes, created_at'
      )
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map((r) => mapApplication(r as Record<string, unknown>));
  }

  const rows = await db
    .select({
      id: recruitmentApplications.id,
      positionId: recruitmentApplications.positionId,
      positionTitle: recruitmentApplications.positionTitle,
      applicantName: recruitmentApplications.applicantName,
      email: recruitmentApplications.email,
      phone: recruitmentApplications.phone,
      message: recruitmentApplications.message,
      cvFilename: recruitmentApplications.cvFilename,
      cvMimeType: recruitmentApplications.cvMimeType,
      cvSize: recruitmentApplications.cvSize,
      status: recruitmentApplications.status,
      internalNotes: recruitmentApplications.internalNotes,
      createdAt: recruitmentApplications.createdAt,
    })
    .from(recruitmentApplications)
    .orderBy(desc(recruitmentApplications.createdAt));
  return rows.map((r) => mapApplication(r as unknown as Record<string, unknown>));
}

export async function updateRecruitmentApplication(
  id: number,
  status: string,
  internalNotes: string
): Promise<{
  id: number;
  status: string;
  internalNotes: string;
  applicantName: string;
} | null> {
  if (isSupabaseServerConfigured && supabaseAdmin) {
    const { data, error } = await supabaseAdmin
      .from('recruitment_applications')
      .update({ status, internal_notes: internalNotes })
      .eq('id', id)
      .select('id, status, internal_notes, applicant_name')
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return {
      id: Number(data.id),
      status: String(data.status),
      internalNotes: String(data.internal_notes ?? ''),
      applicantName: String(data.applicant_name),
    };
  }

  const [updated] = await db
    .update(recruitmentApplications)
    .set({ status, internalNotes })
    .where(eq(recruitmentApplications.id, id))
    .returning({
      id: recruitmentApplications.id,
      status: recruitmentApplications.status,
      internalNotes: recruitmentApplications.internalNotes,
      applicantName: recruitmentApplications.applicantName,
    });
  if (!updated) return null;
  return {
    id: updated.id,
    status: updated.status,
    internalNotes: updated.internalNotes || '',
    applicantName: updated.applicantName,
  };
}

export async function getApplicationCv(id: number): Promise<{
  filename: string;
  mimeType: string;
  buffer: Buffer;
} | null> {
  if (isSupabaseServerConfigured && supabaseAdmin) {
    const { data, error } = await supabaseAdmin
      .from('recruitment_applications')
      .select('cv_filename, cv_mime_type, cv_base64, cv_storage_path')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;

    if (data.cv_storage_path) {
      const { data: blob, error: dlErr } = await supabaseAdmin.storage
        .from('cv-uploads')
        .download(String(data.cv_storage_path));
      if (!dlErr && blob) {
        const arrayBuf = await blob.arrayBuffer();
        return {
          filename: String(data.cv_filename),
          mimeType: String(data.cv_mime_type || 'application/pdf'),
          buffer: Buffer.from(arrayBuf),
        };
      }
    }

    if (data.cv_base64) {
      return {
        filename: String(data.cv_filename),
        mimeType: String(data.cv_mime_type || 'application/pdf'),
        buffer: Buffer.from(String(data.cv_base64), 'base64'),
      };
    }
    return null;
  }

  const [appRow] = await db
    .select({
      cvFilename: recruitmentApplications.cvFilename,
      cvMimeType: recruitmentApplications.cvMimeType,
      cvBase64: recruitmentApplications.cvBase64,
    })
    .from(recruitmentApplications)
    .where(eq(recruitmentApplications.id, id))
    .limit(1);

  if (!appRow) return null;
  return {
    filename: appRow.cvFilename,
    mimeType: appRow.cvMimeType || 'application/pdf',
    buffer: Buffer.from(appRow.cvBase64, 'base64'),
  };
}

export async function getAdminOverviewData() {
  if (isSupabaseServerConfigured && supabaseAdmin) {
    const [
      samplingNewRes,
      samplingTotalRes,
      contactNewRes,
      contactTotalRes,
      recruitmentNewRes,
      recruitmentTotalRes,
      specCountRes,
      examCountRes,
      activityRes,
      settings,
      allSpecialties,
      allExams,
      allGallery,
      allPositions,
    ] = await Promise.all([
      supabaseAdmin
        .from('home_sampling_requests')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'nouveau'),
      supabaseAdmin
        .from('home_sampling_requests')
        .select('id', { count: 'exact', head: true }),
      supabaseAdmin
        .from('contact_messages')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'nouveau'),
      supabaseAdmin
        .from('contact_messages')
        .select('id', { count: 'exact', head: true }),
      supabaseAdmin
        .from('recruitment_applications')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'reçu'),
      supabaseAdmin
        .from('recruitment_applications')
        .select('id', { count: 'exact', head: true }),
      supabaseAdmin
        .from('specialties')
        .select('id', { count: 'exact', head: true }),
      supabaseAdmin
        .from('examinations')
        .select('id', { count: 'exact', head: true }),
      supabaseAdmin
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(15),
      getSettingsBundle(),
      listSpecialties(false),
      listExaminations(false),
      listGallery(false),
      listJobPositions(false),
    ]);

    return {
      counts: {
        samplingNew: samplingNewRes.count ?? 0,
        samplingTotal: samplingTotalRes.count ?? 0,
        contactNew: contactNewRes.count ?? 0,
        contactTotal: contactTotalRes.count ?? 0,
        recruitmentNew: recruitmentNewRes.count ?? 0,
        recruitmentTotal: recruitmentTotalRes.count ?? 0,
        specialties: specCountRes.count ?? 0,
        examinations: examCountRes.count ?? 0,
      },
      recentActivity: (activityRes.data || []).map((r) =>
        mapActivity(r as Record<string, unknown>)
      ),
      settings,
      specialties: allSpecialties,
      examinations: allExams,
      gallery: allGallery,
      positions: allPositions,
    };
  }

  const [
    [samplingNew],
    [samplingTotal],
    [contactNew],
    [contactTotal],
    [recruitmentNew],
    [recruitmentTotal],
    [specCount],
    [examCount],
    recentActivity,
    settings,
    allSpecialties,
    allExams,
    allGallery,
    allPositions,
  ] = await Promise.all([
    db
      .select({ total: count() })
      .from(homeSamplingRequests)
      .where(eq(homeSamplingRequests.status, 'nouveau')),
    db.select({ total: count() }).from(homeSamplingRequests),
    db
      .select({ total: count() })
      .from(contactMessages)
      .where(eq(contactMessages.status, 'nouveau')),
    db.select({ total: count() }).from(contactMessages),
    db
      .select({ total: count() })
      .from(recruitmentApplications)
      .where(eq(recruitmentApplications.status, 'reçu')),
    db.select({ total: count() }).from(recruitmentApplications),
    db.select({ total: count() }).from(specialties),
    db.select({ total: count() }).from(examinations),
    db
      .select()
      .from(activityLogs)
      .orderBy(desc(activityLogs.createdAt))
      .limit(15),
    getSettingsBundle(),
    listSpecialties(false),
    listExaminations(false),
    listGallery(false),
    listJobPositions(false),
  ]);

  return {
    counts: {
      samplingNew: Number(samplingNew.total),
      samplingTotal: Number(samplingTotal.total),
      contactNew: Number(contactNew.total),
      contactTotal: Number(contactTotal.total),
      recruitmentNew: Number(recruitmentNew.total),
      recruitmentTotal: Number(recruitmentTotal.total),
      specialties: Number(specCount.total),
      examinations: Number(examCount.total),
    },
    recentActivity: recentActivity.map((r) =>
      mapActivity(r as unknown as Record<string, unknown>)
    ),
    settings,
    specialties: allSpecialties,
    examinations: allExams,
    gallery: allGallery,
    positions: allPositions,
  };
}

export async function listAdminUsers(): Promise<AdminUserItem[]> {
  if (isSupabaseServerConfigured && supabaseAdmin) {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('id, uid, email, display_name, role, is_active, created_at')
      .order('id', { ascending: true });
    if (error) throw error;
    return (data || []).map((r) => mapAdminUser(r as Record<string, unknown>));
  }

  const rows = await db
    .select({
      id: users.id,
      uid: users.uid,
      email: users.email,
      displayName: users.displayName,
      role: users.role,
      isActive: users.isActive,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(asc(users.id));
  return rows.map((r) => mapAdminUser(r as unknown as Record<string, unknown>));
}

export async function upsertAdminUser(input: {
  email: string;
  displayName: string;
  role: 'super_admin' | 'admin' | 'editor';
  passwordHash?: string;
  supabaseUid?: string;
}): Promise<AdminUserItem> {
  const emailLower = input.email.toLowerCase().trim();
  const uidValue = input.supabaseUid || `pending:${emailLower}`;

  if (isSupabaseServerConfigured && supabaseAdmin) {
    const payload: Record<string, unknown> = {
      uid: uidValue,
      email: emailLower,
      display_name: input.displayName,
      role: input.role,
      is_active: true,
    };
    if (input.passwordHash) {
      payload.password_hash = input.passwordHash;
    }

    const { data: existing } = await supabaseAdmin
      .from('users')
      .select('id, uid')
      .eq('email', emailLower)
      .maybeSingle();

    if (existing) {
      const updateObj: Record<string, unknown> = {
        display_name: input.displayName,
        role: input.role,
        is_active: true,
      };
      if (input.supabaseUid) updateObj.uid = input.supabaseUid;
      if (input.passwordHash) updateObj.password_hash = input.passwordHash;

      const { data, error } = await supabaseAdmin
        .from('users')
        .update(updateObj)
        .eq('id', existing.id)
        .select('id, uid, email, display_name, role, is_active, created_at')
        .single();
      if (error) throw error;
      return mapAdminUser(data as Record<string, unknown>);
    }

    const { data, error } = await supabaseAdmin
      .from('users')
      .insert(payload)
      .select('id, uid, email, display_name, role, is_active, created_at')
      .single();
    if (error) throw error;
    return mapAdminUser(data as Record<string, unknown>);
  }

  const updateSet: Partial<{
    displayName: string;
    role: string;
    isActive: boolean;
    passwordHash: string;
  }> = {
    displayName: input.displayName,
    role: input.role,
    isActive: true,
  };
  if (input.passwordHash) {
    updateSet.passwordHash = input.passwordHash;
  }

  const [created] = await db
    .insert(users)
    .values({
      uid: uidValue,
      email: emailLower,
      displayName: input.displayName,
      role: input.role,
      passwordHash: input.passwordHash || '',
      isActive: true,
    })
    .onConflictDoUpdate({
      target: users.email,
      set: updateSet,
    })
    .returning({
      id: users.id,
      uid: users.uid,
      email: users.email,
      displayName: users.displayName,
      role: users.role,
      isActive: users.isActive,
      createdAt: users.createdAt,
    });
  return mapAdminUser(created as unknown as Record<string, unknown>);
}

export async function updateAdminUser(
  id: number,
  fields: Partial<{ role: string; isActive: boolean; displayName: string }>
): Promise<AdminUserItem | null> {
  if (isSupabaseServerConfigured && supabaseAdmin) {
    const patch: Record<string, unknown> = {};
    if (fields.role !== undefined) patch.role = fields.role;
    if (fields.isActive !== undefined) patch.is_active = fields.isActive;
    if (fields.displayName !== undefined) patch.display_name = fields.displayName;

    const { data, error } = await supabaseAdmin
      .from('users')
      .update(patch)
      .eq('id', id)
      .select('id, uid, email, display_name, role, is_active, created_at')
      .maybeSingle();
    if (error) throw error;
    return data ? mapAdminUser(data as Record<string, unknown>) : null;
  }

  const [updated] = await db
    .update(users)
    .set(fields)
    .where(eq(users.id, id))
    .returning({
      id: users.id,
      uid: users.uid,
      email: users.email,
      displayName: users.displayName,
      role: users.role,
      isActive: users.isActive,
      createdAt: users.createdAt,
    });
  return updated ? mapAdminUser(updated as unknown as Record<string, unknown>) : null;
}

export async function deleteAdminUser(id: number): Promise<void> {
  if (isSupabaseServerConfigured && supabaseAdmin) {
    const { error } = await supabaseAdmin.from('users').delete().eq('id', id);
    if (error) throw error;
    return;
  }
  await db.delete(users).where(eq(users.id, id));
}
