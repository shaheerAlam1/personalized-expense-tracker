import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const ExpenseSchema = z.object({
  item: z.string().min(1),
  date: z.string().datetime().optional(),
  paidById: z.string().min(1),
  participantIds: z.array(z.string().min(1)).min(1),
  quantity: z.number().int().positive().default(1),
  unitAmount: z.number().int().nonnegative(),
  totalAmount: z.number().int().nonnegative().optional(),
  note: z.string().max(500).optional(),
})

export async function POST(req: Request, context: { params: Promise<{ groupId: string }> }) {
  const { groupId } = await context.params
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const membership = await prisma.membership.findFirst({ where: { groupId, userId: session.user.id } })
  if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const body = await req.json().catch(() => null)
  const parsed = ExpenseSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const { item, date, paidById, participantIds, quantity, unitAmount, totalAmount, note } = parsed.data
  const computedTotal = typeof totalAmount === "number" ? totalAmount : quantity * unitAmount

  const expense = await prisma.expense.create({
    data: {
      item,
      date: date ? new Date(date) : new Date(),
      paidById,
      quantity,
      unitAmount,
      totalAmount: computedTotal,
      note,
      groupId,
      participants: { createMany: { data: participantIds.map((uid) => ({ userId: uid })) } },
    },
    include: { participants: true },
  })

  return NextResponse.json(expense)
}

export async function GET(_: Request, context: { params: Promise<{ groupId: string }> }) {
  const { groupId } = await context.params
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const membership = await prisma.membership.findFirst({ where: { groupId, userId: session.user.id } })
  if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const expenses = await prisma.expense.findMany({ where: { groupId }, include: { participants: true } })
  return NextResponse.json(expenses)
}
