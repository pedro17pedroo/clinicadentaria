import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import {
  insertPatientSchema,
  insertConsultationTypeSchema,
  insertProcedureTypeSchema,
  insertAppointmentSchema,
  insertProcedureSchema,
  insertTransactionSchema,
  insertUserTypeConfigSchema,
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Dashboard metrics
  app.get('/api/dashboard/metrics', isAuthenticated, async (req, res) => {
    try {
      const metrics = await storage.getDashboardMetrics();
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching dashboard metrics:", error);
      res.status(500).json({ message: "Failed to fetch dashboard metrics" });
    }
  });

  // Patient routes
  app.get('/api/patients', isAuthenticated, async (req, res) => {
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

  app.get('/api/patients/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
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

  app.post('/api/patients', isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertPatientSchema.parse(req.body);
      
      // Check if patient with CPF already exists
      const existingPatient = await storage.getPatientByCpf(validatedData.cpf);
      if (existingPatient) {
        return res.status(400).json({ message: "Patient with this CPF already exists" });
      }
      
      const patient = await storage.createPatient(validatedData);
      res.status(201).json(patient);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid patient data", errors: error.errors });
      }
      console.error("Error creating patient:", error);
      res.status(500).json({ message: "Failed to create patient" });
    }
  });

  app.put('/api/patients/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertPatientSchema.partial().parse(req.body);
      
      const patient = await storage.updatePatient(id, validatedData);
      res.json(patient);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid patient data", errors: error.errors });
      }
      console.error("Error updating patient:", error);
      res.status(500).json({ message: "Failed to update patient" });
    }
  });

  // Consultation type routes
  app.get('/api/consultation-types', isAuthenticated, async (req, res) => {
    try {
      const consultationTypes = await storage.getConsultationTypes();
      res.json(consultationTypes);
    } catch (error) {
      console.error("Error fetching consultation types:", error);
      res.status(500).json({ message: "Failed to fetch consultation types" });
    }
  });

  app.post('/api/consultation-types', isAuthenticated, async (req: any, res) => {
    try {
      // Check if user is admin
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.userType !== 'admin') {
        return res.status(403).json({ message: "Access denied. Admin role required." });
      }

      const validatedData = insertConsultationTypeSchema.parse(req.body);
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

  // Procedure type routes
  app.get('/api/procedure-types', isAuthenticated, async (req, res) => {
    try {
      const procedureTypes = await storage.getProcedureTypes();
      res.json(procedureTypes);
    } catch (error) {
      console.error("Error fetching procedure types:", error);
      res.status(500).json({ message: "Failed to fetch procedure types" });
    }
  });

  app.post('/api/procedure-types', isAuthenticated, async (req: any, res) => {
    try {
      // Check if user is admin
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.userType !== 'admin') {
        return res.status(403).json({ message: "Access denied. Admin role required." });
      }

      const validatedData = insertProcedureTypeSchema.parse(req.body);
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

  // Appointment routes
  app.get('/api/appointments', isAuthenticated, async (req, res) => {
    try {
      const { date, doctorId, patientId } = req.query;
      const filters: any = {};
      
      if (date && typeof date === 'string') filters.date = date;
      if (doctorId && typeof doctorId === 'string') filters.doctorId = doctorId;
      if (patientId && typeof patientId === 'string') filters.patientId = parseInt(patientId);
      
      const appointments = await storage.getAppointments(filters);
      res.json(appointments);
    } catch (error) {
      console.error("Error fetching appointments:", error);
      res.status(500).json({ message: "Failed to fetch appointments" });
    }
  });

  app.post('/api/appointments', isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertAppointmentSchema.parse(req.body);
      
      // Check doctor availability
      const availableTimes = await storage.getDoctorAvailability(validatedData.doctorId, validatedData.date);
      if (!availableTimes.includes(validatedData.time)) {
        return res.status(400).json({ message: "Doctor is not available at the selected time" });
      }
      
      const appointment = await storage.createAppointment(validatedData);
      res.status(201).json(appointment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid appointment data", errors: error.errors });
      }
      console.error("Error creating appointment:", error);
      res.status(500).json({ message: "Failed to create appointment" });
    }
  });

  app.put('/api/appointments/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertAppointmentSchema.partial().parse(req.body);
      
      const appointment = await storage.updateAppointment(id, validatedData);
      
      // If appointment is completed, create a pending transaction
      if (validatedData.status === 'completed') {
        const appointmentData = await storage.getAppointment(id);
        const consultationType = await storage.getConsultationType(appointmentData!.consultationTypeId);
        
        if (consultationType) {
          await storage.createTransaction({
            patientId: appointmentData!.patientId,
            appointmentId: id,
            amount: consultationType.price,
            type: 'consultation',
            status: 'pending',
            description: `Consultation: ${consultationType.name}`,
            dueDate: new Date().toISOString().split('T')[0],
          });
        }
      }
      
      res.json(appointment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid appointment data", errors: error.errors });
      }
      console.error("Error updating appointment:", error);
      res.status(500).json({ message: "Failed to update appointment" });
    }
  });

  app.get('/api/doctors/:doctorId/availability', isAuthenticated, async (req, res) => {
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
  app.get('/api/procedures', isAuthenticated, async (req, res) => {
    try {
      const { patientId, doctorId, appointmentId } = req.query;
      const filters: any = {};
      
      if (patientId && typeof patientId === 'string') filters.patientId = parseInt(patientId);
      if (doctorId && typeof doctorId === 'string') filters.doctorId = doctorId;
      if (appointmentId && typeof appointmentId === 'string') filters.appointmentId = parseInt(appointmentId);
      
      const procedures = await storage.getProcedures(filters);
      res.json(procedures);
    } catch (error) {
      console.error("Error fetching procedures:", error);
      res.status(500).json({ message: "Failed to fetch procedures" });
    }
  });

  app.post('/api/procedures', isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertProcedureSchema.parse(req.body);
      
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
      
      // Create a transaction for the procedure
      await storage.createTransaction({
        patientId: procedure.patientId,
        procedureId: procedure.id,
        amount: procedure.cost,
        type: 'procedure',
        status: 'pending',
        description: `Procedure: ${procedureType.name}`,
        dueDate: new Date().toISOString().split('T')[0],
      });
      
      res.status(201).json(procedure);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid procedure data", errors: error.errors });
      }
      console.error("Error creating procedure:", error);
      res.status(500).json({ message: "Failed to create procedure" });
    }
  });

  // Transaction routes
  app.get('/api/transactions', isAuthenticated, async (req, res) => {
    try {
      const { patientId, status, dateFrom, dateTo } = req.query;
      const filters: any = {};
      
      if (patientId && typeof patientId === 'string') filters.patientId = parseInt(patientId);
      if (status && typeof status === 'string') filters.status = status;
      if (dateFrom && typeof dateFrom === 'string') filters.dateFrom = dateFrom;
      if (dateTo && typeof dateTo === 'string') filters.dateTo = dateTo;
      
      const transactions = await storage.getTransactions(filters);
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  app.put('/api/transactions/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertTransactionSchema.partial().parse(req.body);
      
      // If marking as paid, set the paid date
      if (validatedData.status === 'paid') {
        validatedData.paidDate = new Date();
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

  // User type configuration routes (Admin only)
  app.get('/api/user-type-configs', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.userType !== 'admin') {
        return res.status(403).json({ message: "Access denied. Admin role required." });
      }

      const configs = await storage.getUserTypeConfigs();
      res.json(configs);
    } catch (error) {
      console.error("Error fetching user type configs:", error);
      res.status(500).json({ message: "Failed to fetch user type configs" });
    }
  });

  app.post('/api/user-type-configs', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.userType !== 'admin') {
        return res.status(403).json({ message: "Access denied. Admin role required." });
      }

      const validatedData = insertUserTypeConfigSchema.parse(req.body);
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

  // User management routes (Admin only)
  app.put('/api/users/:userId/type', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
      if (currentUser?.userType !== 'admin') {
        return res.status(403).json({ message: "Access denied. Admin role required." });
      }

      const { userId } = req.params;
      const { userType } = req.body;
      
      if (!['admin', 'employee', 'doctor'].includes(userType)) {
        return res.status(400).json({ message: "Invalid user type" });
      }

      const updatedUser = await storage.updateUserType(userId, userType);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user type:", error);
      res.status(500).json({ message: "Failed to update user type" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
