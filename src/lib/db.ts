import mysql from "mysql2/promise";


const {
MYSQL_HOST = "localhost",
MYSQL_PORT = "3306",
MYSQL_USER = "root",
MYSQL_PASSWORD = "paik2548",
MYSQL_DATABASE = "academia",
MYSQL_CONN_LIMIT = "10",
} = process.env;


export const pool = mysql.createPool({
host: MYSQL_HOST,
port: Number(MYSQL_PORT),
user: MYSQL_USER,
password: MYSQL_PASSWORD,
database: MYSQL_DATABASE,
waitForConnections: true,
connectionLimit: Number(MYSQL_CONN_LIMIT),
queueLimit: 0,
namedPlaceholders: true,
});


export async function query<T = any>(sql: string, params?: any): Promise<T[]> {
const [rows] = await pool.query(sql, params);
return rows as T[];
}


export async function tx<T>(fn: (conn: mysql.PoolConnection)=>Promise<T>) {
const conn = await pool.getConnection();
try {
await conn.beginTransaction();
const out = await fn(conn);
await conn.commit();
return out;
} catch (e) {
await conn.rollback();
throw e;
} finally {
conn.release();
}
}