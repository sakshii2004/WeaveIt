CREATE TABLE "scene_plays" (
	"id" uuid PRIMARY KEY NOT NULL,
	"scene_id" uuid NOT NULL,
	"content" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"purpose_note" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "scene_plays_scene_id_unique" UNIQUE("scene_id")
);
--> statement-breakpoint
ALTER TABLE "scene_plays" ADD CONSTRAINT "scene_plays_scene_id_scenes_id_fk" FOREIGN KEY ("scene_id") REFERENCES "public"."scenes"("id") ON DELETE cascade ON UPDATE no action;