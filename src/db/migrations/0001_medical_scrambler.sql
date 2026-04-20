CREATE TYPE "public"."user_role" AS ENUM('CLIENT', 'DRIVER', 'OPERATOR', 'ADMIN');--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "role" "user_role" DEFAULT 'CLIENT' NOT NULL;