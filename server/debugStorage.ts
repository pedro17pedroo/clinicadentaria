import { connectDB } from './db.js';
import { storage } from './storage.js';
import { User } from '../shared/schema.js';
import mongoose from 'mongoose';

/**
 * Script para debugar o storage e verificar o que está a acontecer
 */

async function debugStorage() {
  try {
    console.log('🔗 Conectando à base de dados...');
    await connectDB();
    
    console.log('\n🔍 DEBUG DO STORAGE');
    console.log('===================');
    
    const testEmail = 'admin@clinica.ao';
    
    // 1. Buscar directamente via Mongoose
    console.log('\n1️⃣ Busca directa via Mongoose:');
    const directUser = await User.findOne({ email: testEmail }).exec();
    
    if (directUser) {
      console.log('✅ Utilizador encontrado via Mongoose:');
      console.log(`   - ID: ${directUser._id}`);
      console.log(`   - Email: ${directUser.email}`);
      console.log(`   - Tipo: ${directUser.userType}`);
      console.log(`   - Password existe: ${directUser.password ? 'SIM' : 'NÃO'}`);
      console.log(`   - Password length: ${directUser.password ? directUser.password.length : 0}`);
      console.log(`   - MustChangePassword: ${directUser.mustChangePassword}`);
      
      if (directUser.password) {
        console.log(`   - Password hash (primeiros 30 chars): ${directUser.password.substring(0, 30)}...`);
      }
      
      // Verificar todos os campos
      console.log('\n   📋 Todos os campos do utilizador:');
      const userObj = directUser.toObject();
      Object.keys(userObj).forEach(key => {
        const value = userObj[key as keyof typeof userObj];
        console.log(`      ${key}: ${typeof value} = ${value}`);
      });
      
    } else {
      console.log('❌ Utilizador NÃO encontrado via Mongoose');
    }
    
    // 2. Buscar via storage.getUserByEmail
    console.log('\n2️⃣ Busca via storage.getUserByEmail:');
    const storageUser = await storage.getUserByEmail(testEmail);
    
    if (storageUser) {
      console.log('✅ Utilizador encontrado via storage:');
      console.log(`   - ID: ${storageUser._id}`);
      console.log(`   - Email: ${storageUser.email}`);
      console.log(`   - Tipo: ${storageUser.userType}`);
      console.log(`   - Password existe: ${storageUser.password ? 'SIM' : 'NÃO'}`);
      console.log(`   - Password length: ${storageUser.password ? storageUser.password.length : 0}`);
      console.log(`   - MustChangePassword: ${storageUser.mustChangePassword}`);
      
      if (storageUser.password) {
        console.log(`   - Password hash (primeiros 30 chars): ${storageUser.password.substring(0, 30)}...`);
      }
      
      // Verificar todos os campos
      console.log('\n   📋 Todos os campos do utilizador via storage:');
      const storageUserObj = typeof storageUser.toObject === 'function' ? storageUser.toObject() : storageUser;
      Object.keys(storageUserObj).forEach(key => {
        const value = storageUserObj[key as keyof typeof storageUserObj];
        console.log(`      ${key}: ${typeof value} = ${value}`);
      });
      
    } else {
      console.log('❌ Utilizador NÃO encontrado via storage');
    }
    
    // 3. Comparar os resultados
    console.log('\n3️⃣ Comparação dos resultados:');
    
    if (directUser && storageUser) {
      console.log('✅ Ambos encontraram o utilizador');
      
      const directHasPassword = directUser.password && directUser.password.length > 0;
      const storageHasPassword = storageUser.password && storageUser.password.length > 0;
      
      console.log(`   - Mongoose tem password: ${directHasPassword}`);
      console.log(`   - Storage tem password: ${storageHasPassword}`);
      
      if (directHasPassword !== storageHasPassword) {
        console.log('⚠️  DISCREPÂNCIA DETECTADA!');
        console.log(`   - Password via Mongoose: "${directUser.password}"`);
        console.log(`   - Password via Storage: "${storageUser.password}"`);
      } else if (directHasPassword && storageHasPassword) {
        const passwordsMatch = directUser.password === storageUser.password;
        console.log(`   - Passwords coincidem: ${passwordsMatch}`);
        if (!passwordsMatch) {
          console.log('⚠️  PASSWORDS DIFERENTES!');
        }
      }
    }
    
    // 4. Verificar outros utilizadores
    console.log('\n4️⃣ Verificando outros utilizadores:');
    
    const otherEmails = [
      'joao.silva@clinica.ao',
      'maria.santos@clinica.ao',
      'ana.funcionaria@clinica.ao'
    ];
    
    for (const email of otherEmails) {
      console.log(`\n📧 ${email}:`);
      
      const directOther = await User.findOne({ email }).exec();
      const storageOther = await storage.getUserByEmail(email);
      
      const directHasPass = directOther?.password && directOther.password.length > 0;
      const storageHasPass = storageOther?.password && storageOther.password.length > 0;
      
      console.log(`   - Mongoose: ${directOther ? 'encontrado' : 'não encontrado'} | Password: ${directHasPass ? 'SIM' : 'NÃO'}`);
      console.log(`   - Storage: ${storageOther ? 'encontrado' : 'não encontrado'} | Password: ${storageHasPass ? 'SIM' : 'NÃO'}`);
      
      if (directHasPass !== storageHasPass) {
        console.log('   ⚠️  DISCREPÂNCIA!');
      }
    }
    
    // 5. Verificar schema do modelo
    console.log('\n5️⃣ Verificando schema:');
    const schema = User.schema;
    const paths = schema.paths;
    
    console.log('   📋 Campos definidos no schema:');
    Object.keys(paths).forEach(path => {
      if (['password', 'mustChangePassword', 'passwordResetToken'].includes(path)) {
        console.log(`      ✅ ${path}: ${paths[path].instance}`);
      }
    });
    
  } catch (error) {
    console.error('❌ ERRO CRÍTICO:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Conexão com a base de dados fechada.');
    process.exit(0);
  }
}

// Executar debug
debugStorage();

export { debugStorage };