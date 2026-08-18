import Link from "next/link";
import { ArrowRight, Clock3, Smartphone, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Home() {
  return (
    <div className="min-h-full bg-background">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2 text-sm font-medium">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-xs font-semibold text-primary-foreground">
            TC
          </span>
          Time Clock
        </div>
        <Button asChild variant="outline">
          <Link href="/login">Sign in</Link>
        </Button>
      </header>

      <main className="mx-auto w-full max-w-5xl px-6 pb-20">
        <Badge variant="secondary" className="mb-6">
          Demo environment · Riverside Facilities
        </Badge>
        <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
          Accurate time from every employee&apos;s own phone.
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-muted-foreground text-pretty">
          No company devices. Staff install the iPhone or Android app.
          Accounts are created under your business domain, and every punch is
          stamped by the server — not the phone clock.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg" className="h-11 px-5">
            <Link href="/login">
              Open the demo
              <ArrowRight />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="h-11 px-5">
            <Link href="#install">Install on a phone</Link>
          </Button>
        </div>

        <div className="mt-14 grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <Smartphone className="size-5 text-muted-foreground" />
              <CardTitle>Personal phones</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Open the clock on a phone browser, or install the iPhone and
              Android apps for a home-screen icon and a large clock-in button.
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <ShieldCheck className="size-5 text-muted-foreground" />
              <CardTitle>Business-domain accounts</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Managers create people as{" "}
              <span className="font-mono text-foreground">name@riverside.demo</span>.
              Employees cannot self-register.
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Clock3 className="size-5 text-muted-foreground" />
              <CardTitle>Server time</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Clock-in and clock-out are recorded in UTC on the server, then
              shown in the business timezone.
            </CardContent>
          </Card>
        </div>

        <section id="install" className="mt-16 scroll-mt-8">
          <h2 className="text-2xl font-semibold tracking-tight">
            iPhone and Android apps
          </h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>App Store</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>
                  Open the native iPhone app in Xcode with{" "}
                  <span className="font-mono text-foreground">npm run cap:ios</span>{" "}
                  after signing in with an Apple Developer account.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Google Play</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>
                  Open the native Android app in Android Studio with{" "}
                  <span className="font-mono text-foreground">npm run cap:android</span>.
                </p>
              </CardContent>
            </Card>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Read the{" "}
            <Link href="/privacy" className="underline">
              privacy policy
            </Link>
            .
          </p>
        </section>
      </main>
    </div>
  );
}
