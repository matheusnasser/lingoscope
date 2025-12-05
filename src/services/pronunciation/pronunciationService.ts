import axios, { AxiosInstance } from "axios";
import { Platform } from "react-native";
import { supabase } from "../../config/supabase";

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || "";
const PRONUNCIATION_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/check-pronunciation`;

export interface PronunciationFeedback {
  success: boolean;
  transcribedText?: string;
  score: number;
  hints: string[];
  error?: string;
}

class PronunciationService {
  private axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: PRONUNCIATION_FUNCTION_URL,
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

  async checkPronunciation(
    audioUri: string,
    targetText: string,
    language: string = "en"
  ): Promise<PronunciationFeedback> {
    try {
      const accessToken = await this.getAccessToken();

      if (!accessToken) {
        return {
          success: false,
          score: 0,
          hints: ["Authentication required. Please sign in."],
          error: "Authentication required",
        };
      }

      // Create FormData
      const formData = new FormData();
      
      // Determine file extension and mime type based on platform
      // expo-av default HIGH_QUALITY is usually m4a (AAC)
      const fileType = Platform.OS === 'android' ? 'audio/m4a' : 'audio/m4a';
      const fileName = 'recording.m4a';

      // Convert URI to file-like object for React Native
      const audioFile = {
        uri: audioUri,
        type: fileType,
        name: fileName,
      } as any;

      formData.append("audio", audioFile);
      formData.append("targetText", targetText);
      formData.append("language", language);

      const response = await this.axiosInstance.post<PronunciationFeedback>(
        "",
        formData,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      return response.data;
    } catch (error: any) {
      console.error("Error checking pronunciation:", error);
      return {
        success: false,
        score: 0,
        hints: [
          error.response?.data?.error ||
            error.message ||
            "Failed to check pronunciation. Please try again.",
        ],
        error: error.message,
      };
    }
  }
}

export const pronunciationService = new PronunciationService();
