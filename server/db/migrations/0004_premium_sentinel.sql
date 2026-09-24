CREATE TABLE "mission_activities" (
	"id" text PRIMARY KEY NOT NULL,
	"type" text DEFAULT 'other' NOT NULL,
	"status" text DEFAULT 'pending_review' NOT NULL,
	"source" text DEFAULT 'manual' NOT NULL,
	"visibility" text DEFAULT 'group' NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	"title" text NOT NULL,
	"story" text NOT NULL,
	"location_text" text,
	"latitude" text,
	"longitude" text,
	"group_id" text,
	"created_by_id" text NOT NULL,
	"verified_by_id" text,
	"verified_at" timestamp with time zone,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mission_activity_media" (
	"id" text PRIMARY KEY NOT NULL,
	"activity_id" text NOT NULL,
	"type" text DEFAULT 'image' NOT NULL,
	"url" text NOT NULL,
	"caption" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mission_activity_participants" (
	"id" text PRIMARY KEY NOT NULL,
	"activity_id" text NOT NULL,
	"member_id" text NOT NULL,
	"role" text DEFAULT 'participant' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "mission_activities" ADD CONSTRAINT "mission_activities_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mission_activities" ADD CONSTRAINT "mission_activities_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mission_activities" ADD CONSTRAINT "mission_activities_verified_by_id_users_id_fk" FOREIGN KEY ("verified_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mission_activity_media" ADD CONSTRAINT "mission_activity_media_activity_id_mission_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."mission_activities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mission_activity_participants" ADD CONSTRAINT "mission_activity_participants_activity_id_mission_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."mission_activities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mission_activity_participants" ADD CONSTRAINT "mission_activity_participants_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "mission_activities_occurred_at_idx" ON "mission_activities" USING btree ("occurred_at");--> statement-breakpoint
CREATE INDEX "mission_activities_type_idx" ON "mission_activities" USING btree ("type");--> statement-breakpoint
CREATE INDEX "mission_activities_status_idx" ON "mission_activities" USING btree ("status");--> statement-breakpoint
CREATE INDEX "mission_activities_visibility_idx" ON "mission_activities" USING btree ("visibility");--> statement-breakpoint
CREATE INDEX "mission_activities_group_id_idx" ON "mission_activities" USING btree ("group_id");--> statement-breakpoint
CREATE INDEX "mission_activities_created_by_id_idx" ON "mission_activities" USING btree ("created_by_id");--> statement-breakpoint
CREATE INDEX "mission_activity_media_activity_id_idx" ON "mission_activity_media" USING btree ("activity_id");--> statement-breakpoint
CREATE INDEX "mission_activity_media_sort_order_idx" ON "mission_activity_media" USING btree ("activity_id","sort_order");--> statement-breakpoint
CREATE UNIQUE INDEX "mission_activity_participants_activity_member_uniq" ON "mission_activity_participants" USING btree ("activity_id","member_id");--> statement-breakpoint
CREATE INDEX "mission_activity_participants_activity_id_idx" ON "mission_activity_participants" USING btree ("activity_id");--> statement-breakpoint
CREATE INDEX "mission_activity_participants_member_id_idx" ON "mission_activity_participants" USING btree ("member_id");