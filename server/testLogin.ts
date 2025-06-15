import bcrypt from 'bcrypt';
import { connectDB } from './db.js';
import { User } from '../shared/schema.js';
import mongoose from 'mongoose';
import { storage } from './storage.js';

/**
 * Script de teste para verificar o login
 */

async function testLogin() {
  try {
    console.log('🔗 Conectando à base de dados...');
    await connectDB();
    
    console.log('\n🔍 TESTE DE LOGIN COMPLETO');
    console.log('============================');
    
    // Dados de teste
    const testEmail = 'admin@clinica.ao';
    const testPassword = 'admin123';
    
    console.log(`📧 Testando login com: ${testEmail}`);
    console.log(`🔑 Password: ${testPassword}`);
    
    // 1. Verificar se o utilizador existe
    console.log('\n1️⃣ Verificando se o utilizador existe...');
    const user = await storage.getUserByEmail(testEmail);
    
    if (!user) {
      console.log('❌ Utilizador não encontrado!');
      return;
    }
    
    console.log('✅ Utilizador encontrado:');
    console.log(`   - ID: ${user._id}`);
    console.log(`   - Email: ${user.email}`);
    console.log(`   - Tipo: ${user.userType}`);
    console.log(`   - Tem password: ${user.password ? 'SIM' : 'NÃO'}`);
    
    if (user.password) {
      console.log(`   - Password hash: ${user.password.substring(0, 20)}...`);
    }
    
    // 2. Verificar password
    console.log('\n2️⃣ Verificando password...');
    
    if (!user.password) {
      console.log('❌ Utilizador não tem password definida!');
      return;
    }
    
    try {
      const isValidPassword = await bcrypt.compare(testPassword, user.password);
      
      if (isValidPassword) {
        console.log('✅ Password correcta!');
      } else {
        console.log('❌ Password incorrecta!');
        
        // Testar com outras passwords possíveis
        const otherPasswords = ['password123', 'admin', '123456'];
        console.log('\n🔄 Testando outras passwords...');
        
        for (const pwd of otherPasswords) {
          const isValid = await bcrypt.compare(pwd, user.password);
          console.log(`   - "${pwd}": ${isValid ? '✅ CORRECTA' : '❌ incorrecta'}`);
          if (isValid) break;
        }
      }
    } catch (error) {
      console.error('❌ Erro ao verificar password:', error);
    }
    
    // 3. Testar outros utilizadores
    console.log('\n3️⃣ Testando outros utilizadores...');
    
    const otherUsers = [
      { email: 'joao.silva@clinica.ao', password: 'medico123' },
      { email: 'maria.santos@clinica.ao', password: 'medica123' },
      { email: 'ana.funcionaria@clinica.ao', password: 'funcionaria123' }
    ];
    
    for (const testUser of otherUsers) {
      const foundUser = await storage.getUserByEmail(testUser.email);
      
      if (foundUser && foundUser.password) {
        const isValid = await bcrypt.compare(testUser.password, foundUser.password);
        console.log(`   - ${testUser.email}: ${isValid ? '✅ OK' : '❌ FALHA'}`);
      } else {
        console.log(`   - ${testUser.email}: ❌ SEM PASSWORD`);
      }
    }
    
    // 4. Verificar estrutura da base de dados
    console.log('\n4️⃣ Verificando estrutura da base de dados...');
    
    const allUsers = await User.find({}).select('email password userType').exec();
    console.log(`📊 Total de utilizadores: ${allUsers.length}`);
    
    let usersWithPassword = 0;
    let usersWithoutPassword = 0;
    
    for (const u of allUsers) {
      if (u.password && u.password.length > 0) {
        usersWithPassword++;
      } else {
        usersWithoutPassword++;
        console.log(`   ❌ SEM PASSWORD: ${u.email}`);
      }
    }
    
    console.log(`✅ Com password: ${usersWithPassword}`);
    console.log(`❌ Sem password: ${usersWithoutPassword}`);
    
    // 5. Verificar schema do modelo
    console.log('\n5️⃣ Verificando schema do modelo...');
    
    const userSchema = User.schema;
    const passwordPath = userSchema.path('password');
    
    if (passwordPath) {
      console.log('✅ Campo password existe no schema');
      console.log(`   - Tipo: ${passwordPath.instance}`);
      console.log(`   - Obrigatório: ${passwordPath.isRequired}`);
    } else {
      console.log('❌ Campo password NÃO existe no schema!');
    }
    
    const mustChangePasswordPath = userSchema.path('mustChangePassword');
    if (mustChangePasswordPath) {
      console.log('✅ Campo mustChangePassword existe no schema');
    } else {
      console.log('❌ Campo mustChangePassword NÃO existe no schema!');
    }
    
  } catch (error) {
    console.error('❌ ERRO CRÍTICO:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Conexão com a base de dados fechada.');
    process.exit(0);
  }
}

// Executar teste
testLogin();

export { testLogin };