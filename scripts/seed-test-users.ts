import { eq } from "drizzle-orm";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { businesses, employees } from "../src/db/schema";
import { emailFromName, hashPin, INITIAL_PIN } from "../src/lib/pin";

const testers = [
  { firstName: "Temp", lastName: "Employee", role: "employee" },
  { firstName: "Temp", lastName: "Supervisor", role: "supervisor" },
  { firstName: "Temp", lastName: "Admin", role: "admin" },
] as const;

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  const sql = neon(url);
  const db = drizzle(sql);

  const [business] = await db.select().from(businesses).limit(1);
  if (!business) throw new Error("No business found. Run npm run db:seed first.");

  console.log(`Company: ${business.name}`);
  for (const person of testers) {
    const email = emailFromName(person.firstName, person.lastName, business.domain);
    const [current] = await db
      .select()
      .from(employees)
      .where(eq(employees.email, email))
      .limit(1);

    const values = {
      businessId: business.id,
      email,
      firstName: person.firstName,
      lastName: person.lastName,
      role: person.role,
      pinHash: hashPin(INITIAL_PIN),
      mustChangePin: false,
      active: true,
    };

    if (current) {
      await db.update(employees).set(values).where(eq(employees.id, current.id));
    } else {
      await db.insert(employees).values(values);
    }

    console.log(`${person.role.padEnd(12)} ${email}  PIN ${INITIAL_PIN}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
