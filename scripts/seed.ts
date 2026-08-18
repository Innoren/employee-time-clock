import { eq } from "drizzle-orm";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { businesses, employees } from "../src/db/schema";
import { emailFromName, hashPin, INITIAL_PIN } from "../src/lib/pin";

const COMPANY_NAME = "Complete Doors and Hardware";
const COMPANY_DOMAIN = "completedoorsandhardware.com";

const people = [
  { firstName: "Bobby", lastName: "", role: "admin", title: "Owner" },
  { firstName: "Jessie", lastName: "", role: "admin", title: "COO" },
  {
    firstName: "Aaliyah",
    lastName: "Conforme",
    role: "admin",
    title: "Payroll Specialist",
  },
] as const;

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  const sql = neon(url);
  const db = drizzle(sql);

  const [existing] = await db.select().from(businesses).limit(1);
  const [business] = existing
    ? await db
        .update(businesses)
        .set({
          name: COMPANY_NAME,
          domain: COMPANY_DOMAIN,
          timezone: "America/New_York",
        })
        .where(eq(businesses.id, existing.id))
        .returning()
    : await db
        .insert(businesses)
        .values({
          name: COMPANY_NAME,
          domain: COMPANY_DOMAIN,
          timezone: "America/New_York",
        })
        .returning();

  if (!business) throw new Error("Could not seed business");

  for (const person of people) {
    const email = emailFromName(person.firstName, person.lastName, business.domain);
    const [current] = await db
      .select()
      .from(employees)
      .where(eq(employees.email, email))
      .limit(1);

    if (current) {
      await db
        .update(employees)
        .set({
          businessId: business.id,
          firstName: person.firstName,
          lastName: person.lastName,
          role: person.role,
          active: true,
        })
        .where(eq(employees.id, current.id));
      continue;
    }

    await db.insert(employees).values({
      businessId: business.id,
      email,
      firstName: person.firstName,
      lastName: person.lastName,
      role: person.role,
      pinHash: hashPin(INITIAL_PIN),
      mustChangePin: true,
      active: true,
    });
  }

  console.log(`Company: ${business.name} (${business.domain})`);
  console.log(`Starter PIN for new accounts: ${INITIAL_PIN} (changed on first sign-in)`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
