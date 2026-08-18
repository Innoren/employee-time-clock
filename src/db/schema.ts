import {
  boolean,
  doublePrecision,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
  index,
} from "drizzle-orm/pg-core";

export const businesses = pgTable("businesses", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  domain: text("domain").notNull().unique(),
  timezone: text("timezone").notNull().default("America/New_York"),
  siteName: text("site_name"),
  siteLatitude: doublePrecision("site_latitude"),
  siteLongitude: doublePrecision("site_longitude"),
  siteRadiusMeters: integer("site_radius_meters").notNull().default(152),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const employees = pgTable(
  "employees",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id),
    email: text("email").notNull().unique(),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    role: text("role").notNull().default("employee"),
    pinHash: text("pin_hash").notNull(),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("employees_business_idx").on(table.businessId),
  ],
);

export const punches = pgTable(
  "punches",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    employeeId: uuid("employee_id")
      .notNull()
      .references(() => employees.id),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id),
    type: text("type").notNull(),
    note: text("note"),
    travelTime: boolean("travel_time").notNull().default(false),
    outsideSite: boolean("outside_site").notNull().default(false),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
    clientReportedAt: timestamp("client_reported_at", { withTimezone: true }),
    latitude: doublePrecision("latitude"),
    longitude: doublePrecision("longitude"),
    accuracyMeters: doublePrecision("accuracy_meters"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("punches_employee_time_idx").on(table.employeeId, table.occurredAt),
    index("punches_business_time_idx").on(table.businessId, table.occurredAt),
  ],
);

export type Business = typeof businesses.$inferSelect;
export type Employee = typeof employees.$inferSelect;
export type Punch = typeof punches.$inferSelect;

export const locationPings = pgTable(
  "location_pings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    employeeId: uuid("employee_id")
      .notNull()
      .references(() => employees.id),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id),
    latitude: doublePrecision("latitude").notNull(),
    longitude: doublePrecision("longitude").notNull(),
    accuracyMeters: doublePrecision("accuracy_meters"),
    distanceMeters: doublePrecision("distance_meters"),
    outsideSite: boolean("outside_site").notNull().default(false),
    recordedAt: timestamp("recorded_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    index("location_pings_employee_time_idx").on(table.employeeId, table.recordedAt),
    index("location_pings_business_time_idx").on(table.businessId, table.recordedAt),
  ],
);

export type LocationPing = typeof locationPings.$inferSelect;
