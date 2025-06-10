import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  decimal,
  boolean,
  date,
  time,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  userType: varchar("user_type").notNull().default("employee"), // admin, employee, doctor
  specialties: text("specialties").array(), // for doctors
  contactInfo: varchar("contact_info"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Patients table
export const patients = pgTable("patients", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  cpf: varchar("cpf").unique().notNull(),
  phone: varchar("phone"),
  email: varchar("email"),
  address: text("address"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Consultation types configuration
export const consultationTypes = pgTable("consultation_types", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Procedure types configuration
export const procedureTypes = pgTable("procedure_types", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  category: varchar("category"),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Appointments table
export const appointments = pgTable("appointments", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull().references(() => patients.id),
  doctorId: varchar("doctor_id").notNull().references(() => users.id),
  consultationTypeId: integer("consultation_type_id").notNull().references(() => consultationTypes.id),
  date: date("date").notNull(),
  time: time("time").notNull(),
  status: varchar("status").notNull().default("scheduled"), // scheduled, cancelled, completed
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Procedures table
export const procedures = pgTable("procedures", {
  id: serial("id").primaryKey(),
  appointmentId: integer("appointment_id").references(() => appointments.id),
  patientId: integer("patient_id").notNull().references(() => patients.id),
  doctorId: varchar("doctor_id").notNull().references(() => users.id),
  procedureTypeId: integer("procedure_type_id").notNull().references(() => procedureTypes.id),
  date: date("date").notNull(),
  cost: decimal("cost", { precision: 10, scale: 2 }).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Transaction types configuration
export const transactionTypes = pgTable("transaction_types", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  category: varchar("category").notNull(), // income, expense
  description: text("description"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Financial transactions table
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").references(() => patients.id),
  appointmentId: integer("appointment_id").references(() => appointments.id),
  procedureId: integer("procedure_id").references(() => procedures.id),
  transactionTypeId: integer("transaction_type_id").notNull().references(() => transactionTypes.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  status: varchar("status").notNull().default("pending"), // pending, paid, overdue
  description: text("description"),
  transactionDate: timestamp("transaction_date").defaultNow(),
  dueDate: date("due_date"),
  paidDate: timestamp("paid_date"),
  createdAt: timestamp("created_at").defaultNow(),
});

// User type configurations
export const userTypeConfigs = pgTable("user_type_configs", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull().unique(),
  permissions: jsonb("permissions").notNull(), // JSON object with permission flags
  description: text("description"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Schema exports for types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export type InsertPatient = typeof patients.$inferInsert;
export type Patient = typeof patients.$inferSelect;

export type InsertConsultationType = typeof consultationTypes.$inferInsert;
export type ConsultationType = typeof consultationTypes.$inferSelect;

export type InsertProcedureType = typeof procedureTypes.$inferInsert;
export type ProcedureType = typeof procedureTypes.$inferSelect;

export type InsertTransactionType = typeof transactionTypes.$inferInsert;
export type TransactionType = typeof transactionTypes.$inferSelect;

export type InsertAppointment = typeof appointments.$inferInsert;
export type Appointment = typeof appointments.$inferSelect;

export type InsertProcedure = typeof procedures.$inferInsert;
export type Procedure = typeof procedures.$inferSelect;

export type InsertTransaction = typeof transactions.$inferInsert;
export type Transaction = typeof transactions.$inferSelect;

export type InsertUserTypeConfig = typeof userTypeConfigs.$inferInsert;
export type UserTypeConfig = typeof userTypeConfigs.$inferSelect;

// Zod schemas for validation
export const insertPatientSchema = createInsertSchema(patients).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertConsultationTypeSchema = createInsertSchema(consultationTypes).omit({
  id: true,
  createdAt: true,
});

export const insertProcedureTypeSchema = createInsertSchema(procedureTypes).omit({
  id: true,
  createdAt: true,
});

export const insertTransactionTypeSchema = createInsertSchema(transactionTypes).omit({
  id: true,
  createdAt: true,
});

export const insertAppointmentSchema = createInsertSchema(appointments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProcedureSchema = createInsertSchema(procedures).omit({
  id: true,
  createdAt: true,
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
});

export const insertUserTypeConfigSchema = createInsertSchema(userTypeConfigs).omit({
  id: true,
  createdAt: true,
});
