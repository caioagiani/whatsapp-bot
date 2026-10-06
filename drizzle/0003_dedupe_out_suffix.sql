-- Sent messages were stored twice: once with the `_out` suffix newer WhatsApp
-- Web builds put in `$1`, once with the plain key from history fetches.
-- Merge into the plain id.
UPDATE `messages` SET
	`ack` = max(`ack`, coalesce((SELECT o.`ack` FROM `messages` o WHERE o.`id` = `messages`.`id` || '_out'), 0)),
	`media_path` = coalesce(`media_path`, (SELECT o.`media_path` FROM `messages` o WHERE o.`id` = `messages`.`id` || '_out'))
WHERE EXISTS (SELECT 1 FROM `messages` o WHERE o.`id` = `messages`.`id` || '_out');
--> statement-breakpoint
DELETE FROM `messages`
WHERE `id` LIKE '%\_out' ESCAPE '\'
	AND substr(`id`, 1, length(`id`) - 4) IN (SELECT `id` FROM `messages`);
--> statement-breakpoint
UPDATE `messages` SET `id` = substr(`id`, 1, length(`id`) - 4)
WHERE `id` LIKE '%\_out' ESCAPE '\';
--> statement-breakpoint
UPDATE `chats` SET `last_message_id` = substr(`last_message_id`, 1, length(`last_message_id`) - 4)
WHERE `last_message_id` LIKE '%\_out' ESCAPE '\';
