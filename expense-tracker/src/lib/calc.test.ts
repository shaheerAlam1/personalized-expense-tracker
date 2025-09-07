import { describe, it, expect } from "vitest"
import { computeTotals, computeSettlements } from "./calc"

describe("computeTotals", () => {
  it("splits equally and computes net", () => {
    const totals = computeTotals({
      expenses: [
        { id: "1", paidById: "a", totalAmount: 300, participants: ["a", "b", "c"] },
        { id: "2", paidById: "b", totalAmount: 150, participants: ["b", "c"] },
      ],
    })
    expect(totals["a"]).toEqual({ paid: 300, share: 100, net: 200 })
    expect(totals["b"]).toEqual({ paid: 150, share: 175, net: -25 })
    expect(totals["c"]).toEqual({ paid: 0, share: 175, net: -175 })
  })

  it("suggests settlements from totals", () => {
    const totals = computeTotals({
      expenses: [
        { id: "1", paidById: "a", totalAmount: 300, participants: ["a", "b", "c"] },
        { id: "2", paidById: "b", totalAmount: 150, participants: ["b", "c"] },
      ],
    })
    const tx = computeSettlements(totals)
    // a is owed 200, b owes 25, c owes 175 (based on the previous test)
    // Debtors pay creditors: b->a 25, c->a 175
    expect(tx).toEqual([
      { fromUserId: "b", toUserId: "a", amount: 25 },
      { fromUserId: "c", toUserId: "a", amount: 175 },
    ])
  })
})
