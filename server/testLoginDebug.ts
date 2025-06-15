import { connectDB } from './db';
import { storage } from './storage';
import bcrypt from 'bcrypt';

async function testLoginDebug() {
  console.log('🔍 Testando login debug...');
  
  // Conectar à base de dados
  console.log('🔌 Conectando à base de dados...');
  await connectDB();
  console.log('✅ Conexão estabelecida!');
  
  // Aguardar um pouco para garantir que a conexão está estável
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const testCredentials = [
    { email: 'joao.silva@clinica.ao', password: 'password123' },
    { email: 'maria.santos@clinica.ao', password: 'password123' },
    { email: 'ana.funcionaria@clinica.ao', password: 'password123' },
    { email: 'admin@clinica.ao', password: 'admin123' }
  ];
  
  for (const { email, password } of testCredentials) {
    console.log(`\n📧 Testando: ${email}`);
    
    try {
      // 1. Buscar utilizador
      console.log('1️⃣ Buscando utilizador...');
      const user = await storage.getUserByEmail(email);
      
      if (!user) {
        console.log('❌ Utilizador não encontrado');
        continue;
      }
      
      console.log('✅ Utilizador encontrado:', {
        id: user._id,
        email: user.email,
        name: user.name,
        hasPassword: !!user.password,
        passwordLength: user.password ? user.password.length : 0
      });
      
      // 2. Verificar se tem password
      console.log('2️⃣ Verificando password...');
      if (!user.password) {
        console.log('❌ Utilizador não tem password definida');
        continue;
      }
      
      console.log('✅ Password existe, comprimento:', user.password.length);
      
      // 3. Comparar password
      console.log('3️⃣ Comparando password...');
      const isValidPassword = await bcrypt.compare(password, user.password);
      
      if (isValidPassword) {
        console.log('✅ Password válida - LOGIN SUCESSO');
      } else {
        console.log('❌ Password inválida');
        
        // Debug adicional - testar com hash direto
        console.log('🔍 Debug adicional:');
        console.log('Password fornecida:', password);
        console.log('Hash armazenado:', user.password.substring(0, 20) + '...');
        
        // Testar se o hash está correto
        const testHash = await bcrypt.hash(password, 10);
        console.log('Novo hash de teste:', testHash.substring(0, 20) + '...');
        
        const testCompare = await bcrypt.compare(password, testHash);
        console.log('Comparação com novo hash:', testCompare);
      }
      
    } catch (error) {
      console.error('❌ Erro durante teste:', error);
    }
  }
  
  process.exit(0);
}

testLoginDebug().catch(console.error);