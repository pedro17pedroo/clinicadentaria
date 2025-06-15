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
 * Script para limpar completamente a base de dados MongoDB
 * Executa: npm run db:reset
 * 
 * ATENÇÃO: Este script irá eliminar TODOS os dados da base de dados!
 */
async function resetDatabase() {
  try {
    console.log('🚨 ATENÇÃO: Este script irá eliminar TODOS os dados da base de dados!');
    console.log('⏳ Aguardando 3 segundos antes de prosseguir...');
    
    // Aguardar 3 segundos para dar tempo ao utilizador de cancelar
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('🔄 Iniciando reset da base de dados...');
    
    // Conectar à base de dados
    await connectDB();
    console.log('✅ Conectado à base de dados MongoDB');
    
    // Eliminar todas as coleções
    console.log('🗑️  Eliminando todas as coleções...');
    
    const collections = [
      { model: User, name: 'Utilizadores' },
      { model: Patient, name: 'Pacientes' },
      { model: ConsultationType, name: 'Tipos de Consulta' },
      { model: ProcedureType, name: 'Tipos de Procedimento' },
      { model: TransactionType, name: 'Tipos de Transação' },
      { model: Appointment, name: 'Consultas' },
      { model: Procedure, name: 'Procedimentos' },
      { model: Transaction, name: 'Transações' },
      { model: UserTypeConfig, name: 'Configurações de Utilizador' },
    ];
    
    for (const collection of collections) {
      try {
        const count = await collection.model.countDocuments();
        if (count > 0) {
          await (collection.model as any).deleteMany({});
          console.log(`   ✅ ${collection.name}: ${count} documentos eliminados`);
        } else {
          console.log(`   ℹ️  ${collection.name}: Nenhum documento encontrado`);
        }
      } catch (error) {
        console.log(`   ⚠️  ${collection.name}: Erro ao eliminar - ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    
    // Verificar se todas as coleções estão vazias
    console.log('\n🔍 Verificando se todas as coleções estão vazias...');
    let totalDocuments = 0;
    
    for (const collection of collections) {
      try {
        const count = await collection.model.countDocuments();
        totalDocuments += count;
        if (count > 0) {
          console.log(`   ⚠️  ${collection.name}: ${count} documentos restantes`);
        }
      } catch (error) {
        console.log(`   ❌ ${collection.name}: Erro ao verificar - ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    
    if (totalDocuments === 0) {
      console.log('\n🎉 Reset da base de dados concluído com sucesso!');
      console.log('✅ Todas as coleções estão vazias');
      console.log('\n💡 Para popular a base de dados com dados iniciais, execute:');
      console.log('   npm run db:seed');
    } else {
      console.log(`\n⚠️  Reset parcialmente concluído. ${totalDocuments} documentos restantes.`);
    }
    
  } catch (error) {
    console.error('❌ Erro durante o reset da base de dados:', error);
    process.exit(1);
  } finally {
    // Desconectar da base de dados
    await disconnectDB();
    console.log('\n🔌 Desconectado da base de dados');
    process.exit(0);
  }
}

/**
 * Função para reset com confirmação interativa
 */
async function resetWithConfirmation() {
  console.log('🚨 RESET DA BASE DE DADOS 🚨');
  console.log('\nEste comando irá eliminar PERMANENTEMENTE todos os dados:');
  console.log('• Todos os utilizadores');
  console.log('• Todos os pacientes');
  console.log('• Todas as consultas');
  console.log('• Todos os procedimentos');
  console.log('• Todas as transações');
  console.log('• Todas as configurações');
  console.log('\n⚠️  ESTA AÇÃO NÃO PODE SER DESFEITA!');
  
  // Em ambiente de produção, adicionar confirmação interativa
  if (process.env.NODE_ENV === 'production') {
    console.log('\n❌ Reset não permitido em ambiente de produção!');
    process.exit(1);
  }
  
  // Verificar se foi passado o flag de confirmação
  const forceFlag = process.argv.includes('--force') || process.argv.includes('-f');
  
  if (!forceFlag) {
    console.log('\n💡 Para confirmar o reset, execute:');
    console.log('   npm run db:reset -- --force');
    console.log('   ou');
    console.log('   npm run db:reset -- -f');
    process.exit(0);
  }
  
  await resetDatabase();
}

// Executar reset se o arquivo for chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  resetWithConfirmation();
}

export default resetDatabase;