import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const [students, instructors, workouts, todaySessions] = await Promise.all([
    prisma.student.count(),
    prisma.instructor.count(),
    prisma.workoutPlan.count(), // se não usar treinos, pode remover
    prisma.classSession.count({
      where: {
        date: {
          gte: new Date(new Date().toDateString()),
          lt: new Date(new Date().toDateString() + " 23:59:59"),
        },
      },
    }),
  ]);

  return NextResponse.json({
    students,
    instructors,
    workouts,
    todaySessions,
  });
}
