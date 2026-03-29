import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export async function query(sql, params) {
  const [rows] = await pool.execute(sql, params);
  return rows;
}

export async function testConnection() {
  try {
    const conn = await pool.getConnection();
    conn.release();
    console.log('✅ MySQL connesso');
    return true;
  } catch (err) {
    console.error('❌ MySQL errore:', err.message);
    return false;
  }
}

export default pool;
