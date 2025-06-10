import {
  users,
  patients,
  consultationTypes,
  procedureTypes,
  transactionTypes,
  appointments,
  procedures,
  transactions,
  userTypeConfigs,
  type User,
  type UpsertUser,
  type Patient,
  type InsertPatient,
  type ConsultationType,
  type InsertConsultationType,
  type ProcedureType,
  type InsertProcedureType,
  type TransactionType,
  type InsertTransactionType,
  type Appointment,
  type InsertAppointment,
  type Procedure,
  type InsertProcedure,
  type Transaction,
  type InsertTransaction,
  type UserTypeConfig,
  type InsertUserTypeConfig,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte, like, desc, asc } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserType(userId: string, userType: string): Promise<User>;
  
  // Patient operations
  getPatients(): Promise<Patient[]>;
  getPatient(id: number): Promise<Patient | undefined>;
  getPatientByCpf(cpf: string): Promise<Patient | undefined>;
  createPatient(patient: InsertPatient): Promise<Patient>;
  updatePatient(id: number, patient: Partial<InsertPatient>): Promise<Patient>;
  searchPatients(query: string): Promise<Patient[]>;
  
  // Consultation type operations
  getConsultationTypes(): Promise<ConsultationType[]>;
  getConsultationType(id: number): Promise<ConsultationType | undefined>;
  createConsultationType(consultationType: InsertConsultationType): Promise<ConsultationType>;
  updateConsultationType(id: number, consultationType: Partial<InsertConsultationType>): Promise<ConsultationType>;
  deleteConsultationType(id: number): Promise<void>;
  
  // Procedure type operations
  getProcedureTypes(): Promise<ProcedureType[]>;
  getProcedureType(id: number): Promise<ProcedureType | undefined>;
  createProcedureType(procedureType: InsertProcedureType): Promise<ProcedureType>;
  updateProcedureType(id: number, procedureType: Partial<InsertProcedureType>): Promise<ProcedureType>;
  deleteProcedureType(id: number): Promise<void>;
  
  // Transaction type operations
  getTransactionTypes(): Promise<TransactionType[]>;
  getTransactionType(id: number): Promise<TransactionType | undefined>;
  createTransactionType(transactionType: InsertTransactionType): Promise<TransactionType>;
  updateTransactionType(id: number, transactionType: Partial<InsertTransactionType>): Promise<TransactionType>;
  deleteTransactionType(id: number): Promise<void>;
  
  // Appointment operations
  getAppointments(filters?: { date?: string; doctorId?: string; patientId?: number }): Promise<Appointment[]>;
  getAppointment(id: number): Promise<Appointment | undefined>;
  createAppointment(appointment: InsertAppointment): Promise<Appointment>;
  updateAppointment(id: number, appointment: Partial<InsertAppointment>): Promise<Appointment>;
  deleteAppointment(id: number): Promise<void>;
  getDoctorAvailability(doctorId: string, date: string): Promise<string[]>;
  
  // Procedure operations
  getProcedures(filters?: { patientId?: number; doctorId?: string; appointmentId?: number }): Promise<Procedure[]>;
  getProcedure(id: number): Promise<Procedure | undefined>;
  createProcedure(procedure: InsertProcedure): Promise<Procedure>;
  updateProcedure(id: number, procedure: Partial<InsertProcedure>): Promise<Procedure>;
  
  // Transaction operations
  getTransactions(filters?: { patientId?: number; status?: string; dateFrom?: string; dateTo?: string }): Promise<Transaction[]>;
  getTransaction(id: number): Promise<Transaction | undefined>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  updateTransaction(id: number, transaction: Partial<InsertTransaction>): Promise<Transaction>;
  
  // User type config operations
  getUserTypeConfigs(): Promise<UserTypeConfig[]>;
  getUserTypeConfig(id: number): Promise<UserTypeConfig | undefined>;
  createUserTypeConfig(config: InsertUserTypeConfig): Promise<UserTypeConfig>;
  updateUserTypeConfig(id: number, config: Partial<InsertUserTypeConfig>): Promise<UserTypeConfig>;
  deleteUserTypeConfig(id: number): Promise<void>;
  
  // Dashboard metrics
  getDashboardMetrics(): Promise<{
    todayAppointments: number;
    pendingPayments: number;
    monthlyRevenue: number;
    activePatients: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUserType(userId: string, userType: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ userType, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  // Patient operations
  async getPatients(): Promise<Patient[]> {
    return await db.select().from(patients).orderBy(asc(patients.name));
  }

  async getPatient(id: number): Promise<Patient | undefined> {
    const [patient] = await db.select().from(patients).where(eq(patients.id, id));
    return patient;
  }

  async getPatientByCpf(cpf: string): Promise<Patient | undefined> {
    const [patient] = await db.select().from(patients).where(eq(patients.cpf, cpf));
    return patient;
  }

  async createPatient(patient: InsertPatient): Promise<Patient> {
    const [newPatient] = await db.insert(patients).values(patient).returning();
    return newPatient;
  }

  async updatePatient(id: number, patient: Partial<InsertPatient>): Promise<Patient> {
    const [updatedPatient] = await db
      .update(patients)
      .set({ ...patient, updatedAt: new Date() })
      .where(eq(patients.id, id))
      .returning();
    return updatedPatient;
  }

  async searchPatients(query: string): Promise<Patient[]> {
    return await db
      .select()
      .from(patients)
      .where(like(patients.name, `%${query}%`))
      .orderBy(asc(patients.name));
  }

  // Consultation type operations
  async getConsultationTypes(): Promise<ConsultationType[]> {
    return await db.select().from(consultationTypes).where(eq(consultationTypes.isActive, true));
  }

  async getConsultationType(id: number): Promise<ConsultationType | undefined> {
    const [consultationType] = await db.select().from(consultationTypes).where(eq(consultationTypes.id, id));
    return consultationType;
  }

  async createConsultationType(consultationType: InsertConsultationType): Promise<ConsultationType> {
    const [newConsultationType] = await db.insert(consultationTypes).values(consultationType).returning();
    return newConsultationType;
  }

  async updateConsultationType(id: number, consultationType: Partial<InsertConsultationType>): Promise<ConsultationType> {
    const [updatedConsultationType] = await db
      .update(consultationTypes)
      .set(consultationType)
      .where(eq(consultationTypes.id, id))
      .returning();
    return updatedConsultationType;
  }

  async deleteConsultationType(id: number): Promise<void> {
    await db.update(consultationTypes).set({ isActive: false }).where(eq(consultationTypes.id, id));
  }

  // Procedure type operations
  async getProcedureTypes(): Promise<ProcedureType[]> {
    return await db.select().from(procedureTypes).where(eq(procedureTypes.isActive, true));
  }

  async getProcedureType(id: number): Promise<ProcedureType | undefined> {
    const [procedureType] = await db.select().from(procedureTypes).where(eq(procedureTypes.id, id));
    return procedureType;
  }

  async createProcedureType(procedureType: InsertProcedureType): Promise<ProcedureType> {
    const [newProcedureType] = await db.insert(procedureTypes).values(procedureType).returning();
    return newProcedureType;
  }

  async updateProcedureType(id: number, procedureType: Partial<InsertProcedureType>): Promise<ProcedureType> {
    const [updatedProcedureType] = await db
      .update(procedureTypes)
      .set(procedureType)
      .where(eq(procedureTypes.id, id))
      .returning();
    return updatedProcedureType;
  }

  async deleteProcedureType(id: number): Promise<void> {
    await db.update(procedureTypes).set({ isActive: false }).where(eq(procedureTypes.id, id));
  }

  // Transaction type operations
  async getTransactionTypes(): Promise<TransactionType[]> {
    return await db.select().from(transactionTypes).where(eq(transactionTypes.isActive, true));
  }

  async getTransactionType(id: number): Promise<TransactionType | undefined> {
    const [transactionType] = await db.select().from(transactionTypes).where(eq(transactionTypes.id, id));
    return transactionType;
  }

  async createTransactionType(transactionType: InsertTransactionType): Promise<TransactionType> {
    const [newTransactionType] = await db.insert(transactionTypes).values(transactionType).returning();
    return newTransactionType;
  }

  async updateTransactionType(id: number, transactionType: Partial<InsertTransactionType>): Promise<TransactionType> {
    const [updatedTransactionType] = await db
      .update(transactionTypes)
      .set(transactionType)
      .where(eq(transactionTypes.id, id))
      .returning();
    return updatedTransactionType;
  }

  async deleteTransactionType(id: number): Promise<void> {
    await db.update(transactionTypes).set({ isActive: false }).where(eq(transactionTypes.id, id));
  }

  // Appointment operations
  async getAppointments(filters?: { date?: string; doctorId?: string; patientId?: number }): Promise<Appointment[]> {
    let query = db.select().from(appointments);
    
    if (filters?.date) {
      query = query.where(eq(appointments.date, filters.date));
    }
    if (filters?.doctorId) {
      query = query.where(eq(appointments.doctorId, filters.doctorId));
    }
    if (filters?.patientId) {
      query = query.where(eq(appointments.patientId, filters.patientId));
    }
    
    return await query.orderBy(asc(appointments.date), asc(appointments.time));
  }

  async getAppointment(id: number): Promise<Appointment | undefined> {
    const [appointment] = await db.select().from(appointments).where(eq(appointments.id, id));
    return appointment;
  }

  async createAppointment(appointment: InsertAppointment): Promise<Appointment> {
    const [newAppointment] = await db.insert(appointments).values(appointment).returning();
    return newAppointment;
  }

  async updateAppointment(id: number, appointment: Partial<InsertAppointment>): Promise<Appointment> {
    const [updatedAppointment] = await db
      .update(appointments)
      .set({ ...appointment, updatedAt: new Date() })
      .where(eq(appointments.id, id))
      .returning();
    return updatedAppointment;
  }

  async deleteAppointment(id: number): Promise<void> {
    await db.delete(appointments).where(eq(appointments.id, id));
  }

  async getDoctorAvailability(doctorId: string, date: string): Promise<string[]> {
    const existingAppointments = await db
      .select({ time: appointments.time })
      .from(appointments)
      .where(and(eq(appointments.doctorId, doctorId), eq(appointments.date, date)));
    
    const bookedTimes = existingAppointments.map(apt => apt.time);
    
    // Generate available time slots (8 AM to 6 PM, 30-minute intervals)
    const allTimes = [];
    for (let hour = 8; hour < 18; hour++) {
      allTimes.push(`${hour.toString().padStart(2, '0')}:00:00`);
      allTimes.push(`${hour.toString().padStart(2, '0')}:30:00`);
    }
    
    return allTimes.filter(time => !bookedTimes.includes(time));
  }

  // Procedure operations
  async getProcedures(filters?: { patientId?: number; doctorId?: string; appointmentId?: number }): Promise<Procedure[]> {
    let query = db.select().from(procedures);
    
    if (filters?.patientId) {
      query = query.where(eq(procedures.patientId, filters.patientId));
    }
    if (filters?.doctorId) {
      query = query.where(eq(procedures.doctorId, filters.doctorId));
    }
    if (filters?.appointmentId) {
      query = query.where(eq(procedures.appointmentId, filters.appointmentId));
    }
    
    return await query.orderBy(desc(procedures.date));
  }

  async getProcedure(id: number): Promise<Procedure | undefined> {
    const [procedure] = await db.select().from(procedures).where(eq(procedures.id, id));
    return procedure;
  }

  async createProcedure(procedure: InsertProcedure): Promise<Procedure> {
    const [newProcedure] = await db.insert(procedures).values(procedure).returning();
    return newProcedure;
  }

  async updateProcedure(id: number, procedure: Partial<InsertProcedure>): Promise<Procedure> {
    const [updatedProcedure] = await db
      .update(procedures)
      .set(procedure)
      .where(eq(procedures.id, id))
      .returning();
    return updatedProcedure;
  }

  // Transaction operations
  async getTransactions(filters?: { patientId?: number; status?: string; dateFrom?: string; dateTo?: string }): Promise<Transaction[]> {
    let query = db.select().from(transactions);
    
    if (filters?.patientId) {
      query = query.where(eq(transactions.patientId, filters.patientId));
    }
    if (filters?.status) {
      query = query.where(eq(transactions.status, filters.status));
    }
    if (filters?.dateFrom) {
      query = query.where(gte(transactions.transactionDate, new Date(filters.dateFrom)));
    }
    if (filters?.dateTo) {
      query = query.where(lte(transactions.transactionDate, new Date(filters.dateTo)));
    }
    
    return await query.orderBy(desc(transactions.transactionDate));
  }

  async getTransaction(id: number): Promise<Transaction | undefined> {
    const [transaction] = await db.select().from(transactions).where(eq(transactions.id, id));
    return transaction;
  }

  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const [newTransaction] = await db.insert(transactions).values(transaction).returning();
    return newTransaction;
  }

  async updateTransaction(id: number, transaction: Partial<InsertTransaction>): Promise<Transaction> {
    const [updatedTransaction] = await db
      .update(transactions)
      .set(transaction)
      .where(eq(transactions.id, id))
      .returning();
    return updatedTransaction;
  }

  // User type config operations
  async getUserTypeConfigs(): Promise<UserTypeConfig[]> {
    return await db.select().from(userTypeConfigs).where(eq(userTypeConfigs.isActive, true));
  }

  async getUserTypeConfig(id: number): Promise<UserTypeConfig | undefined> {
    const [config] = await db.select().from(userTypeConfigs).where(eq(userTypeConfigs.id, id));
    return config;
  }

  async createUserTypeConfig(config: InsertUserTypeConfig): Promise<UserTypeConfig> {
    const [newConfig] = await db.insert(userTypeConfigs).values(config).returning();
    return newConfig;
  }

  async updateUserTypeConfig(id: number, config: Partial<InsertUserTypeConfig>): Promise<UserTypeConfig> {
    const [updatedConfig] = await db
      .update(userTypeConfigs)
      .set(config)
      .where(eq(userTypeConfigs.id, id))
      .returning();
    return updatedConfig;
  }

  async deleteUserTypeConfig(id: number): Promise<void> {
    await db.update(userTypeConfigs).set({ isActive: false }).where(eq(userTypeConfigs.id, id));
  }

  // Dashboard metrics
  async getDashboardMetrics(): Promise<{
    todayAppointments: number;
    pendingPayments: number;
    monthlyRevenue: number;
    activePatients: number;
  }> {
    const today = new Date().toISOString().split('T')[0];
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    // Today's appointments
    const todayAppointments = await db
      .select({ count: appointments.id })
      .from(appointments)
      .where(eq(appointments.date, today));

    // Pending payments
    const pendingTransactions = await db
      .select({ amount: transactions.amount })
      .from(transactions)
      .where(eq(transactions.status, 'pending'));

    const pendingPayments = pendingTransactions.reduce((sum, t) => sum + Number(t.amount), 0);

    // Monthly revenue
    const monthlyTransactions = await db
      .select({ amount: transactions.amount })
      .from(transactions)
      .where(and(
        eq(transactions.status, 'paid'),
        gte(transactions.transactionDate, monthStart)
      ));

    const monthlyRevenue = monthlyTransactions.reduce((sum, t) => sum + Number(t.amount), 0);

    // Active patients (patients with appointments in the last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const activePatientIds = await db
      .selectDistinct({ patientId: appointments.patientId })
      .from(appointments)
      .where(gte(appointments.date, sixMonthsAgo.toISOString().split('T')[0]));

    return {
      todayAppointments: todayAppointments.length,
      pendingPayments,
      monthlyRevenue,
      activePatients: activePatientIds.length,
    };
  }
}

export const storage = new DatabaseStorage();
