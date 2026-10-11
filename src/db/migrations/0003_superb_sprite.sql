CREATE TABLE "map_edges" (
	"id" uuid PRIMARY KEY NOT NULL,
	"map_id" uuid NOT NULL,
	"source_node_id" uuid NOT NULL,
	"target_node_id" uuid NOT NULL,
	"edge_type" text DEFAULT 'sequence' NOT NULL,
	"label" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "map_groups" (
	"id" uuid PRIMARY KEY NOT NULL,
	"map_id" uuid NOT NULL,
	"label" text NOT NULL,
	"color" text DEFAULT 'slate' NOT NULL,
	"x" double precision DEFAULT 0 NOT NULL,
	"y" double precision DEFAULT 0 NOT NULL,
	"width" double precision DEFAULT 400 NOT NULL,
	"height" double precision DEFAULT 300 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "map_nodes" (
	"id" uuid PRIMARY KEY NOT NULL,
	"map_id" uuid NOT NULL,
	"scene_id" uuid,
	"character_id" uuid,
	"x" double precision DEFAULT 0 NOT NULL,
	"y" double precision DEFAULT 0 NOT NULL,
	"width" double precision,
	"height" double precision,
	"group_id" uuid,
	"chapter_id" uuid,
	"sequence_index" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "map_edges" ADD CONSTRAINT "map_edges_map_id_story_maps_id_fk" FOREIGN KEY ("map_id") REFERENCES "public"."story_maps"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "map_edges" ADD CONSTRAINT "map_edges_source_node_id_map_nodes_id_fk" FOREIGN KEY ("source_node_id") REFERENCES "public"."map_nodes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "map_edges" ADD CONSTRAINT "map_edges_target_node_id_map_nodes_id_fk" FOREIGN KEY ("target_node_id") REFERENCES "public"."map_nodes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "map_groups" ADD CONSTRAINT "map_groups_map_id_story_maps_id_fk" FOREIGN KEY ("map_id") REFERENCES "public"."story_maps"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "map_nodes" ADD CONSTRAINT "map_nodes_map_id_story_maps_id_fk" FOREIGN KEY ("map_id") REFERENCES "public"."story_maps"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "map_nodes" ADD CONSTRAINT "map_nodes_scene_id_scenes_id_fk" FOREIGN KEY ("scene_id") REFERENCES "public"."scenes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "map_nodes" ADD CONSTRAINT "map_nodes_character_id_characters_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "map_nodes" ADD CONSTRAINT "map_nodes_group_id_map_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."map_groups"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "map_nodes" ADD CONSTRAINT "map_nodes_chapter_id_chapters_id_fk" FOREIGN KEY ("chapter_id") REFERENCES "public"."chapters"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "map_nodes_map_scene_idx" ON "map_nodes" USING btree ("map_id","scene_id");