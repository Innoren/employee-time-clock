import Link from "next/link";
import { APP_NAME, COMPANY_NAME } from "@/lib/company";

export const metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-10">
      <Link href="/" className="text-sm text-muted-foreground">
        {APP_NAME}
      </Link>
      <h1 className="mt-6 text-3xl font-semibold tracking-tight">Privacy Policy</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: August 17, 2026</p>

      <div className="mt-8 space-y-6 text-sm leading-6 text-muted-foreground">
        <p>
          {APP_NAME} is the workplace timekeeping app for {COMPANY_NAME}. It is
          used by employees on their own iPhone or Android phones and by managers
          on the web.
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
            collects location while {APP_NAME} is on screen.
          </p>
        </section>
        <section className="space-y-2">
          <h2 className="text-base font-medium text-foreground">How it is used</h2>
          <p>
            Punch times and location are shown to {COMPANY_NAME} for payroll,
            timesheets, and confirming presence at the worksite. Location is not
            used for advertising, not sold, and not shared with other companies.
            Tracking stops when the employee clocks out.
          </p>
        </section>
        <section className="space-y-2">
          <h2 className="text-base font-medium text-foreground">Retention</h2>
          <p>
            Punch records and location pings are kept for {COMPANY_NAME}&apos;s
            timekeeping and payroll needs. Employees should ask payroll or a
            manager about the company&apos;s retention policy.
          </p>
        </section>
        <section className="space-y-2">
          <h2 className="text-base font-medium text-foreground">Contact</h2>
          <p>
            Privacy questions can be sent to {COMPANY_NAME} payroll or the manager
            that issued the {APP_NAME} account, or to the app publisher listed on
            the App Store or Google Play listing.
          </p>
        </section>
      </div>
    </div>
  );
}
