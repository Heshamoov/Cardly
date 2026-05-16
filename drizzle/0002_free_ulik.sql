CREATE TABLE `rsvp_responses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`invitationSlug` varchar(16) NOT NULL,
	`guestName` varchar(128) NOT NULL,
	`partySize` int NOT NULL DEFAULT 1,
	`message` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `rsvp_responses_id` PRIMARY KEY(`id`)
);
