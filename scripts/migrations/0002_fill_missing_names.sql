-- 0002_fill_missing_names.sql
-- Fill NULL/empty `name` in users using the local-part of the email where available.
-- This is safe and idempotent for production and dev databases.

UPDATE users
SET name = SUBSTRING_INDEX(email, '@', 1)
WHERE (name IS NULL OR TRIM(name) = '')
  AND email IS NOT NULL
  AND TRIM(email) <> '';
