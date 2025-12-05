import axios, { AxiosInstance } from "axios";
import { supabase } from "../../config/supabase";

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || "";
const VOCABULARY_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/generate-vocabulary-suggestions`;

export interface VocabularySuggestion {
  target: string;
  base: string;
  pinyin?: string;
  contextSentence: string;
  suggestion: string;
}

export interface VocabularySuggestionsResponse {
  success: boolean;
  suggestions: VocabularySuggestion[];
  error?: string;
}

class VocabularyService {
  private axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: VOCABULARY_FUNCTION_URL,
      timeout: 30000,
    });
  }

  private async getAccessToken(): Promise<string | null> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return session?.access_token || null;
    } catch (error) {
      return null;
    }
  }

  async generateSuggestions(): Promise<VocabularySuggestionsResponse> {
    try {
      const accessToken = await this.getAccessToken();

      if (!accessToken) {
        return {
          success: false,
          suggestions: [],
          error: "Authentication required. Please sign in.",
        };
      }

      const response = await this.axiosInstance.post<VocabularySuggestionsResponse>(
        "",
        {},
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      return response.data;
    } catch (error: any) {
      console.error("Error generating vocabulary suggestions:", error);
      return {
        success: false,
        suggestions: [],
        error:
          error.response?.data?.error ||
          error.message ||
          "Failed to generate suggestions. Please try again.",
      };
    }
  }
}

export const vocabularyService = new VocabularyService();



