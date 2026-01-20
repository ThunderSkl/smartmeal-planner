-- Add `password` column (safe for dev). The script caller already checks existence
ALTER TABLE `users` ADD COLUMN `password` varchar(255) NULL DEFAULT NULL;

-- Index creation is attempted by the caller script (DB-specific); omitted here to maximize compatibility.
