-- Create review_items table for Spaced Repetition System (SRS)
CREATE TABLE IF NOT EXISTS review_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Link to the original post/analysis
  post_id UUID REFERENCES public.user_posts(id) ON DELETE SET NULL,
  
  -- Vocabulary being reviewed
  vocabulary_base TEXT NOT NULL,        -- Ex: "Maçã" (native language)
  vocabulary_target TEXT NOT NULL,      -- Ex: "Apple" (target language)
  vocabulary_target_pinyin TEXT,         -- Pinyin if applicable
  context_sentence TEXT,                -- Example sentence
  context_sentence_pinyin TEXT,          -- Pinyin for sentence
  example_phrases JSONB,                -- Array of example phrases
  
  -- SRS Algorithm Data (SM-2 simplified)
  interval_days INTEGER DEFAULT 0,     -- Days until next review
  ease_factor NUMERIC DEFAULT 2.5,     -- Ease factor multiplier (SM-2 default)
  repetitions INTEGER DEFAULT 0,       -- Consecutive successful reviews
  
  -- Critical dates
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  next_review_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,  -- Key date for scheduling!
  last_reviewed_at TIMESTAMPTZ,         -- When was it last reviewed
  
  -- Additional metadata
  image_url TEXT,                       -- Link to original image
  difficulty_level TEXT DEFAULT 'new',   -- new, learning, mastered
  
  -- Ensure one review item per vocabulary per user (can have multiple from different posts)
  UNIQUE(user_id, vocabulary_target, post_id)
);

-- Index for quickly finding items that need review TODAY
CREATE INDEX IF NOT EXISTS review_items_next_review_idx 
  ON review_items (user_id, next_review_at) 
  WHERE next_review_at <= NOW();

-- Index for user's review queue
CREATE INDEX IF NOT EXISTS review_items_user_queue_idx 
  ON review_items (user_id, next_review_at ASC);

-- Index for post lookup
CREATE INDEX IF NOT EXISTS review_items_post_id_idx 
  ON review_items (post_id);

-- RLS (Row Level Security)
ALTER TABLE review_items ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own review items
CREATE POLICY "Users own reviews" 
  ON review_items 
  FOR ALL 
  USING (auth.uid() = user_id);

-- Function to update next_review_at based on SRS algorithm
CREATE OR REPLACE FUNCTION calculate_next_review(
  current_interval INTEGER,
  ease_factor NUMERIC,
  repetitions INTEGER,
  grade TEXT -- 'again', 'hard', 'good', 'easy'
) RETURNS INTEGER AS $$
DECLARE
  new_interval INTEGER;
  new_ease NUMERIC;
BEGIN
  -- SM-2 Algorithm simplified
  IF grade = 'again' THEN
    -- Reset: review in 10 minutes (0 days, but we'll use 0.01 days = ~14 minutes)
    new_interval := 0;
    new_ease := GREATEST(1.3, ease_factor - 0.2);
  ELSIF grade = 'hard' THEN
    -- Review in 1 day
    new_interval := 1;
    new_ease := GREATEST(1.3, ease_factor - 0.15);
  ELSIF grade = 'good' THEN
    -- Standard progression
    IF repetitions = 0 THEN
      new_interval := 1;
    ELSIF repetitions = 1 THEN
      new_interval := 3;
    ELSE
      new_interval := ROUND(current_interval * ease_factor)::INTEGER;
    END IF;
    new_ease := ease_factor; -- No change for 'good'
  ELSIF grade = 'easy' THEN
    -- Faster progression
    IF repetitions = 0 THEN
      new_interval := 2;
    ELSIF repetitions = 1 THEN
      new_interval := 5;
    ELSE
      new_interval := ROUND(current_interval * ease_factor * 1.3)::INTEGER;
    END IF;
    new_ease := ease_factor + 0.15;
  ELSE
    -- Default to 'good' behavior
    new_interval := 1;
    new_ease := ease_factor;
  END IF;
  
  RETURN new_interval;
END;
$$ LANGUAGE plpgsql;

-- Add comment for clarity
COMMENT ON TABLE review_items IS 'Manages spaced repetition system (SRS) for vocabulary learning';
COMMENT ON COLUMN review_items.interval_days IS 'Days until next review (calculated by SRS algorithm)';
COMMENT ON COLUMN review_items.ease_factor IS 'Ease factor for SM-2 algorithm (default 2.5)';
COMMENT ON COLUMN review_items.next_review_at IS 'When this item should be reviewed next (key for scheduling)';







