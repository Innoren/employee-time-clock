import { requireTimesheets } from "@/app/actions/auth";
import { AppHeader } from "@/components/app-header";
import { LiveFloor } from "@/components/live-floor";
import { renderPage } from "@/components/page-unavailable";
import { loadLiveSnapshot } from "@/lib/live-data";

export const dynamic = "force-dynamic";
export const metadata = { title: "Live floor" };

export default async function AdminPage() {
  return renderPage(async () => {
    const session = await requireTimesheets();
    const snapshot = await loadLiveSnapshot(session.businessId);

    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-6">
        <AppHeader title="Live floor" subtitle="GPS tracking" role={session.role} />
        <LiveFloor initial={snapshot} />
      </div>
    );
  });
}
