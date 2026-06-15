import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  numeric,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";

export const productType = pgEnum("product_type", [
  "otc_drug",
  "supplement",
  "cosmetic",
  "medical_device",
  "other",
]);
export const priceUnit = pgEnum("price_unit", ["per_pack", "per_piece"]);

/** Catalog product — entered once, reused across issues (spec §6). */
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  subtitle: text("subtitle"),
  imageUrl: text("image_url"),
  type: productType("type").notNull(),
  priceUnit: priceUnit("price_unit").notNull().default("per_pack"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const issues = pgTable("issues", {
  id: serial("id").primaryKey(),
  number: integer("number").notNull(),
  periodFrom: text("period_from"),
  periodTo: text("period_to"),
  freeText: text("free_text"),
  createdAt: timestamp("created_at").defaultNow(),
});

/** A product inside a concrete issue, with its issue-specific pricing. */
export const issueProducts = pgTable("issue_products", {
  id: serial("id").primaryKey(),
  issueId: integer("issue_id").notNull(),
  productId: integer("product_id").notNull(),
  oldPriceEur: numeric("old_price_eur", { precision: 10, scale: 2 }),
  newPriceEur: numeric("new_price_eur", { precision: 10, scale: 2 }),
  percentOnly: boolean("percent_only").notNull().default(false),
  percent: integer("percent"),
  isHero: boolean("is_hero").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  priceConfirmed: boolean("price_confirmed").notNull().default(true),
});

/** Single-row settings table (spec §6). */
export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  slogan: text("slogan"),
  address: text("address"),
  phone: text("phone"),
  facebook: text("facebook"),
  workingHours: text("working_hours"),
  disclaimerOtc: text("disclaimer_otc"),
  disclaimerSupplement: text("disclaimer_supplement"),
});
