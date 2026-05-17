ALTER TABLE `invitations` ADD `views` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `rsvp_responses` ADD `phone` varchar(32);