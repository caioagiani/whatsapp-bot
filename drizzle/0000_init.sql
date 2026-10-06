CREATE TABLE `chats` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text,
	`is_group` integer DEFAULT false NOT NULL,
	`unread_count` integer DEFAULT 0 NOT NULL,
	`archived` integer DEFAULT false NOT NULL,
	`pinned` integer DEFAULT false NOT NULL,
	`muted` integer DEFAULT false NOT NULL,
	`last_message_id` text,
	`last_message_at` integer DEFAULT 0 NOT NULL,
	`last_message_preview` text,
	`last_message_type` text,
	`last_message_from_me` integer,
	`last_message_ack` integer,
	`history_complete` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE INDEX `chats_last_message_idx` ON `chats` (`archived`,`pinned`,`last_message_at`);--> statement-breakpoint
CREATE TABLE `contacts` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text,
	`pushname` text,
	`number` text,
	`is_my_contact` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` text PRIMARY KEY NOT NULL,
	`chat_id` text NOT NULL,
	`from_me` integer NOT NULL,
	`author` text,
	`author_name` text,
	`body` text DEFAULT '' NOT NULL,
	`type` text NOT NULL,
	`timestamp` integer NOT NULL,
	`ack` integer DEFAULT 0 NOT NULL,
	`has_media` integer DEFAULT false NOT NULL,
	`media_mime` text,
	`media_filename` text,
	`media_path` text,
	`duration` integer,
	`quoted_id` text,
	`quoted_body` text,
	`quoted_author` text,
	`is_forwarded` integer DEFAULT false NOT NULL,
	`revoked` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE INDEX `messages_chat_time_idx` ON `messages` (`chat_id`,`timestamp`);