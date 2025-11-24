import * as VideoThumbnails from 'expo-video-thumbnails';
import * as FileSystem from 'expo-file-system';

/**
 * Convert a short video to GIF by extracting frames
 * For a 4-second video, we extract frames at regular intervals
 * and return the middle frame as a representative image
 */
export async function convertVideoToGif(
  videoUri: string,
  maxDuration: number = 4,
  frameCount: number = 8
): Promise<string | null> {
  try {
    // Extract multiple frames from the video
    const frames: string[] = [];
    const duration = Math.min(maxDuration, 4);
    const interval = duration / frameCount;

    // Extract frames at regular intervals
    for (let i = 0; i < frameCount; i++) {
      const time = Math.min(i * interval, duration - 0.1); // Ensure we don't exceed duration
      try {
        const thumbnail = await VideoThumbnails.getThumbnailAsync(videoUri, {
          time: time * 1000, // Convert to milliseconds
          quality: 0.8,
        });
        frames.push(thumbnail.uri);
      } catch (error) {
        // Skip failed frames
        continue;
      }
    }

    if (frames.length === 0) {
      // Fallback: use middle frame
      try {
        const thumbnail = await VideoThumbnails.getThumbnailAsync(videoUri, {
          time: (duration / 2) * 1000,
          quality: 0.8,
        });
        return thumbnail.uri;
      } catch (error) {
        // Last resort: first frame
        const thumbnail = await VideoThumbnails.getThumbnailAsync(videoUri, {
          time: 0,
          quality: 0.8,
        });
        return thumbnail.uri;
      }
    }

    // Return the middle frame as a representative image
    const middleIndex = Math.floor(frames.length / 2);
    return frames[middleIndex];
  } catch (error) {
    // Fallback: try to get any frame
    try {
      const thumbnail = await VideoThumbnails.getThumbnailAsync(videoUri, {
        time: 0,
        quality: 0.8,
      });
      return thumbnail.uri;
    } catch (fallbackError) {
      return null;
    }
  }
}

/**
 * Check if a file is a video based on its URI/type
 */
export function isVideoFile(uri: string, mimeType?: string): boolean {
  if (mimeType) {
    return mimeType.startsWith('video/');
  }
  return uri.includes('.mp4') || uri.includes('.mov') || uri.includes('.m4v');
}

