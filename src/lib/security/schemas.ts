/**
 * StudyFlow Schema Validation Module
 * Uses Zod to validate local storage reads, data imports, and state integrity.
 */

import { z } from "zod";

export const TaskPrioritySchema = z.enum(["high", "medium", "low"]);
export const TaskCategorySchema = z.enum(["homework", "exam", "revision", "project"]);
export const SubjectSchema = z.enum([
  "Mathematics",
  "Physics",
  "Chemistry",
  "Computer Science",
  "DSA",
  "English",
  "Electronics",
  "Other",
]);

export const TaskSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(500),
  subject: SubjectSchema,
  category: TaskCategorySchema,
  priority: TaskPrioritySchema,
  completed: z.boolean(),
  dueDate: z.string(),
  estimatedHours: z.number().nonnegative().optional(),
  completedAt: z.string().optional(),
});

export const UserProfileSchema = z.object({
  name: z.string().max(100),
  email: z.string().email().or(z.string().max(100)),
  phone: z.string().max(30),
  branch: z.string().max(100),
  className: z.string().max(100),
});

export const StudyLogSchema = z.object({
  id: z.string().min(1),
  subject: SubjectSchema,
  duration: z.number().positive(),
  date: z.string(),
  notes: z.string().max(2000).optional(),
});

export const SubjectMaterialSchema = z.object({
  id: z.string().min(1),
  subject: SubjectSchema,
  title: z.string().min(1).max(200),
  type: z.enum(["pdf", "link", "video", "notes"]),
  url: z.string().max(2000),
  createdAt: z.string(),
});

export const SettingsSchema = z.object({
  animations: z.boolean(),
  dailyGoal: z.number().int().positive(),
});

export const GamificationSchema = z.object({
  xp: z.number().nonnegative(),
  level: z.number().int().positive(),
  unlockedBadges: z.array(z.string()),
});

export const BackupSchema = z.object({
  version: z.string().optional(),
  exportedAt: z.string().optional(),
  tasks: z.array(TaskSchema).optional(),
  profile: UserProfileSchema.optional(),
  studyLogs: z.array(StudyLogSchema).optional(),
  materials: z.array(SubjectMaterialSchema).optional(),
  settings: SettingsSchema.optional(),
  gamification: GamificationSchema.optional(),
});

export type ValidatedBackup = z.infer<typeof BackupSchema>;
