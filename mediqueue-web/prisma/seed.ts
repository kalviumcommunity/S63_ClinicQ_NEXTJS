import { PrismaClient } from "../src/generated/prisma";

const prisma = new PrismaClient();

async function main() {
  // Seed a couple of departments
  const opd = await prisma.department.upsert({
    where: { code: "OPD" },
    update: {},
    create: {
      name: "Outpatient Department",
      code: "OPD",
      avgServiceTimeMinutes: 15,
    },
  });

  const xray = await prisma.department.upsert({
    where: { code: "XRAY" },
    update: {},
    create: {
      name: "Radiology / X-Ray",
      code: "XRAY",
      avgServiceTimeMinutes: 10,
    },
  });

  // Seed one counter per department
  await prisma.counter.upsert({
    where: { departmentId_counterNumber: { departmentId: opd.id, counterNumber: 1 } },
    update: {},
    create: {
      departmentId: opd.id,
      counterNumber: 1,
      counterCode: "A",
    },
  });

  await prisma.counter.upsert({
    where: { departmentId_counterNumber: { departmentId: xray.id, counterNumber: 1 } },
    update: {},
    create: {
      departmentId: xray.id,
      counterNumber: 1,
      counterCode: "B",
    },
  });

  // Seed a sample staff user
  await prisma.staff.upsert({
    where: { email: "operator@mediqueue.local" },
    update: {},
    create: {
      name: "Default Operator",
      email: "operator@mediqueue.local",
      passwordHash: "placeholder-hash",
      role: "operator",
      departmentId: opd.id,
    },
  });

  // No initial tokens/queues; those will be created by the app flows.
  // This seed is idempotent thanks to upsert usage.
  console.log("Prisma seed data inserted successfully");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

