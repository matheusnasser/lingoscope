import { supabase } from "../../config/supabase";

export interface CapturedImage {
  id: string;
  name: string;
  path: string;
  url: string;
  storage_path: string;
  detected_object_base?: string;
  detected_object_target?: string;
  detected_object_target_pinyin?: string; // Pinyin for detected object in target language
  context_sentence?: string;
  context_sentence_pinyin?: string; // Pinyin for context sentence
  example_phrases?: Array<{
    base: string;
    target: string;
    targetPinyin?: string;
  }>;
  pinyin?: string; // Legacy field, use detected_object_target_pinyin
  created_at?: string;
}

class StorageService {
  /**
   * Get public URL for an image in storage
   */
  getPublicUrl(path: string): string {
    try {
      const { data: imageUrl } = supabase.storage
        .from("captures")
        .getPublicUrl(path);

      if (!imageUrl?.publicUrl) {
        return "";
      }

      return imageUrl.publicUrl;
    } catch (error) {
      return "";
    }
  }

  /**
   * Verify bucket exists and is accessible
   */
  async verifyBucket(): Promise<boolean> {
    try {
      const { error } = await supabase.storage
        .from("captures")
        .list("", { limit: 1 });

      if (error) {
        return false;
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * List all images for a user from user_posts table
   */
  async getUserImages(userId: string): Promise<CapturedImage[]> {
    try {
      await this.verifyBucket();

      const { data, error } = await supabase
        .from("user_posts")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) {
        return [];
      }

      if (!data || data.length === 0) {
        return [];
      }

      return data.map((post) => {
        const storagePath = post.storage_path || "";
        const fileName = storagePath.split("/").pop() || "image.jpg";
        const aiData = post.ai_data || {};

        return {
          id: post.id,
          name: fileName,
          path: storagePath,
          storage_path: storagePath,
          url: this.getPublicUrl(storagePath),
          detected_object_base:
            aiData.detectedObjectBase || aiData.detected_object_base,
          detected_object_target:
            aiData.detectedObjectTarget || aiData.detected_object_target,
          detected_object_target_pinyin:
            aiData.detectedObjectTargetPinyin ||
            aiData.detected_object_target_pinyin ||
            aiData.pinyin,
          context_sentence: aiData.contextSentence || aiData.context_sentence,
          context_sentence_pinyin:
            aiData.contextSentencePinyin || aiData.context_sentence_pinyin,
          example_phrases:
            aiData.examplePhrases || aiData.example_phrases || [],
          pinyin:
            aiData.pinyin ||
            aiData.detectedObjectTargetPinyin ||
            aiData.detected_object_target_pinyin, // Legacy support
          created_at: post.created_at,
        };
      });
    } catch (error) {
      return [];
    }
  }

  /**
   * Get a single post by ID
   */
  async getPostById(postId: string): Promise<CapturedImage | null> {
    try {
      const { data, error } = await supabase
        .from("user_posts")
        .select("*")
        .eq("id", postId)
        .single();

      if (error) {
        return null;
      }

      if (!data) return null;

      const storagePath = data.storage_path || "";
      const fileName = storagePath.split("/").pop() || "image.jpg";

      // Parse ai_data JSONB field
      const aiData = data.ai_data || {};

      return {
        id: data.id,
        name: fileName,
        path: storagePath,
        storage_path: storagePath,
        url: this.getPublicUrl(storagePath),
        detected_object_base:
          aiData.detectedObjectBase || aiData.detected_object_base,
        detected_object_target:
          aiData.detectedObjectTarget || aiData.detected_object_target,
        detected_object_target_pinyin:
          aiData.detectedObjectTargetPinyin ||
          aiData.detected_object_target_pinyin ||
          aiData.pinyin,
        context_sentence: aiData.contextSentence || aiData.context_sentence,
        context_sentence_pinyin:
          aiData.contextSentencePinyin || aiData.context_sentence_pinyin,
        example_phrases: aiData.examplePhrases || aiData.example_phrases || [],
        pinyin:
          aiData.pinyin ||
          aiData.detectedObjectTargetPinyin ||
          aiData.detected_object_target_pinyin, // Legacy support
        created_at: data.created_at,
      };
    } catch (error) {
      return null;
    }
  }
}

export const storageService = new StorageService();
