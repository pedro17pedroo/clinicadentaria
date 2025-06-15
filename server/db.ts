import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

/**
 * Configuração da conexão MongoDB
 * Utiliza Mongoose para gestão da base de dados
 */

// Verificar se a URL da base de dados está definida
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL deve estar definida. Certifique-se de que a base de dados MongoDB está configurada."
  );
}

/**
 * Conectar à base de dados MongoDB
 * @returns Promise<void>
 */
export const connectDB = async (): Promise<void> => {
  try {
    // Configurações de conexão simplificadas
    const connectionOptions = {
      // Configurações básicas
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    // Conectar ao MongoDB
    await mongoose.connect(process.env.DATABASE_URL!, connectionOptions);
    
    console.log('✅ MongoDB conectado com sucesso!');
    console.log(`📊 Base de dados: ${mongoose.connection.name}`);
    console.log(`🌐 Host: ${mongoose.connection.host}:${mongoose.connection.port}`);
    
  } catch (error) {
    console.error('❌ Erro na conexão MongoDB:', error);
    
    // Em ambiente de desenvolvimento, mostrar mais detalhes
    if (process.env.NODE_ENV === 'development') {
      console.error('Detalhes do erro:', {
        message: error instanceof Error ? error.message : 'Erro desconhecido',
        stack: error instanceof Error ? error.stack : undefined
      });
    }
    
    // Terminar o processo em caso de erro crítico
    process.exit(1);
  }
};

/**
 * Desconectar da base de dados MongoDB
 * Útil para testes e shutdown graceful
 */
export const disconnectDB = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
    console.log('🔌 MongoDB desconectado com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao desconectar MongoDB:', error);
  }
};

/**
 * Verificar o estado da conexão
 * @returns boolean - true se conectado, false caso contrário
 */
export const isConnected = (): boolean => {
  return mongoose.connection.readyState === 1;
};

/**
 * Obter informações da conexão atual
 * @returns objeto com informações da conexão
 */
export const getConnectionInfo = () => {
  const connection = mongoose.connection;
  return {
    readyState: connection.readyState,
    host: connection.host,
    port: connection.port,
    name: connection.name,
    collections: Object.keys(connection.collections)
  };
};

/**
 * Event listeners para monitorização da conexão
 */
mongoose.connection.on('connected', () => {
  console.log('🔗 Mongoose conectado ao MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ Erro de conexão Mongoose:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('🔌 Mongoose desconectado do MongoDB');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Recebido SIGINT. Encerrando conexões...');
  await disconnectDB();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Recebido SIGTERM. Encerrando conexões...');
  await disconnectDB();
  process.exit(0);
});

// Exportar a instância do mongoose para uso direto se necessário
export { mongoose };
export default mongoose;