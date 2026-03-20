import { pgTable, text, integer, timestamp, jsonb, serial } from "drizzle-orm/pg-core";

export const designs = pgTable("designs", {
  id:                 text("id").primaryKey(),
  curtainType:        text("curtain_type").notNull(),
  designName:         text("design_name").notNull(),
  widthCm:            integer("width_cm").notNull(),
  price:              integer("price").notNull(),
  composition:        text("composition"),
  fabricMaterial:     text("fabric_material"),
  fabricTransparency: text("fabric_transparency"),
  fabricTexture:      text("fabric_texture"),
  fabricWeight:       text("fabric_weight"),
  fabricPattern:      text("fabric_pattern"),
  description:        text("description"),
  tags:               text("tags"),
  createdAt:          timestamp("created_at").defaultNow().notNull(),
  updatedAt:          timestamp("updated_at").defaultNow().notNull(),
});

export const shopifyProducts = pgTable("shopify_products", {
  designId:    text("design_id").primaryKey().references(() => designs.id, { onDelete: "cascade" }),
  productId:   text("product_id"),
  handle:      text("handle"),
  productType: text("product_type"),
  status:      text("status").default("DRAFT").notNull(),
  options:     jsonb("options").$type<string[]>().default(["Renk"]).notNull(),
  syncedAt:    timestamp("synced_at"),
});

export const variants = pgTable("variants", {
  sku:              text("sku").primaryKey(),
  designId:         text("design_id").notNull().references(() => designs.id, { onDelete: "cascade" }),
  colour:           text("colour").notNull(),
  finish:           text("finish"),
  swatchPath:       text("swatch_path"),
  shopifyVariantId: text("shopify_variant_id"),
  shopifyStatus:    text("shopify_status").default("DRAFT").notNull(),
  createdAt:        timestamp("created_at").defaultNow().notNull(),
});

export const generatedImages = pgTable("generated_images", {
  id:             serial("id").primaryKey(),
  sku:            text("sku").notNull().references(() => variants.sku, { onDelete: "cascade" }),
  imageType:      text("image_type").notNull(),
  roomId:         text("room_id"),
  filePath:       text("file_path").notNull(),
  shopifyMediaId: text("shopify_media_id"),
  evaluationScore: integer("evaluation_score"),
  createdAt:      timestamp("created_at").defaultNow().notNull(),
});

export const jobs = pgTable("jobs", {
  id:        text("id").primaryKey(),
  type:      text("type").notNull(),
  params:    jsonb("params").$type<Record<string, unknown>>().notNull(),
  status:    text("status").default("pending").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  startedAt: timestamp("started_at"),
  endedAt:   timestamp("ended_at"),
  error:     text("error"),
  result:    jsonb("result").$type<Record<string, unknown>>(),
  log:       text("log").array().default([]).notNull(),
});

export type DesignRow         = typeof designs.$inferSelect;
export type DesignInsert      = typeof designs.$inferInsert;
export type ShopifyProductRow = typeof shopifyProducts.$inferSelect;
export type VariantRow        = typeof variants.$inferSelect;
export type GeneratedImageRow = typeof generatedImages.$inferSelect;
export type JobRow            = typeof jobs.$inferSelect;
export type JobInsert         = typeof jobs.$inferInsert;
