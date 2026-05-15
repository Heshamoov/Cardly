CREATE TABLE `invitations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(16) NOT NULL,
	`data` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `invitations_id` PRIMARY KEY(`id`),
	CONSTRAINT `invitations_slug_unique` UNIQUE(`slug`)
);
