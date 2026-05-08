require('dotenv').config();
const { PrismaClient } = require("@prisma/client");
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const board = await prisma.board.create({
    data: {
      title: "Meu Primeiro Board",
      description: "Bem-vindo ao seu Kanban Pessoal!",
      columns: {
        create: [
          {
            title: "To Do",
            position: 1,
            cards: {
              create: [
                { title: "Configurar Banco de Dados", position: 1, priority: "High", tags: ["Backend"] },
                { title: "Criar API Routes", position: 2, priority: "Medium", tags: ["API"] },
              ],
            },
          },
          {
            title: "Doing",
            position: 2,
            cards: {
              create: [
                { title: "Integrar Prisma", position: 1, priority: "High", tags: ["Prisma"] },
              ],
            },
          },
          {
            title: "Done",
            position: 3,
          },
        ],
      },
    },
  });

  console.log({ board });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
