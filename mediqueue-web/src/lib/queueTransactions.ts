import { prisma } from "./prisma";

type GenerateTokenInput = {
  departmentCode: string;
  patientName: string;
  patientPhone: string;
  isPriority?: boolean;
};

export async function generateTokenWithTransaction(
  input: GenerateTokenInput,
) {
  const { departmentCode, patientName, patientPhone, isPriority = false } =
    input;

  const result = await prisma.$transaction(async (tx) => {
    const department = await tx.department.findUniqueOrThrow({
      where: { code: departmentCode },
    });

    const today = new Date();
    const startOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    );

    const queue = await tx.queue.upsert({
      where: {
        departmentId_date: {
          departmentId: department.id,
          date: startOfDay,
        },
      },
      update: {},
      create: {
        departmentId: department.id,
        date: startOfDay,
      },
    });

    const nextSequence = queue.currentTokenNumber + 1;

    const counter = await tx.counter.findFirstOrThrow({
      where: {
        departmentId: department.id,
        isActive: true,
      },
      orderBy: { counterNumber: "asc" },
    });

    const tokenNumber = `${department.code}-${counter.counterCode}-${String(
      nextSequence,
    ).padStart(3, "0")}`;

    const token = await tx.token.create({
      data: {
        queueId: queue.id,
        counterId: counter.id,
        tokenNumber,
        tokenSequence: nextSequence,
        patientName,
        patientPhone,
        isPriority,
      },
    });

    await tx.queue.update({
      where: { id: queue.id },
      data: { currentTokenNumber: nextSequence },
    });

    return { department, queue, counter, token };
  });

  return result;
}

export async function safelyCallNextToken(queueId: string, counterId: string) {
  try {
    const result = await prisma.$transaction(async (tx) => {
      const queue = await tx.queue.findUniqueOrThrow({
        where: { id: queueId },
      });

      if (queue.isPaused) {
        throw new Error("Queue is currently paused");
      }

      const currentServing = await tx.token.findFirst({
        where: {
          queueId,
          counterId,
          status: "SERVING",
        },
      });

      if (currentServing) {
        await tx.token.update({
          where: { id: currentServing.id },
          data: { status: "SERVED", servedAt: new Date() },
        });
      }

      const nextToken = await tx.token.findFirst({
        where: {
          queueId,
          status: "WAITING",
        },
        orderBy: [
          { isPriority: "desc" },
          { tokenSequence: "asc" },
        ],
      });

      if (!nextToken) {
        return { nextToken: null };
      }

      const updatedToken = await tx.token.update({
        where: { id: nextToken.id },
        data: {
          status: "SERVING",
          servingAt: new Date(),
          counterId,
        },
      });

      return { nextToken: updatedToken };
    });

    return result;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Transaction failed. Rolling back.", error);
    throw error;
  }
}

