ALTER TABLE `subscriptions` MODIFY COLUMN `stripeSubscriptionId` varchar(128);--> statement-breakpoint
ALTER TABLE `subscriptions` MODIFY COLUMN `stripeCustomerId` varchar(128);--> statement-breakpoint
ALTER TABLE `subscriptions` ADD `plan` varchar(16) DEFAULT 'stripe' NOT NULL;