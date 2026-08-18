import { eq } from "drizzle-orm";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { businesses, employees, locationPings, punches } from "../src/db/schema";
import { hashPin } from "../src/lib/pin";

const people = [
  { firstName: "Alex", lastName: "Rivera", role: "admin", pin: "1001" },
  { firstName: "Maria", lastName: "Chen", role: "supervisor", pin: "4821" },
  { firstName: "James", lastName: "Okonkwo", role: "employee", pin: "7390" },
  { firstName: "Priya", lastName: "Shah", role: "employee", pin: "1564" },
] as const;

function atHour(daysAgo: number, hour: number, minute = 0) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - daysAgo);
  date.setUTCHours(hour + 4, minute, 0, 0);
  return date;
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  const sql = neon(url);
  const db = drizzle(sql);

  const [business] = await db
    .insert(businesses)
    .values({
      name: "Riverside Facilities",
      domain: "riverside.demo",
      timezone: "America/New_York",
    })
    .onConflictDoUpdate({
      target: businesses.domain,
      set: {
        name: "Riverside Facilities",
        timezone: "America/New_York",
      },
    })
    .returning();

  if (!business) throw new Error("Could not seed business");

  const created = [];
  for (const person of people) {
    const email = `${person.firstName}.${person.lastName}@${business.domain}`.toLowerCase();
    const [row] = await db
      .insert(employees)
      .values({
        businessId: business.id,
        email,
        firstName: person.firstName,
        lastName: person.lastName,
        role: person.role,
        pinHash: hashPin(person.pin),
        active: true,
      })
      .onConflictDoUpdate({
        target: employees.email,
        set: {
          businessId: business.id,
          firstName: person.firstName,
          lastName: person.lastName,
          role: person.role,
          pinHash: hashPin(person.pin),
          active: true,
        },
      })
      .returning();
    if (!row) throw new Error(`Could not seed ${email}`);
    created.push(row);
  }

  await db.delete(locationPings).where(eq(locationPings.businessId, business.id));
  await db.delete(punches).where(eq(punches.businessId, business.id));

  const maria = created.find((row) => row.firstName === "Maria");
  const james = created.find((row) => row.firstName === "James");
  const priya = created.find((row) => row.firstName === "Priya");
  if (!maria || !james || !priya) throw new Error("Demo employees missing after seed");

  const punchValues = [
    { employeeId: maria.id, type: "in", occurredAt: atHour(4, 13, 2), note: "Warehouse open", travelTime: false },
    { employeeId: maria.id, type: "lunch_out", occurredAt: atHour(4, 17, 0), note: null, travelTime: false },
    { employeeId: maria.id, type: "lunch_in", occurredAt: atHour(4, 17, 32), note: null, travelTime: false },
    { employeeId: maria.id, type: "out", occurredAt: atHour(4, 21, 11), note: null, travelTime: false },
    { employeeId: james.id, type: "travel_start", occurredAt: atHour(4, 13, 8), note: "Drive to North lot", travelTime: true },
    { employeeId: james.id, type: "travel_end", occurredAt: atHour(4, 13, 41), note: "North lot", travelTime: false },
    { employeeId: james.id, type: "out", occurredAt: atHour(4, 21, 4), note: null, travelTime: false },
    { employeeId: priya.id, type: "in", occurredAt: atHour(3, 12, 57), note: null, travelTime: false },
    { employeeId: priya.id, type: "lunch_out", occurredAt: atHour(3, 16, 58), note: null, travelTime: false },
    { employeeId: priya.id, type: "lunch_in", occurredAt: atHour(3, 17, 29), note: null, travelTime: false },
    { employeeId: priya.id, type: "out", occurredAt: atHour(3, 20, 41), note: null, travelTime: false },
    { employeeId: maria.id, type: "in", occurredAt: atHour(2, 13, 1), note: null, travelTime: false },
    { employeeId: maria.id, type: "out", occurredAt: atHour(2, 21, 18), note: null, travelTime: false },
    { employeeId: james.id, type: "in", occurredAt: atHour(1, 13, 6), note: "On site", travelTime: false },
    { employeeId: james.id, type: "travel_start", occurredAt: atHour(1, 15, 10), note: "Site to site", travelTime: true },
    { employeeId: james.id, type: "travel_end", occurredAt: atHour(1, 15, 48), note: null, travelTime: false },
    { employeeId: james.id, type: "out", occurredAt: atHour(1, 17, 2), note: null, travelTime: false },
    { employeeId: maria.id, type: "in", occurredAt: atHour(0, 12, 58), note: "On site", travelTime: false },
  ];

  await db.insert(punches).values(
    punchValues.map((punch) => ({
      ...punch,
      businessId: business.id,
    })),
  );

  console.log("Seeded Riverside Facilities demo accounts.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
