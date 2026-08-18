import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChangePinForm } from "@/components/change-pin-form";
import { findActiveEmployee, logoutAction, requireUser } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { homePath, parseRole } from "@/lib/roles";
import { redirect } from "next/navigation";
import { APP_NAME } from "@/lib/company";

export const metadata = { title: "Set your PIN" };

export default async function PinPage() {
  const session = await requireUser();
  const employee = await findActiveEmployee(session);
  if (!employee) {
    redirect("/login");
  }
  if (!employee.mustChangePin) {
    redirect(homePath(parseRole(employee.role)));
  }

  return (
    <div className="flex min-h-full flex-col items-center justify-center px-4 py-10">
      <p className="mb-6 text-sm text-muted-foreground">{APP_NAME}</p>
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Choose a new PIN</CardTitle>
          <CardDescription>
            The starter PIN only works once. Pick a 4-digit PIN you will remember.
            Do not use 1234.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChangePinForm />
        </CardContent>
      </Card>
      <form action={logoutAction} className="mt-6">
        <Button type="submit" variant="ghost" size="sm">
          Sign out
        </Button>
      </form>
    </div>
  );
}
