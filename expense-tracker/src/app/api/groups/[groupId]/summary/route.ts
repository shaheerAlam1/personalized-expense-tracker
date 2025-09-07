import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { computeTotals, computeSettlements } from "@/lib/calc"

export async function GET(_: Request, context: { params: Promise<{ groupId: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { groupId } = await context.params
  const membership = await prisma.membership.findFirst({ where: { groupId, userId: session.user.id } })
  if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const expenses = await prisma.expense.findMany({ where: { groupId }, include: { participants: true } })
  const input = {
    expenses: expenses.map((e) => ({
      id: e.id,
      paidById: e.paidById,
      totalAmount: e.totalAmount,
      participants: e.participants.map((p) => p.userId),
    })),
  }
  const totals = computeTotals(input)

  const members = await prisma.membership.findMany({ where: { groupId }, include: { user: true } })
  const result = members.map((m) => ({
    userId: m.userId,
    name: m.user?.name ?? "Unknown",
    paid: totals[m.userId]?.paid ?? 0,
    share: totals[m.userId]?.share ?? 0,
    net: totals[m.userId]?.net ?? 0,
  }))

  const currency = (await prisma.group.findUnique({ where: { id: groupId }, select: { currency: true } }))?.currency ??
    process.env.CURRENCY ?? "PKR"

  const suggestions = computeSettlements(totals)

  return NextResponse.json({ currency, members: result, suggestions })
}
