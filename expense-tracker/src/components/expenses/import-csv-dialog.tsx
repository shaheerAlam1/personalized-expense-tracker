"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

function parseCsv(text: string): string[][] {
  const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0)
  if (lines.length === 0) return []
  const rows: string[][] = []
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    // simple comma split, assumes no embedded commas in fields
    const cols = line.split(",").map(c => c.trim())
    rows.push(cols)
  }
  return rows
}

export default function ImportCsvDialog({ groupId }: { groupId: string }) {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [okCount, setOkCount] = useState(0)

  async function handleFile(file: File) {
    setBusy(true)
    setError(null)
    setOkCount(0)
    try {
      const text = await file.text()
      const rows = parseCsv(text)
      if (rows.length < 2) throw new Error("Empty CSV or missing header")
      const [header, ...data] = rows
      const expected = ["item","date","paidById","participants","quantity","unitAmount","totalAmount","note"]
      if (header.join(",") !== expected.join(",")) {
        throw new Error("Unexpected header. Expected: " + expected.join(","))
      }
      for (const cols of data) {
        if (cols.length === 0) continue
        const [item, date, paidById, participants, quantity, unitAmount, totalAmount, note] = cols
        const body = {
          item,
          date: date || undefined,
          paidById,
          participantIds: (participants || "").split("|").filter(Boolean),
          quantity: Number(quantity || 1),
          unitAmount: Number(unitAmount || 0),
          totalAmount: totalAmount ? Number(totalAmount) : undefined,
          note: note || undefined,
        }
        const res = await fetch(`/api/groups/${groupId}/expenses`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })
        if (!res.ok) throw new Error("Failed to import some rows")
        setOkCount((c) => c + 1)
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Import failed"
      setError(msg)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Import CSV</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import Expenses (CSV)</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 text-sm">
          <p>CSV header must be exactly:</p>
          <pre className="rounded bg-muted p-2 overflow-auto">item,date,paidById,participants,quantity,unitAmount,totalAmount,note</pre>
          <input
            type="file"
            accept=".csv,text/csv"
            disabled={busy}
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) void handleFile(file)
            }}
          />
          {busy && <div>Importing…</div>}
          {!!okCount && !busy && <div>Imported {okCount} rows.</div>}
          {error && <div className="text-red-600">{error}</div>}
        </div>
      </DialogContent>
    </Dialog>
  )
}
