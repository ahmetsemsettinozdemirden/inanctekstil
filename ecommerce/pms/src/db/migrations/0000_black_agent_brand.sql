CREATE TABLE "designs" (
	"id" text PRIMARY KEY NOT NULL,
	"curtain_type" text NOT NULL,
	"design_name" text NOT NULL,
	"width_cm" integer NOT NULL,
	"price" integer NOT NULL,
	"composition" text,
	"fabric_material" text,
	"fabric_transparency" text,
	"fabric_texture" text,
	"fabric_weight" text,
	"fabric_pattern" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "generated_images" (
	"id" serial PRIMARY KEY NOT NULL,
	"sku" text NOT NULL,
	"image_type" text NOT NULL,
	"room_id" text,
	"file_path" text NOT NULL,
	"shopify_media_id" text,
	"evaluation_score" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "jobs" (
	"id" text PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"params" jsonb NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"started_at" timestamp,
	"ended_at" timestamp,
	"error" text,
	"result" jsonb,
	"log" text[] DEFAULT '{}' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shopify_products" (
	"design_id" text PRIMARY KEY NOT NULL,
	"product_id" text,
	"handle" text,
	"product_type" text,
	"status" text DEFAULT 'DRAFT' NOT NULL,
	"options" jsonb DEFAULT '["Renk"]'::jsonb NOT NULL,
	"synced_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "variants" (
	"sku" text PRIMARY KEY NOT NULL,
	"design_id" text NOT NULL,
	"colour" text NOT NULL,
	"finish" text,
	"swatch_path" text,
	"shopify_variant_id" text,
	"shopify_status" text DEFAULT 'DRAFT' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "generated_images" ADD CONSTRAINT "generated_images_sku_variants_sku_fk" FOREIGN KEY ("sku") REFERENCES "public"."variants"("sku") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shopify_products" ADD CONSTRAINT "shopify_products_design_id_designs_id_fk" FOREIGN KEY ("design_id") REFERENCES "public"."designs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "variants" ADD CONSTRAINT "variants_design_id_designs_id_fk" FOREIGN KEY ("design_id") REFERENCES "public"."designs"("id") ON DELETE cascade ON UPDATE no action;