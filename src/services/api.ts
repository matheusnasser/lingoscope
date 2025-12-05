import axios, { AxiosInstance, AxiosError } from 'axios';
import * as ImageManipulator from 'expo-image-manipulator';
import { supabase } from '../config/supabase';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const EDGE_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/analyze-user-image`;

// Backend response format (direct data object)
export interface AnalyzeImageBackendResponse {
  detectedObjectBase: string;
  detectedObjectTarget: string;
  detectedObjectTargetPinyin?: string; // Pinyin for detected object in target language
  contextSentence: string;
  contextSentencePinyin?: string; // Pinyin for context sentence
  contextFoundPhrase?: string; // Phrase found on the picture in base language
  examplePhrases: Array<{ base: string; target: string; targetPinyin?: string }>;
  storagePath: string;
  pinyin?: string; // Optional pinyin for Chinese characters (legacy, use detectedObjectTargetPinyin)
}

// Frontend service response format
export interface AnalyzeImageResponse {
  success: boolean;
  data?: AnalyzeImageBackendResponse;
  error?: string;
}

class ApiService {
  private axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: EDGE_FUNCTION_URL,
      timeout: 30000, // 30 seconds timeout
    });
  }

  /**
   * Get the current session access token
   */
  private async getAccessToken(): Promise<string | null> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return session?.access_token || null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get current user ID from session
   */
  private async getUserId(): Promise<string | null> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return session?.user?.id || null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Compress image before uploading
   * @param imageUri - Local URI of the image file
   * @returns Compressed image URI
   */
  private async compressImage(imageUri: string): Promise<string> {
    try {
      const manipResult = await ImageManipulator.manipulateAsync(
        imageUri,
        [],
        {
          compress: 0.8,
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );

      return manipResult.uri;
    } catch (error) {
      return imageUri;
    }
  }

  /**
   * Analyze user image or video
   * @param imageUri - Local URI of the image/video file
   * @param baseLanguage - User's native/base language code (e.g., 'en', 'pt')
   * @param targetLanguage - User's target language code (e.g., 'en', 'es')
   * @param isVideo - Whether the file is a video
   * @returns Analysis result from the backend
   */
  async analyzeUserImage(
    imageUri: string,
    baseLanguage: string,
    targetLanguage: string,
    isVideo: boolean = false
  ): Promise<AnalyzeImageResponse> {
    try {
      const accessToken = await this.getAccessToken();
      const userId = await this.getUserId();
      
      if (!accessToken) {
        return {
          success: false,
          error: 'Authentication required. Please sign in.',
        };
      }

      if (!baseLanguage || !targetLanguage) {
        return {
          success: false,
          error: 'Language preferences not set. Please complete onboarding.',
        };
      }

      // Determine file type and process accordingly
      let processedUri = imageUri;
      let fileType = 'image/jpeg';
      let fileName = 'image.jpg';

      // Check if it's a GIF (converted from video)
      const isGif = imageUri.includes('.gif') || imageUri.toLowerCase().endsWith('gif');
      
      if (isVideo && !isGif) {
        // For videos, send directly (max 4 seconds)
        fileType = 'video/mp4';
        fileName = 'video.mp4';
        // Videos are sent as-is, no compression needed
      } else if (isGif) {
        // For GIFs (converted from video), send as GIF
        fileType = 'image/gif';
        fileName = 'video.gif';
        // GIFs are already processed, no compression needed
      } else {
        // Compress image before uploading
        processedUri = await this.compressImage(imageUri);
      }

      // Create FormData
      const formData = new FormData();
      
      // Add processed image/video file
      // For React Native, we need to convert the URI to a file-like object
      const mediaFile = {
        uri: processedUri,
        type: fileType,
        name: fileName,
      } as any;
      
      formData.append('image', mediaFile);
      formData.append('baseLanguage', baseLanguage);
      formData.append('targetLanguage', targetLanguage);
      
      // Add userId if available (optional, backend defaults to 'anonymous')
      if (userId) {
        formData.append('userId', userId);
      }

      // Make the request
      const response = await this.axiosInstance.post<AnalyzeImageBackendResponse>(
        '',
        formData,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      // Backend returns the data directly, not wrapped
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<{ error?: string; message?: string }>;
        
        return {
          success: false,
          error: axiosError.response?.data?.error || 
                 axiosError.response?.data?.message || 
                 axiosError.message || 
                 'Failed to analyze image',
        };
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }
}

export const apiService = new ApiService();

