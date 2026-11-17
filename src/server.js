const { Pool } = require('pg');
const { criarApp } = require('./app');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 5432),
  user: process.env.DB_USER || 'estulanches',
  password: process.env.DB_PASSWORD || 'estulanches',
  database: process.env.DB_NAME || 'estulanches',
});

const PORT = Number(process.env.PORT || 3000);

async function aguardarBanco(tentativas = 10) {
  for (let i = 1; i <= tentativas; i++) {
    try {
      await pool.query('SELECT 1');
      console.log('[INFO] Conexão com o banco estabelecida');
      return;
    } catch (e) {
      console.log(`[INFO] Aguardando banco (${i}/${tentativas}): ${e.message}`);
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
  throw new Error('Não foi possível conectar ao banco');
}

(async () => {
  await aguardarBanco();
  const server = criarApp(pool).listen(PORT, () =>
    console.log(`[INFO] EstuLanches v${process.env.APP_VERSION || '1.0.0'} escutando na porta ${PORT}`)
  );
  const parar = () => server.close(() => pool.end().then(() => process.exit(0)));
  process.on('SIGTERM', parar);
  process.on('SIGINT', parar);
})().catch((e) => {
  console.error('[FATAL]', e.message);
  process.exit(1);
});
