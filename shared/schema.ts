import mongoose, { Schema, Document, Types } from 'mongoose';
import { z } from 'zod';

// ============================================================================
// INTERFACES E TIPOS TYPESCRIPT
// ============================================================================

// Interface para Utilizador
export interface IUser extends Document {
  email: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  userType: 'admin' | 'employee' | 'doctor';
  specialties?: string[];
  contactInfo?: string;
  isActive: boolean;
  password?: string; // Para autenticação tradicional
  mustChangePassword?: boolean; // Forçar mudança de password no primeiro login
  passwordResetToken?: string; // Token para reset de password
  // Campos específicos para médicos
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
  createdAt: Date;
  updatedAt: Date;
}

// Interface para Paciente
export interface IPatient extends Document {
  name: string;
  di?: string; // Documento de Identidade
  nif?: string; // Número de Identificação Fiscal (único e opcional)
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Interface para Tipo de Consulta
export interface IConsultationType extends Document {
  name: string;
  price: number;
  description?: string;
  isActive: boolean;
  createdAt: Date;
}

// Interface para Tipo de Procedimento
export interface IProcedureType extends Document {
  name: string;
  price: number;
  category?: string;
  description?: string;
  specialty?: string;
  isActive: boolean;
  createdAt: Date;
}

// Interface para Consulta
export interface IAppointment extends Document {
  patientId: Types.ObjectId;
  doctorId: Types.ObjectId;
  consultationTypeId: Types.ObjectId;
  date: Date;
  time: string;
  status: 'scheduled' | 'cancelled' | 'completed';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Interface para Procedimento
export interface IProcedure extends Document {
  appointmentId?: Types.ObjectId;
  patientId: Types.ObjectId;
  doctorId: Types.ObjectId;
  procedureTypeId: Types.ObjectId;
  date: Date;
  cost: number;
  status: 'in_progress' | 'completed';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Interface para Tipo de Transação
export interface ITransactionType extends Document {
  name: string;
  category: 'income' | 'expense';
  description?: string;
  isActive: boolean;
  createdAt: Date;
}

// Interface para Transação Financeira
export interface ITransaction extends Document {
  patientId?: Types.ObjectId;
  appointmentId?: Types.ObjectId;
  procedureId?: Types.ObjectId;
  transactionTypeId: Types.ObjectId;
  amount: number;
  status: 'pending' | 'paid' | 'overdue';
  description?: string;
  transactionDate: Date;
  dueDate?: Date;
  paidDate?: Date;
  createdAt: Date;
}

// Interface para Configuração de Tipo de Utilizador
export interface IUserTypeConfig extends Document {
  name: string;
  permissions: Record<string, boolean>;
  description?: string;
  isActive: boolean;
  createdAt: Date;
}

// ============================================================================
// SCHEMAS MONGOOSE
// ============================================================================

// Schema para Utilizador
const userSchema = new Schema<IUser>({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  firstName: {
    type: String,
    trim: true
  },
  lastName: {
    type: String,
    trim: true
  },
  profileImageUrl: String,
  password: {
    type: String,
    trim: true
  },
  mustChangePassword: {
    type: Boolean,
    default: false
  },
  passwordResetToken: {
    type: String,
    trim: true
  },
  userType: {
    type: String,
    enum: ['admin', 'employee', 'doctor'],
    default: 'employee',
    required: true
  },
  specialties: [{
    type: String,
    trim: true
  }],
  contactInfo: {
    type: String,
    trim: true
  },
  // Campos específicos para médicos
  workingDays: [{
    type: String,
    trim: true
  }],
  workingHours: {
    start: {
      type: String,
      trim: true
    },
    end: {
      type: String,
      trim: true
    }
  },
  consultationTypes: [{
    type: String,
    trim: true
  }],
  procedureTypes: [{
    type: String,
    trim: true
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Schema para Paciente
const patientSchema = new Schema<IPatient>({
  name: {
    type: String,
    required: true,
    trim: true
  },
  di: {
    type: String,
    required: false,
    sparse: true, // Permite múltiplos valores null/undefined
    trim: true
  },
  nif: {
    type: String,
    required: false,
    sparse: true, // Permite múltiplos valores null/undefined
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    lowercase: true,
    trim: true
  },
  address: {
    type: String,
    trim: true
  },
  notes: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Schema para Tipo de Consulta
const consultationTypeSchema = new Schema<IConsultationType>({
  name: {
    type: String,
    required: true,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  description: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Schema para Tipo de Procedimento
const procedureTypeSchema = new Schema<IProcedureType>({
  name: {
    type: String,
    required: true,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  category: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  specialty: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Schema para Consulta
const appointmentSchema = new Schema<IAppointment>({
  patientId: {
    type: Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  doctorId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  consultationTypeId: {
    type: Schema.Types.ObjectId,
    ref: 'ConsultationType',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  time: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['scheduled', 'cancelled', 'completed'],
    default: 'scheduled'
  },
  notes: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Schema para Procedimento
const procedureSchema = new Schema<IProcedure>({
  appointmentId: {
    type: Schema.Types.ObjectId,
    ref: 'Appointment'
  },
  patientId: {
    type: Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  doctorId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  procedureTypeId: {
    type: Schema.Types.ObjectId,
    ref: 'ProcedureType',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  cost: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['in_progress', 'completed'],
    default: 'in_progress'
  },
  notes: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Schema para Tipo de Transação
const transactionTypeSchema = new Schema<ITransactionType>({
  name: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    enum: ['income', 'expense'],
    required: true
  },
  description: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Schema para Transação Financeira
const transactionSchema = new Schema<ITransaction>({
  patientId: {
    type: Schema.Types.ObjectId,
    ref: 'Patient'
  },
  appointmentId: {
    type: Schema.Types.ObjectId,
    ref: 'Appointment'
  },
  procedureId: {
    type: Schema.Types.ObjectId,
    ref: 'Procedure'
  },
  transactionTypeId: {
    type: Schema.Types.ObjectId,
    ref: 'TransactionType',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'paid', 'overdue'],
    default: 'pending'
  },
  description: String,
  transactionDate: {
    type: Date,
    default: Date.now
  },
  dueDate: Date,
  paidDate: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Schema para Configuração de Tipo de Utilizador
const userTypeConfigSchema = new Schema<IUserTypeConfig>({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  permissions: {
    type: Schema.Types.Mixed,
    required: true
  },
  description: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// ============================================================================
// ÍNDICES PARA PERFORMANCE
// ============================================================================

// Índices para Utilizadores
userSchema.index({ email: 1 });
userSchema.index({ userType: 1 });
userSchema.index({ isActive: 1 });

// Índices para Pacientes
patientSchema.index({ di: 1 }, { unique: true, sparse: true }); // Índice único e esparso para DI
patientSchema.index({ nif: 1 }, { unique: true, sparse: true }); // Índice único e esparso para NIF
patientSchema.index({ name: 1 });
patientSchema.index({ email: 1 });

// Índices para Consultas
appointmentSchema.index({ patientId: 1 });
appointmentSchema.index({ doctorId: 1 });
appointmentSchema.index({ date: 1 });
appointmentSchema.index({ status: 1 });
appointmentSchema.index({ date: 1, doctorId: 1 }); // Índice composto para verificar disponibilidade

// Índices para Procedimentos
procedureSchema.index({ patientId: 1 });
procedureSchema.index({ doctorId: 1 });
procedureSchema.index({ date: 1 });

// Índices para Transações
transactionSchema.index({ patientId: 1 });
transactionSchema.index({ status: 1 });
transactionSchema.index({ transactionDate: 1 });
transactionSchema.index({ dueDate: 1 });

// ============================================================================
// MODELOS MONGOOSE
// ============================================================================

export const User = mongoose.model<IUser>('User', userSchema);
export const Patient = mongoose.model<IPatient>('Patient', patientSchema);
export const ConsultationType = mongoose.model<IConsultationType>('ConsultationType', consultationTypeSchema);
export const ProcedureType = mongoose.model<IProcedureType>('ProcedureType', procedureTypeSchema);
export const Appointment = mongoose.model<IAppointment>('Appointment', appointmentSchema);
export const Procedure = mongoose.model<IProcedure>('Procedure', procedureSchema);
export const TransactionType = mongoose.model<ITransactionType>('TransactionType', transactionTypeSchema);
export const Transaction = mongoose.model<ITransaction>('Transaction', transactionSchema);
export const UserTypeConfig = mongoose.model<IUserTypeConfig>('UserTypeConfig', userTypeConfigSchema);

// ============================================================================
// VALIDAÇÕES ZOD PARA FORMULÁRIOS
// ============================================================================

// Validação para criação de utilizador
export const createUserSchema = z.object({
  email: z.string().email('Email inválido'),
  firstName: z.string().min(1, 'Nome é obrigatório').optional(),
  lastName: z.string().min(1, 'Apelido é obrigatório').optional(),
  userType: z.enum(['admin', 'employee', 'doctor']),
  specialties: z.array(z.string()).optional(),
  contactInfo: z.string().optional()
});

// Validação para criação de paciente
export const createPatientSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  di: z.string().optional(), // Documento de Identidade
  nif: z.string().optional(), // Número de Identificação Fiscal
  phone: z.string().optional(),
  email: z.string().email('Email inválido').optional(),
  address: z.string().optional(),
  notes: z.string().optional()
});

// Validação para criação de consulta
export const createAppointmentSchema = z.object({
  patientId: z.string().min(1, 'Paciente é obrigatório'),
  doctorId: z.string().min(1, 'Médico é obrigatório'),
  consultationTypeId: z.string().min(1, 'Tipo de consulta é obrigatório'),
  date: z.string().min(1, 'Data é obrigatória'),
  time: z.string().min(1, 'Hora é obrigatória'),
  status: z.enum(['scheduled', 'cancelled', 'completed']).optional(),
  notes: z.string().optional()
});

// Validação para criação de procedimento
export const createProcedureSchema = z.object({
  appointmentId: z.string().optional(),
  patientId: z.string().min(1, 'Paciente é obrigatório'),
  doctorId: z.string().min(1, 'Médico é obrigatório'),
  procedureTypeId: z.string().min(1, 'Tipo de procedimento é obrigatório'),
  date: z.string().min(1, 'Data é obrigatória'),
  cost: z.number().min(0, 'Custo deve ser positivo'),
  status: z.enum(['in_progress', 'completed', 'cancelled']).optional(),
  notes: z.string().optional()
});

// Validação para criação de transação
export const createTransactionSchema = z.object({
  patientId: z.string().optional(),
  appointmentId: z.string().optional(),
  procedureId: z.string().optional(),
  transactionTypeId: z.string().min(1, 'Tipo de transação é obrigatório'),
  amount: z.number().min(0, 'Valor deve ser positivo'),
  description: z.string().optional(),
  status: z.enum(['pending', 'paid', 'overdue']).optional(),
  dueDate: z.string().optional(),
  paidDate: z.string().optional(),
  transactionDate: z.string().optional()
});

// ============================================================================
// TIPOS PARA EXPORTAÇÃO
// ============================================================================

export type CreateUser = z.infer<typeof createUserSchema>;
export type CreatePatient = z.infer<typeof createPatientSchema>;
export type CreateAppointment = z.infer<typeof createAppointmentSchema>;
export type CreateProcedure = z.infer<typeof createProcedureSchema>;
export type CreateTransaction = z.infer<typeof createTransactionSchema>;

// Tipos para respostas da API
export type UserResponse = IUser;
export type PatientResponse = IPatient;
export type AppointmentResponse = IAppointment;
export type ProcedureResponse = IProcedure;
export type TransactionResponse = ITransaction;
