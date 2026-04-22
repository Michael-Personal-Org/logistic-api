CREATE TABLE "trucks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plate_number" varchar(20) NOT NULL,
	"model" varchar(100) NOT NULL,
	"capacity" varchar(50) NOT NULL,
	"allowed_cargo_types" json DEFAULT '["GENERAL"]'::json NOT NULL,
	"is_available" boolean DEFAULT true NOT NULL,
	"assigned_driver_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "trucks_plate_number_unique" UNIQUE("plate_number")
);
--> statement-breakpoint
ALTER TABLE "trucks" ADD CONSTRAINT "trucks_assigned_driver_id_users_id_fk" FOREIGN KEY ("assigned_driver_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;