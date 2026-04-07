import { neon } from '@neondatabase/serverless';

// Neon serverless PostgreSQL client
const sql = neon(process.env.DATABASE_URL!);

export default sql;
