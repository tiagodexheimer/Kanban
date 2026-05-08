require('dotenv').config();
const { PrismaClient } = require("@prisma/client");
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function clean() {
  const deleted = await prisma.board.deleteMany({
    where: {
      title: "teste"
    }
  });
  console.log(`Deletados ${deleted.count} boards vazios.`);
}

clean().finally(() => prisma.$disconnect());
