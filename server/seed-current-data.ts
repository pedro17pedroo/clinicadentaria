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
 * Script de seed gerado automaticamente com dados atuais
 * Data de geração: 26/07/2025, 16:20:28
 * Total de registos: 35
 */
async function seedDatabase() {
  try {
    console.log('🌱 Iniciando seed da base de dados com dados atuais...');
    
    // Conectar à base de dados
    await connectDB();
    console.log('✅ Conectado à base de dados MongoDB');
    
    // Limpar dados existentes
    console.log('🧹 Limpando dados existentes...');
    await Promise.all([
      User.deleteMany({}),
      Patient.deleteMany({}),
      ConsultationType.deleteMany({}),
      ProcedureType.deleteMany({}),
      TransactionType.deleteMany({}),
      Appointment.deleteMany({}),
      Procedure.deleteMany({}),
      Transaction.deleteMany({}),
      UserTypeConfig.deleteMany({}),
    ]);
    
    // Contador de registos inseridos
    const insertedCounts = {
      users: 0,
      patients: 0,
      consultationTypes: 0,
      procedureTypes: 0,
      transactionTypes: 0,
      appointments: 0,
      procedures: 0,
      transactions: 0,
      userTypeConfigs: 0
    };
    
    // Inserir configurações de utilizador
    console.log('👥 Inserindo configurações de utilizador...');
    const userTypeConfigsResult = await UserTypeConfig.insertMany(    [
          {
                "name": "Administrador",
                "permissions": [
                      "admin.access",
                      "users.read",
                      "users.write",
                      "users.delete",
                      "patients.read",
                      "patients.write",
                      "patients.delete",
                      "appointments.read",
                      "appointments.write",
                      "appointments.delete",
                      "procedures.read",
                      "procedures.write",
                      "procedures.delete",
                      "transactions.read",
                      "transactions.write",
                      "transactions.delete",
                      "reports.read",
                      "settings.read",
                      "settings.write"
                ],
                "description": "Acesso total ao sistema",
                "isActive": true
          },
          {
                "name": "Médico",
                "permissions": [
                      "patients.read",
                      "patients.write",
                      "appointments.read",
                      "appointments.write",
                      "procedures.read",
                      "procedures.write",
                      "transactions.read"
                ],
                "description": "Acesso a consultas e procedimentos",
                "isActive": true
          },
          {
                "name": "Funcionário",
                "permissions": [
                      "patients.read",
                      "patients.write",
                      "appointments.read",
                      "appointments.write",
                      "transactions.read"
                ],
                "description": "Acesso a agendamentos e pacientes",
                "isActive": true
          },
          {
                "name": "Rececionista",
                "permissions": [
                      "patients.read",
                      "appointments.read",
                      "appointments.write"
                ],
                "description": "Acesso limitado a agendamentos",
                "isActive": true
          }
    ]);
    console.log(`✅ Inseridos ${userTypeConfigsResult.length} configurações de utilizador`);
    insertedCounts.userTypeConfigs = userTypeConfigsResult.length;

    // Inserir tipos de consulta
    console.log('📋 Inserindo tipos de consulta...');
    const consultationTypesResult = await ConsultationType.insertMany(    [
          {
                "name": "Consulta de Rotina",
                "price": 80,
                "description": "Consulta preventiva e de acompanhamento",
                "isActive": true
          },
          {
                "name": "Consulta de Urgência",
                "price": 120,
                "description": "Consulta para casos urgentes",
                "isActive": true
          },
          {
                "name": "Consulta Especializada",
                "price": 150,
                "description": "Consulta com especialista",
                "isActive": true
          },
          {
                "name": "Avaliação Ortodôntica",
                "price": 100,
                "description": "Avaliação para tratamento ortodôntico",
                "isActive": true
          }
    ]);
    console.log(`✅ Inseridos ${consultationTypesResult.length} tipos de consulta`);
    insertedCounts.consultationTypes = consultationTypesResult.length;

    // Inserir tipos de procedimento
    console.log('🦷 Inserindo tipos de procedimento...');
    const procedureTypesResult = await ProcedureType.insertMany(    [
          {
                "name": "Limpeza Dentária",
                "price": 60,
                "category": "preventivo",
                "description": "Profilaxia e remoção de tártaro",
                "isActive": true
          },
          {
                "name": "Restauração",
                "price": 120,
                "category": "restaurativo",
                "description": "Restauração de dente cariado",
                "isActive": true
          },
          {
                "name": "Extração Simples",
                "price": 80,
                "category": "cirurgico",
                "description": "Extração de dente simples",
                "isActive": true
          },
          {
                "name": "Extração Complexa",
                "price": 200,
                "category": "cirurgico",
                "description": "Extração de dente complexa",
                "isActive": true
          },
          {
                "name": "Canal Radicular",
                "price": 300,
                "category": "endodontico",
                "description": "Tratamento endodôntico",
                "isActive": true
          },
          {
                "name": "Clareamento Dental",
                "price": 250,
                "category": "estetico",
                "description": "Clareamento dos dentes",
                "isActive": true
          },
          {
                "name": "Aplicação de Flúor",
                "price": 40,
                "category": "preventivo",
                "description": "Aplicação tópica de flúor",
                "isActive": true
          },
          {
                "name": "Prótese Parcial",
                "price": 800,
                "category": "protese",
                "description": "Confecção de prótese parcial",
                "isActive": true
          }
    ]);
    console.log(`✅ Inseridos ${procedureTypesResult.length} tipos de procedimento`);
    insertedCounts.procedureTypes = procedureTypesResult.length;

    // Inserir tipos de transação
    console.log('💰 Inserindo tipos de transação...');
    const transactionTypesResult = await TransactionType.insertMany(    [
          {
                "name": "Pagamento de Consulta",
                "category": "income",
                "description": "Pagamento referente a consulta realizada",
                "isActive": true
          },
          {
                "name": "Pagamento de Procedimento",
                "category": "income",
                "description": "Pagamento referente a procedimento realizado",
                "isActive": true
          },
          {
                "name": "Pagamento de Tratamento",
                "category": "income",
                "description": "Pagamento referente a tratamento completo",
                "isActive": true
          },
          {
                "name": "Desconto",
                "category": "expense",
                "description": "Desconto aplicado ao paciente",
                "isActive": true
          },
          {
                "name": "Estorno",
                "category": "expense",
                "description": "Estorno de pagamento",
                "isActive": true
          },
          {
                "name": "Material Odontológico",
                "category": "expense",
                "description": "Compra de materiais odontológicos",
                "isActive": true
          },
          {
                "name": "Equipamento",
                "category": "expense",
                "description": "Compra ou manutenção de equipamentos",
                "isActive": true
          },
          {
                "name": "Aluguel",
                "category": "expense",
                "description": "Pagamento de aluguel do consultório",
                "isActive": true
          },
          {
                "name": "Salário",
                "category": "expense",
                "description": "Pagamento de salários",
                "isActive": true
          }
    ]);
    console.log(`✅ Inseridos ${transactionTypesResult.length} tipos de transação`);
    insertedCounts.transactionTypes = transactionTypesResult.length;

    // Inserir utilizadores
    console.log('👤 Inserindo utilizadores...');
    const usersResult = await User.insertMany(    [
          {
                "email": "admin@clinica.ao",
                "firstName": "Administrador",
                "lastName": "Principal",
                "password": "$2b$10$3PKpSXOWVDPQ8hJUeieOOO1Ln2yzVC8sfagRjQQyWOw1sRb92WJJG",
                "mustChangePassword": false,
                "userType": "admin",
                "specialties": [],
                "workingDays": [],
                "consultationTypes": [],
                "procedureTypes": [],
                "isActive": true
          },
          {
                "email": "joao.silva@clinica.ao",
                "firstName": "João",
                "lastName": "Silva",
                "password": "$2b$10$W1RD8irzzazpVd2UU.rTq./2qTPFZmFCTw8oQSf6/vlFJz/gcL9k6",
                "mustChangePassword": true,
                "userType": "doctor",
                "specialties": [],
                "workingDays": [
                      "monday",
                      "tuesday",
                      "wednesday",
                      "thursday",
                      "friday",
                      "saturday"
                ],
                "workingHours": {
                      "start": "08:00",
                      "end": "18:00"
                },
                "consultationTypes": [],
                "procedureTypes": [
                      "684df9ee055517433ea02c3f",
                      "684df9ee055517433ea02c40"
                ],
                "isActive": true
          },
          {
                "email": "maria.santos@clinica.ao",
                "firstName": "Maria",
                "lastName": "Santos",
                "password": "$2b$10$D6jX/wvXE6mI07kdE1LoHeDLZjrGFq/9z7U2I.Cd9ENiLMWdKQpAq",
                "mustChangePassword": false,
                "userType": "doctor",
                "specialties": [
                      "Endodontia"
                ],
                "workingDays": [
                      "monday",
                      "tuesday",
                      "wednesday",
                      "thursday",
                      "friday",
                      "saturday"
                ],
                "workingHours": {
                      "start": "08:00",
                      "end": "18:00"
                },
                "consultationTypes": [],
                "procedureTypes": [],
                "isActive": false
          },
          {
                "email": "ana.funcionaria@clinica.ao",
                "firstName": "Ana",
                "lastName": "Funcionária",
                "password": "$2b$10$kQKvmhTzF5C2E.5bpwBoyesZe94n2xfF6EM5qfrFp8.Kq2YpchT3W",
                "mustChangePassword": true,
                "userType": "employee",
                "specialties": [],
                "workingDays": [],
                "consultationTypes": [],
                "procedureTypes": [],
                "isActive": true
          },
          {
                "email": "carlos.recepcao@clinica.ao",
                "firstName": "Carlos",
                "lastName": "Recepcionista",
                "password": "$2b$10$C/PAwb0nLJp0JTInuCJD3eZ7IGJqsz17ZeOrnc17UrVX0sqogN946",
                "mustChangePassword": false,
                "userType": "employee",
                "specialties": [],
                "workingDays": [],
                "consultationTypes": [],
                "procedureTypes": [],
                "isActive": true
          },
          {
                "email": "pedro.dentista@clinica.ao",
                "firstName": "Pedro",
                "lastName": "Dentista",
                "password": "$2b$10$KRnza2rWUtajAW1nLsdZy.vw5l4SwMCfmnhJ9zrc5Yr9Cd8W.Q.Lu",
                "mustChangePassword": false,
                "userType": "doctor",
                "specialties": [],
                "workingDays": [
                      "monday",
                      "tuesday",
                      "wednesday",
                      "thursday",
                      "friday",
                      "saturday"
                ],
                "workingHours": {
                      "start": "08:00",
                      "end": "18:00"
                },
                "consultationTypes": [
                      "684df9ee055517433ea02c33",
                      "684df9ee055517433ea02c30"
                ],
                "procedureTypes": [
                      "684df9ee055517433ea02c3f",
                      "684df9ee055517433ea02c3e",
                      "684df9ee055517433ea02c3b",
                      "684df9ee055517433ea02c3d",
                      "684df9ee055517433ea02c3c",
                      "684df9ee055517433ea02c39",
                      "684df9ee055517433ea02c3a",
                      "684df9ee055517433ea02c40"
                ],
                "isActive": true
          },
          {
                "email": "admin.teste@clinica.ao",
                "firstName": "Admin",
                "lastName": "Teste",
                "password": "$2b$10$jz.0EByTTLiTPp8HUybJouolMRhY.wVUoKL3cwLCMo.wbvSJa9x.u",
                "mustChangePassword": true,
                "userType": "admin",
                "specialties": [],
                "workingDays": [],
                "consultationTypes": [],
                "procedureTypes": [],
                "isActive": true
          }
    ]);
    console.log(`✅ Inseridos ${usersResult.length} utilizadores`);
    insertedCounts.users = usersResult.length;

    // Inserir pacientes
    console.log('🏥 Inserindo pacientes...');
    const patientsResult = await Patient.insertMany(    [
          {
                "name": "João Silva",
                "di": "123456789",
                "phone": "(11) 99999-1111",
                "email": "joao.silva@email.com",
                "address": "Rua das Flores, 123"
          },
          {
                "name": "Maria Santos",
                "di": "987654321",
                "phone": "(11) 88888-3333",
                "email": "maria.santos@email.com",
                "address": "Av. Principal, 456"
          },
          {
                "name": "Pedro Oliveira",
                "di": "456789123",
                "phone": "(11) 77777-5555",
                "email": "pedro.oliveira@email.com",
                "address": "Rua do Comércio, 789"
          }
    ]);
    console.log(`✅ Inseridos ${patientsResult.length} pacientes`);
    insertedCounts.patients = patientsResult.length;

    // Nenhum consultas encontrado

    // Nenhum procedimentos encontrado

    // Nenhum transações encontrado

    
    console.log('\n🎉 Seed da base de dados concluído com sucesso!');
    console.log('\n📊 Resumo dos dados inseridos:');
    console.log(`   • ${insertedCounts.userTypeConfigs} configurações de utilizador`);
    console.log(`   • ${insertedCounts.consultationTypes} tipos de consulta`);
    console.log(`   • ${insertedCounts.procedureTypes} tipos de procedimento`);
    console.log(`   • ${insertedCounts.transactionTypes} tipos de transação`);
    console.log(`   • ${insertedCounts.users} utilizadores`);
    console.log(`   • ${insertedCounts.patients} pacientes`);
    console.log(`   • ${insertedCounts.appointments} consultas`);
    console.log(`   • ${insertedCounts.procedures} procedimentos`);
    console.log(`   • ${insertedCounts.transactions} transações`);
    console.log('\n✅ Base de dados restaurada com dados atuais!');
    
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
