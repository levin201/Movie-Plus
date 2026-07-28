-- Add subscription_expiry column to users table
-- New users get 3-month trial from registration date
ALTER TABLE users ADD COLUMN subscription_expiry INTEGER;
-- Set existing users to never expire (0 = never)
UPDATE users SET subscription_expiry = 0 WHERE subscription_expiry IS NULL;
