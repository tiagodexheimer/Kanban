import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({ include: { ownedProjects: true, memberProjects: true } });
  console.log("Users and their projects:", JSON.stringify(users, null, 2));
  
  const projects = await prisma.project.findMany();
  console.log("Total projects:", projects.length);
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
