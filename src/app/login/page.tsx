import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "@/components/login-form";
import { APP_NAME, getCompany } from "@/lib/company";

export const metadata = {
  title: "Sign in",
};

export default async function LoginPage() {
  const company = await getCompany();

  return (
    <div className="flex min-h-full flex-col items-center justify-center px-4 py-10">
      <Link href="/" className="mb-6 text-sm text-muted-foreground">
        {APP_NAME}
      </Link>
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Sign in to {company.name}</CardTitle>
          <CardDescription>
            Use your work email and 4-digit PIN. First sign-in uses PIN 1234,
            then you set your own.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm domain={company.domain} />
        </CardContent>
      </Card>
      <Link href="/privacy" className="mt-6 text-xs text-muted-foreground">
        Privacy
      </Link>
    </div>
  );
}
