import {
  User,
  Patient,
  ConsultationType,
  ProcedureType,
  TransactionType,
  Appointment,
  Procedure,
  Transaction,
  UserTypeConfig,
  type IUser,
  type IPatient,
  type IConsultationType,
  type IProcedureType,
  type ITransactionType,
  type IAppointment,
  type IProcedure,
  type ITransaction,
  type IUserTypeConfig,
  type CreateUser,
  type CreatePatient,
  type CreateAppointment,
  type CreateProcedure,
  type CreateTransaction,
} from "@shared/schema";
import { Types } from 'mongoose';

/**
 * Interface para operações de armazenamento
 * Define todos os métodos necessários para gestão de dados
 */
export interface IStorage {
  // Operações de utilizador
  getUsers(): Promise<IUser[]>;
  getUser(id: string): Promise<IUser | null>;
  upsertUser(user: Partial<IUser>): Promise<IUser>;
  createUser(userData: Omit<IUser, '_id' | 'createdAt' | 'updatedAt'>): Promise<IUser>;
  updateUser(id: string, userData: Partial<IUser>): Promise<IUser | null>;
  updateUserType(userId: string, userType: string): Promise<IUser | null>;
  updateUserStatus(userId: string, isActive: boolean): Promise<IUser | null>;
  updateDoctorSchedule(id: string, schedule: {
    workingDays?: string[];
    workingHours?: { start: string; end: string };
    dailySchedules?: {
      [key: string]: {
        start: string;
        end: string;
        isActive: boolean;
      };
    };
    consultationTypes?: string[];
    procedureTypes?: string[];
  }): Promise<IUser | null>;
  updateDoctorSpecialties(id: string, specialties: string[]): Promise<IUser | null>;
  deleteUser(id: string): Promise<boolean>;
  
  // Operações de paciente
  getPatients(): Promise<IPatient[]>;
  getPatient(id: string): Promise<IPatient | null>;
  getPatientByDi(di: string): Promise<IPatient | null>;
  createPatient(patient: CreatePatient): Promise<IPatient>;
  updatePatient(id: string, patient: Partial<CreatePatient>): Promise<IPatient | null>;
  deletePatient(id: string): Promise<boolean>;
  searchPatients(query: string): Promise<IPatient[]>;
  
  // Operações de tipo de consulta
  getConsultationTypes(): Promise<IConsultationType[]>;
  getConsultationType(id: string): Promise<IConsultationType | null>;
  createConsultationType(consultationType: Partial<IConsultationType>): Promise<IConsultationType>;
  updateConsultationType(id: string, consultationType: Partial<IConsultationType>): Promise<IConsultationType | null>;
  deleteConsultationType(id: string): Promise<void>;
  
  // Operações de tipo de procedimento
  getProcedureTypes(): Promise<IProcedureType[]>;
  getProcedureType(id: string): Promise<IProcedureType | null>;
  createProcedureType(procedureType: Partial<IProcedureType>): Promise<IProcedureType>;
  updateProcedureType(id: string, procedureType: Partial<IProcedureType>): Promise<IProcedureType | null>;
  deleteProcedureType(id: string): Promise<boolean>;
  
  // Operações de tipo de transação
  getTransactionTypes(): Promise<ITransactionType[]>;
  getTransactionType(id: string): Promise<ITransactionType | null>;
  createTransactionType(transactionType: Partial<ITransactionType>): Promise<ITransactionType>;
  updateTransactionType(id: string, transactionType: Partial<ITransactionType>): Promise<ITransactionType | null>;
  deleteTransactionType(id: string): Promise<void>;
  
  // Operações de consulta
  getAppointments(filters?: { 
    date?: string; 
    doctorId?: string; 
    patientId?: string;
    status?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<{ appointments: IAppointment[]; total: number; totalPages: number; currentPage: number }>;
  getAppointment(id: string): Promise<IAppointment | null>;
  createAppointment(appointment: CreateAppointment): Promise<IAppointment>;
  updateAppointment(id: string, appointment: Partial<CreateAppointment>): Promise<IAppointment | null>;
  deleteAppointment(id: string): Promise<void>;
  getDoctorAvailability(doctorId: string, date: string): Promise<string[]>;
  
  // Operações de procedimento
  getProcedures(filters?: { 
    patientId?: string; 
    doctorId?: string; 
    appointmentId?: string;
    procedureTypeId?: string;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ procedures: IProcedure[]; total: number; totalPages: number; currentPage: number }>;
  getProcedure(id: string): Promise<IProcedure | null>;
  createProcedure(procedure: CreateProcedure): Promise<IProcedure>;
  updateProcedure(id: string, procedure: Partial<CreateProcedure>): Promise<IProcedure | null>;
  
  // Operações de transação
  getTransactions(filters?: { 
    patientId?: string; 
    status?: string; 
    dateFrom?: string; 
    dateTo?: string;
    page?: number;
    limit?: number;
  }): Promise<{ transactions: ITransaction[]; total: number; totalPages: number; currentPage: number }>;
  getTransaction(id: string): Promise<ITransaction | null>;
  createTransaction(transaction: CreateTransaction): Promise<ITransaction>;
  updateTransaction(id: string, transaction: Partial<CreateTransaction>): Promise<ITransaction | null>;
  deleteTransaction(id: string): Promise<boolean>;
  
  // Operações de configuração de tipo de utilizador
  getUserTypeConfigs(): Promise<IUserTypeConfig[]>;
  getUserTypeConfig(id: string): Promise<IUserTypeConfig | null>;
  createUserTypeConfig(config: Partial<IUserTypeConfig>): Promise<IUserTypeConfig>;
  updateUserTypeConfig(id: string, config: Partial<IUserTypeConfig>): Promise<IUserTypeConfig | null>;
  deleteUserTypeConfig(id: string): Promise<void>;
  
  // Métricas do dashboard
  getDashboardMetrics(): Promise<{
    todayAppointments: number;
    pendingPayments: number;
    monthlyRevenue: number;
    activePatients: number;
    recentAppointments: IAppointment[];
    recentTransactions: ITransaction[];
  }>;
  
  // Relatórios financeiros
  getFinancialReport(dateFrom: string, dateTo: string): Promise<{
    totalRevenue: number;
    totalExpenses: number;
    netProfit: number;
    transactionsByType: Array<{ type: string; amount: number; count: number }>;
    dailyRevenue: Array<{ date: string; amount: number }>;
  }>;
}

/**
 * Implementação do storage usando MongoDB/Mongoose
 */
class MongoStorage implements IStorage {
  
  // ============================================================================
  // OPERAÇÕES DE UTILIZADOR
  // ============================================================================
  
  async getUsers(): Promise<IUser[]> {
    try {
      return await User.find({}).sort({ createdAt: -1 }).exec();
    } catch (error) {
      console.error('Erro ao buscar utilizadores:', error);
      throw error;
    }
  }

  async getUser(id: string): Promise<IUser | null> {
    try {
      return await User.findById(id).exec();
    } catch (error) {
      console.error('Erro ao buscar utilizador:', error);
      return null;
    }
  }
  
  async upsertUser(userData: Partial<IUser>): Promise<IUser> {
    try {
      const user = await User.findByIdAndUpdate(
        userData._id,
        { ...userData, updatedAt: new Date() },
        { upsert: true, new: true, runValidators: true }
      ).exec();
      
      if (!user) {
        throw new Error('Falha ao criar/atualizar utilizador');
      }
      
      return user;
    } catch (error) {
      console.error('Erro ao upsert utilizador:', error);
      throw error;
    }
  }
  
  async updateUserType(userId: string, userType: string): Promise<IUser | null> {
    try {
      return await User.findByIdAndUpdate(
        userId,
        { userType, updatedAt: new Date() },
        { new: true, runValidators: true }
      ).exec();
    } catch (error) {
      console.error('Erro ao atualizar tipo de utilizador:', error);
      return null;
    }
  }

  async updateUserStatus(userId: string, isActive: boolean): Promise<IUser | null> {
    try {
      return await User.findByIdAndUpdate(
        userId,
        { isActive, updatedAt: new Date() },
        { new: true, runValidators: true }
      ).exec();
    } catch (error) {
      console.error('Erro ao atualizar status do utilizador:', error);
      return null;
    }
  }

  async updateDoctorSchedule(id: string, schedule: {
    workingDays?: string[];
    workingHours?: { start: string; end: string };
    dailySchedules?: {
      [key: string]: {
        start: string;
        end: string;
        isActive: boolean;
      };
    };
    consultationTypes?: string[];
    procedureTypes?: string[];
  }): Promise<IUser | null> {
    try {
      const updateData: any = { updatedAt: new Date() };
      
      if (schedule.workingDays !== undefined) {
        updateData.workingDays = schedule.workingDays;
      }
      if (schedule.workingHours !== undefined) {
        updateData.workingHours = schedule.workingHours;
      }
      if (schedule.dailySchedules !== undefined) {
        updateData.dailySchedules = schedule.dailySchedules;
      }
      if (schedule.consultationTypes !== undefined) {
        updateData.consultationTypes = schedule.consultationTypes;
      }
      if (schedule.procedureTypes !== undefined) {
        updateData.procedureTypes = schedule.procedureTypes;
      }

      return await User.findOneAndUpdate(
        { _id: id, userType: 'doctor' },
        updateData,
        { new: true, runValidators: true }
      ).exec();
    } catch (error) {
      console.error('Erro ao atualizar horários do médico:', error);
      return null;
    }
  }

  async updateDoctorSpecialties(id: string, specialties: string[]): Promise<IUser | null> {
    try {
      return await User.findOneAndUpdate(
        { _id: id, userType: 'doctor' },
        { specialties, updatedAt: new Date() },
        { new: true, runValidators: true }
      ).exec();
    } catch (error) {
      console.error('Erro ao atualizar especialidades do médico:', error);
      return null;
    }
  }

  // Métodos para autenticação tradicional
  async getUserByEmail(email: string): Promise<IUser | null> {
    try {
      const user = await User.findOne({ email }).exec();
      return user;
    } catch (error) {
      console.error('Erro ao buscar utilizador por email:', error);
      throw error;
    }
  }

  async createUser(userData: Omit<IUser, '_id' | 'createdAt' | 'updatedAt'>): Promise<IUser> {
    try {
      const user = new User(userData);
      return await user.save();
    } catch (error) {
      console.error('Erro ao criar utilizador:', error);
      throw error;
    }
  }

  async updateUserPassword(userId: string, hashedPassword: string): Promise<void> {
    try {
      await User.findByIdAndUpdate(
        userId,
        { 
          password: hashedPassword, 
          mustChangePassword: false,
          updatedAt: new Date() 
        }
      ).exec();
    } catch (error) {
      console.error('Erro ao atualizar senha do utilizador:', error);
      throw error;
    }
  }

  async setPasswordResetToken(userId: string, token: string): Promise<void> {
    try {
      await User.findByIdAndUpdate(
        userId,
        { 
          passwordResetToken: token,
          updatedAt: new Date() 
        }
      ).exec();
    } catch (error) {
      console.error('Erro ao definir token de reset de senha:', error);
      throw error;
    }
  }

  async clearPasswordResetToken(userId: string): Promise<void> {
    try {
      await User.findByIdAndUpdate(
        userId,
        { 
          $unset: { passwordResetToken: "" },
          updatedAt: new Date()
        }
      ).exec();
    } catch (error) {
      console.error('Erro ao limpar token de reset de senha:', error);
      throw error;
    }
  }

  async updateUser(id: string, userData: Partial<IUser>): Promise<IUser | null> {
    try {
      return await User.findByIdAndUpdate(
        id,
        { ...userData, updatedAt: new Date() },
        { new: true, runValidators: true }
      ).exec();
    } catch (error) {
      console.error('Erro ao atualizar utilizador:', error);
      return null;
    }
  }

  async deleteUser(id: string): Promise<boolean> {
    try {
      const result = await User.findByIdAndDelete(id).exec();
      return result !== null;
    } catch (error) {
      console.error('Erro ao eliminar utilizador:', error);
      return false;
    }
  }
  
  // ============================================================================
  // OPERAÇÕES DE PACIENTE
  // ============================================================================
  
  async getPatients(): Promise<IPatient[]> {
    try {
      return await Patient.find({ }).sort({ name: 1 }).exec();
    } catch (error) {
      console.error('Erro ao buscar pacientes:', error);
      return [];
    }
  }
  
  async getPatient(id: string): Promise<IPatient | null> {
    try {
      return await Patient.findById(id).exec();
    } catch (error) {
      console.error('Erro ao buscar paciente:', error);
      return null;
    }
  }
  
  async getPatientByDi(di: string): Promise<IPatient | null> {
    try {
      return await Patient.findOne({ di }).exec();
    } catch (error) {
      console.error('Erro ao buscar paciente por DI:', error);
      return null;
    }
  }
  
  async createPatient(patientData: CreatePatient): Promise<IPatient> {
    try {
      // Verificar se DI já existe (apenas se foi fornecido)
      if (patientData.di && patientData.di.trim()) {
        const existingPatient = await Patient.findOne({ di: patientData.di.trim() }).exec();
        if (existingPatient) {
          throw new Error('Já existe um paciente com este Documento de Identidade');
        }
      }
      
      // Verificar se NIF já existe (apenas se foi fornecido)
      if (patientData.nif && patientData.nif.trim()) {
        const existingPatient = await Patient.findOne({ nif: patientData.nif.trim() }).exec();
        if (existingPatient) {
          throw new Error('Já existe um paciente com este NIF');
        }
      }
      
      const patient = new Patient(patientData);
      return await patient.save();
    } catch (error) {
      console.error('Erro ao criar paciente:', error);
      throw error;
    }
  }
  
  async updatePatient(id: string, patientData: Partial<CreatePatient>): Promise<IPatient | null> {
    try {
      // Verificar se DI já existe noutro paciente (apenas se foi fornecido)
      if (patientData.di && patientData.di.trim()) {
        const existingPatient = await Patient.findOne({ 
          di: patientData.di.trim(),
          _id: { $ne: id } // Excluir o próprio paciente da verificação
        }).exec();
        if (existingPatient) {
          throw new Error('Já existe um paciente com este Documento de Identidade');
        }
      }
      
      // Verificar se NIF já existe noutro paciente (apenas se foi fornecido)
      if (patientData.nif && patientData.nif.trim()) {
        const existingPatient = await Patient.findOne({ 
          nif: patientData.nif.trim(),
          _id: { $ne: id } // Excluir o próprio paciente da verificação
        }).exec();
        if (existingPatient) {
          throw new Error('Já existe um paciente com este NIF');
        }
      }
      
      return await Patient.findByIdAndUpdate(
        id,
        { ...patientData, updatedAt: new Date() },
        { new: true, runValidators: true }
      ).exec();
    } catch (error) {
      console.error('Erro ao atualizar paciente:', error);
      throw error;
    }
  }

  async deletePatient(id: string): Promise<boolean> {
    try {
      // Verificar se o paciente tem consultas ou procedimentos associados
      const appointmentCount = await Appointment.countDocuments({ patientId: id }).exec();
      const procedureCount = await Procedure.countDocuments({ patientId: id }).exec();
      const transactionCount = await Transaction.countDocuments({ patientId: id }).exec();
      
      if (appointmentCount > 0 || procedureCount > 0 || transactionCount > 0) {
        throw new Error('Não é possível eliminar o paciente pois tem consultas, procedimentos ou transações associadas');
      }
      
      const result = await Patient.findByIdAndDelete(id).exec();
      return !!result;
    } catch (error) {
      console.error('Erro ao eliminar paciente:', error);
      throw error;
    }
  }
  
  async searchPatients(query: string): Promise<IPatient[]> {
    try {
      const searchRegex = new RegExp(query, 'i');
      return await Patient.find({
        $or: [
          { name: searchRegex },
          { di: searchRegex },
          { email: searchRegex },
          { phone: searchRegex }
        ]
      }).sort({ name: 1 }).exec();
    } catch (error) {
      console.error('Erro ao pesquisar pacientes:', error);
      return [];
    }
  }
  
  // ============================================================================
  // OPERAÇÕES DE TIPO DE CONSULTA
  // ============================================================================
  
  async getConsultationTypes(): Promise<IConsultationType[]> {
    try {
      return await ConsultationType.find({ isActive: true }).sort({ name: 1 }).exec();
    } catch (error) {
      console.error('Erro ao buscar tipos de consulta:', error);
      return [];
    }
  }
  
  async getConsultationType(id: string): Promise<IConsultationType | null> {
    try {
      return await ConsultationType.findById(id).exec();
    } catch (error) {
      console.error('Erro ao buscar tipo de consulta:', error);
      return null;
    }
  }
  
  async createConsultationType(data: Partial<IConsultationType>): Promise<IConsultationType> {
    try {
      const consultationType = new ConsultationType(data);
      return await consultationType.save();
    } catch (error) {
      console.error('Erro ao criar tipo de consulta:', error);
      throw error;
    }
  }
  
  async updateConsultationType(id: string, data: Partial<IConsultationType>): Promise<IConsultationType | null> {
    try {
      return await ConsultationType.findByIdAndUpdate(
        id,
        data,
        { new: true, runValidators: true }
      ).exec();
    } catch (error) {
      console.error('Erro ao atualizar tipo de consulta:', error);
      return null;
    }
  }
  
  async deleteConsultationType(id: string): Promise<void> {
    try {
      await ConsultationType.findByIdAndUpdate(
        id,
        { isActive: false },
        { runValidators: true }
      ).exec();
    } catch (error) {
      console.error('Erro ao desativar tipo de consulta:', error);
      throw error;
    }
  }
  
  // ============================================================================
  // OPERAÇÕES DE TIPO DE PROCEDIMENTO
  // ============================================================================
  
  async getProcedureTypes(): Promise<IProcedureType[]> {
    try {
      return await ProcedureType.find({ isActive: true }).sort({ name: 1 }).exec();
    } catch (error) {
      console.error('Erro ao buscar tipos de procedimento:', error);
      return [];
    }
  }
  
  async getProcedureType(id: string): Promise<IProcedureType | null> {
    try {
      return await ProcedureType.findById(id).exec();
    } catch (error) {
      console.error('Erro ao buscar tipo de procedimento:', error);
      return null;
    }
  }
  
  async createProcedureType(data: Partial<IProcedureType>): Promise<IProcedureType> {
    try {
      const procedureType = new ProcedureType(data);
      return await procedureType.save();
    } catch (error) {
      console.error('Erro ao criar tipo de procedimento:', error);
      throw error;
    }
  }
  
  async updateProcedureType(id: string, data: Partial<IProcedureType>): Promise<IProcedureType | null> {
    try {
      return await ProcedureType.findByIdAndUpdate(
        id,
        data,
        { new: true, runValidators: true }
      ).exec();
    } catch (error) {
      console.error('Erro ao atualizar tipo de procedimento:', error);
      return null;
    }
  }
  
  async deleteProcedureType(id: string): Promise<boolean> {
    try {
      const result = await ProcedureType.findByIdAndUpdate(
        id,
        { isActive: false },
        { runValidators: true }
      ).exec();
      return result !== null;
    } catch (error) {
      console.error('Erro ao desativar tipo de procedimento:', error);
      throw error;
    }
  }
  
  // ============================================================================
  // OPERAÇÕES DE TIPO DE TRANSAÇÃO
  // ============================================================================
  
  async getTransactionTypes(): Promise<ITransactionType[]> {
    try {
      return await TransactionType.find({ isActive: true }).sort({ name: 1 }).exec();
    } catch (error) {
      console.error('Erro ao buscar tipos de transação:', error);
      return [];
    }
  }
  
  async getTransactionType(id: string): Promise<ITransactionType | null> {
    try {
      return await TransactionType.findById(id).exec();
    } catch (error) {
      console.error('Erro ao buscar tipo de transação:', error);
      return null;
    }
  }
  
  async createTransactionType(data: Partial<ITransactionType>): Promise<ITransactionType> {
    try {
      const transactionType = new TransactionType(data);
      return await transactionType.save();
    } catch (error) {
      console.error('Erro ao criar tipo de transação:', error);
      throw error;
    }
  }
  
  async updateTransactionType(id: string, data: Partial<ITransactionType>): Promise<ITransactionType | null> {
    try {
      return await TransactionType.findByIdAndUpdate(
        id,
        data,
        { new: true, runValidators: true }
      ).exec();
    } catch (error) {
      console.error('Erro ao atualizar tipo de transação:', error);
      return null;
    }
  }
  
  async deleteTransactionType(id: string): Promise<void> {
    try {
      await TransactionType.findByIdAndUpdate(
        id,
        { isActive: false },
        { runValidators: true }
      ).exec();
    } catch (error) {
      console.error('Erro ao desativar tipo de transação:', error);
      throw error;
    }
  }
  
  // ============================================================================
  // OPERAÇÕES DE CONSULTA
  // ============================================================================
  
  async getAppointments(filters?: { 
    date?: string; 
    doctorId?: string; 
    patientId?: string;
    status?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<{ appointments: IAppointment[]; total: number; totalPages: number; currentPage: number }> {
    try {
      console.log('[DEBUG] getAppointments called with filters:', filters);
      const query: any = {};
      
      // Filtros de data
      if (filters?.date) {
        const dateFilter = new Date(filters.date);
        console.log('[DEBUG] Date filter applied:', filters.date, '-> MongoDB Date:', dateFilter);
        query.date = dateFilter;
      } else if (filters?.startDate || filters?.endDate) {
        query.date = {};
        if (filters.startDate) {
          query.date.$gte = new Date(filters.startDate);
        }
        if (filters.endDate) {
          query.date.$lte = new Date(filters.endDate);
        }
        console.log('[DEBUG] Date range filter applied:', query.date);
      }
      
      // Filtros por IDs
      if (filters?.doctorId) {
        query.doctorId = new Types.ObjectId(filters.doctorId);
      }
      if (filters?.patientId) {
        query.patientId = new Types.ObjectId(filters.patientId);
      }
      
      // Filtro por status
      if (filters?.status) {
        query.status = filters.status;
      }
      
      // Configuração de paginação
      const page = filters?.page || 1;
      const limit = filters?.limit || 10;
      const skip = (page - 1) * limit;
      
      // Query base
      let appointmentQuery = Appointment.find(query)
        .populate('patientId', 'name di phone')
        .populate('doctorId', 'firstName lastName')
        .populate('consultationTypeId', 'name price')
        .sort({ date: -1, time: 1 });
      
      // Aplicar paginação
      const appointments = await appointmentQuery
        .skip(skip)
        .limit(limit)
        .exec();
      
      // Filtro de pesquisa (aplicado após populate para buscar em campos relacionados)
      let filteredAppointments = appointments;
      if (filters?.search) {
        const searchTerm = filters.search.toLowerCase();
        filteredAppointments = appointments.filter((appointment: any) => {
          const patientName = appointment.patientId?.name?.toLowerCase() || '';
          const doctorName = `${appointment.doctorId?.firstName || ''} ${appointment.doctorId?.lastName || ''}`.toLowerCase();
          const consultationType = appointment.consultationTypeId?.name?.toLowerCase() || '';
          const status = appointment.status?.toLowerCase() || '';
          
          return patientName.includes(searchTerm) ||
                 doctorName.includes(searchTerm) ||
                 consultationType.includes(searchTerm) ||
                 status.includes(searchTerm);
        });
      }
      
      // Contar total de registros
      const total = await Appointment.countDocuments(query);
      const totalPages = Math.ceil(total / limit);
      
      console.log('[DEBUG] Final query:', JSON.stringify(query, null, 2));
      console.log('[DEBUG] Total appointments found:', total);
      console.log('[DEBUG] Appointments returned:', filteredAppointments.length);
      console.log('[DEBUG] Sample appointment dates:', filteredAppointments.slice(0, 3).map(apt => ({ id: apt._id, date: apt.date })));
      
      return {
        appointments: filteredAppointments,
        total,
        totalPages,
        currentPage: page
      };
    } catch (error) {
      console.error('Erro ao buscar consultas:', error);
      return {
        appointments: [],
        total: 0,
        totalPages: 0,
        currentPage: 1
      };
    }
  }
  
  async getAppointment(id: string): Promise<IAppointment | null> {
    try {
      return await Appointment.findById(id)
        .populate('patientId')
        .populate('doctorId')
        .populate('consultationTypeId')
        .exec();
    } catch (error) {
      console.error('Erro ao buscar consulta:', error);
      return null;
    }
  }
  
  async createAppointment(appointmentData: CreateAppointment): Promise<IAppointment> {
    try {
      const appointment = new Appointment({
        ...appointmentData,
        patientId: new Types.ObjectId(appointmentData.patientId),
        doctorId: new Types.ObjectId(appointmentData.doctorId),
        consultationTypeId: new Types.ObjectId(appointmentData.consultationTypeId),
        date: new Date(appointmentData.date)
      });
      return await appointment.save();
    } catch (error) {
      console.error('Erro ao criar consulta:', error);
      throw error;
    }
  }
  
  async updateAppointment(id: string, appointmentData: Partial<CreateAppointment>): Promise<IAppointment | null> {
    try {
      console.log(`[DEBUG] Storage updateAppointment - ID: ${id}, Data:`, appointmentData);
      
      const updateData: any = { ...appointmentData, updatedAt: new Date() };
      
      if (appointmentData.patientId) {
        updateData.patientId = new Types.ObjectId(appointmentData.patientId);
      }
      if (appointmentData.doctorId) {
        updateData.doctorId = new Types.ObjectId(appointmentData.doctorId);
      }
      if (appointmentData.consultationTypeId) {
        updateData.consultationTypeId = new Types.ObjectId(appointmentData.consultationTypeId);
      }
      if (appointmentData.date) {
        updateData.date = new Date(appointmentData.date);
      }
      if (appointmentData.status) {
        updateData.status = appointmentData.status;
      }
      
      console.log(`[DEBUG] Final update data:`, updateData);
      
      const result = await Appointment.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      ).exec();
      
      console.log(`[DEBUG] MongoDB update result:`, result);
      return result;
    } catch (error) {
      console.error('Erro ao atualizar consulta:', error);
      return null;
    }
  }
  
  async deleteAppointment(id: string): Promise<void> {
    try {
      await Appointment.findByIdAndDelete(id).exec();
    } catch (error) {
      console.error('Erro ao eliminar consulta:', error);
      throw error;
    }
  }
  
  async getDoctorAvailability(doctorId: string, date: string): Promise<string[]> {
    try {
      console.log(`[DEBUG] getDoctorAvailability called with doctorId: ${doctorId}, date: ${date}`);
      
      // Buscar agendamentos ocupados
      const appointments = await Appointment.find({
        doctorId: new Types.ObjectId(doctorId),
        date: new Date(date),
        status: { $ne: 'cancelled' }
      }).select('time').exec();
      
      const occupiedTimes = appointments.map(apt => apt.time);
      console.log(`[DEBUG] Occupied times:`, occupiedTimes);
      
      // Buscar informações do médico para obter horário de trabalho
      const doctor = await User.findById(doctorId).exec();
      if (!doctor) {
        console.log(`[DEBUG] Doctor not found with ID: ${doctorId}`);
        return [];
      }
      
      console.log(`[DEBUG] Doctor found:`, {
        name: `${doctor.firstName} ${doctor.lastName}`,
        workingDays: doctor.workingDays,
        workingHours: doctor.workingHours,
        dailySchedules: doctor.dailySchedules
      });
      
      // Obter dia da semana
      const selectedDateObj = new Date(date);
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const dayName = dayNames[selectedDateObj.getDay()];
      console.log(`[DEBUG] Day of week: ${dayName} (${selectedDateObj.getDay()})`);
      
      // Verificar se o médico trabalha neste dia
      if (doctor.workingDays && doctor.workingDays.length > 0 && !doctor.workingDays.includes(dayName)) {
        console.log(`[DEBUG] Doctor does not work on ${dayName}`);
        return [];
      }
      
      // Obter horário de trabalho para o dia específico ou horário padrão
      let workingHours = doctor.workingHours || { start: '09:00', end: '17:00' };
      if (doctor.dailySchedules && doctor.dailySchedules[dayName] && doctor.dailySchedules[dayName].isActive) {
        workingHours = {
          start: doctor.dailySchedules[dayName].start,
          end: doctor.dailySchedules[dayName].end
        };
      }
      console.log(`[DEBUG] Working hours for ${dayName}:`, workingHours);
      
      // Gerar todos os horários possíveis (slots de 30 minutos)
      const availableTimes = [];
      const startTime = new Date(`2000-01-01T${workingHours.start}:00`);
      const endTime = new Date(`2000-01-01T${workingHours.end}:00`);
      
      let currentTime = new Date(startTime);
      while (currentTime < endTime) {
        const timeString = currentTime.toTimeString().substring(0, 5);
        
        // Adicionar apenas se não estiver ocupado
        if (!occupiedTimes.includes(timeString)) {
          availableTimes.push(timeString);
        }
        
        // Adicionar 30 minutos
        currentTime.setMinutes(currentTime.getMinutes() + 30);
      }
      
      console.log(`[DEBUG] Available times generated:`, availableTimes);
      return availableTimes;
    } catch (error) {
      console.error('Erro ao verificar disponibilidade do médico:', error);
      return [];
    }
  }
  
  // ============================================================================
  // OPERAÇÕES DE PROCEDIMENTO
  // ============================================================================
  
  async getProcedures(filters?: { 
    patientId?: string; 
    doctorId?: string; 
    appointmentId?: string;
    procedureTypeId?: string;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ procedures: IProcedure[]; total: number; totalPages: number; currentPage: number }> {
    try {
      const query: any = {};
      
      if (filters?.patientId) {
        query.patientId = new Types.ObjectId(filters.patientId);
      }
      if (filters?.doctorId) {
        query.doctorId = new Types.ObjectId(filters.doctorId);
      }
      if (filters?.appointmentId) {
        query.appointmentId = new Types.ObjectId(filters.appointmentId);
      }
      if (filters?.procedureTypeId) {
        query.procedureTypeId = new Types.ObjectId(filters.procedureTypeId);
      }
      if (filters?.status) {
        query.status = filters.status;
      }
      
      // Configurações de paginação
      const page = filters?.page || 1;
      const limit = filters?.limit || 10;
      const skip = (page - 1) * limit;
      
      // Buscar total de registros
      const total = await Procedure.countDocuments(query);
      const totalPages = Math.ceil(total / limit);
      
      // Buscar procedimentos com paginação
      let proceduresQuery = Procedure.find(query)
        .populate('patientId', 'name di')
        .populate('doctorId', 'firstName lastName')
        .populate('procedureTypeId', 'name price category')
        .populate('appointmentId')
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit);
      
      const procedures = await proceduresQuery.exec();
      
      // Aplicar filtro de pesquisa após popular os dados
      let filteredProcedures = procedures;
      if (filters?.search) {
        const searchTerm = filters.search.toLowerCase();
        filteredProcedures = procedures.filter((procedure: any) => {
          const patientName = procedure.patientId?.name?.toLowerCase() || '';
          const doctorName = `${procedure.doctorId?.firstName || ''} ${procedure.doctorId?.lastName || ''}`.toLowerCase();
          const procedureTypeName = procedure.procedureTypeId?.name?.toLowerCase() || '';
          const notes = procedure.notes?.toLowerCase() || '';
          
          return patientName.includes(searchTerm) ||
                 doctorName.includes(searchTerm) ||
                 procedureTypeName.includes(searchTerm) ||
                 notes.includes(searchTerm);
        });
      }
      
      return {
        procedures: filteredProcedures,
        total,
        totalPages,
        currentPage: page
      };
    } catch (error) {
      console.error('Erro ao buscar procedimentos:', error);
      return {
        procedures: [],
        total: 0,
        totalPages: 0,
        currentPage: 1
      };
    }
  }
  
  async getProcedure(id: string): Promise<IProcedure | null> {
    try {
      return await Procedure.findById(id)
        .populate('patientId')
        .populate('doctorId')
        .populate('procedureTypeId')
        .populate('appointmentId')
        .exec();
    } catch (error) {
      console.error('Erro ao buscar procedimento:', error);
      return null;
    }
  }
  
  async createProcedure(procedureData: CreateProcedure): Promise<IProcedure> {
    try {
      const procedure = new Procedure({
        ...procedureData,
        patientId: new Types.ObjectId(procedureData.patientId),
        doctorId: new Types.ObjectId(procedureData.doctorId),
        procedureTypeId: new Types.ObjectId(procedureData.procedureTypeId),
        appointmentId: procedureData.appointmentId ? new Types.ObjectId(procedureData.appointmentId) : undefined,
        date: new Date(procedureData.date)
      });
      return await procedure.save();
    } catch (error) {
      console.error('Erro ao criar procedimento:', error);
      throw error;
    }
  }
  
  async updateProcedure(id: string, procedureData: Partial<CreateProcedure>): Promise<IProcedure | null> {
    try {
      const updateData: any = { ...procedureData };
      
      if (procedureData.patientId) {
        updateData.patientId = new Types.ObjectId(procedureData.patientId);
      }
      if (procedureData.doctorId) {
        updateData.doctorId = new Types.ObjectId(procedureData.doctorId);
      }
      if (procedureData.procedureTypeId) {
        updateData.procedureTypeId = new Types.ObjectId(procedureData.procedureTypeId);
      }
      if (procedureData.appointmentId) {
        updateData.appointmentId = new Types.ObjectId(procedureData.appointmentId);
      }
      if (procedureData.date) {
        updateData.date = new Date(procedureData.date);
      }
      
      return await Procedure.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      ).exec();
    } catch (error) {
      console.error('Erro ao atualizar procedimento:', error);
      return null;
    }
  }
  
  // ============================================================================
  // OPERAÇÕES DE TRANSAÇÃO
  // ============================================================================
  
  async getTransactions(filters?: { 
    patientId?: string; 
    status?: string; 
    dateFrom?: string; 
    dateTo?: string;
    page?: number;
    limit?: number;
  }): Promise<{ transactions: ITransaction[]; total: number; totalPages: number; currentPage: number }> {
    try {
      const query: any = {};
      
      if (filters?.patientId) {
        query.patientId = new Types.ObjectId(filters.patientId);
      }
      if (filters?.status) {
        query.status = filters.status;
      }
      if (filters?.dateFrom || filters?.dateTo) {
        query.transactionDate = {};
        if (filters.dateFrom) {
          query.transactionDate.$gte = new Date(filters.dateFrom);
        }
        if (filters.dateTo) {
          query.transactionDate.$lte = new Date(filters.dateTo);
        }
      }
      
      // Configurações de paginação
      const page = filters?.page || 1;
      const limit = filters?.limit || 10;
      const skip = (page - 1) * limit;
      
      // Buscar total de registros
      const total = await Transaction.countDocuments(query);
      const totalPages = Math.ceil(total / limit);
      
      // Buscar transações com paginação
      const transactions = await Transaction.find(query)
        .populate('patientId', 'name di')
        .populate('transactionTypeId', 'name category')
        .populate('appointmentId')
        .populate('procedureId')
        .sort({ transactionDate: -1 })
        .skip(skip)
        .limit(limit)
        .exec();
        
      return {
        transactions,
        total,
        totalPages,
        currentPage: page
      };
    } catch (error) {
      console.error('Erro ao buscar transações:', error);
      return {
        transactions: [],
        total: 0,
        totalPages: 0,
        currentPage: 1
      };
    }
  }
  
  async getTransaction(id: string): Promise<ITransaction | null> {
    try {
      return await Transaction.findById(id)
        .populate('patientId')
        .populate('transactionTypeId')
        .populate('appointmentId')
        .populate('procedureId')
        .exec();
    } catch (error) {
      console.error('Erro ao buscar transação:', error);
      return null;
    }
  }
  
  async createTransaction(transactionData: CreateTransaction): Promise<ITransaction> {
    try {
      const transaction = new Transaction({
        ...transactionData,
        patientId: transactionData.patientId ? new Types.ObjectId(transactionData.patientId) : undefined,
        appointmentId: transactionData.appointmentId ? new Types.ObjectId(transactionData.appointmentId) : undefined,
        procedureId: transactionData.procedureId ? new Types.ObjectId(transactionData.procedureId) : undefined,
        transactionTypeId: new Types.ObjectId(transactionData.transactionTypeId),
        dueDate: transactionData.dueDate ? new Date(transactionData.dueDate) : undefined
      });
      return await transaction.save();
    } catch (error) {
      console.error('Erro ao criar transação:', error);
      throw error;
    }
  }
  
  async updateTransaction(id: string, transactionData: Partial<CreateTransaction>): Promise<ITransaction | null> {
    try {
      const updateData: any = { ...transactionData };
      
      if (transactionData.patientId) {
        updateData.patientId = new Types.ObjectId(transactionData.patientId);
      }
      if (transactionData.appointmentId) {
        updateData.appointmentId = new Types.ObjectId(transactionData.appointmentId);
      }
      if (transactionData.procedureId) {
        updateData.procedureId = new Types.ObjectId(transactionData.procedureId);
      }
      if (transactionData.transactionTypeId) {
        updateData.transactionTypeId = new Types.ObjectId(transactionData.transactionTypeId);
      }
      if (transactionData.dueDate) {
        updateData.dueDate = new Date(transactionData.dueDate);
      }
      
      return await Transaction.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      ).exec();
    } catch (error) {
      console.error('Erro ao atualizar transação:', error);
      return null;
    }
  }

  async deleteTransaction(id: string): Promise<boolean> {
    try {
      const result = await Transaction.findByIdAndDelete(id).exec();
      return result !== null;
    } catch (error) {
      console.error('Erro ao eliminar transação:', error);
      return false;
    }
  }
  
  // ============================================================================
  // OPERAÇÕES DE CONFIGURAÇÃO DE TIPO DE UTILIZADOR
  // ============================================================================
  
  async getUserTypeConfigs(): Promise<IUserTypeConfig[]> {
    try {
      return await UserTypeConfig.find({ isActive: true }).sort({ name: 1 }).exec();
    } catch (error) {
      console.error('Erro ao buscar configurações de tipo de utilizador:', error);
      return [];
    }
  }
  
  async getUserTypeConfig(id: string): Promise<IUserTypeConfig | null> {
    try {
      return await UserTypeConfig.findById(id).exec();
    } catch (error) {
      console.error('Erro ao buscar configuração de tipo de utilizador:', error);
      return null;
    }
  }
  
  async createUserTypeConfig(data: Partial<IUserTypeConfig>): Promise<IUserTypeConfig> {
    try {
      const config = new UserTypeConfig(data);
      return await config.save();
    } catch (error) {
      console.error('Erro ao criar configuração de tipo de utilizador:', error);
      throw error;
    }
  }
  
  async updateUserTypeConfig(id: string, data: Partial<IUserTypeConfig>): Promise<IUserTypeConfig | null> {
    try {
      return await UserTypeConfig.findByIdAndUpdate(
        id,
        data,
        { new: true, runValidators: true }
      ).exec();
    } catch (error) {
      console.error('Erro ao atualizar configuração de tipo de utilizador:', error);
      return null;
    }
  }
  
  async deleteUserTypeConfig(id: string): Promise<void> {
    try {
      await UserTypeConfig.findByIdAndUpdate(
        id,
        { isActive: false },
        { runValidators: true }
      ).exec();
    } catch (error) {
      console.error('Erro ao desativar configuração de tipo de utilizador:', error);
      throw error;
    }
  }
  
  // ============================================================================
  // MÉTRICAS DO DASHBOARD
  // ============================================================================
  
  async getDashboardMetrics(): Promise<{
    todayAppointments: number;
    pendingPayments: number;
    monthlyRevenue: number;
    activePatients: number;
    recentAppointments: IAppointment[];
    recentTransactions: ITransaction[];
  }> {
    try {
      console.log('📊 [DASHBOARD METRICS] Iniciando cálculo das métricas...');
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      startOfMonth.setHours(0, 0, 0, 0);
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      endOfMonth.setHours(23, 59, 59, 999);
      
      console.log('📊 [DASHBOARD METRICS] Datas calculadas:', {
        today: today.toISOString(),
        startOfMonth: startOfMonth.toISOString(),
        endOfMonth: endOfMonth.toISOString()
      });
      
      // Consultas de hoje
      const todayEnd = new Date(today);
      todayEnd.setHours(23, 59, 59, 999);
      
      console.log('📊 [DASHBOARD METRICS] Buscando consultas de hoje...');
      const todayAppointments = await Appointment.countDocuments({
        date: { $gte: today, $lte: todayEnd },
        status: { $ne: 'cancelled' }
      });
      console.log('📊 [DASHBOARD METRICS] Consultas de hoje:', todayAppointments);
      
      // Pagamentos pendentes (valor total, não quantidade)
      console.log('📊 [DASHBOARD METRICS] Buscando pagamentos pendentes...');
      const pendingPaymentsResult = await Transaction.aggregate([
        {
          $match: {
            status: 'pending'
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' }
          }
        }
      ]);
      
      const pendingPayments = pendingPaymentsResult[0]?.total || 0;
      console.log('📊 [DASHBOARD METRICS] Pagamentos pendentes:', {
        result: pendingPaymentsResult,
        total: pendingPayments
      });
      
      // Receita mensal
      console.log('📊 [DASHBOARD METRICS] Buscando receita mensal...');
      const monthlyRevenueResult = await Transaction.aggregate([
        {
          $match: {
            transactionDate: { $gte: startOfMonth, $lte: endOfMonth },
            status: 'paid'
          }
        },
        {
          $lookup: {
            from: 'transactiontypes',
            localField: 'transactionTypeId',
            foreignField: '_id',
            as: 'transactionType'
          }
        },
        {
          $match: {
            'transactionType.category': 'income'
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' }
          }
        }
      ]);
      
      const monthlyRevenue = monthlyRevenueResult[0]?.total || 0;
      console.log('📊 [DASHBOARD METRICS] Receita mensal:', {
        result: monthlyRevenueResult,
        total: monthlyRevenue
      });
      
      // Pacientes ativos (com consultas nos últimos 6 meses)
      console.log('📊 [DASHBOARD METRICS] Buscando pacientes ativos...');
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      sixMonthsAgo.setHours(0, 0, 0, 0);
      
      const activePatientIds = await Appointment.distinct('patientId', {
        date: { $gte: sixMonthsAgo },
        status: { $ne: 'cancelled' }
      });
      
      const activePatients = activePatientIds.length;
      console.log('📊 [DASHBOARD METRICS] Pacientes ativos:', {
        sixMonthsAgo: sixMonthsAgo.toISOString(),
        patientIds: activePatientIds.length,
        total: activePatients
      });
      
      // Consultas recentes
      console.log('📊 [DASHBOARD METRICS] Buscando consultas recentes...');
      const recentAppointments = await Appointment.find({})
        .populate('patientId', 'name')
        .populate('doctorId', 'firstName lastName')
        .populate('consultationTypeId', 'name')
        .sort({ createdAt: -1 })
        .limit(5)
        .exec();
      console.log('📊 [DASHBOARD METRICS] Consultas recentes encontradas:', recentAppointments.length);
      
      // Transações recentes
      console.log('📊 [DASHBOARD METRICS] Buscando transações recentes...');
      const recentTransactions = await Transaction.find({})
        .populate('patientId', 'name')
        .populate('transactionTypeId', 'name category')
        .sort({ transactionDate: -1 })
        .limit(5)
        .exec();
      console.log('📊 [DASHBOARD METRICS] Transações recentes encontradas:', recentTransactions.length);
      
      const finalMetrics = {
        todayAppointments,
        pendingPayments,
        monthlyRevenue,
        activePatients,
        recentAppointments,
        recentTransactions
      };
      
      console.log('📊 [DASHBOARD METRICS] Métricas finais calculadas:', {
        todayAppointments,
        pendingPayments,
        monthlyRevenue,
        activePatients,
        recentAppointmentsCount: recentAppointments.length,
        recentTransactionsCount: recentTransactions.length
      });
      
      return finalMetrics;
    } catch (error) {
      console.error('❌ [DASHBOARD METRICS] Erro ao buscar métricas do dashboard:', error);
      return {
        todayAppointments: 0,
        pendingPayments: 0,
        monthlyRevenue: 0,
        activePatients: 0,
        recentAppointments: [],
        recentTransactions: []
      };
    }
  }
  
  // ============================================================================
  // RELATÓRIOS FINANCEIROS
  // ============================================================================
  
  async getFinancialReport(dateFrom: string, dateTo: string): Promise<{
    totalRevenue: number;
    totalExpenses: number;
    netProfit: number;
    transactionsByType: Array<{ type: string; amount: number; count: number }>;
    dailyRevenue: Array<{ date: string; amount: number }>;
  }> {
    try {
      const startDate = new Date(dateFrom);
      const endDate = new Date(dateTo);
      
      // Receitas e despesas totais
      const financialSummary = await Transaction.aggregate([
        {
          $match: {
            transactionDate: { $gte: startDate, $lte: endDate },
            status: 'paid'
          }
        },
        {
          $lookup: {
            from: 'transactiontypes',
            localField: 'transactionTypeId',
            foreignField: '_id',
            as: 'transactionType'
          }
        },
        {
          $unwind: '$transactionType'
        },
        {
          $group: {
            _id: '$transactionType.category',
            total: { $sum: '$amount' }
          }
        }
      ]);
      
      const totalRevenue = financialSummary.find(item => item._id === 'income')?.total || 0;
      const totalExpenses = financialSummary.find(item => item._id === 'expense')?.total || 0;
      const netProfit = totalRevenue - totalExpenses;
      
      // Transações por tipo
      const transactionsByType = await Transaction.aggregate([
        {
          $match: {
            transactionDate: { $gte: startDate, $lte: endDate },
            status: 'paid'
          }
        },
        {
          $lookup: {
            from: 'transactiontypes',
            localField: 'transactionTypeId',
            foreignField: '_id',
            as: 'transactionType'
          }
        },
        {
          $unwind: '$transactionType'
        },
        {
          $group: {
            _id: '$transactionType.name',
            amount: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        },
        {
          $project: {
            type: '$_id',
            amount: 1,
            count: 1,
            _id: 0
          }
        },
        {
          $sort: { amount: -1 }
        }
      ]);
      
      // Receita diária
      const dailyRevenue = await Transaction.aggregate([
        {
          $match: {
            transactionDate: { $gte: startDate, $lte: endDate },
            status: 'paid'
          }
        },
        {
          $lookup: {
            from: 'transactiontypes',
            localField: 'transactionTypeId',
            foreignField: '_id',
            as: 'transactionType'
          }
        },
        {
          $match: {
            'transactionType.category': 'income'
          }
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$transactionDate'
              }
            },
            amount: { $sum: '$amount' }
          }
        },
        {
          $project: {
            date: '$_id',
            amount: 1,
            _id: 0
          }
        },
        {
          $sort: { date: 1 }
        }
      ]);
      
      return {
        totalRevenue,
        totalExpenses,
        netProfit,
        transactionsByType,
        dailyRevenue
      };
    } catch (error) {
      console.error('Erro ao gerar relatório financeiro:', error);
      return {
        totalRevenue: 0,
        totalExpenses: 0,
        netProfit: 0,
        transactionsByType: [],
        dailyRevenue: []
      };
    }
  }
}

// Exportar instância singleton do storage
export const storage = new MongoStorage();
export default storage;
