"use client"

import { Button } from "@/components/ui/button"

export default function ExportCsvButton({ groupId }: { groupId: string }) {
  async function onExport() {
    const res = await fetch(`/api/groups/${groupId}/expenses`)
    if (!res.ok) return
    type ExportExpense = {
      item: string
      date: string
      paidById: string
      participants: { userId: string }[]
      quantity: number
      unitAmount: number
      totalAmount: number
      note: string | null
    }
    const data: ExportExpense[] = await res.json()
    const header = [
      "item",
      "date",
      "paidById",
      "participants",
      "quantity",
      "unitAmount",
      "totalAmount",
      "note",
    ]
    const rows: (string | number)[][] = data.map((e) => [
      e.item,
      new Date(e.date).toISOString(),
      e.paidById,
      e.participants.map((p) => p.userId).join("|"),
      e.quantity,
      e.unitAmount,
      e.totalAmount,
      (e.note ?? "").replaceAll(",", " ").replaceAll("\n", " "),
    ])
    const csv = [header.join(","), ...rows.map((r) => r.join(","))].join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `expenses-${groupId}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Button variant="outline" onClick={onExport}>Export CSV</Button>
  )
}
