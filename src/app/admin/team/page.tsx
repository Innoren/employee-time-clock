import { eq } from "drizzle-orm";
import { requireAdmin } from "@/app/actions/auth";
import { AddEmployeeForm } from "@/components/add-employee-form";
import { AppHeader } from "@/components/app-header";
import { renderPage } from "@/components/page-unavailable";
import { ToggleActiveButton } from "@/components/toggle-active-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getDb } from "@/db";
import { businesses, employees } from "@/db/schema";
import { COMPANY_DOMAIN, personName } from "@/lib/company";
import { parseRole, roleLabel } from "@/lib/roles";

export const metadata = { title: "Team" };

export default async function TeamPage() {
  return renderPage(async () => {
  const session = await requireAdmin();
  const db = getDb();
  const [[business], team] = await Promise.all([
    db.select().from(businesses).where(eq(businesses.id, session.businessId)).limit(1),
    db
      .select()
      .from(employees)
      .where(eq(employees.businessId, session.businessId))
      .orderBy(employees.lastName, employees.firstName),
  ]);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6">
      <AppHeader title="Team" subtitle={business?.name} role={session.role} />
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Create an account</CardTitle>
          <CardDescription>
            New people get an email under @{business?.domain} and a one-time PIN.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AddEmployeeForm domain={business?.domain ?? COMPANY_DOMAIN} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Roster</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {team.map((person) => (
                <TableRow key={person.id}>
                  <TableCell>
                    {personName(person.firstName, person.lastName)}
                  </TableCell>
                  <TableCell className="font-mono text-xs">{person.email}</TableCell>
                  <TableCell>{roleLabel(parseRole(person.role))}</TableCell>
                  <TableCell>
                    <Badge variant={person.active ? "secondary" : "outline"}>
                      {person.active ? "Active" : "Off roster"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {person.id === session.employeeId ? (
                      <span className="text-xs text-muted-foreground">You</span>
                    ) : (
                      <ToggleActiveButton employeeId={person.id} active={person.active} />
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
  });
}
