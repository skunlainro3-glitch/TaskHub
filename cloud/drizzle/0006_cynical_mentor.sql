CREATE TABLE `quote_audit` (
	`id` text PRIMARY KEY NOT NULL,
	`workspace` text NOT NULL,
	`quote_id` text NOT NULL,
	`actor_id` text,
	`actor_name` text NOT NULL,
	`action` text NOT NULL,
	`from_status` text NOT NULL,
	`to_status` text NOT NULL,
	`version` integer NOT NULL,
	`total` integer NOT NULL,
	`payload` text NOT NULL,
	`note` text NOT NULL,
	`created` text NOT NULL,
	FOREIGN KEY (`workspace`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`quote_id`) REFERENCES `quotes`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`actor_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `quote_audit_quote` ON `quote_audit` (`quote_id`);--> statement-breakpoint
CREATE TABLE `quotes` (
	`id` text PRIMARY KEY NOT NULL,
	`workspace` text NOT NULL,
	`tour_id` text,
	`payload` text NOT NULL,
	`total` integer NOT NULL,
	`status` text NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`created_by` text,
	`reviewed_by` text,
	`reviewed_at` text,
	`created` text NOT NULL,
	`updated` text NOT NULL,
	FOREIGN KEY (`workspace`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tour_id`) REFERENCES `tours`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`reviewed_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "quote_total" CHECK("quotes"."total" >= 0),
	CONSTRAINT "quote_status" CHECK("quotes"."status" IN ('draft','pending','approved','rejected'))
);
--> statement-breakpoint
CREATE INDEX `quotes_workspace` ON `quotes` (`workspace`);--> statement-breakpoint
CREATE TABLE `task_template_runs` (
	`id` text PRIMARY KEY NOT NULL,
	`workspace` text NOT NULL,
	`template_id` text,
	`tour_id` text,
	`template_version` integer NOT NULL,
	`tour_version` integer NOT NULL,
	`token` text NOT NULL,
	`created_by` text,
	`created` text NOT NULL,
	FOREIGN KEY (`workspace`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`template_id`) REFERENCES `task_templates`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`tour_id`) REFERENCES `tours`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `task_template_runs_workspace` ON `task_template_runs` (`workspace`);--> statement-breakpoint
CREATE TABLE `task_templates` (
	`id` text PRIMARY KEY NOT NULL,
	`workspace` text NOT NULL,
	`name` text NOT NULL,
	`entries` text NOT NULL,
	`archived` integer DEFAULT 0 NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`created` text NOT NULL,
	`updated` text NOT NULL,
	FOREIGN KEY (`workspace`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `task_templates_workspace` ON `task_templates` (`workspace`);--> statement-breakpoint
ALTER TABLE `tasks` ADD `assignee_id` text REFERENCES users(id) ON DELETE SET NULL;
