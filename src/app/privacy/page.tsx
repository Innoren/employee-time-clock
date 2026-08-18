import Link from "next/link";

export const metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-10">
      <Link href="/" className="text-sm text-muted-foreground">
        Time Clock
      </Link>
      <h1 className="mt-6 text-3xl font-semibold tracking-tight">Privacy Policy</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: August 17, 2026</p>

      <div className="mt-8 space-y-6 text-sm leading-6 text-muted-foreground">
        <p>
          Time Clock is a workplace timekeeping app. It is used by employees on
          their own iPhone or Android phones and by managers on the web.
        </p>
        <section className="space-y-2">
          <h2 className="text-base font-medium text-foreground">What we collect</h2>
          <p>
            Work email, name, role, and a hashed 4-digit PIN. Clock-in, clock-out,
            lunch, and travel punches, including optional notes.
          </p>
          <p>
            Precise location (GPS) at every punch: latitude, longitude, accuracy,
            and whether the employee was inside or outside the employer&apos;s
            designated worksite. In the iPhone and Android apps, location is also
            collected in the background for the rest of the shift, including when
            the phone is locked, until the employee clocks out. Browser use only
            collects location while Time Clock is on screen.
          </p>
        </section>
        <section className="space-y-2">
          <h2 className="text-base font-medium text-foreground">How it is used</h2>
          <p>
            Punch times and location are shown to the employee&apos;s employer for
            payroll, timesheets, and confirming presence at the worksite. Location
            is not used for advertising, not sold, and not shared with other
            companies. Tracking stops when the employee clocks out.
          </p>
        </section>
        <section className="space-y-2">
          <h2 className="text-base font-medium text-foreground">Retention</h2>
          <p>
            Punch records and location pings are kept for the employer&apos;s
            timekeeping and payroll needs. Employees should ask their manager
            about their company&apos;s retention policy.
          </p>
        </section>
        <section className="space-y-2">
          <h2 className="text-base font-medium text-foreground">Contact</h2>
          <p>
            Privacy questions can be sent to the employer that issued the Time
            Clock account, or to the app publisher listed on the App Store or
            Google Play listing.
          </p>
        </section>
      </div>
    </div>
  );
}
