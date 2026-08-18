import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "@/components/login-form";

export const metadata = {
  title: "Sign in",
};

export default function LoginPage() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center px-4 py-10">
      <Link href="/" className="mb-6 text-sm text-muted-foreground">
        Time Clock
      </Link>
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Sign in to Riverside Facilities</CardTitle>
          <CardDescription>
            Use your work email and PIN. Accounts are created by a manager under
            riverside.demo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>
      <Link href="/privacy" className="mt-6 text-xs text-muted-foreground">
        Privacy
      </Link>
    </div>
  );
}
