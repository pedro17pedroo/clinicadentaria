import express from "express";
import { createServer, type Server } from "http";
import mongoose from "mongoose";
import { storage } from "./storage";
import {
  createPatientSchema,
  createAppointmentSchema,
  createProcedureSchema,
  createTransactionSchema,
  type IUser
} from "@shared/schema";
import { z } from "zod";
import type { Request, Response, NextFunction, Express } from "express";
import jwt from 'jsonwebtoken';

// Schemas temporários para tipos não migrados
const createConsultationTypeSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  price: z.number().positive('Preço deve ser positivo'),
  description: z.string().optional(),
});

const createProcedureTypeSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  price: z.number().positive('Preço deve ser positivo'),
  category: z.string().optional(),
  description: z.string().optional(),
  specialty: z.string().optional(),
});

const updateProcedureTypeSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  price: z.number().positive('Preço deve ser positivo'),
  category: z.string().optional(),
  description: z.string().optional(),
  specialty: z.string().optional(),
});

const createTransactionTypeSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  category: z.enum(['income', 'expense']),
  description: z.string().optional(),
});

const createUserTypeConfigSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  userType: z.enum(['admin', 'employee', 'doctor']),
  permissions: z.record(z.string(), z.boolean()),
  description: z.string().optional(),
});

const createUserWithPasswordSchema = z.object({
  email: z.string().email('Email inválido'),
  firstName: z.string().min(1, 'Nome é obrigatório'),
  lastName: z.string().min(1, 'Sobrenome é obrigatório'),
  userType: z.enum(['admin', 'employee', 'doctor']),
  specialties: z.array(z.string()).optional(),
  contactInfo: z.string().optional(),
  password: z.string().min(6, 'Password deve ter pelo menos 6 caracteres'),
  isActive: z.boolean().optional().default(true),
});

const updateUserSchema = z.object({
  email: z.string().email('Email inválido').optional(),
  firstName: z.string().min(1, 'Nome é obrigatório').optional(),
  lastName: z.string().min(1, 'Sobrenome é obrigatório').optional(),
  userType: z.enum(['admin', 'employee', 'doctor']).optional(),
  specialties: z.array(z.string()).optional(),
  contactInfo: z.string().optional(),
  isActive: z.boolean().optional(),
});

// ============================================================================
// MIDDLEWARE DE AUTORIZAÇÃO
// ============================================================================

// Middleware para verificar JWT
const verifyToken = (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ message: 'Token de acesso requerido' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret');
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token inválido' });
  }
};

/**
 * Middleware para verificar se o utilizador tem uma permissão específica
 * @param permission - A permissão necessária (ex: 'patients.read', 'users.write')
 * @returns Middleware function
 */
function requirePermission(permission: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      
      if (!user || !user.userId) {
        return res.status(401).json({ message: 'Utilizador não autenticado' });
      }

      // Buscar dados completos do utilizador
      const userData = await storage.getUser(user.userId);
      
      if (!userData) {
        return res.status(401).json({ message: 'Utilizador não encontrado' });
      }

      // Verificar se é admin (admin tem todas as permissões)
      if (userData.userType === 'admin') {
        return next();
      }

      // Buscar configurações de permissões para o tipo de utilizador
      const userTypeConfigs = await storage.getUserTypeConfigs();
      const userConfig = userTypeConfigs.find(config => 
        config.name.toLowerCase() === userData.userType.toLowerCase() && config.isActive === true
      );

      if (!userConfig) {
        return res.status(403).json({ 
          message: `Configuração não encontrada para o tipo de utilizador: ${userData.userType}` 
        });
      }

      // Verificar se o utilizador tem a permissão específica
      if (!userConfig.permissions[permission]) {
        return res.status(403).json({ 
          message: `Acesso negado. Permissão necessária: ${permission}` 
        });
      }

      // Adicionar dados do utilizador ao request para uso posterior
      (req as any).userData = userData;
      (req as any).userPermissions = userConfig.permissions;
      
      next();
    } catch (error) {
      console.error('Erro na verificação de permissões:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  };
}

/**
 * Middleware para verificar se o utilizador é admin
 */
function requireAdmin(req: Request, res: Response, next: NextFunction) {
  return requirePermission('admin.access')(req, res, next);
}

/**
 * Função auxiliar para verificar múltiplas permissões
 * @param permissions - Array de permissões necessárias
 * @returns Middleware function
 */
function requireAnyPermission(permissions: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      
      if (!user || !user.userId) {
        return res.status(401).json({ message: 'Utilizador não autenticado' });
      }

      const userData = await storage.getUser(user.userId);
      
      if (!userData) {
        return res.status(401).json({ message: 'Utilizador não encontrado' });
      }

      // Admin tem todas as permissões
      if (userData.userType === 'admin') {
        return next();
      }

      const userTypeConfigs = await storage.getUserTypeConfigs();
      const userConfig = userTypeConfigs.find(config => 
        config.name.toLowerCase() === userData.userType.toLowerCase() && config.isActive === true
      );

      if (!userConfig) {
        return res.status(403).json({ 
          message: `Configuração não encontrada para o tipo de utilizador: ${userData.userType}` 
        });
      }

      // Verificar se o utilizador tem pelo menos uma das permissões
      const hasPermission = permissions.some(permission => userConfig.permissions[permission]);
      
      if (!hasPermission) {
        return res.status(403).json({ 
          message: `Acesso negado. Permissões necessárias: ${permissions.join(' ou ')}` 
        });
      }

      (req as any).userData = userData;
      (req as any).userPermissions = userConfig.permissions;
      
      next();
    } catch (error) {
      console.error('Erro na verificação de permissões:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  };
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.get('/api/auth/user', verifyToken, async (req: any, res) => {
    try {
      const userId = req.user.userId;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Logout route
  app.post('/api/logout', (req, res) => {
    try {
      // No servidor, o logout é apenas uma confirmação
      // O token é removido no frontend
      res.json({ message: 'Logout realizado com sucesso' });
    } catch (error) {
      console.error("Error during logout:", error);
      res.status(500).json({ message: "Erro durante o logout" });
    }
  });

  // Logout route (GET para compatibilidade)
  app.get('/api/logout', (req, res) => {
    try {
      // Redireciona para a página de login após logout
      res.redirect('/');
    } catch (error) {
      console.error("Error during logout:", error);
      res.status(500).json({ message: "Erro durante o logout" });
    }
  });

  // Dashboard metrics
  app.get('/api/dashboard/metrics', verifyToken, async (req, res) => {
    try {
      const metrics = await storage.getDashboardMetrics();
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching dashboard metrics:", error);
      res.status(500).json({ message: "Failed to fetch dashboard metrics" });
    }
  });

  // Patient routes - com controle de permissões
  app.get('/api/patients', verifyToken, requirePermission('patients.read'), async (req, res) => {
    try {
      const { search } = req.query;
      let patients;
      
      if (search && typeof search === 'string') {
        patients = await storage.searchPatients(search);
      } else {
        patients = await storage.getPatients();
      }
      
      res.json(patients);
    } catch (error) {
      console.error("Error fetching patients:", error);
      res.status(500).json({ message: "Failed to fetch patients" });
    }
  });

  app.get('/api/patients/:id', verifyToken, requirePermission('patients.read'), async (req, res) => {
    try {
      const id = req.params.id;
      const patient = await storage.getPatient(id);
      
      if (!patient) {
        return res.status(404).json({ message: "Patient not found" });
      }
      
      res.json(patient);
    } catch (error) {
      console.error("Error fetching patient:", error);
      res.status(500).json({ message: "Failed to fetch patient" });
    }
  });

  app.post('/api/patients', verifyToken, requirePermission('patients.write'), async (req, res) => {
    try {
      const validatedData = createPatientSchema.parse(req.body);
      
      const patient = await storage.createPatient(validatedData);
      res.status(201).json(patient);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid patient data", errors: error.errors });
      }
      // Verificar se é erro de DI duplicado
      if (error instanceof Error && error.message.includes('Já existe um paciente com este Documento de Identidade')) {
        return res.status(400).json({ message: error.message });
      }
      // Verificar se é erro de NIF duplicado
      if (error instanceof Error && error.message.includes('Já existe um paciente com este NIF')) {
        return res.status(400).json({ message: error.message });
      }
      console.error("Error creating patient:", error);
      res.status(500).json({ message: "Failed to create patient" });
    }
  });

  app.put('/api/patients/:id', verifyToken, requirePermission('patients.write'), async (req, res) => {
    try {
      const id = req.params.id;
      const validatedData = createPatientSchema.partial().parse(req.body);
      
      const patient = await storage.updatePatient(id, validatedData);
      res.json(patient);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid patient data", errors: error.errors });
      }
      // Verificar se é erro de DI duplicado
      if (error instanceof Error && error.message.includes('Já existe um paciente com este Documento de Identidade')) {
        return res.status(400).json({ message: error.message });
      }
      // Verificar se é erro de NIF duplicado
      if (error instanceof Error && error.message.includes('Já existe um paciente com este NIF')) {
        return res.status(400).json({ message: error.message });
      }
      console.error("Error updating patient:", error);
      res.status(500).json({ message: "Failed to update patient" });
    }
  });

  app.delete('/api/patients/:id', verifyToken, requirePermission('patients.delete'), async (req, res) => {
    try {
      const id = req.params.id;
      
      const success = await storage.deletePatient(id);
      
      if (success) {
        res.json({ message: "Paciente eliminado com sucesso" });
      } else {
        res.status(404).json({ message: "Paciente não encontrado" });
      }
    } catch (error) {
      console.error("Error deleting patient:", error);
      if (error instanceof Error && error.message.includes('consultas, procedimentos ou transações')) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Falha ao eliminar paciente" });
      }
    }
  });

  // Consultation type routes
  app.get('/api/consultation-types', verifyToken, async (req, res) => {
    try {
      const consultationTypes = await storage.getConsultationTypes();
      res.json(consultationTypes);
    } catch (error) {
      console.error("Error fetching consultation types:", error);
      res.status(500).json({ message: "Failed to fetch consultation types" });
    }
  });

  app.post('/api/consultation-types', verifyToken, async (req: any, res) => {
    try {
      // Check if user is admin
      const user = await storage.getUser(req.user.userId);
      if (user?.userType !== 'admin') {
        return res.status(403).json({ message: "Access denied. Admin role required." });
      }

      const validatedData = createConsultationTypeSchema.parse(req.body);
      const consultationType = await storage.createConsultationType(validatedData);
      res.status(201).json(consultationType);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid consultation type data", errors: error.errors });
      }
      console.error("Error creating consultation type:", error);
      res.status(500).json({ message: "Failed to create consultation type" });
    }
  });

  app.put('/api/consultation-types/:id', verifyToken, async (req: any, res) => {
    try {
      // Check if user is admin
      const user = await storage.getUser(req.user.userId);
      if (user?.userType !== 'admin') {
        return res.status(403).json({ message: "Access denied. Admin role required." });
      }

      const id = req.params.id;
      const validatedData = createConsultationTypeSchema.partial().parse(req.body);
      const consultationType = await storage.updateConsultationType(id, validatedData);
      
      if (!consultationType) {
        return res.status(404).json({ message: "Consultation type not found" });
      }
      
      res.json(consultationType);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid consultation type data", errors: error.errors });
      }
      console.error("Error updating consultation type:", error);
      res.status(500).json({ message: "Failed to update consultation type" });
    }
  });

  app.delete('/api/consultation-types/:id', verifyToken, async (req: any, res) => {
    try {
      // Check if user is admin
      const user = await storage.getUser(req.user.userId);
      if (user?.userType !== 'admin') {
        return res.status(403).json({ message: "Access denied. Admin role required." });
      }

      const id = req.params.id;
      await storage.deleteConsultationType(id);
      res.json({ message: "Consultation type deleted successfully" });
    } catch (error) {
      console.error("Error deleting consultation type:", error);
      res.status(500).json({ message: "Failed to delete consultation type" });
    }
  });

  // Procedure type routes
  app.get('/api/procedure-types', async (req, res) => {
    try {
      const procedureTypes = await storage.getProcedureTypes();
      res.json(procedureTypes);
    } catch (error) {
      console.error("Error fetching procedure types:", error);
      res.status(500).json({ message: "Failed to fetch procedure types" });
    }
  });

  app.post('/api/procedure-types', verifyToken, async (req: any, res) => {
    try {
      // Check if user is admin
      const user = await storage.getUser(req.user.userId);
      if (user?.userType !== 'admin') {
        return res.status(403).json({ message: "Access denied. Admin role required." });
      }

      const validatedData = createProcedureTypeSchema.parse(req.body);
      const procedureType = await storage.createProcedureType(validatedData);
      res.status(201).json(procedureType);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid procedure type data", errors: error.errors });
      }
      console.error("Error creating procedure type:", error);
      res.status(500).json({ message: "Failed to create procedure type" });
    }
  });

  app.put('/api/procedure-types/:id', verifyToken, async (req: any, res) => {
    try {
      // Check if user is admin
      const user = await storage.getUser(req.user.userId);
      if (user?.userType !== 'admin') {
        return res.status(403).json({ message: "Access denied. Admin role required." });
      }

      const validatedData = updateProcedureTypeSchema.parse(req.body);
      const procedureType = await storage.updateProcedureType(req.params.id, validatedData);
      
      if (!procedureType) {
        return res.status(404).json({ message: "Procedure type not found" });
      }
      
      res.json(procedureType);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid procedure type data", errors: error.errors });
      }
      console.error("Error updating procedure type:", error);
      res.status(500).json({ message: "Failed to update procedure type" });
    }
  });

  app.delete('/api/procedure-types/:id', verifyToken, async (req: any, res) => {
    try {
      // Check if user is admin
      const user = await storage.getUser(req.user.userId);
      if (user?.userType !== 'admin') {
        return res.status(403).json({ message: "Access denied. Admin role required." });
      }

      const success = await storage.deleteProcedureType(req.params.id);
      
      if (!success) {
        return res.status(404).json({ message: "Procedure type not found" });
      }
      
      res.json({ message: "Procedure type deleted successfully" });
    } catch (error) {
      console.error("Error deleting procedure type:", error);
      res.status(500).json({ message: "Failed to delete procedure type" });
    }
  });

  // Transaction type routes
  app.get('/api/transaction-types', verifyToken, async (req, res) => {
    try {
      const transactionTypes = await storage.getTransactionTypes();
      res.json(transactionTypes);
    } catch (error) {
      console.error("Error fetching transaction types:", error);
      res.status(500).json({ message: "Failed to fetch transaction types" });
    }
  });

  app.post('/api/transaction-types', verifyToken, async (req: any, res) => {
    try {
      // Check if user is admin
      const user = await storage.getUser(req.user.userId);
      if (user?.userType !== 'admin') {
        return res.status(403).json({ message: "Access denied. Admin role required." });
      }

      const validatedData = createTransactionTypeSchema.parse(req.body);
      const transactionType = await storage.createTransactionType(validatedData);
      res.status(201).json(transactionType);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid transaction type data", errors: error.errors });
      }
      console.error("Error creating transaction type:", error);
      res.status(500).json({ message: "Failed to create transaction type" });
    }
  });

  app.put('/api/transaction-types/:id', verifyToken, async (req: any, res) => {
    try {
      // Check if user is admin
      const user = await storage.getUser(req.user.userId);
      if (user?.userType !== 'admin') {
        return res.status(403).json({ message: "Access denied. Admin role required." });
      }

      const id = req.params.id;
      const validatedData = createTransactionTypeSchema.partial().parse(req.body);
      const transactionType = await storage.updateTransactionType(id, validatedData);
      res.json(transactionType);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid transaction type data", errors: error.errors });
      }
      console.error("Error updating transaction type:", error);
      res.status(500).json({ message: "Failed to update transaction type" });
    }
  });

  app.delete('/api/transaction-types/:id', verifyToken, async (req: any, res) => {
    try {
      // Check if user is admin
      const user = await storage.getUser(req.user.userId);
      if (user?.userType !== 'admin') {
        return res.status(403).json({ message: "Access denied. Admin role required." });
      }

      const id = req.params.id;
      await storage.deleteTransactionType(id);
      res.json({ message: "Transaction type deactivated successfully" });
    } catch (error) {
      console.error("Error deleting transaction type:", error);
      res.status(500).json({ message: "Failed to delete transaction type" });
    }
  });

  // Appointment routes - com controle de permissões
  app.get('/api/appointments', verifyToken, requirePermission('appointments.read'), async (req, res) => {
    try {
      const { date, doctorId, patientId, status, search, page, limit } = req.query;
      const filters: any = {};
      
      if (date && typeof date === 'string') filters.date = date;
      if (doctorId && typeof doctorId === 'string') filters.doctorId = doctorId;
      if (patientId && typeof patientId === 'string') filters.patientId = patientId;
      if (status && typeof status === 'string') filters.status = status;
      if (search && typeof search === 'string') filters.search = search;
      if (page && typeof page === 'string') filters.page = parseInt(page, 10);
      if (limit && typeof limit === 'string') filters.limit = parseInt(limit, 10);
      
      const result = await storage.getAppointments(filters);
      res.json(result);
    } catch (error) {
      console.error("Error fetching appointments:", error);
      res.status(500).json({ message: "Failed to fetch appointments" });
    }
  });

  app.post('/api/appointments', verifyToken, requirePermission('appointments.write'), async (req, res) => {
    try {
      console.log(`[DEBUG] POST /api/appointments - Request body:`, req.body);
      const validatedData = createAppointmentSchema.parse(req.body);
      console.log(`[DEBUG] Validated data:`, validatedData);
      
      // Check doctor availability
      const availableTimes = await storage.getDoctorAvailability(validatedData.doctorId, validatedData.date);
      console.log(`[DEBUG] Available times from storage:`, availableTimes);
      console.log(`[DEBUG] Requested time:`, validatedData.time);
      console.log(`[DEBUG] Time is available:`, availableTimes.includes(validatedData.time));
      
      if (!availableTimes.includes(validatedData.time)) {
        console.log(`[DEBUG] Rejecting appointment - time not available`);
        return res.status(400).json({ message: "Doctor is not available at the selected time" });
      }
      
      const appointment = await storage.createAppointment(validatedData);
      console.log(`[DEBUG] Appointment created successfully:`, appointment);
      res.status(201).json(appointment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.log(`[DEBUG] Validation error:`, error.errors);
        return res.status(400).json({ message: "Invalid appointment data", errors: error.errors });
      }
      console.error("Error creating appointment:", error);
      res.status(500).json({ message: "Failed to create appointment" });
    }
  });

  app.put('/api/appointments/:id', verifyToken, requirePermission('appointments.write'), async (req, res) => {
    try {
      const id = req.params.id;
      console.log(`[DEBUG] PUT /api/appointments/${id} - Request body:`, req.body);
      
      const validatedData = createAppointmentSchema.partial().parse(req.body);
      console.log(`[DEBUG] Validated data:`, validatedData);
      
      const appointment = await storage.updateAppointment(id, validatedData);
      console.log(`[DEBUG] Updated appointment:`, appointment);
      
      // Nota: A criação de transações agora é gerenciada pelo cliente
      // para permitir controle sobre o status baseado no método de pagamento
      
      res.json(appointment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.log(`[DEBUG] Validation error:`, error.errors);
        return res.status(400).json({ message: "Invalid appointment data", errors: error.errors });
      }
      console.error("Error updating appointment:", error);
      res.status(500).json({ message: "Failed to update appointment" });
    }
  });

  app.get('/api/doctors/:doctorId/availability', verifyToken, async (req, res) => {
    try {
      const { doctorId } = req.params;
      const { date } = req.query;
      
      if (!date || typeof date !== 'string') {
        return res.status(400).json({ message: "Date parameter is required" });
      }
      
      const availableTimes = await storage.getDoctorAvailability(doctorId, date);
      res.json(availableTimes);
    } catch (error) {
      console.error("Error fetching doctor availability:", error);
      res.status(500).json({ message: "Failed to fetch doctor availability" });
    }
  });

  // Procedure routes
  app.get('/api/procedures', verifyToken, async (req, res) => {
    try {
      const { patientId, doctorId, appointmentId, procedureTypeId, status, search, page, limit } = req.query;
      const filters: any = {};
      
      if (patientId && typeof patientId === 'string') filters.patientId = patientId;
      if (doctorId && typeof doctorId === 'string') filters.doctorId = doctorId;
      if (appointmentId && typeof appointmentId === 'string') filters.appointmentId = appointmentId;
      if (procedureTypeId && typeof procedureTypeId === 'string') filters.procedureTypeId = procedureTypeId;
      if (status && typeof status === 'string') filters.status = status;
      if (search && typeof search === 'string') filters.search = search;
      if (page && typeof page === 'string') filters.page = parseInt(page, 10);
      if (limit && typeof limit === 'string') filters.limit = parseInt(limit, 10);
      
      const result = await storage.getProcedures(filters);
      res.json(result);
    } catch (error) {
      console.error("Error fetching procedures:", error);
      res.status(500).json({ message: "Failed to fetch procedures" });
    }
  });

  app.post('/api/procedures', verifyToken, async (req, res) => {
    try {
      const validatedData = createProcedureSchema.parse(req.body);
      
      // Validate ObjectIds
      if (!mongoose.Types.ObjectId.isValid(validatedData.patientId)) {
        return res.status(400).json({ message: "Invalid patient ID" });
      }
      if (!mongoose.Types.ObjectId.isValid(validatedData.doctorId)) {
        return res.status(400).json({ message: "Invalid doctor ID" });
      }
      if (!mongoose.Types.ObjectId.isValid(validatedData.procedureTypeId)) {
        return res.status(400).json({ message: "Invalid procedure type ID" });
      }
      if (validatedData.appointmentId && !mongoose.Types.ObjectId.isValid(validatedData.appointmentId)) {
        return res.status(400).json({ message: "Invalid appointment ID" });
      }
      
      // Get procedure type for cost
      const procedureType = await storage.getProcedureType(validatedData.procedureTypeId);
      if (!procedureType) {
        return res.status(400).json({ message: "Invalid procedure type" });
      }
      
      const procedureData = {
        ...validatedData,
        cost: procedureType.price,
      };
      
      const procedure = await storage.createProcedure(procedureData);
      
      // Não criar transação automaticamente - será criada quando o pagamento for processado
      
      res.status(201).json(procedure);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid procedure data", errors: error.errors });
      }
      console.error("Error creating procedure:", error);
      res.status(500).json({ message: "Failed to create procedure" });
    }
  });

  app.put('/api/procedures/:id', verifyToken, requirePermission('procedures.write'), async (req, res) => {
    try {
      const id = req.params.id;
      
      // Validate procedure ID
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid procedure ID" });
      }
      
      const validatedData = createProcedureSchema.partial().parse(req.body);
      
      // Validate ObjectIds if provided
      if (validatedData.patientId && !mongoose.Types.ObjectId.isValid(validatedData.patientId)) {
        return res.status(400).json({ message: "Invalid patient ID" });
      }
      if (validatedData.doctorId && !mongoose.Types.ObjectId.isValid(validatedData.doctorId)) {
        return res.status(400).json({ message: "Invalid doctor ID" });
      }
      if (validatedData.procedureTypeId && !mongoose.Types.ObjectId.isValid(validatedData.procedureTypeId)) {
        return res.status(400).json({ message: "Invalid procedure type ID" });
      }
      if (validatedData.appointmentId && !mongoose.Types.ObjectId.isValid(validatedData.appointmentId)) {
        return res.status(400).json({ message: "Invalid appointment ID" });
      }
      
      // If procedure type is being updated, get the new cost
      if (validatedData.procedureTypeId) {
        const procedureType = await storage.getProcedureType(validatedData.procedureTypeId);
        if (!procedureType) {
          return res.status(400).json({ message: "Invalid procedure type" });
        }
        validatedData.cost = procedureType.price;
      }
      
      const procedure = await storage.updateProcedure(id, validatedData);
      res.json(procedure);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid procedure data", errors: error.errors });
      }
      console.error("Error updating procedure:", error);
      res.status(500).json({ message: "Failed to update procedure" });
    }
  });

  // Transaction routes - com controle de permissões
  app.get('/api/transactions', verifyToken, requirePermission('transactions.read'), async (req, res) => {
    try {
      const { patientId, status, dateFrom, dateTo, page, limit } = req.query;
      const filters: any = {};
      
      if (patientId && typeof patientId === 'string') filters.patientId = patientId;
      if (status && typeof status === 'string') filters.status = status;
      if (dateFrom && typeof dateFrom === 'string') filters.dateFrom = dateFrom;
      if (dateTo && typeof dateTo === 'string') filters.dateTo = dateTo;
      if (page && typeof page === 'string') filters.page = parseInt(page, 10);
      if (limit && typeof limit === 'string') filters.limit = parseInt(limit, 10);
      
      const result = await storage.getTransactions(filters);
      res.json(result);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  app.post('/api/transactions', verifyToken, requirePermission('transactions.write'), async (req, res) => {
    try {
      const validatedData = createTransactionSchema.parse(req.body);
      const transaction = await storage.createTransaction(validatedData);
      res.status(201).json(transaction);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating transaction:", error);
      res.status(500).json({ message: "Failed to create transaction" });
    }
  });

  app.put('/api/transactions/:id', verifyToken, requirePermission('transactions.write'), async (req, res) => {
    try {
      const id = req.params.id;
      const validatedData = createTransactionSchema.partial().parse(req.body);
      
      // If marking as paid, set the paid date
      if (validatedData.status === 'paid') {
        validatedData.paidDate = new Date().toISOString();
      }
      
      const transaction = await storage.updateTransaction(id, validatedData);
      res.json(transaction);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid transaction data", errors: error.errors });
      }
      console.error("Error updating transaction:", error);
      res.status(500).json({ message: "Failed to update transaction" });
    }
  });

  app.delete('/api/transactions/:id', verifyToken, requirePermission('transactions.delete'), async (req, res) => {
    try {
      const id = req.params.id;
      const success = await storage.deleteTransaction(id);
      
      if (!success) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting transaction:", error);
      res.status(500).json({ message: "Failed to delete transaction" });
    }
  });

  // Cancel paid transaction route
  app.patch('/api/transactions/:id/cancel', verifyToken, requirePermission('transactions.write'), async (req, res) => {
    try {
      const id = req.params.id;
      const { cancellationReason } = req.body;
      
      // Validate that cancellation reason is provided
      if (!cancellationReason || typeof cancellationReason !== 'string' || cancellationReason.trim().length === 0) {
        return res.status(400).json({ message: "Motivo do anulamento é obrigatório" });
      }
      
      // Get the current transaction to verify it's paid
      const currentTransaction = await storage.getTransaction(id);
      if (!currentTransaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      
      if (currentTransaction.status !== 'paid') {
        return res.status(400).json({ message: "Only paid transactions can be cancelled" });
      }
      
      // Update transaction to cancelled status
      const updateData = {
        status: 'cancelled' as any,
        cancelledDate: new Date().toISOString(),
        cancellationReason: cancellationReason.trim()
      };
      
      const transaction = await storage.updateTransaction(id, updateData);
      res.json(transaction);
    } catch (error) {
      console.error("Error cancelling transaction:", error);
      res.status(500).json({ message: "Failed to cancel transaction" });
    }
  });

  // User type configuration routes (Admin only)
  app.get('/api/user-type-configs', verifyToken, requireAdmin, async (req: any, res) => {
    try {
      const configs = await storage.getUserTypeConfigs();
      res.json(configs);
    } catch (error) {
      console.error("Error fetching user type configs:", error);
      res.status(500).json({ message: "Failed to fetch user type configs" });
    }
  });

  app.post('/api/user-type-configs', verifyToken, requireAdmin, async (req: any, res) => {
    try {
      const validatedData = createUserTypeConfigSchema.parse(req.body);
      const config = await storage.createUserTypeConfig(validatedData);
      res.status(201).json(config);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid user type config data", errors: error.errors });
      }
      console.error("Error creating user type config:", error);
      res.status(500).json({ message: "Failed to create user type config" });
    }
  });

  app.put('/api/user-type-configs/:id', verifyToken, requireAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const validatedData = createUserTypeConfigSchema.parse(req.body);
      const config = await storage.updateUserTypeConfig(id, validatedData);
      
      if (!config) {
        return res.status(404).json({ message: "User type config not found" });
      }
      
      res.json(config);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error updating user type config:", error);
      res.status(500).json({ message: "Failed to update user type config" });
    }
  });

  app.delete('/api/user-type-configs/:id', verifyToken, requireAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      
      // Validar se o ID é um ObjectId válido
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid user type config ID" });
      }
      
      await storage.deleteUserTypeConfig(id);
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting user type config:", error);
      res.status(500).json({ message: "Failed to delete user type config" });
    }
  });

  // Rota pública para buscar médicos (para formulários de procedimentos)
  app.get('/api/doctors', verifyToken, async (req, res) => {
    try {
      const users = await storage.getUsers();
      const doctors = users.filter(user => user.userType === 'doctor' && user.isActive !== false);
      
      // Retornar apenas os campos necessários para o select
      const doctorsForSelect = doctors.map(doctor => ({
        _id: doctor._id,
        firstName: doctor.firstName,
        lastName: doctor.lastName,
        specialties: doctor.specialties || [],
        userType: doctor.userType
      }));
      
      res.json(doctorsForSelect);
    } catch (error) {
      console.error("Error fetching doctors:", error);
      res.status(500).json({ message: "Failed to fetch doctors" });
    }
  });

  // User management routes (Admin only)
  app.get('/api/users', verifyToken, requireAdmin, async (req, res) => {
    try {
      const { userType } = req.query;
      let users = await storage.getUsers();
      
      // Filtrar por tipo de usuário se especificado
      if (userType && typeof userType === 'string') {
        users = users.filter(user => user.userType === userType);
      }
      
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.post('/api/users', verifyToken, requireAdmin, async (req: any, res) => {
    try {
      const validatedData = createUserWithPasswordSchema.parse(req.body);
      const userData = {
        email: validatedData.email,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        userType: validatedData.userType,
        specialties: validatedData.specialties || [],
        contactInfo: validatedData.contactInfo,
        password: validatedData.password,
        isActive: validatedData.isActive ?? true,
        mustChangePassword: false,
        ...(validatedData.userType === 'doctor' && {
          workingDays: [],
          workingHours: { start: '08:00', end: '18:00' },
          consultationTypes: [],
          procedureTypes: [],
          dailySchedules: {}
        })
      };
      const user = await storage.createUser(userData as any);
      res.status(201).json(user);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid user data", errors: error.errors });
      }
      
      // Verificar se é erro de email duplicado
      if (error.code === 11000 && error.keyPattern?.email) {
        return res.status(409).json({ 
          message: "Email já está em uso", 
          field: "email" 
        });
      }
      
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  app.put('/api/users/:userId', verifyToken, requireAdmin, async (req: any, res) => {
    try {
      const { userId } = req.params;
      const validatedData = updateUserSchema.parse(req.body);
      const updatedUser = await storage.updateUser(userId, validatedData);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(updatedUser);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid user data", errors: error.errors });
      }
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  app.put('/api/users/:userId/type', verifyToken, requireAdmin, async (req: any, res) => {
    try {
      const { userId } = req.params;
      const { userType } = req.body;
      
      if (!['admin', 'employee', 'doctor'].includes(userType)) {
        return res.status(400).json({ message: "Invalid user type" });
      }

      const updatedUser = await storage.updateUserType(userId, userType);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user type:", error);
      res.status(500).json({ message: "Failed to update user type" });
    }
  });

  // Endpoint para ativar/desativar utilizador
  app.patch('/api/users/:userId/status', verifyToken, requireAdmin, async (req: any, res) => {
    try {
      const { userId } = req.params;
      const { isActive } = req.body;
      
      if (typeof isActive !== 'boolean') {
        return res.status(400).json({ message: "isActive deve ser um valor booleano" });
      }

      const updatedUser = await storage.updateUserStatus(userId, isActive);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "Utilizador não encontrado" });
      }
      
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user status:", error);
      res.status(500).json({ message: "Falha ao alterar status do utilizador" });
    }
  });

  app.delete('/api/users/:userId', verifyToken, requireAdmin, async (req: any, res) => {
    try {
      const { userId } = req.params;
      const success = await storage.deleteUser(userId);
      
      if (!success) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({ message: "User deactivated successfully" });
    } catch (error) {
      console.error("Error deactivating user:", error);
      res.status(500).json({ message: "Failed to deactivate user" });
    }
  });

  // Rotas específicas para gestão de médicos
  
  // Atualizar horários e especialidades do médico
  app.put('/api/doctors/:doctorId/schedule', verifyToken, requireAdmin, async (req: any, res) => {
    try {
      const { doctorId } = req.params;
      const { workingDays, workingHours, dailySchedules, consultationTypes, procedureTypes } = req.body;
      
      // Validar se o usuário é realmente um médico
      const doctor = await storage.getUser(doctorId);
      if (!doctor || doctor.userType !== 'doctor') {
        return res.status(404).json({ message: "Médico não encontrado" });
      }
      
      const updatedDoctor = await storage.updateDoctorSchedule(doctorId, {
        workingDays,
        workingHours,
        dailySchedules,
        consultationTypes,
        procedureTypes
      });
      
      res.json(updatedDoctor);
    } catch (error) {
      console.error("Error updating doctor schedule:", error);
      res.status(500).json({ message: "Falha ao atualizar horários do médico" });
    }
  });
  
  // Atualizar especialidades do médico
  app.put('/api/doctors/:doctorId/specialties', verifyToken, requireAdmin, async (req: any, res) => {
    try {
      const { doctorId } = req.params;
      const { specialties } = req.body;
      
      if (!Array.isArray(specialties)) {
        return res.status(400).json({ message: "Especialidades devem ser um array" });
      }
      
      // Validar se o usuário é realmente um médico
      const doctor = await storage.getUser(doctorId);
      if (!doctor || doctor.userType !== 'doctor') {
        return res.status(404).json({ message: "Médico não encontrado" });
      }
      
      const updatedDoctor = await storage.updateDoctorSpecialties(doctorId, specialties);
      
      res.json(updatedDoctor);
    } catch (error) {
      console.error("Error updating doctor specialties:", error);
      res.status(500).json({ message: "Falha ao atualizar especialidades do médico" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
