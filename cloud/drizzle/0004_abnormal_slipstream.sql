CREATE TABLE `workspace_planning` (
	`workspace` text PRIMARY KEY NOT NULL,
	`payload` text NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`updated` text NOT NULL,
	`updated_by` text,
	FOREIGN KEY (`workspace`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`updated_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
ALTER TABLE `workspace_invites` ADD `department` text DEFAULT 'general' NOT NULL;--> statement-breakpoint
ALTER TABLE `workspace_members` ADD `department` text DEFAULT 'general' NOT NULL;