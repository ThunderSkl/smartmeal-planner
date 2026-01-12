CREATE TABLE `shoppingLists` (
	`id` int AUTO_INCREMENT NOT NULL,
	`weeklyMenuId` int NOT NULL,
	`userId` int NOT NULL,
	`items` json NOT NULL,
	`isCompleted` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `shoppingLists_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `userPreferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`allergies` json NOT NULL,
	`dietaryRestrictions` json NOT NULL,
	`nutritionalGoals` json NOT NULL,
	`preferredCuisines` json NOT NULL,
	`dislikedIngredients` json NOT NULL,
	`targetCalories` int DEFAULT 2000,
	`targetProtein` int DEFAULT 50,
	`targetCarbs` int DEFAULT 250,
	`targetFat` int DEFAULT 65,
	`mealsPerDay` int DEFAULT 3,
	`includeSnacks` int DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `userPreferences_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);
--> statement-breakpoint
CREATE TABLE `weeklyMenus` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`menuData` json NOT NULL,
	`nutritionSummary` json NOT NULL,
	`startDate` timestamp NOT NULL,
	`isActive` int DEFAULT 0,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `weeklyMenus_id` PRIMARY KEY(`id`)
);
