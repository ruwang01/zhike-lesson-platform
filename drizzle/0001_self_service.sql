ALTER TABLE site_accounts ADD COLUMN last_login INTEGER;
--> statement-breakpoint
ALTER TABLE site_accounts ADD COLUMN first_used INTEGER;
--> statement-breakpoint
ALTER TABLE site_accounts ADD COLUMN last_used INTEGER;
--> statement-breakpoint
CREATE TABLE site_daily_active(user_id TEXT NOT NULL REFERENCES auth_user(id) ON DELETE CASCADE,day TEXT NOT NULL,PRIMARY KEY(user_id,day));
--> statement-breakpoint
CREATE TABLE site_request_limits(key TEXT PRIMARY KEY,count INTEGER NOT NULL,expires_at INTEGER NOT NULL);
--> statement-breakpoint
CREATE TABLE admin_audit(id TEXT PRIMARY KEY,admin_id TEXT NOT NULL,target_id TEXT NOT NULL,action TEXT NOT NULL,reason TEXT NOT NULL,created_at INTEGER NOT NULL);
