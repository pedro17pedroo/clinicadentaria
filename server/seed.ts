import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

import { connectDB, disconnectDB } from './db.js';
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
} from '@shared/schema';

/**
 * Script para popular a base de dados MongoDB com dados iniciais
 * Executa: npm run db:seed
 */
async function seedDatabase() {
  try {
    console.log('🌱 Iniciando seed da base de dados...');
    
    // Conectar à base de dados
    await connectDB();
    console.log('✅ Conectado à base de dados MongoDB');
    
    // Limpar dados existentes (opcional)
    console.log('🧹 Limpando dados existentes...');
    await Promise.all([
      ConsultationType.deleteMany({}),
      ProcedureType.deleteMany({}),
      TransactionType.deleteMany({}),
      UserTypeConfig.deleteMany({}),
    ]);
    
    // Seed Tipos de Consulta
    console.log('📋 Criando tipos de consulta...');
    const consultationTypes = await ConsultationType.insertMany([
      {
        name: 'Consulta de Rotina',
        description: 'Consulta preventiva e de acompanhamento',
        price: 80.00,
        duration: 30,
        isActive: true
      },
      {
        name: 'Consulta de Urgência',
        description: 'Consulta para casos urgentes',
        price: 120.00,
        duration: 45,
        isActive: true
      },
      {
        name: 'Consulta Especializada',
        description: 'Consulta com especialista',
        price: 150.00,
        duration: 60,
        isActive: true
      },
      {
        name: 'Avaliação Ortodôntica',
        description: 'Avaliação para tratamento ortodôntico',
        price: 100.00,
        duration: 45,
        isActive: true
      }
    ]);
    console.log(`✅ Criados ${consultationTypes.length} tipos de consulta`);
    
    // Seed Tipos de Procedimento
    console.log('🦷 Criando tipos de procedimento...');
    const procedureTypes = await ProcedureType.insertMany([
      {
        name: 'Limpeza Dentária',
        description: 'Profilaxia e remoção de tártaro',
        category: 'preventivo',
        price: 60.00,
        duration: 45,
        isActive: true
      },
      {
        name: 'Restauração',
        description: 'Restauração de dente cariado',
        category: 'restaurativo',
        price: 120.00,
        duration: 60,
        isActive: true
      },
      {
        name: 'Extração Simples',
        description: 'Extração de dente simples',
        category: 'cirurgico',
        price: 80.00,
        duration: 30,
        isActive: true
      },
      {
        name: 'Extração Complexa',
        description: 'Extração de dente complexa',
        category: 'cirurgico',
        price: 200.00,
        duration: 90,
        isActive: true
      },
      {
        name: 'Canal Radicular',
        description: 'Tratamento endodôntico',
        category: 'endodontico',
        price: 300.00,
        duration: 120,
        isActive: true
      },
      {
        name: 'Clareamento Dental',
        description: 'Clareamento dos dentes',
        category: 'estetico',
        price: 250.00,
        duration: 90,
        isActive: true
      },
      {
        name: 'Aplicação de Flúor',
        description: 'Aplicação tópica de flúor',
        category: 'preventivo',
        price: 40.00,
        duration: 20,
        isActive: true
      },
      {
        name: 'Prótese Parcial',
        description: 'Confecção de prótese parcial',
        category: 'protese',
        price: 800.00,
        duration: 180,
        isActive: true
      }
    ]);
    console.log(`✅ Criados ${procedureTypes.length} tipos de procedimento`);
    
    // Seed Tipos de Transação
    console.log('💰 Criando tipos de transação...');
    const transactionTypes = await TransactionType.insertMany([
      {
        name: 'Pagamento de Consulta',
        description: 'Pagamento referente a consulta realizada',
        category: 'income',
        isActive: true
      },
      {
        name: 'Pagamento de Procedimento',
        description: 'Pagamento referente a procedimento realizado',
        category: 'income',
        isActive: true
      },
      {
        name: 'Pagamento de Tratamento',
        description: 'Pagamento referente a tratamento completo',
        category: 'income',
        isActive: true
      },
      {
        name: 'Desconto',
        description: 'Desconto aplicado ao paciente',
        category: 'expense',
        isActive: true
      },
      {
        name: 'Estorno',
        description: 'Estorno de pagamento',
        category: 'expense',
        isActive: true
      },
      {
        name: 'Material Odontológico',
        description: 'Compra de materiais odontológicos',
        category: 'expense',
        isActive: true
      },
      {
        name: 'Equipamento',
        description: 'Compra ou manutenção de equipamentos',
        category: 'expense',
        isActive: true
      },
      {
        name: 'Aluguel',
        description: 'Pagamento de aluguel do consultório',
        category: 'expense',
        isActive: true
      },
      {
        name: 'Salário',
        description: 'Pagamento de salários',
        category: 'expense',
        isActive: true
      }
    ]);
    console.log(`✅ Criados ${transactionTypes.length} tipos de transação`);
    
    // Seed Configurações de Tipo de Utilizador
    console.log('👥 Criando configurações de tipo de utilizador...');
    const userTypeConfigs = await UserTypeConfig.insertMany([
      {
        name: 'Administrador',
        description: 'Acesso total ao sistema',
        permissions: [
          'admin.access',
          'users.read',
          'users.write',
          'users.delete',
          'patients.read',
          'patients.write',
          'patients.delete',
          'appointments.read',
          'appointments.write',
          'appointments.delete',
          'procedures.read',
          'procedures.write',
          'procedures.delete',
          'transactions.read',
          'transactions.write',
          'transactions.delete',
          'reports.read',
          'settings.read',
          'settings.write'
        ],
        isActive: true
      },
      {
        name: 'Médico',
        description: 'Acesso a consultas e procedimentos',
        permissions: [
          'patients.read',
          'patients.write',
          'appointments.read',
          'appointments.write',
          'procedures.read',
          'procedures.write',
          'transactions.read'
        ],
        isActive: true
      },
      {
        name: 'Funcionário',
        description: 'Acesso a agendamentos e pacientes',
        permissions: [
          'patients.read',
          'patients.write',
          'appointments.read',
          'appointments.write',
          'transactions.read'
        ],
        isActive: true
      },
      {
        name: 'Rececionista',
        description: 'Acesso limitado a agendamentos',
        permissions: [
          'patients.read',
          'appointments.read',
          'appointments.write'
        ],
        isActive: true
      }
    ]);
    console.log(`✅ Criadas ${userTypeConfigs.length} configurações de tipo de utilizador`);
    
    // Seed Pacientes de Exemplo (opcional)
    console.log('👤 Criando pacientes de exemplo...');
    const patients = await Patient.insertMany([
      {
        name: 'João Silva',
        di: '123456789',
        email: 'joao.silva@email.com',
        phone: '(11) 99999-1111',
        birthDate: new Date('1985-03-15'),
        address: 'Rua das Flores, 123',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '01234-567',
        emergencyContact: 'Maria Silva - (11) 99999-2222',
        medicalHistory: 'Hipertensão controlada',
        allergies: 'Penicilina',
        isActive: true
      },
      {
        name: 'Maria Santos',
        di: '987654321',
        email: 'maria.santos@email.com',
        phone: '(11) 88888-3333',
        birthDate: new Date('1990-07-22'),
        address: 'Av. Principal, 456',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '09876-543',
        emergencyContact: 'José Santos - (11) 88888-4444',
        medicalHistory: 'Diabetes tipo 2',
        allergies: 'Nenhuma conhecida',
        isActive: true
      },
      {
        name: 'Pedro Oliveira',
        di: '456789123',
        email: 'pedro.oliveira@email.com',
        phone: '(11) 77777-5555',
        birthDate: new Date('1978-12-10'),
        address: 'Rua do Comércio, 789',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '05432-109',
        emergencyContact: 'Ana Oliveira - (11) 77777-6666',
        medicalHistory: 'Histórico de problemas cardíacos',
        allergies: 'Látex',
        isActive: true
      }
    ]);
    console.log(`✅ Criados ${patients.length} pacientes de exemplo`);
    
    console.log('\n🎉 Seed da base de dados concluído com sucesso!');
    console.log('\n📊 Resumo:');
    console.log(`   • ${consultationTypes.length} tipos de consulta`);
    console.log(`   • ${procedureTypes.length} tipos de procedimento`);
    console.log(`   • ${transactionTypes.length} tipos de transação`);
    console.log(`   • ${userTypeConfigs.length} configurações de utilizador`);
    console.log(`   • ${patients.length} pacientes de exemplo`);
    console.log('\n✅ Base de dados pronta para uso!');
    
  } catch (error) {
    console.error('❌ Erro durante o seed da base de dados:', error);
    process.exit(1);
  } finally {
    // Desconectar da base de dados
    await disconnectDB();
    console.log('\n🔌 Desconectado da base de dados');
    process.exit(0);
  }
}

// Executar seed se o arquivo for chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase();
}

export default seedDatabase;