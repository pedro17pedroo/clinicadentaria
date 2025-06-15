import bcrypt from 'bcrypt';
import { connectDB } from './db.js';
import { storage } from './storage.js';
import mongoose from 'mongoose';
import { z } from 'zod';

/**
 * Script que simula exactamente o processo de login
 */

// Schema de validação (igual ao usado no authRoutes)
const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Password é obrigatório')
});

async function simulateLogin() {
  try {
    console.log('🔗 Conectando à base de dados...');
    await connectDB();
    
    console.log('\n🎭 SIMULAÇÃO DO PROCESSO DE LOGIN');
    console.log('==================================');
    
    // Dados de entrada (igual ao que vem do frontend)
    const requestBody = {
      email: 'admin@clinica.ao',
      password: 'admin123'
    };
    
    console.log(`📧 Email recebido: "${requestBody.email}"`);
    console.log(`🔑 Password recebida: "${requestBody.password}"`);
    
    // Passo 1: Validação do schema
    console.log('\n1️⃣ Validação do schema...');
    try {
      const { email, password } = loginSchema.parse(requestBody);
      console.log('✅ Schema válido');
      console.log(`   - Email validado: "${email}"`);
      console.log(`   - Password validada: "${password}"`);
      
      // Passo 2: Buscar utilizador
      console.log('\n2️⃣ Buscando utilizador...');
      const user = await storage.getUserByEmail(email);
      
      if (!user) {
        console.log('❌ Utilizador não encontrado!');
        return;
      }
      
      console.log('✅ Utilizador encontrado:');
      console.log(`   - ID: ${user._id}`);
      console.log(`   - Email: ${user.email}`);
      console.log(`   - Tipo: ${user.userType}`);
      console.log(`   - Password existe: ${user.password ? 'SIM' : 'NÃO'}`);
      console.log(`   - Password é string: ${typeof user.password === 'string'}`);
      console.log(`   - Password length: ${user.password ? user.password.length : 0}`);
      console.log(`   - Password truthy: ${!!user.password}`);
      console.log(`   - Password === null: ${user.password === null}`);
      console.log(`   - Password === undefined: ${user.password === undefined}`);
      console.log(`   - Password === '': ${user.password === ''}`);
      
      if (user.password) {
        console.log(`   - Password hash (primeiros 20 chars): ${user.password.substring(0, 20)}...`);
      }
      
      // Passo 3: Verificar password (EXACTAMENTE como no código)
      console.log('\n3️⃣ Verificando password...');
      
      // Esta é a verificação EXACTA do código original
      if (!user.password) {
        console.log('❌ FALHA: !user.password é true');
        console.log('   Retornaria: "Utilizador não tem password definida. Use login OAuth."');
        return;
      }
      
      console.log('✅ user.password existe, prosseguindo para bcrypt.compare...');
      
      // Passo 4: Comparar password com bcrypt
      console.log('\n4️⃣ Comparando password com bcrypt...');
      console.log(`   - Password fornecida: "${password}"`);
      console.log(`   - Hash armazenado: "${user.password}"`);
      
      const isValidPassword = await bcrypt.compare(password, user.password);
      console.log(`   - Resultado bcrypt.compare: ${isValidPassword}`);
      
      if (!isValidPassword) {
        console.log('❌ FALHA: Password incorrecta');
        console.log('   Retornaria: "Credenciais inválidas"');
        
        // Testar com outras passwords
        console.log('\n🔄 Testando outras passwords...');
        const testPasswords = ['password123', 'admin', '123456', 'admin123'];
        
        for (const testPwd of testPasswords) {
          const testResult = await bcrypt.compare(testPwd, user.password);
          console.log(`      "${testPwd}": ${testResult ? '✅ CORRECTA' : '❌ incorrecta'}`);
        }
        
        return;
      }
      
      console.log('✅ Password correcta!');
      
      // Passo 5: Gerar token (simulado)
      console.log('\n5️⃣ Gerando token...');
      console.log('✅ Token seria gerado com sucesso');
      console.log('✅ LOGIN BEM-SUCEDIDO!');
      
    } catch (validationError) {
      console.log('❌ Erro de validação do schema:', validationError);
    }
    
    // Testar outros utilizadores
    console.log('\n🔄 TESTANDO OUTROS UTILIZADORES');
    console.log('================================');
    
    const otherUsers = [
      { email: 'joao.silva@clinica.ao', password: 'medico123' },
      { email: 'maria.santos@clinica.ao', password: 'medica123' },
      { email: 'ana.funcionaria@clinica.ao', password: 'funcionaria123' }
    ];
    
    for (const testUser of otherUsers) {
      console.log(`\n📧 Testando: ${testUser.email}`);
      
      try {
        const { email, password } = loginSchema.parse(testUser);
        const user = await storage.getUserByEmail(email);
        
        if (!user) {
          console.log('   ❌ Utilizador não encontrado');
          continue;
        }
        
        if (!user.password) {
          console.log('   ❌ Sem password');
          continue;
        }
        
        const isValid = await bcrypt.compare(password, user.password);
        console.log(`   ${isValid ? '✅ Sucesso' : '❌ Falha'}`);
        
      } catch (error) {
        console.log(`   ❌ Erro: ${error}`);
      }
    }
    
  } catch (error) {
    console.error('❌ ERRO CRÍTICO:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Conexão com a base de dados fechada.');
    process.exit(0);
  }
}

// Executar simulação
simulateLogin();

export { simulateLogin };