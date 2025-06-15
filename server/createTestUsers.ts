import bcrypt from 'bcrypt';
import { connectDB } from './db.js';
import { User } from '../shared/schema.js';

/**
 * Script para criar utilizadores de teste com diferentes tipos e permissões
 * Este script cria utilizadores para testar o sistema de autenticação tradicional
 */

interface TestUser {
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  userType: 'admin' | 'employee' | 'doctor';
  mustChangePassword?: boolean;
}

const testUsers: TestUser[] = [
  {
    name: 'Administrador Principal',
    firstName: 'Administrador',
    lastName: 'Principal',
    email: 'admin@clinica.ao',
    password: 'admin123',
    userType: 'admin',
    mustChangePassword: false
  },
  {
    name: 'Dr. João Silva',
    firstName: 'João',
    lastName: 'Silva',
    email: 'joao.silva@clinica.ao',
    password: 'medico123',
    userType: 'doctor',
    mustChangePassword: true
  },
  {
    name: 'Dra. Maria Santos',
    firstName: 'Maria',
    lastName: 'Santos',
    email: 'maria.santos@clinica.ao',
    password: 'medica123',
    userType: 'doctor',
    mustChangePassword: false
  },
  {
    name: 'Ana Funcionária',
    firstName: 'Ana',
    lastName: 'Funcionária',
    email: 'ana.funcionaria@clinica.ao',
    password: 'funcionaria123',
    userType: 'employee',
    mustChangePassword: true
  },
  {
    name: 'Carlos Recepcionista',
    firstName: 'Carlos',
    lastName: 'Recepcionista',
    email: 'carlos.recepcao@clinica.ao',
    password: 'recepcao123',
    userType: 'employee',
    mustChangePassword: false
  },
  {
    name: 'Dr. Pedro Dentista',
    firstName: 'Pedro',
    lastName: 'Dentista',
    email: 'pedro.dentista@clinica.ao',
    password: 'dentista123',
    userType: 'doctor',
    mustChangePassword: false
  },
  {
    name: 'Admin Teste',
    firstName: 'Admin',
    lastName: 'Teste',
    email: 'admin.teste@clinica.ao',
    password: 'teste123',
    userType: 'admin',
    mustChangePassword: true
  }
];

async function createTestUsers() {
  try {
    console.log('🔗 Conectando à base de dados...');
    await connectDB();
    
    console.log('🔄 Processando utilizadores de teste...');
    
    for (const userData of testUsers) {
      try {
        // Hash da password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(userData.password, saltRounds);
        
        // Verificar se o utilizador já existe
        const existingUser = await User.findOne({ email: userData.email });
        
        if (existingUser) {
          // Actualizar utilizador existente com password
          await User.updateOne(
            { email: userData.email },
            {
              $set: {
                firstName: userData.firstName,
                lastName: userData.lastName,
                password: hashedPassword,
                userType: userData.userType,
                mustChangePassword: userData.mustChangePassword || false,
                updatedAt: new Date()
              }
            }
          );
          
          console.log(`🔄 Utilizador actualizado: ${userData.name} (${userData.email}) - Tipo: ${userData.userType}`);
          if (userData.mustChangePassword) {
            console.log(`   ⚠️  Deve alterar password no primeiro login`);
          }
        } else {
          // Criar novo utilizador
          const userDoc: any = {
            name: userData.name,
            firstName: userData.firstName,
            lastName: userData.lastName,
            email: userData.email,
            password: hashedPassword,
            userType: userData.userType,
            mustChangePassword: userData.mustChangePassword || false,
            createdAt: new Date(),
            updatedAt: new Date()
          };
          
          // Adicionar campos específicos para médicos
          if (userData.userType === 'doctor') {
            userDoc.workingDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
            userDoc.workingHours = { start: '08:00', end: '18:00' };
            userDoc.consultationTypes = [];
            userDoc.procedureTypes = [];
            userDoc.dailySchedules = {};
          }
          
          const user = new User(userDoc);
          
          await user.save();
          
          console.log(`✅ Utilizador criado: ${userData.name} (${userData.email}) - Tipo: ${userData.userType}`);
          if (userData.mustChangePassword) {
            console.log(`   ⚠️  Deve alterar password no primeiro login`);
          }
        }
        
      } catch (error: any) {
        console.error(`❌ Erro ao processar utilizador ${userData.email}:`, error.message);
      }
    }
    
    console.log('\n📋 Resumo dos utilizadores criados:');
    console.log('=====================================');
    
    const createdUsers = await User.find({ email: { $regex: /@clinica\.ao$/ } }).select('name email userType mustChangePassword');
    
    createdUsers.forEach(user => {
      const changePasswordFlag = user.mustChangePassword ? ' (Deve alterar password)' : '';
      console.log(`• ${user.name} - ${user.email} - ${user.userType.toUpperCase()}${changePasswordFlag}`);
    });
    
    console.log('\n🔐 Credenciais para teste:');
    console.log('===========================');
    testUsers.forEach(user => {
      const changePasswordFlag = user.mustChangePassword ? ' (Deve alterar password)' : '';
      console.log(`Email: ${user.email} | Password: ${user.password} | Tipo: ${user.userType}${changePasswordFlag}`);
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
createTestUsers();

export { createTestUsers, testUsers };