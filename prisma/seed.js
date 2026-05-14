/* eslint-disable @typescript-eslint/no-require-imports */
require('dotenv').config();
const { PrismaClient } = require("@prisma/client");
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  // Limpa o banco para evitar duplicatas se rodar de novo
  await prisma.checklistItem.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.card.deleteMany();
  await prisma.column.deleteMany();
  await prisma.board.deleteMany();

  const board = await prisma.board.create({
    data: {
      title: "Meu Primeiro Board",
      description: "Bem-vindo ao seu OmniTask!",
      columns: {
        create: [
          {
            title: "A Fazer",
            position: 1,
            cards: {
              create: [
                { 
                  title: "Explorar novas funções", 
                  position: 1, 
                  priority: "High",
                  checklists: {
                    create: [
                      { text: "Testar Checklists", position: 1 },
                      { text: "Criar uma Tag", position: 2 }
                    ]
                  }
                },
                { title: "Personalizar Cores", position: 2, priority: "Medium" },
              ],
            },
          },
          {
            title: "Em Execução",
            position: 2,
          },
          {
            title: "Concluído",
            position: 3,
          },
        ],
      },
    },
  });

  console.log("Banco de dados populado com sucesso!", { boardId: board.id });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
