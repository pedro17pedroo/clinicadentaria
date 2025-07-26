import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

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
 * Script melhorado para criar seed com dados atuais da base de dados
 * Executa: npx tsx server/create-seed-from-current.ts
 */
async function createSeedFromCurrent() {
  try {
    console.log('🌱 Criando seed com dados atuais da base de dados...');
    
    // Conectar à base de dados
    await connectDB();
    console.log('✅ Conectado à base de dados MongoDB');
    
    // Buscar todos os dados das coleções
    console.log('🔍 Buscando dados das coleções...');
    
    const [users, patients, consultationTypes, procedureTypes, transactionTypes, appointments, procedures, transactions, userTypeConfigs] = await Promise.all([
      User.find({}).lean(),
      Patient.find({}).lean(),
      ConsultationType.find({}).lean(),
      ProcedureType.find({}).lean(),
      TransactionType.find({}).lean(),
      Appointment.find({}).lean(),
      Procedure.find({}).lean(),
      Transaction.find({}).lean(),
      UserTypeConfig.find({}).lean()
    ]);
    
    console.log('📊 Dados encontrados:');
    console.log(`   • ${users.length} utilizadores`);
    console.log(`   • ${patients.length} pacientes`);
    console.log(`   • ${consultationTypes.length} tipos de consulta`);
    console.log(`   • ${procedureTypes.length} tipos de procedimento`);
    console.log(`   • ${transactionTypes.length} tipos de transação`);
    console.log(`   • ${appointments.length} consultas`);
    console.log(`   • ${procedures.length} procedimentos`);
    console.log(`   • ${transactions.length} transações`);
    console.log(`   • ${userTypeConfigs.length} configurações de utilizador`);
    
    // Gerar conteúdo do ficheiro de seed
    const seedContent = generateCleanSeedFile({
      users,
      patients,
      consultationTypes,
      procedureTypes,
      transactionTypes,
      appointments,
      procedures,
      transactions,
      userTypeConfigs
    });
    
    // Criar ficheiro de seed com timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const seedFileName = `seed-current-data.ts`;
    const seedFilePath = path.join(process.cwd(), 'server', seedFileName);
    
    fs.writeFileSync(seedFilePath, seedContent, 'utf8');
    
    console.log(`\n✅ Seed criado com sucesso!`);
    console.log(`📁 Ficheiro: ${seedFilePath}`);
    console.log(`\n🚀 Para usar este seed:`);
    console.log(`   1. Execute: npx tsx server/${seedFileName}`);
    console.log(`   2. Ou substitua o seed.ts: mv server/${seedFileName} server/seed.ts && npm run db:seed`);
    
  } catch (error) {
    console.error('❌ Erro durante a criação do seed:', error);
    process.exit(1);
  } finally {
    // Desconectar da base de dados
    await disconnectDB();
    console.log('\n🔌 Desconectado da base de dados');
    process.exit(0);
  }
}

/**
 * Gera um ficheiro de seed limpo e bem formatado
 */
function generateCleanSeedFile(data: any): string {
  const { users, patients, consultationTypes, procedureTypes, transactionTypes, appointments, procedures, transactions, userTypeConfigs } = data;
  
  // Função para limpar dados (remover campos desnecessários)
  const cleanData = (items: any[]) => {
    return items.map(item => {
      const cleaned = { ...item };
      delete cleaned._id;
      delete cleaned.__v;
      delete cleaned.createdAt;
      delete cleaned.updatedAt;
      return cleaned;
    });
  };
  
  // Função para converter ObjectIds e Datas para formato correto
  const convertData = (obj: any): any => {
    if (obj === null || obj === undefined) return obj;
    
    // Converter ObjectId para string
    if (typeof obj === 'object' && obj.constructor && obj.constructor.name === 'ObjectId') {
      return obj.toString();
    }
    
    // Converter Date para ISO string
    if (obj instanceof Date) {
      return obj.toISOString();
    }
    
    if (Array.isArray(obj)) {
      return obj.map(convertData);
    }
    
    if (typeof obj === 'object') {
      const result: any = {};
      for (const [key, value] of Object.entries(obj)) {
        result[key] = convertData(value);
      }
      return result;
    }
    
    return obj;
  };
  
  // Limpar e converter dados
  const cleanUsers = convertData(cleanData(users));
  const cleanPatients = convertData(cleanData(patients));
  const cleanConsultationTypes = convertData(cleanData(consultationTypes));
  const cleanProcedureTypes = convertData(cleanData(procedureTypes));
  const cleanTransactionTypes = convertData(cleanData(transactionTypes));
  const cleanAppointments = convertData(cleanData(appointments));
  const cleanProcedures = convertData(cleanData(procedures));
  const cleanTransactions = convertData(cleanData(transactions));
  const cleanUserTypeConfigs = convertData(cleanData(userTypeConfigs));
  
  // Função para gerar código de inserção
  const generateInsertCode = (collectionName: string, modelName: string, data: any[], emoji: string, description: string) => {
    if (data.length === 0) {
      return `    // Nenhum ${description} encontrado\n`;
    }
    
    return `    // Inserir ${description}
    console.log('${emoji} Inserindo ${description}...');
    const ${collectionName}Result = await ${modelName}.insertMany(${JSON.stringify(data, null, 6).replace(/^/gm, '    ')});
    console.log(\`✅ Inseridos \${${collectionName}Result.length} ${description}\`);
    insertedCounts.${collectionName} = ${collectionName}Result.length;\n`;
  };
  
  return `import dotenv from 'dotenv';

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
 * Data de geração: ${new Date().toLocaleString('pt-PT')}
 * Total de registos: ${users.length + patients.length + consultationTypes.length + procedureTypes.length + transactionTypes.length + appointments.length + procedures.length + transactions.length + userTypeConfigs.length}
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
    
${generateInsertCode('userTypeConfigs', 'UserTypeConfig', cleanUserTypeConfigs, '👥', 'configurações de utilizador')}
${generateInsertCode('consultationTypes', 'ConsultationType', cleanConsultationTypes, '📋', 'tipos de consulta')}
${generateInsertCode('procedureTypes', 'ProcedureType', cleanProcedureTypes, '🦷', 'tipos de procedimento')}
${generateInsertCode('transactionTypes', 'TransactionType', cleanTransactionTypes, '💰', 'tipos de transação')}
${generateInsertCode('users', 'User', cleanUsers, '👤', 'utilizadores')}
${generateInsertCode('patients', 'Patient', cleanPatients, '🏥', 'pacientes')}
${generateInsertCode('appointments', 'Appointment', cleanAppointments, '📅', 'consultas')}
${generateInsertCode('procedures', 'Procedure', cleanProcedures, '⚕️', 'procedimentos')}
${generateInsertCode('transactions', 'Transaction', cleanTransactions, '💳', 'transações')}
    
    console.log('\\n🎉 Seed da base de dados concluído com sucesso!');
    console.log('\\n📊 Resumo dos dados inseridos:');
    console.log(\`   • \${insertedCounts.userTypeConfigs} configurações de utilizador\`);
    console.log(\`   • \${insertedCounts.consultationTypes} tipos de consulta\`);
    console.log(\`   • \${insertedCounts.procedureTypes} tipos de procedimento\`);
    console.log(\`   • \${insertedCounts.transactionTypes} tipos de transação\`);
    console.log(\`   • \${insertedCounts.users} utilizadores\`);
    console.log(\`   • \${insertedCounts.patients} pacientes\`);
    console.log(\`   • \${insertedCounts.appointments} consultas\`);
    console.log(\`   • \${insertedCounts.procedures} procedimentos\`);
    console.log(\`   • \${insertedCounts.transactions} transações\`);
    console.log('\\n✅ Base de dados restaurada com dados atuais!');
    
  } catch (error) {
    console.error('❌ Erro durante o seed da base de dados:', error);
    process.exit(1);
  } finally {
    // Desconectar da base de dados
    await disconnectDB();
    console.log('\\n🔌 Desconectado da base de dados');
    process.exit(0);
  }
}

// Executar seed se o arquivo for chamado diretamente
if (import.meta.url === \`file://\${process.argv[1]}\`) {
  seedDatabase();
}

export default seedDatabase;
`;
}

// Executar se o arquivo for chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  createSeedFromCurrent();
}

export default createSeedFromCurrent;