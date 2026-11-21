import { relations } from 'drizzle-orm';
import {
  boolean,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  email: text('email').notNull().unique(),
  displayName: text('display_name').default(''),
  role: text('role').notNull().default('admin'), // 'super_admin' | 'admin' | 'editor'
  passwordHash: text('password_hash').default(''),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const siteSettings = pgTable('site_settings', {
  id: serial('id').primaryKey(),
  key: text('key').notNull().unique(), // 'general' | 'homepage' | 'about' | 'hours' | 'recruitment'
  data: jsonb('data').notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const specialties = pgTable('specialties', {
  id: serial('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  shortDescription: text('short_description').notNull(),
  fullDescription: text('full_description').notNull(),
  iconName: text('icon_name').notNull().default('FlaskConical'),
  imageUrl: text('image_url').default(''),
  isPublished: boolean('is_published').notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const examinations = pgTable('examinations', {
  id: serial('id').primaryKey(),
  specialtyId: integer('specialty_id').references(() => specialties.id, {
    onDelete: 'set null',
  }),
  code: text('code').notNull(),
  name: text('name').notNull(),
  sampleType: text('sample_type').notNull(),
  preparation: text('preparation').notNull(),
  fastingRequired: boolean('fasting_required').notNull().default(false),
  turnaroundTime: text('turnaround_time').notNull(),
  notes: text('notes').default(''),
  isPublished: boolean('is_published').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const galleryPhotos = pgTable('gallery_photos', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  caption: text('caption').notNull(),
  category: text('category').notNull().default('installations'),
  imageUrl: text('image_url').notNull(),
  isAuthentic: boolean('is_authentic').notNull().default(true),
  isPublished: boolean('is_published').notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const homeSamplingRequests = pgTable('home_sampling_requests', {
  id: serial('id').primaryKey(),
  patientName: text('patient_name').notNull(),
  phone: text('phone').notNull(),
  address: text('address').notNull(),
  requestedDate: text('requested_date').notNull(),
  preferredTime: text('preferred_time').notNull(),
  additionalInfo: text('additional_info').default(''),
  status: text('status').notNull().default('nouveau'), // 'nouveau' | 'en_cours' | 'confirmé' | 'archivé'
  internalNotes: text('internal_notes').default(''),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const contactMessages = pgTable('contact_messages', {
  id: serial('id').primaryKey(),
  senderName: text('sender_name').notNull(),
  phone: text('phone').default(''),
  email: text('email').default(''),
  subject: text('subject').notNull(),
  message: text('message').notNull(),
  status: text('status').notNull().default('nouveau'), // 'nouveau' | 'traité' | 'archivé'
  internalNotes: text('internal_notes').default(''),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const jobPositions = pgTable('job_positions', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  department: text('department').notNull(),
  contractType: text('contract_type').notNull(),
  description: text('description').notNull(),
  isOpen: boolean('is_open').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const recruitmentApplications = pgTable('recruitment_applications', {
  id: serial('id').primaryKey(),
  positionId: integer('position_id').references(() => jobPositions.id, {
    onDelete: 'set null',
  }),
  positionTitle: text('position_title').notNull(),
  applicantName: text('applicant_name').notNull(),
  email: text('email').notNull(),
  phone: text('phone').notNull(),
  message: text('message').default(''),
  cvFilename: text('cv_filename').notNull(),
  cvMimeType: text('cv_mime_type').notNull(),
  cvSize: integer('cv_size').notNull(),
  cvBase64: text('cv_base64').notNull(),
  status: text('status').notNull().default('reçu'), // 'reçu' | 'présélectionné' | 'entretien' | 'archivé'
  internalNotes: text('internal_notes').default(''),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const activityLogs = pgTable('activity_logs', {
  id: serial('id').primaryKey(),
  type: text('type').notNull(),
  summary: text('summary').notNull(),
  actor: text('actor').default('Système'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const specialtiesRelations = relations(specialties, ({ many }) => ({
  examinations: many(examinations),
}));

export const examinationsRelations = relations(examinations, ({ one }) => ({
  specialty: one(specialties, {
    fields: [examinations.specialtyId],
    references: [specialties.id],
  }),
}));

export const jobPositionsRelations = relations(jobPositions, ({ many }) => ({
  applications: many(recruitmentApplications),
}));

export const recruitmentApplicationsRelations = relations(
  recruitmentApplications,
  ({ one }) => ({
    position: one(jobPositions, {
      fields: [recruitmentApplications.positionId],
      references: [jobPositions.id],
    }),
  })
);
