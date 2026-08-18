import Link from "next/link";
import { logoutAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import {
  canManageTeam,
  canViewTimesheets,
  type Role,
} from "@/lib/roles";

export function AppHeader({
  title,
  subtitle,
  role,
}: {
  title: string;
  subtitle?: string;
  role?: Role;
}) {
  const showTimesheets = role ? canViewTimesheets(role) : false;
  const showTeam = role ? canManageTeam(role) : false;

  return (
    <header className="mb-6 flex items-center justify-between gap-3">
      <div>
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{title}</p>
        {subtitle ? <p className="text-sm font-medium">{subtitle}</p> : null}
      </div>
      <nav className="flex flex-wrap items-center justify-end gap-2">
        {showTimesheets ? (
          <>
            <Button asChild variant="ghost" size="sm">
              <Link href="/admin">Live</Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link href="/admin/timesheets">Timesheets</Link>
            </Button>
          </>
        ) : null}
        {showTeam ? (
          <Button asChild variant="ghost" size="sm">
            <Link href="/admin/team">Team</Link>
          </Button>
        ) : null}
        <Button asChild variant="outline" size="sm">
          <Link href="/clock">Clock</Link>
        </Button>
        <form action={logoutAction}>
          <Button type="submit" variant="ghost" size="sm">
            Sign out
          </Button>
        </form>
      </nav>
    </header>
  );
}
