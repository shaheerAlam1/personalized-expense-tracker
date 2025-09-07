import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { notFound } from "next/navigation"
import AddExpenseForm from "@/components/expenses/add-expense-form"
import ExportCsvButton from "@/components/expenses/export-csv-button"
import ImportCsvDialog from "@/components/expenses/import-csv-dialog"
import { computeSettlements } from "@/lib/calc"
import { computeTotals } from "@/lib/calc"

export default async function GroupPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  const group = await prisma.group.findUnique({
    where: { id: params.id },
    include: { memberships: { include: { user: true } }, expenses: { include: { participants: true } } },
  })
  if (!group) return notFound()

  const isMember = group.memberships.some((m) => m.userId === session!.user!.id)
  if (!isMember) return notFound()

  const input = {
    expenses: group.expenses.map((e) => ({
      id: e.id,
      paidById: e.paidById,
      totalAmount: e.totalAmount,
      participants: e.participants.map((p) => p.userId),
    })),
  }
  const totals = computeTotals(input)
  const currency = group.currency
  const settlements = computeSettlements(totals)

  const fmt = (n: number) => new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n)

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{group.name}</h1>
        <div className="text-sm text-muted-foreground">Currency: {currency}</div>
      </div>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {group.memberships.map((m) => {
          const t = totals[m.userId] ?? { paid: 0, share: 0, net: 0 }
          return (
            <div key={m.id} className="border rounded-md p-4">
              <div className="font-medium">{m.user?.name ?? "Unknown"}</div>
              <div className="text-sm">Paid: {fmt(t.paid)}</div>
              <div className="text-sm">Share: {fmt(t.share)}</div>
              <div className="text-sm font-semibold">Net: {fmt(t.net)}</div>
            </div>
          )
        })}
      </section>

      <section className="space-y-2">
        <h2 className="font-medium">Settlement Suggestions</h2>
        {settlements.length === 0 ? (
          <div className="text-sm text-muted-foreground">All settled.</div>
        ) : (
          <ul className="text-sm list-disc pl-5">
            {settlements.map((s, idx) => (
              <li key={idx}>
                {group.memberships.find((m) => m.userId === s.fromUserId)?.user?.name ?? "Unknown"}
                {" → "}
                {group.memberships.find((m) => m.userId === s.toUserId)?.user?.name ?? "Unknown"}
                {": "}
                {fmt(s.amount)}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h2 className="font-medium">Add Expense</h2>
          <AddExpenseForm
            groupId={group.id}
            members={group.memberships.map((m) => ({ id: m.userId, name: m.user?.name ?? "Unknown" }))}
          />
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-medium">Expenses</h2>
            <div className="flex gap-2">
              <ImportCsvDialog groupId={group.id} />
              <ExportCsvButton groupId={group.id} />
            </div>
          </div>
          <div className="border rounded-md divide-y">
            <div className="grid grid-cols-6 text-sm px-3 py-2 bg-muted/50">
              <div>Item</div>
              <div>Date</div>
              <div>Paid by</div>
              <div>Participants</div>
              <div>Qty x Unit</div>
              <div>Total</div>
            </div>
            {group.expenses.map((e) => (
              <div key={e.id} className="grid grid-cols-6 text-sm px-3 py-2">
                <div>{e.item}</div>
                <div>{new Date(e.date).toLocaleDateString()}</div>
                <div>{group.memberships.find((m) => m.userId === e.paidById)?.user?.name ?? "Unknown"}</div>
                <div>{e.participants.length}</div>
                <div>{e.quantity} x {e.unitAmount}</div>
                <div>{e.totalAmount}</div>
              </div>
            ))}
            {group.expenses.length === 0 && (
              <div className="text-sm text-muted-foreground px-3 py-2">No expenses yet.</div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
