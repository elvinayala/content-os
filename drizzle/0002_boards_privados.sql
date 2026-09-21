CREATE TABLE "pulse_board_members" (
	"board_id" uuid NOT NULL,
	"user_id" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "pulse_boards" ADD COLUMN "privado" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "pulse_board_members" ADD CONSTRAINT "pulse_board_members_board_id_pulse_boards_id_fk" FOREIGN KEY ("board_id") REFERENCES "public"."pulse_boards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pulse_board_members" ADD CONSTRAINT "pulse_board_members_user_id_pulse_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."pulse_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "pulse_board_members_pk" ON "pulse_board_members" USING btree ("board_id","user_id");