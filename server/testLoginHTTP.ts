// Usando fetch nativo do Node.js (disponível a partir da versão 18)

/**
 * Script para testar o login via HTTP
 */

async function testLoginHTTP() {
  try {
    console.log('🌐 TESTE DE LOGIN VIA HTTP');
    console.log('===========================');
    
    const baseUrl = 'http://localhost:3000';
    const loginData = {
      email: 'admin@clinica.ao',
      password: 'admin123'
    };
    
    console.log(`📧 Email: ${loginData.email}`);
    console.log(`🔑 Password: ${loginData.password}`);
    console.log(`🌐 URL: ${baseUrl}/api/auth/login`);
    
    console.log('\n📤 Enviando pedido de login...');
    
    const response = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(loginData),
    });
    
    console.log(`📥 Status: ${response.status} ${response.statusText}`);
    console.log(`📋 Headers:`);
    response.headers.forEach((value, key) => {
      console.log(`   ${key}: ${value}`);
    });
    
    const responseText = await response.text();
    console.log(`\n📄 Resposta:`);
    console.log(responseText);
    
    if (response.ok) {
      try {
        const data = JSON.parse(responseText);
        console.log('\n✅ LOGIN BEM-SUCEDIDO!');
        console.log(`🎫 Token: ${data.token ? data.token.substring(0, 20) + '...' : 'N/A'}`);
        console.log(`👤 Utilizador: ${data.user ? data.user.email : 'N/A'}`);
        console.log(`🏷️  Tipo: ${data.user ? data.user.userType : 'N/A'}`);
      } catch (parseError) {
        console.log('⚠️  Resposta não é JSON válido');
      }
    } else {
      console.log('❌ LOGIN FALHADO!');
      try {
        const errorData = JSON.parse(responseText);
        console.log(`💬 Mensagem: ${errorData.message || 'Erro desconhecido'}`);
      } catch (parseError) {
        console.log('⚠️  Resposta de erro não é JSON válido');
      }
    }
    
    // Testar outros utilizadores
    console.log('\n🔄 TESTANDO OUTROS UTILIZADORES');
    console.log('================================');
    
    const otherUsers = [
      { email: 'joao.silva@clinica.ao', password: 'medico123' },
      { email: 'maria.santos@clinica.ao', password: 'medica123' },
      { email: 'ana.funcionaria@clinica.ao', password: 'funcionaria123' }
    ];
    
    for (const user of otherUsers) {
      console.log(`\n📧 Testando: ${user.email}`);
      
      try {
        const testResponse = await fetch(`${baseUrl}/api/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(user),
        });
        
        const testResponseText = await testResponse.text();
        
        if (testResponse.ok) {
          console.log(`   ✅ Sucesso (${testResponse.status})`);
        } else {
          console.log(`   ❌ Falha (${testResponse.status})`);
          try {
            const errorData = JSON.parse(testResponseText);
            console.log(`   💬 ${errorData.message}`);
          } catch {
            console.log(`   💬 ${testResponseText}`);
          }
        }
      } catch (error: any) {
        console.log(`   ❌ Erro de rede: ${error.message}`);
      }
    }
    
    // Testar endpoint de verificação de utilizador
    console.log('\n🔍 TESTANDO ENDPOINT /api/auth/user');
    console.log('====================================');
    
    try {
      const userResponse = await fetch(`${baseUrl}/api/auth/user`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      console.log(`📥 Status: ${userResponse.status} ${userResponse.statusText}`);
      const userResponseText = await userResponse.text();
      console.log(`📄 Resposta: ${userResponseText}`);
      
    } catch (error: any) {
      console.log(`❌ Erro: ${error.message}`);
    }
    
  } catch (error: any) {
    console.error('❌ ERRO CRÍTICO:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Executar teste
testLoginHTTP();

export { testLoginHTTP };