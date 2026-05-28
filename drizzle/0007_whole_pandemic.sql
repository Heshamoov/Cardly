CREATE TABLE `payments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`invitationId` int NOT NULL,
	`stripePaymentIntentId` varchar(128) NOT NULL,
	`amount` int NOT NULL,
	`currency` varchar(3) NOT NULL,
	`status` enum('pending','succeeded','failed') NOT NULL DEFAULT 'pending',
	`stripeCustomerId` varchar(128),
	`email` varchar(320),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`succeededAt` timestamp,
	CONSTRAINT `payments_id` PRIMARY KEY(`id`),
	CONSTRAINT `payments_stripePaymentIntentId_unique` UNIQUE(`stripePaymentIntentId`)
);
--> statement-breakpoint
ALTER TABLE `invitations` ADD `isPaid` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `invitations` ADD `stripePaymentIntentId` varchar(128);--> statement-breakpoint
ALTER TABLE `invitations` ADD `paidAt` timestamp;--> statement-breakpoint
ALTER TABLE `rsvp_responses` ADD `showOnWall` boolean DEFAULT false NOT NULL;