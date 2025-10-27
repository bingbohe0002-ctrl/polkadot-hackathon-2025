import mysql from 'mysql2/promise';

// 从环境变量加载配置（推荐使用环境变量存储数据库连接信息）
const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'test',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// 测试连接函数
(async () => {
    try {
      const connection = await pool.getConnection();
      console.log('✅ Database connection successful!');
      connection.release(); // 释放连接回连接池
    } catch (error) {
      console.error('❌ Database connection failed:', error.message);
    }
  })();

export default pool;
