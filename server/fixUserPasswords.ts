import bcrypt from 'bcrypt';
import { connectDB } from './db.js';
import { User } from '../shared/schema.js';
import mongoose from 'mongoose';

/**
 * Script de diagnóstico e correção de passwords
 * Este script verifica o estado real da base de dados e corrige o problema
 */

async function diagnoseAndFixPasswords() {
  try {
    console.log('🔗 Conectando à base de dados...');
    await connectDB();
    
    console.log('\n🔍 DIAGNÓSTICO COMPLETO DA BASE DE DADOS');
    console.log('==========================================');
    
    // 1. Verificar todos os utilizadores
    const allUsers = await User.find({});
    console.log(`📊 Total de utilizadores na base de dados: ${allUsers.length}`);
    
    if (allUsers.length === 0) {
      console.log('❌ Nenhum utilizador encontrado na base de dados!');
      return;
    }
    
    // 2. Analisar estado das passwords
    let usersWithPassword = 0;
    let usersWithoutPassword = 0;
    let usersWithEmptyPassword = 0;
    
    console.log('\n📋 ANÁLISE DETALHADA DOS UTILIZADORES:');
    console.log('=====================================');
    
    for (const user of allUsers) {
      const hasPassword = user.password && user.password.length > 0;
      const passwordStatus = hasPassword ? '✅ TEM PASSWORD' : '❌ SEM PASSWORD';
      
      console.log(`• ${user.email} | ${user.userType || 'N/A'} | ${passwordStatus}`);
      
      if (hasPassword) {
        usersWithPassword++;
      } else {
        if (user.password === '') {
          usersWithEmptyPassword++;
        } else {
          usersWithoutPassword++;
        }
      }
    }
    
    console.log('\n📊 RESUMO DO DIAGNÓSTICO:');
    console.log('=========================');
    console.log(`✅ Utilizadores com password: ${usersWithPassword}`);
    console.log(`❌ Utilizadores sem password: ${usersWithoutPassword}`);
    console.log(`⚠️  Utilizadores com password vazia: ${usersWithEmptyPassword}`);
    
    const problemUsers = usersWithoutPassword + usersWithEmptyPassword;
    
    if (problemUsers === 0) {
      console.log('\n🎉 TODOS OS UTILIZADORES JÁ TÊM PASSWORD!');
      console.log('Não é necessária nenhuma correção.');
      return;
    }
    
    console.log(`\n🔧 INICIANDO CORREÇÃO DE ${problemUsers} UTILIZADORES...`);
    console.log('================================================');
    
    // 3. Definir passwords para utilizadores específicos
    const passwordMappings = new Map([
      ['admin@clinica.ao', { password: 'admin123', userType: 'admin', mustChange: false }],
      ['joao.silva@clinica.ao', { password: 'medico123', userType: 'doctor', mustChange: true }],
      ['maria.santos@clinica.ao', { password: 'medica123', userType: 'doctor', mustChange: false }],
      ['ana.funcionaria@clinica.ao', { password: 'funcionaria123', userType: 'employee', mustChange: true }],
      ['carlos.recepcao@clinica.ao', { password: 'recepcao123', userType: 'employee', mustChange: false }],
      ['pedro.dentista@clinica.ao', { password: 'dentista123', userType: 'doctor', mustChange: false }],
      ['admin.teste@clinica.ao', { password: 'teste123', userType: 'admin', mustChange: true }]
    ]);
    
    // 4. Corrigir utilizadores sem password
    let correctedCount = 0;
    
    for (const user of allUsers) {
      const hasPassword = user.password && user.password.length > 0;
      
      if (!hasPassword) {
        try {
          const mapping = passwordMappings.get(user.email);
          
          let passwordToSet = 'defaultPassword123';
          let userTypeToSet = user.userType || 'employee';
          let mustChangePassword = true;
          
          if (mapping) {
            passwordToSet = mapping.password;
            userTypeToSet = mapping.userType;
            mustChangePassword = mapping.mustChange;
          }
          
          // Hash da password
          const saltRounds = 10;
          const hashedPassword = await bcrypt.hash(passwordToSet, saltRounds);
          
          // Actualizar na base de dados
          const updateResult = await User.updateOne(
            { _id: user._id },
            {
              $set: {
                password: hashedPassword,
                userType: userTypeToSet,
                mustChangePassword: mustChangePassword,
                updatedAt: new Date()
              }
            }
          );
          
          if (updateResult.modifiedCount > 0) {
            console.log(`✅ CORRIGIDO: ${user.email} | Password: ${passwordToSet} | Tipo: ${userTypeToSet}`);
            if (mustChangePassword) {
              console.log(`   ⚠️  Deve alterar password no primeiro login`);
            }
            correctedCount++;
          } else {
            console.log(`❌ FALHA: Não foi possível actualizar ${user.email}`);
          }
          
        } catch (error: any) {
          console.error(`❌ ERRO ao corrigir ${user.email}:`, error.message);
        }
      }
    }
    
    console.log('\n🔍 VERIFICAÇÃO FINAL:');
    console.log('=====================');
    
    // 5. Verificar se a correção funcionou
    const updatedUsers = await User.find({});
    let finalUsersWithPassword = 0;
    let finalUsersWithoutPassword = 0;
    
    for (const user of updatedUsers) {
      const hasPassword = user.password && user.password.length > 0;
      if (hasPassword) {
        finalUsersWithPassword++;
      } else {
        finalUsersWithoutPassword++;
        console.log(`❌ AINDA SEM PASSWORD: ${user.email}`);
      }
    }
    
    console.log(`✅ Utilizadores com password: ${finalUsersWithPassword}`);
    console.log(`❌ Utilizadores ainda sem password: ${finalUsersWithoutPassword}`);
    console.log(`🔧 Utilizadores corrigidos nesta execução: ${correctedCount}`);
    
    if (finalUsersWithoutPassword === 0) {
      console.log('\n🎉 SUCESSO! TODOS OS UTILIZADORES AGORA TÊM PASSWORD!');
      console.log('\n🔐 CREDENCIAIS PARA TESTE:');
      console.log('===========================');
      
      passwordMappings.forEach((config, email) => {
        const changeFlag = config.mustChange ? ' (Deve alterar password)' : '';
        console.log(`Email: ${email} | Password: ${config.password} | Tipo: ${config.userType}${changeFlag}`);
      });
      
      console.log('\n🌐 Acesse http://localhost:3000 para testar o login');
    } else {
      console.log('\n⚠️  ATENÇÃO: Ainda existem utilizadores sem password!');
    }
    
  } catch (error) {
    console.error('❌ ERRO CRÍTICO:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Conexão com a base de dados fechada.');
    process.exit(0);
  }
}

// Executar diagnóstico e correção
diagnoseAndFixPasswords();

export { diagnoseAndFixPasswords };