CREATE TABLE `subscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerOpenId` varchar(64) NOT NULL,
	`stripeSubscriptionId` varchar(128) NOT NULL,
	`stripeCustomerId` varchar(128) NOT NULL,
	`status` varchar(32) NOT NULL DEFAULT 'active',
	`currentPeriodEnd` timestamp NOT NULL,
	`invitationsUsed` int NOT NULL DEFAULT 0,
	`invitationsLimit` int NOT NULL DEFAULT 10,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `subscriptions_id` PRIMARY KEY(`id`),
	CONSTRAINT `subscriptions_ownerOpenId_unique` UNIQUE(`ownerOpenId`),
	CONSTRAINT `subscriptions_stripeSubscriptionId_unique` UNIQUE(`stripeSubscriptionId`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `passwordHash` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `googleId` varchar(128);--> statement-breakpoint
ALTER TABLE `users` ADD `stripeCustomerId` varchar(128);