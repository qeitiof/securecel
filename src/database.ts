import sql from 'mssql';

const config = {
  user: process.env.DB_USER || 'securecel_user',
  password: process.env.DB_PASSWORD || 'SecureCelPass2025!',
  server: process.env.DB_SERVER || 'localhost',
  database: process.env.DB_NAME || 'Securecel',
  options: {
    encrypt: true,
    trustServerCertificate: true,
  },
};

export async function connectToDatabase(): Promise<sql.ConnectionPool> {
  try {
    const pool = await sql.connect(config);
    console.log('Conectado ao banco de dados com sucesso');
    return pool;
  } catch (err) {
    console.error('Erro ao conectar ao banco de dados:', err);
    throw err;
  }
} 