import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import en from './locales/en.json';
import es from './locales/es.json';
import fr from './locales/fr.json';
import it from './locales/it.json';
import pt from './locales/pt.json';
import zh from './locales/zh.json';
import ar from './locales/ar.json';

// Map language codes to supported locales
const languageMap: Record<string, string> = {
  en: 'en',
  'en-US': 'en',
  'en-GB': 'en',
  es: 'es',
  'es-ES': 'es',
  'es-MX': 'es',
  fr: 'fr',
  'fr-FR': 'fr',
  de: 'en', // German uses English for now (can add later)
  'de-DE': 'en',
  it: 'it',
  'it-IT': 'it',
  pt: 'pt',
  'pt-BR': 'pt',
  'pt-PT': 'pt',
  ru: 'en', // Russian uses English for now
  'ru-RU': 'en',
  ja: 'en', // Japanese uses English for now
  'ja-JP': 'en',
  ko: 'en', // Korean uses English for now
  'ko-KR': 'en',
  zh: 'zh',
  'zh-CN': 'zh',
  'zh-TW': 'zh',
  ar: 'ar',
  'ar-SA': 'ar',
  hi: 'en', // Hindi uses English for now
  'hi-IN': 'en',
};

// Detect device language
const getDeviceLanguage = (): string => {
  try {
    const locale = Localization.locale;
    if (!locale || typeof locale !== 'string') {
      return 'en';
    }
    const langCode = locale.split('-')[0];
    return languageMap[locale] || languageMap[langCode] || 'en';
  } catch (error) {
    console.error('Error detecting device language:', error);
    return 'en';
  }
};

// Initialize i18n with safe language detection
try {
  i18n
    .use(initReactI18next)
    .init({
      compatibilityJSON: 'v3',
      resources: {
        en: { translation: en },
        es: { translation: es },
        fr: { translation: fr },
        it: { translation: it },
        pt: { translation: pt },
        zh: { translation: zh },
        ar: { translation: ar },
      },
      lng: getDeviceLanguage(),
      fallbackLng: 'en',
      interpolation: {
        escapeValue: false,
      },
    });
} catch (error) {
  console.error('Error initializing i18n:', error);
  // Fallback initialization with English
  i18n
    .use(initReactI18next)
    .init({
      compatibilityJSON: 'v3',
      resources: {
        en: { translation: en },
      },
      lng: 'en',
      fallbackLng: 'en',
      interpolation: {
        escapeValue: false,
      },
    });
}

export default i18n;

