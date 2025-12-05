/**
 * Detect the language of a text string and return appropriate TTS language code
 */
export function detectLanguageForTTS(text: string): string {
  if (!text || text.trim().length === 0) {
    return "en-US"; // Default to English
  }

  const trimmedText = text.trim();

  // Check for Chinese characters (Simplified or Traditional)
  if (/[\u4e00-\u9fff]/.test(trimmedText)) {
    return "zh-CN";
  }

  // Check for Arabic characters
  if (/[\u0600-\u06FF]/.test(trimmedText)) {
    return "ar-SA";
  }

  // Check for Japanese characters (Hiragana, Katakana, Kanji)
  if (/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(trimmedText)) {
    return "ja-JP";
  }

  // Check for Korean characters
  if (/[\uAC00-\uD7AF]/.test(trimmedText)) {
    return "ko-KR";
  }

  // Check for Russian/Cyrillic
  if (/[\u0400-\u04FF]/.test(trimmedText)) {
    return "ru-RU";
  }

  // Check for Hindi/Devanagari
  if (/[\u0900-\u097F]/.test(trimmedText)) {
    return "hi-IN";
  }

  // Check for Spanish (common patterns)
  if (/[áéíóúñü¿¡]/.test(trimmedText.toLowerCase()) || 
      /\b(el|la|los|las|un|una|es|está|están|con|por|para|de|del|en|sobre)\b/i.test(trimmedText)) {
    return "es-ES";
  }

  // Check for French (common patterns)
  if (/[àâäéèêëïîôùûüÿç]/.test(trimmedText.toLowerCase()) ||
      /\b(le|la|les|un|une|est|sont|avec|pour|de|du|dans|sur)\b/i.test(trimmedText)) {
    return "fr-FR";
  }

  // Check for German (common patterns)
  if (/[äöüß]/.test(trimmedText.toLowerCase()) ||
      /\b(der|die|das|ein|eine|ist|sind|mit|für|von|in|auf)\b/i.test(trimmedText)) {
    return "de-DE";
  }

  // Check for Italian (common patterns)
  if (/[àèéìíîòóùú]/.test(trimmedText.toLowerCase()) ||
      /\b(il|la|lo|gli|le|un|una|è|sono|con|per|di|del|in|su)\b/i.test(trimmedText)) {
    return "it-IT";
  }

  // Check for Portuguese (common patterns)
  if (/[àáâãéêíóôõúç]/.test(trimmedText.toLowerCase()) ||
      /\b(o|a|os|as|um|uma|é|são|com|por|para|de|do|da|em|sobre)\b/i.test(trimmedText)) {
    return "pt-BR";
  }

  // Default to English
  return "en-US";
}

/**
 * Map language codes to TTS language codes
 */
export function mapLanguageCodeToTTS(langCode: string): string {
  const langMap: Record<string, string> = {
    zh: "zh-CN",
    "zh-CN": "zh-CN",
    "zh-TW": "zh-TW",
    en: "en-US",
    "en-US": "en-US",
    "en-GB": "en-GB",
    es: "es-ES",
    "es-ES": "es-ES",
    "es-MX": "es-MX",
    fr: "fr-FR",
    "fr-FR": "fr-FR",
    de: "de-DE",
    "de-DE": "de-DE",
    it: "it-IT",
    "it-IT": "it-IT",
    pt: "pt-BR",
    "pt-BR": "pt-BR",
    "pt-PT": "pt-PT",
    ru: "ru-RU",
    "ru-RU": "ru-RU",
    ja: "ja-JP",
    "ja-JP": "ja-JP",
    ko: "ko-KR",
    "ko-KR": "ko-KR",
    ar: "ar-SA",
    "ar-SA": "ar-SA",
    hi: "hi-IN",
    "hi-IN": "hi-IN",
  };

  return langMap[langCode] || "en-US";
}







