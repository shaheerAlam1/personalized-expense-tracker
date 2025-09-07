"use client"

import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Textarea } from "@/components/ui/textarea"

const ExpenseSchema = z.object({
  item: z.string().min(1),
  date: z.string().optional(),
  paidById: z.string().min(1),
  participantIds: z.array(z.string().min(1)).min(1),
  quantity: z.number().int().positive().default(1),
  unitAmount: z.number().int().nonnegative(),
  totalAmount: z.number().int().nonnegative().optional(),
  note: z.string().max(500).optional(),
})

type ExpenseFormValues = z.infer<typeof ExpenseSchema>

export default function AddExpenseForm({
  groupId,
  members,
}: {
  groupId: string
  members: { id: string; name: string }[]
}) {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(ExpenseSchema),
    defaultValues: {
      quantity: 1,
      date: new Date().toISOString(),
    },
  })

  const onSubmit = async (values: ExpenseFormValues) => {
    setSubmitting(true)
    try {
      const res = await fetch(`/api/groups/${groupId}/expenses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      })
      if (!res.ok) throw new Error("Failed")
      router.refresh()
    } finally {
      setSubmitting(false)
    }
  }

  const selectedParticipants = watch("participantIds") || []

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="text-sm">Item</label>
          <Input {...register("item")} placeholder="Hotel" />
          {errors.item && <p className="text-xs text-red-600">{errors.item.message}</p>}
        </div>
        <div>
          <label className="text-sm">Date</label>
          <Input type="date" {...register("date")} />
        </div>
        <div>
          <label className="text-sm">Paid by</label>
          <select className="w-full border rounded-md h-9 px-2" {...register("paidById")}>
            <option value="">Select payer</option>
            {members.map((m) => (
              <option value={m.id} key={m.id}>{m.name}</option>
            ))}
          </select>
          {errors.paidById && <p className="text-xs text-red-600">Payer is required</p>}
        </div>
        <div>
          <label className="text-sm">Participants</label>
          <div className="border rounded-md p-2 max-h-36 overflow-auto space-y-1">
            {members.map((m) => {
              const checked = selectedParticipants.includes(m.id)
              return (
                <label key={m.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => {
                      const next = new Set(selectedParticipants)
                      if (e.target.checked) next.add(m.id); else next.delete(m.id)
                      setValue("participantIds", Array.from(next))
                    }}
                  />
                  {m.name}
                </label>
              )
            })}
          </div>
          {errors.participantIds && <p className="text-xs text-red-600">Select at least one participant</p>}
        </div>
        <div>
          <label className="text-sm">Quantity</label>
          <Input type="number" min={1} {...register("quantity", { valueAsNumber: true })} />
        </div>
        <div>
          <label className="text-sm">Unit amount</label>
          <Input type="number" min={0} {...register("unitAmount", { valueAsNumber: true })} />
        </div>
        <div className="md:col-span-2">
          <label className="text-sm">Note</label>
          <Textarea rows={2} {...register("note")} />
        </div>
      </div>
      <Button type="submit" disabled={submitting}>{submitting ? "Saving..." : "Add expense"}</Button>
    </form>
  )
}
