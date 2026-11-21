export interface GeneralSettings {
  labName: string;
  shortName: string;
  address: string;
  city: string;
  country: string;
  phone: string;
  phoneRaw: string;
  whatsapp: string;
  email: string;
  resultsPlatformUrl: string;
  googleMapsUrl: string;
  latitude: number;
  longitude: number;
  facebookUrl: string;
  instagramUrl: string;
}

export interface WhyChooseItem {
  number: string;
  title: string;
  description: string;
}

export interface HomepageSettings {
  heroKicker: string;
  heroTitle: string;
  heroSubtitle: string;
  heroImageUrl: string;
  introTitle: string;
  introBody: string;
  whyChooseItems: WhyChooseItem[];
  resultsBannerTitle: string;
  resultsBannerText: string;
}

export interface AboutValue {
  title: string;
  description: string;
}

export interface AboutSettings {
  headline: string;
  lead: string;
  historyTitle: string;
  historyText: string;
  missionTitle: string;
  missionText: string;
  visionText: string;
  values: AboutValue[];
}

export interface OpeningHourRow {
  day: string;
  hours: string;
  isOpen: boolean;
}

export interface HoursSettings {
  notice: string;
  schedule: OpeningHourRow[];
}

export interface RecruitmentSettings {
  enabled: boolean;
  introTitle: string;
  introText: string;
}

export interface SiteSettingsBundle {
  general: GeneralSettings;
  homepage: HomepageSettings;
  about: AboutSettings;
  hours: HoursSettings;
  recruitment: RecruitmentSettings;
}

export interface Specialty {
  id: number;
  slug: string;
  name: string;
  shortDescription: string;
  fullDescription: string;
  iconName: string;
  imageUrl: string | null;
  isPublished: boolean;
  sortOrder: number;
}

export interface Examination {
  id: number;
  specialtyId: number | null;
  code: string;
  name: string;
  sampleType: string;
  preparation: string;
  fastingRequired: boolean;
  turnaroundTime: string;
  notes: string | null;
  isPublished: boolean;
}

export interface GalleryPhoto {
  id: number;
  title: string;
  caption: string;
  category: string;
  imageUrl: string;
  isAuthentic: boolean;
  isPublished: boolean;
  sortOrder: number;
}

export interface JobPosition {
  id: number;
  title: string;
  department: string;
  contractType: string;
  description: string;
  isOpen: boolean;
}

export interface HomeSamplingRequestItem {
  id: number;
  patientName: string;
  phone: string;
  address: string;
  requestedDate: string;
  preferredTime: string;
  additionalInfo: string | null;
  status: string;
  internalNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ContactMessageItem {
  id: number;
  senderName: string;
  phone: string | null;
  email: string | null;
  subject: string;
  message: string;
  status: string;
  internalNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RecruitmentApplicationItem {
  id: number;
  positionId: number | null;
  positionTitle: string;
  applicantName: string;
  email: string;
  phone: string;
  message: string | null;
  cvFilename: string;
  cvMimeType: string;
  cvSize: number;
  status: string;
  internalNotes: string | null;
  createdAt: string;
}

export interface ActivityLogItem {
  id: number;
  type: string;
  summary: string;
  actor: string | null;
  createdAt: string;
}

export interface AdminUserItem {
  id: number;
  uid: string;
  email: string;
  displayName: string | null;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export interface PublicBootstrapPayload {
  settings: SiteSettingsBundle;
  specialties: Specialty[];
  examinations: Examination[];
  gallery: GalleryPhoto[];
  positions: JobPosition[];
}
