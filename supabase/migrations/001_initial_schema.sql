-- =============================================================================
-- Laboratoires d'analyses médicales El Amine — Supabase PostgreSQL + RLS Schema
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.users (
  id SERIAL PRIMARY KEY,
  uid TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  display_name TEXT DEFAULT '',
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('super_admin', 'admin', 'editor')),
  password_hash TEXT DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.site_settings (
  id SERIAL PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.specialties (
  id SERIAL PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  short_description TEXT NOT NULL,
  full_description TEXT NOT NULL,
  icon_name TEXT NOT NULL DEFAULT 'FlaskConical',
  image_url TEXT DEFAULT '',
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.examinations (
  id SERIAL PRIMARY KEY,
  specialty_id INTEGER REFERENCES public.specialties(id) ON DELETE SET NULL,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  sample_type TEXT NOT NULL,
  preparation TEXT NOT NULL,
  fasting_required BOOLEAN NOT NULL DEFAULT FALSE,
  turnaround_time TEXT NOT NULL,
  notes TEXT DEFAULT '',
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.gallery_photos (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  caption TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'installations',
  image_url TEXT NOT NULL,
  is_authentic BOOLEAN NOT NULL DEFAULT TRUE,
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.home_sampling_requests (
  id SERIAL PRIMARY KEY,
  patient_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  requested_date TEXT NOT NULL,
  preferred_time TEXT NOT NULL,
  additional_info TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'nouveau' CHECK (status IN ('nouveau', 'en_cours', 'confirmé', 'archivé')),
  internal_notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.contact_messages (
  id SERIAL PRIMARY KEY,
  sender_name TEXT NOT NULL,
  phone TEXT DEFAULT '',
  email TEXT DEFAULT '',
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'nouveau' CHECK (status IN ('nouveau', 'traité', 'archivé')),
  internal_notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.job_positions (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  department TEXT NOT NULL,
  contract_type TEXT NOT NULL,
  description TEXT NOT NULL,
  is_open BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.recruitment_applications (
  id SERIAL PRIMARY KEY,
  position_id INTEGER REFERENCES public.job_positions(id) ON DELETE SET NULL,
  position_title TEXT NOT NULL,
  applicant_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  message TEXT DEFAULT '',
  cv_filename TEXT NOT NULL,
  cv_mime_type TEXT NOT NULL,
  cv_size INTEGER NOT NULL,
  cv_base64 TEXT NOT NULL DEFAULT '',
  cv_storage_path TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'reçu' CHECK (status IN ('reçu', 'présélectionné', 'entretien', 'archivé')),
  internal_notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.activity_logs (
  id SERIAL PRIMARY KEY,
  type TEXT NOT NULL,
  summary TEXT NOT NULL,
  actor TEXT DEFAULT 'Système',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- Row Level Security (RLS)
-- =============================================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.specialties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.examinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.home_sampling_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recruitment_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Helper function checking active authenticated admin
CREATE OR REPLACE FUNCTION public.is_active_admin()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.is_active = TRUE
      AND (u.uid = auth.uid()::text OR LOWER(u.email) = LOWER(auth.jwt() ->> 'email'))
  );
$$;

-- Public read access ONLY for published content
CREATE POLICY "Public read site_settings" ON public.site_settings
  FOR SELECT USING (TRUE);

CREATE POLICY "Public read published specialties" ON public.specialties
  FOR SELECT USING (is_published = TRUE);

CREATE POLICY "Public read published examinations" ON public.examinations
  FOR SELECT USING (is_published = TRUE);

CREATE POLICY "Public read published gallery" ON public.gallery_photos
  FOR SELECT USING (is_published = TRUE);

CREATE POLICY "Public read open job positions" ON public.job_positions
  FOR SELECT USING (is_open = TRUE);

-- Public insert-only policies for request & contact forms (NO public SELECT)
CREATE POLICY "Public submit home sampling" ON public.home_sampling_requests
  FOR INSERT WITH CHECK (
    char_length(patient_name) >= 2 AND char_length(phone) >= 8 AND char_length(address) >= 5
  );

CREATE POLICY "Public submit contact" ON public.contact_messages
  FOR INSERT WITH CHECK (
    char_length(sender_name) >= 2 AND char_length(subject) >= 2 AND char_length(message) >= 5
  );

CREATE POLICY "Public submit recruitment" ON public.recruitment_applications
  FOR INSERT WITH CHECK (
    char_length(applicant_name) >= 2 AND char_length(email) >= 5
  );

-- Active admins full access
CREATE POLICY "Admins manage users" ON public.users
  FOR ALL USING (public.is_active_admin()) WITH CHECK (public.is_active_admin());

CREATE POLICY "Admins manage settings" ON public.site_settings
  FOR ALL USING (public.is_active_admin()) WITH CHECK (public.is_active_admin());

CREATE POLICY "Admins manage specialties" ON public.specialties
  FOR ALL USING (public.is_active_admin()) WITH CHECK (public.is_active_admin());

CREATE POLICY "Admins manage examinations" ON public.examinations
  FOR ALL USING (public.is_active_admin()) WITH CHECK (public.is_active_admin());

CREATE POLICY "Admins manage gallery" ON public.gallery_photos
  FOR ALL USING (public.is_active_admin()) WITH CHECK (public.is_active_admin());

CREATE POLICY "Admins manage sampling requests" ON public.home_sampling_requests
  FOR ALL USING (public.is_active_admin()) WITH CHECK (public.is_active_admin());

CREATE POLICY "Admins manage contact messages" ON public.contact_messages
  FOR ALL USING (public.is_active_admin()) WITH CHECK (public.is_active_admin());

CREATE POLICY "Admins manage job positions" ON public.job_positions
  FOR ALL USING (public.is_active_admin()) WITH CHECK (public.is_active_admin());

CREATE POLICY "Admins manage applications" ON public.recruitment_applications
  FOR ALL USING (public.is_active_admin()) WITH CHECK (public.is_active_admin());

CREATE POLICY "Admins view activity logs" ON public.activity_logs
  FOR ALL USING (public.is_active_admin()) WITH CHECK (public.is_active_admin());

-- =============================================================================
-- Private Storage Bucket for Candidate CVs
-- =============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('cv-uploads', 'cv-uploads', FALSE)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Admins download CVs" ON storage.objects
  FOR SELECT USING (bucket_id = 'cv-uploads' AND public.is_active_admin());
