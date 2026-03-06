const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    const urls = await prisma.url.findMany({
        orderBy: { created_at: 'desc' },
        take: 5
    });
    console.log(JSON.stringify(urls, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
