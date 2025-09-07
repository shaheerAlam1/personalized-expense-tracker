export type SplitInput = {
  expenses: Array<{
    id: string
    paidById: string
    totalAmount: number
    participants: string[] // userIds
  }>
}

export type Totals = Record<string, { paid: number; share: number; net: number }>

/**
 * Compute totals per user for a set of expenses.
 * - Paid: sum of totalAmount for expenses where user is payer
 * - Share: equal split of totalAmount across participants (rounded to integer)
 * - Net: Paid - Share
 */
export function computeTotals(input: SplitInput): Totals {
  const totals: Totals = {}
  const ensure = (uid: string) => (totals[uid] ??= { paid: 0, share: 0, net: 0 })

  for (const e of input.expenses) {
    ensure(e.paidById).paid += e.totalAmount
    const count = Math.max(1, e.participants.length)
    const shareEach = Math.round(e.totalAmount / count)
    for (const uid of e.participants) ensure(uid).share += shareEach
  }
  for (const uid of Object.keys(totals)) {
    const t = totals[uid]
    t.net = t.paid - t.share
  }
  return totals
}

export type Settlement = { fromUserId: string; toUserId: string; amount: number }

/**
 * Compute settlement suggestions from totals using a greedy match between
 * debtors (net < 0) and creditors (net > 0).
 */
export function computeSettlements(totals: Totals): Settlement[] {
  const debtors: Array<{ userId: string; amount: number }> = []
  const creditors: Array<{ userId: string; amount: number }> = []
  for (const [userId, t] of Object.entries(totals)) {
    if (t.net < 0) debtors.push({ userId, amount: -t.net })
    else if (t.net > 0) creditors.push({ userId, amount: t.net })
  }
  // Greedy pairing
  const res: Settlement[] = []
  let i = 0, j = 0
  while (i < debtors.length && j < creditors.length) {
    const d = debtors[i]
    const c = creditors[j]
    const amt = Math.min(d.amount, c.amount)
    if (amt > 0) res.push({ fromUserId: d.userId, toUserId: c.userId, amount: amt })
    d.amount -= amt
    c.amount -= amt
    if (d.amount === 0) i++
    if (c.amount === 0) j++
  }
  return res
}
