import { supabase } from '../../config/supabase';
import { storageService, CapturedImage } from '../storage/storageService';

export interface ReviewItem {
  id: string;
  user_id: string;
  post_id: string | null;
  vocabulary_base: string;
  vocabulary_target: string;
  vocabulary_target_pinyin?: string;
  context_sentence?: string;
  context_sentence_pinyin?: string;
  example_phrases?: Array<{
    base: string;
    target: string;
    targetPinyin?: string;
  }>;
  interval_days: number;
  ease_factor: number;
  repetitions: number;
  created_at: string;
  next_review_at: string;
  last_reviewed_at: string | null;
  image_url?: string;
  difficulty_level: 'new' | 'learning' | 'mastered';
}

export type ReviewGrade = 'again' | 'hard' | 'good' | 'easy';

class SRSService {
  /**
   * Get review items due for review (next_review_at <= now)
   */
  async getDueReviews(userId: string, limit?: number): Promise<ReviewItem[]> {
    try {
      let query = supabase
        .from('review_items')
        .select('*')
        .eq('user_id', userId)
        .lte('next_review_at', new Date().toISOString())
        .order('next_review_at', { ascending: true });

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []) as ReviewItem[];
    } catch (error) {
      console.error('Error getting due reviews:', error);
      return [];
    }
  }

  /**
   * Get count of items due for review
   */
  async getDueReviewCount(userId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('review_items')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .lte('next_review_at', new Date().toISOString());

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('Error getting due review count:', error);
      return 0;
    }
  }

  /**
   * Create review items from existing captured photos
   * This ensures all captured photos can be reviewed
   */
  async createReviewItemsFromExistingPosts(userId: string): Promise<number> {
    try {
      // Get all user posts
      const posts = await storageService.getUserImages(userId);
      
      if (posts.length === 0) {
        return 0;
      }

      // Get existing review items to avoid duplicates
      const { data: existingItems } = await supabase
        .from('review_items')
        .select('post_id')
        .eq('user_id', userId);

      const existingPostIds = new Set(
        (existingItems || [])
          .map(item => item.post_id)
          .filter(Boolean)
      );

      // Filter posts that don't have review items yet
      const postsToProcess = posts.filter(
        post => post.detected_object_base && 
                post.detected_object_target &&
                !existingPostIds.has(post.id)
      );

      if (postsToProcess.length === 0) {
        return 0;
      }

      // Set initial review for tomorrow (1 day)
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      // Create review items in batch
      const reviewItemsToInsert = postsToProcess.map(post => ({
        user_id: userId,
        post_id: post.id,
        vocabulary_base: post.detected_object_base || '',
        vocabulary_target: post.detected_object_target || '',
        vocabulary_target_pinyin: post.detected_object_target_pinyin || null,
        context_sentence: post.context_sentence || null,
        context_sentence_pinyin: post.context_sentence_pinyin || null,
        example_phrases: post.example_phrases || null,
        image_url: post.url || null,
        interval_days: 1,
        ease_factor: 2.5,
        repetitions: 0,
        next_review_at: tomorrow.toISOString(),
        difficulty_level: 'new' as const,
      }));

      // Insert in batches of 50 to avoid hitting limits
      let created = 0;
      for (let i = 0; i < reviewItemsToInsert.length; i += 50) {
        const batch = reviewItemsToInsert.slice(i, i + 50);
        const { error } = await supabase
          .from('review_items')
          .insert(batch);

        if (error) {
          console.error(`Error creating review items batch ${i}:`, error);
          // Continue with next batch
          continue;
        }
        created += batch.length;
      }

      return created;
    } catch (error) {
      console.error('Error creating review items from existing posts:', error);
      return 0;
    }
  }

  /**
   * Create review item from analysis result
   */
  async createReviewItem(
    userId: string,
    data: {
      postId?: string;
      vocabularyBase: string;
      vocabularyTarget: string;
      vocabularyTargetPinyin?: string;
      contextSentence?: string;
      contextSentencePinyin?: string;
      examplePhrases?: Array<{
        base: string;
        target: string;
        targetPinyin?: string;
      }>;
      imageUrl?: string;
    }
  ): Promise<ReviewItem | null> {
    try {
      // Set initial review for tomorrow (1 day)
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      const { data: reviewItem, error } = await supabase
        .from('review_items')
        .insert({
          user_id: userId,
          post_id: data.postId || null,
          vocabulary_base: data.vocabularyBase,
          vocabulary_target: data.vocabularyTarget,
          vocabulary_target_pinyin: data.vocabularyTargetPinyin || null,
          context_sentence: data.contextSentence || null,
          context_sentence_pinyin: data.contextSentencePinyin || null,
          example_phrases: data.examplePhrases || null,
          image_url: data.imageUrl || null,
          interval_days: 1,
          ease_factor: 2.5,
          repetitions: 0,
          next_review_at: tomorrow.toISOString(),
          difficulty_level: 'new',
        })
        .select()
        .single();

      if (error) {
        // If duplicate, try to get existing one
        if (error.code === '23505') {
          const { data: existing } = await supabase
            .from('review_items')
            .select('*')
            .eq('user_id', userId)
            .eq('vocabulary_target', data.vocabularyTarget)
            .eq('post_id', data.postId || null)
            .single();
          return existing as ReviewItem;
        }
        throw error;
      }

      return reviewItem as ReviewItem;
    } catch (error) {
      console.error('Error creating review item:', error);
      return null;
    }
  }

  /**
   * Process a review (update SRS algorithm)
   */
  async processReview(
    reviewItemId: string,
    grade: ReviewGrade
  ): Promise<ReviewItem | null> {
    try {
      // Get current review item
      const { data: currentItem, error: fetchError } = await supabase
        .from('review_items')
        .select('*')
        .eq('id', reviewItemId)
        .single();

      if (fetchError || !currentItem) throw fetchError || new Error('Review item not found');

      // Calculate new interval using SRS algorithm
      let newInterval: number;
      let newEaseFactor: number;
      let newRepetitions: number;

      if (grade === 'again') {
        newInterval = 0; // Review in 10 minutes (we'll use 0.01 days ≈ 14 minutes)
        newEaseFactor = Math.max(1.3, currentItem.ease_factor - 0.2);
        newRepetitions = 0; // Reset repetitions
      } else if (grade === 'hard') {
        newInterval = 1;
        newEaseFactor = Math.max(1.3, currentItem.ease_factor - 0.15);
        newRepetitions = Math.max(0, currentItem.repetitions - 1);
      } else if (grade === 'good') {
        if (currentItem.repetitions === 0) {
          newInterval = 1;
        } else if (currentItem.repetitions === 1) {
          newInterval = 3;
        } else {
          newInterval = Math.round(currentItem.interval_days * currentItem.ease_factor);
        }
        newEaseFactor = currentItem.ease_factor;
        newRepetitions = currentItem.repetitions + 1;
      } else if (grade === 'easy') {
        if (currentItem.repetitions === 0) {
          newInterval = 2;
        } else if (currentItem.repetitions === 1) {
          newInterval = 5;
        } else {
          newInterval = Math.round(currentItem.interval_days * currentItem.ease_factor * 1.3);
        }
        newEaseFactor = currentItem.ease_factor + 0.15;
        newRepetitions = currentItem.repetitions + 1;
      } else {
        // Default to 'good'
        newInterval = 1;
        newEaseFactor = currentItem.ease_factor;
        newRepetitions = currentItem.repetitions + 1;
      }

      // Calculate next review date
      const nextReviewDate = new Date();
      if (newInterval === 0) {
        // Review in 10 minutes
        nextReviewDate.setMinutes(nextReviewDate.getMinutes() + 10);
      } else {
        nextReviewDate.setDate(nextReviewDate.getDate() + newInterval);
        nextReviewDate.setHours(0, 0, 0, 0);
      }

      // Determine difficulty level
      let difficultyLevel: 'new' | 'learning' | 'mastered' = 'learning';
      if (newRepetitions === 0) {
        difficultyLevel = 'new';
      } else if (newInterval >= 7 && newRepetitions >= 3) {
        difficultyLevel = 'mastered';
      }

      // Update review item
      const { data: updatedItem, error: updateError } = await supabase
        .from('review_items')
        .update({
          interval_days: newInterval,
          ease_factor: newEaseFactor,
          repetitions: newRepetitions,
          next_review_at: nextReviewDate.toISOString(),
          last_reviewed_at: new Date().toISOString(),
          difficulty_level: difficultyLevel,
        })
        .eq('id', reviewItemId)
        .select()
        .single();

      if (updateError) throw updateError;
      return updatedItem as ReviewItem;
    } catch (error) {
      console.error('Error processing review:', error);
      return null;
    }
  }

  /**
   * Get all review items for a user (for stats)
   */
  async getAllReviewItems(userId: string): Promise<ReviewItem[]> {
    try {
      const { data, error } = await supabase
        .from('review_items')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as ReviewItem[];
    } catch (error) {
      console.error('Error getting all review items:', error);
      return [];
    }
  }

  /**
   * Get review statistics
   */
  async getReviewStats(userId: string): Promise<{
    total: number;
    due: number;
    new: number;
    learning: number;
    mastered: number;
  }> {
    try {
      const [allItems, dueItems] = await Promise.all([
        this.getAllReviewItems(userId),
        this.getDueReviews(userId),
      ]);

      return {
        total: allItems.length,
        due: dueItems.length,
        new: allItems.filter((item) => item.difficulty_level === 'new').length,
        learning: allItems.filter((item) => item.difficulty_level === 'learning').length,
        mastered: allItems.filter((item) => item.difficulty_level === 'mastered').length,
      };
    } catch (error) {
      console.error('Error getting review stats:', error);
      return {
        total: 0,
        due: 0,
        new: 0,
        learning: 0,
        mastered: 0,
      };
    }
  }
}

export const srsService = new SRSService();
