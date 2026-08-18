import { eq } from "drizzle-orm";
import { requireAdmin } from "@/app/actions/auth";
import { AppHeader } from "@/components/app-header";
import { renderPage } from "@/components/page-unavailable";
import { WorksiteForm } from "@/components/worksite-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getDb } from "@/db";
import { businesses } from "@/db/schema";

export const metadata = { title: "Worksite" };

export default async function WorksitePage() {
  return renderPage(async () => {
  const session = await requireAdmin();
  const db = getDb();
  const [business] = await db
    .select()
    .from(businesses)
    .where(eq(businesses.id, session.businessId))
    .limit(1);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6">
      <AppHeader title="Worksite" subtitle={business?.name} role={session.role} />
      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>Designated clock-in location</CardTitle>
          <CardDescription>
            Employees see how far they are from this pin while clocked in, like
            Square. Stand at the shop and save this phone’s GPS as the worksite.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <WorksiteForm
            siteName={business?.siteName || business?.name || ""}
            latitude={business?.siteLatitude ?? null}
            longitude={business?.siteLongitude ?? null}
            radiusFeet={Math.round((business?.siteRadiusMeters || 152) * 3.28084)}
          />
        </CardContent>
      </Card>
    </div>
  );
  });
}
