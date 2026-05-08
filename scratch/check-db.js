require('dotenv').config();
const { PrismaClient } = require("@prisma/client");
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function check() {
  const boards = await prisma.board.findMany({
    include: {
      columns: {
        include: {
          cards: true
        }
      }
    }
  });
  console.log(JSON.stringify(boards, null, 2));
}

check().finally(() => prisma.$disconnect());
