/**
 * Utility functions for handling pinyin (Chinese pronunciation)
 */

/**
 * Check if a string contains Chinese characters
 */
export function containsChinese(text: string): boolean {
  return /[\u4e00-\u9fff]/.test(text);
}

/**
 * Format text to show pinyin if it contains Chinese characters
 */
export function formatWithPinyin(text: string, pinyin?: string): string {
  if (!text) return text;
  
  // If pinyin is provided, use it
  if (pinyin && containsChinese(text)) {
    return `${text} (${pinyin})`;
  }
  
  // Otherwise, just return the text
  return text;
}

/**
 * Extract pinyin from text if it's in format "汉字 (pinyin)"
 */
export function extractPinyin(text: string): { chinese: string; pinyin: string | null } {
  const match = text.match(/^(.+?)\s*\(([^)]+)\)$/);
  if (match) {
    return {
      chinese: match[1].trim(),
      pinyin: match[2].trim(),
    };
  }
  return {
    chinese: text,
    pinyin: null,
  };
}

