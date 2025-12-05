-- Migration: Add is_deleted column to user_posts and review_items for soft deletes

-- Add is_deleted to user_posts
ALTER TABLE IF EXISTS user_posts 
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;

-- Add is_deleted to review_items
ALTER TABLE IF EXISTS review_items 
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;

-- Update RLS Policies for user_posts to exclude deleted items
DROP POLICY IF EXISTS "Users can view their own posts" ON user_posts;
CREATE POLICY "Users can view their own posts" 
ON user_posts 
FOR SELECT 
USING (auth.uid() = user_id AND is_deleted = FALSE);

-- Update RLS Policies for review_items to exclude deleted items
DROP POLICY IF EXISTS "Users own reviews" ON review_items;
CREATE POLICY "Users own reviews" 
ON review_items 
FOR ALL 
USING (auth.uid() = user_id AND is_deleted = FALSE);

-- Index for faster filtering
CREATE INDEX IF NOT EXISTS idx_user_posts_is_deleted ON user_posts(is_deleted);
CREATE INDEX IF NOT EXISTS idx_review_items_is_deleted ON review_items(is_deleted);


