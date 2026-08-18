import { eq } from "drizzle-orm";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { employees } from "../src/db/schema";
import { hashPin, INITIAL_PIN } from "../src/lib/pin";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  const sql = neon(url);
  const db = drizzle(sql);

  const roster = await db.select({ id: employees.id }).from(employees);
  for (const person of roster) {
    await db
      .update(employees)
      .set({
        pinHash: hashPin(INITIAL_PIN),
        mustChangePin: true,
      })
      .where(eq(employees.id, person.id));
  }
  console.log(
    `Reset ${roster.length} PIN(s) to ${INITIAL_PIN}. Each person must change it on next sign-in.`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
