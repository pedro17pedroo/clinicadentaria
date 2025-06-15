import bcrypt from 'bcrypt';
import { connectDB } from './db.js';
import { User } from '../shared/schema.js';

/**
 * Script para adicionar passwords a utilizadores existentes que não têm password
 * Este script actualiza todos os utilizadores na base de dados
 */

interface UserPasswordUpdate {
  email: string;
  password: string;
  userType?: 'admin' | 'employee' | 'doctor';
  mustChangePassword?: boolean;
}

// Passwords padrão para utilizadores existentes
const defaultPasswords: UserPasswordUpdate[] = [
  {
    email: 'admin@clinica.ao',
    password: 'admin123',
    userType: 'admin',
    mustChangePassword: false
  },
  {
    email: 'joao.silva@clinica.ao',
    password: 'medico123',
    userType: 'doctor',
    mustChangePassword: true
  },
  {
    email: 'maria.santos@clinica.ao',
    password: 'medica123',
    userType: 'doctor',
    mustChangePassword: false
  },
  {
    email: 'ana.funcionaria@clinica.ao',
    password: 'funcionaria123',
    userType: 'employee',
    mustChangePassword: true
  },
  {
    email: 'carlos.recepcao@clinica.ao',
    password: 'recepcao123',
    userType: 'employee',
    mustChangePassword: false
  },
  {
    email: 'pedro.dentista@clinica.ao',
    password: 'dentista123',
    userType: 'doctor',
    mustChangePassword: false
  },
  {
    email: 'admin.teste@clinica.ao',
    password: 'teste123',
    userType: 'admin',
    mustChangePassword: true
  }
];

async function addPasswordsToUsers() {
  try {
    console.log('🔗 Conectando à base de dados...');
    await connectDB();
    
    console.log('🔍 Verificando utilizadores sem password...');
    
    // Buscar todos os utilizadores sem password
    const usersWithoutPassword = await User.find({
      $or: [
        { password: { $exists: false } },
        { password: null },
        { password: '' }
      ]
    });
    
    console.log(`📊 Encontrados ${usersWithoutPassword.length} utilizadores sem password`);
    
    if (usersWithoutPassword.length === 0) {
      console.log('✅ Todos os utilizadores já têm password definida!');
      return;
    }
    
    console.log('🔐 Adicionando passwords aos utilizadores...');
    
    for (const user of usersWithoutPassword) {
      try {
        // Procurar password padrão para este utilizador
        const defaultPassword = defaultPasswords.find(dp => dp.email === user.email);
        
        let passwordToUse = 'password123'; // Password padrão genérica
        let userTypeToUse = user.userType || 'employee';
        let mustChangePassword = true;
        
        if (defaultPassword) {
          passwordToUse = defaultPassword.password;
          userTypeToUse = defaultPassword.userType || user.userType || 'employee';
          mustChangePassword = defaultPassword.mustChangePassword ?? true;
        }
        
        // Hash da password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(passwordToUse, saltRounds);
        
        // Actualizar utilizador
        await User.updateOne(
          { _id: user._id },
          {
            $set: {
              password: hashedPassword,
              userType: userTypeToUse,
              mustChangePassword: mustChangePassword,
              updatedAt: new Date()
            }
          }
        );
        
        console.log(`✅ Password adicionada: ${user.email} | Password: ${passwordToUse} | Tipo: ${userTypeToUse}`);
        if (mustChangePassword) {
          console.log(`   ⚠️  Deve alterar password no primeiro login`);
        }
        
      } catch (error: any) {
        console.error(`❌ Erro ao actualizar utilizador ${user.email}:`, error.message);
      }
    }
    
    console.log('\n📋 Resumo final dos utilizadores:');
    console.log('==================================');
    
    const allUsers = await User.find({}).select('name email userType mustChangePassword');
    
    allUsers.forEach(user => {
      const changePasswordFlag = user.mustChangePassword ? ' (Deve alterar password)' : '';
      console.log(`• ${user.name || user.email} - ${user.email} - ${user.userType?.toUpperCase()}${changePasswordFlag}`);
    });
    
    console.log('\n🔐 Credenciais para teste:');
    console.log('===========================');
    defaultPasswords.forEach(dp => {
      const changePasswordFlag = dp.mustChangePassword ? ' (Deve alterar password)' : '';
      console.log(`Email: ${dp.email} | Password: ${dp.password} | Tipo: ${dp.userType}${changePasswordFlag}`);
    });
    
    console.log('\n✅ Script executado com sucesso!');
    console.log('🌐 Acesse http://localhost:3000 para testar o login');
    
  } catch (error) {
    console.error('❌ Erro ao executar script:', error);
  } finally {
    // Fechar conexão
    process.exit(0);
  }
}

// Executar script
addPasswordsToUsers();

export { addPasswordsToUsers };