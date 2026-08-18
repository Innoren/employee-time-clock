import { getDb } from "@/db";
import { businesses } from "@/db/schema";

export const COMPANY_NAME = "Complete Doors and Hardware";
export const COMPANY_DOMAIN = "completedoorsandhardware.com";
export const APP_NAME = "Time Clock";

export async function getCompany() {
  try {
    const db = getDb();
    const [row] = await db.select().from(businesses).limit(1);
    if (row) {
      return { name: row.name, domain: row.domain };
    }
  } catch {
    // Landing and login still render if the database is unreachable.
  }
  return { name: COMPANY_NAME, domain: COMPANY_DOMAIN };
}

export function personName(firstName: string, lastName: string) {
  return `${firstName} ${lastName}`.replace(/\s+/g, " ").trim();
}
