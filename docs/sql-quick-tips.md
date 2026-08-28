# Quick tip: SQL mistakes we hit on Time Clock

This app already uses **SQL** (PostgreSQL on Neon). Drizzle is TypeScript that writes SQL. The bugs below were not “we picked the wrong database.” They were the query asking the wrong question.

Use this as a checklist when you change punches, GPS pings, or employees.

---

## 1. `LIMIT` is not “this week”

**Symptom:** Live floor “Hours this week” looks too low. GPS trails mix yesterday with today.

**What we thought:** “Take the last 200 punches / last 800 pings. That’s recent.”

**What SQL actually did:** After sorting by time, **stop after N rows**, for the whole company. Busy days steal the limit. Monday falls off even though it is still this week. “Last 800 pings” is not “this shift.”

**Fix:** Filter by time first. `LIMIT` is only a safety cap.

```sql
-- Punches: a real window, not “newest 200 mixed people”
SELECT *
FROM punches
WHERE business_id = $1
  AND occurred_at >= now() - interval '14 days'
ORDER BY occurred_at DESC
LIMIT 2000;

-- GPS: recent pings only, only columns the map needs
SELECT employee_id, latitude, longitude, recorded_at, ...
FROM location_pings
WHERE business_id = $1
  AND recorded_at >= now() - interval '8 hours'
ORDER BY recorded_at DESC
LIMIT 400;
```

In this repo that lives in `src/lib/live-data.ts`. Week hours are then counted only from the last 7 days of those rows.

**Watch for**

- `ORDER BY time DESC LIMIT n` used as if it meant today / this week
- One limit shared across many employees
- Trails with no `recorded_at >= shift start`

**Rule:** If the question is “in this period,” SQL needs `WHERE timestamp >= start`. `LIMIT` is a guardrail, not the period.

Does SQL know what 14 days is? Yes. `interval '14 days'` is 14 calendar days (same clock time). This app’s JS helper uses `14 * 24 * 60 * 60 * 1000` (exactly 336 hours). Around DST that can differ by an hour from “14 dates on the wall.” Close enough for the live floor; payroll-by-calendar-day should use the business timezone.

---

## 2. `SELECT *` loads secrets you do not need

**Symptom:** Nothing looks wrong on the map. Every live poll still reads PIN hashes from the database.

**What we thought:** “Load the employee row. We’ll use what we need.”

**What SQL actually did:** `SELECT * FROM employees` includes `pin_hash`. The UI never showed it. The hash still left Neon on every 3-second live refresh. Extra data, extra cost, bigger leak if a log or API ever dumps the whole object.

**Fix:** Name the columns.

```sql
SELECT id, first_name, last_name, email, active
FROM employees
WHERE business_id = $1;
```

Same idea for pings: coordinates, time, inside/outside — not the whole row.

**Watch for**

- `db.select().from(employees)` / `SELECT *` on users or accounts
- `return employee` to the browser after a fetch
- `console.log(employee)` in production

**Rule:** Every `SELECT` lists only what this screen needs. Load `pin_hash` only when checking a login.

---

## 3. Code schema and Neon must match

**Symptom:** Everyone gets “Could not sign in.” Logs say `column ... does not exist`.

**What we thought:** “We added lockout columns in `schema.ts`. Login can use them.”

**What SQL actually did:** Drizzle generated `SELECT failed_pin_attempts, locked_until ...`. Those columns were never created on Neon (`db:push` never ran). Postgres rejected the query. Login failed for **everyone**, not only bad PINs.

**Fix:** Do not query columns that are not on the server. Lockout after 5 bad PINs is in app memory until a real migration is applied. Then the app may use DB columns.

Two-step schema change:

1. Edit `src/db/schema.ts`
2. Apply it: `npm run db:push`

`npx tsc` does not talk to Postgres. A green typecheck does not mean Neon matches.

**Watch for**

- Deploying schema edits without `db:push`
- `column ... does not exist` / `relation ... does not exist`
- Adding `.notNull()` columns with no default on a table that already has rows

**Rule:** If step 2 did not happen, the app must not mention the new fields in SQL.

---

## Checklist

| Question | Wrong shortcut | Right SQL idea |
| --- | --- | --- |
| Totals for a period? | `LIMIT 200` | `WHERE occurred_at >= start` |
| Need name and email? | `SELECT *` | List columns; never pull PIN hashes for Live |
| New column in TypeScript? | Deploy only | `db:push`, then query it |

Related code: `src/db/schema.ts`, `src/lib/live-data.ts`, `src/lib/login-guard.ts`.
