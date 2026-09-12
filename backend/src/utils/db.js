import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const validDbUrl = "postgresql://postgres.qmdlhmlrdhvpkakdplrv:karketodekhomeesho@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true";

let dbUrl = process.env.DATABASE_URL;
if (!dbUrl || !dbUrl.includes('karketodekhomeesho')) {
  dbUrl = validDbUrl;
}

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: dbUrl,
    },
  },
});

export default prisma;

