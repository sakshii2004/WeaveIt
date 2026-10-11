CREATE TABLE "chapters" (
	"id" uuid PRIMARY KEY NOT NULL,
	"project_id" uuid NOT NULL,
	"map_id" uuid,
	"title" text NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "character_custom_fields" (
	"id" uuid PRIMARY KEY NOT NULL,
	"character_id" uuid NOT NULL,
	"key" text NOT NULL,
	"value" text DEFAULT '' NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "character_relationships" (
	"id" uuid PRIMARY KEY NOT NULL,
	"project_id" uuid NOT NULL,
	"source_character_id" uuid NOT NULL,
	"target_character_id" uuid NOT NULL,
	"type" text NOT NULL,
	"description" text,
	"is_directed" boolean DEFAULT true NOT NULL,
	"start_scene_id" uuid,
	"end_scene_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "characters" (
	"id" uuid PRIMARY KEY NOT NULL,
	"project_id" uuid NOT NULL,
	"name" text NOT NULL,
	"image_url" text,
	"role" text DEFAULT 'supporting' NOT NULL,
	"role_custom" text,
	"description" text,
	"personality" text,
	"goals" text,
	"fears" text,
	"background" text,
	"arc" text,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "locations" (
	"id" uuid PRIMARY KEY NOT NULL,
	"project_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"image_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scene_characters" (
	"scene_id" uuid NOT NULL,
	"character_id" uuid NOT NULL,
	"role_in_scene" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "scene_characters_scene_id_character_id_pk" PRIMARY KEY("scene_id","character_id")
);
--> statement-breakpoint
CREATE TABLE "scene_threads" (
	"scene_id" uuid NOT NULL,
	"thread_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "scene_threads_scene_id_thread_id_pk" PRIMARY KEY("scene_id","thread_id")
);
--> statement-breakpoint
CREATE TABLE "threads" (
	"id" uuid PRIMARY KEY NOT NULL,
	"project_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"color" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "scenes" ADD COLUMN "chapter_id" uuid;--> statement-breakpoint
ALTER TABLE "chapters" ADD CONSTRAINT "chapters_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chapters" ADD CONSTRAINT "chapters_map_id_story_maps_id_fk" FOREIGN KEY ("map_id") REFERENCES "public"."story_maps"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "character_custom_fields" ADD CONSTRAINT "character_custom_fields_character_id_characters_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "character_relationships" ADD CONSTRAINT "character_relationships_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "character_relationships" ADD CONSTRAINT "character_relationships_source_character_id_characters_id_fk" FOREIGN KEY ("source_character_id") REFERENCES "public"."characters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "character_relationships" ADD CONSTRAINT "character_relationships_target_character_id_characters_id_fk" FOREIGN KEY ("target_character_id") REFERENCES "public"."characters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "character_relationships" ADD CONSTRAINT "character_relationships_start_scene_id_scenes_id_fk" FOREIGN KEY ("start_scene_id") REFERENCES "public"."scenes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "character_relationships" ADD CONSTRAINT "character_relationships_end_scene_id_scenes_id_fk" FOREIGN KEY ("end_scene_id") REFERENCES "public"."scenes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "characters" ADD CONSTRAINT "characters_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "locations" ADD CONSTRAINT "locations_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scene_characters" ADD CONSTRAINT "scene_characters_scene_id_scenes_id_fk" FOREIGN KEY ("scene_id") REFERENCES "public"."scenes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scene_characters" ADD CONSTRAINT "scene_characters_character_id_characters_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scene_threads" ADD CONSTRAINT "scene_threads_scene_id_scenes_id_fk" FOREIGN KEY ("scene_id") REFERENCES "public"."scenes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scene_threads" ADD CONSTRAINT "scene_threads_thread_id_threads_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."threads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "threads" ADD CONSTRAINT "threads_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scenes" ADD CONSTRAINT "scenes_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scenes" ADD CONSTRAINT "scenes_chapter_id_chapters_id_fk" FOREIGN KEY ("chapter_id") REFERENCES "public"."chapters"("id") ON DELETE set null ON UPDATE no action;