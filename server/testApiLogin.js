// Usando fetch nativo do Node.js 18+

async function testLogin() {
  try {
    const response = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'admin@clinica.ao',
        password: 'admin123'
      })
    });

    const data = await response.json();
    console.log('Login Response:', JSON.stringify(data, null, 2));

    if (data.token) {
      console.log('\n🔑 Token obtido:', data.token);
      
      // Testar API de tipos de consulta
      const consultationTypesResponse = await fetch('http://localhost:3000/api/consultation-types', {
        headers: {
          'Authorization': `Bearer ${data.token}`
        }
      });
      
      const consultationTypes = await consultationTypesResponse.json();
      console.log('\n📋 Tipos de Consulta:', JSON.stringify(consultationTypes, null, 2));
    }
  } catch (error) {
    console.error('Erro:', error);
  }
}

testLogin();