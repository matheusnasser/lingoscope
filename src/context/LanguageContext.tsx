import React, { createContext, useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import * as Localization from 'expo-localization';
import { useAuth } from './AuthContext';
import { userService } from '../services/user';
import i18n from '../i18n';

interface LanguageContextType {
  currentLanguage: string;
  changeLanguage: (lang: string) => Promise<void>;
  isLoading: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const [currentLanguage, setCurrentLanguage] = useState<string>('en');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeLanguage = async () => {
      try {
        let langToUse = 'en';

        // First, try to get user's native language preference if logged in
        if (session?.user?.id) {
          try {
            const profile = await userService.getUserProfile(session.user.id);
            if (profile?.native_language) {
              // Map user's native language to i18n language code
              const langMap: Record<string, string> = {
                en: 'en',
                es: 'es',
                fr: 'fr',
                de: 'en', // German falls back to English for now
                it: 'it',
                pt: 'pt',
                ru: 'en',
                ja: 'en',
                ko: 'en',
                zh: 'zh',
                ar: 'ar',
                hi: 'en',
              };
              langToUse = langMap[profile.native_language] || 'en';
            }
          } catch (error) {
            console.error('Error fetching user profile for language:', error);
            // Fall through to device language detection
          }
        }

        // If no user preference, detect device language
        if (langToUse === 'en') {
          try {
            const deviceLocale = Localization.locale;
            if (deviceLocale && typeof deviceLocale === 'string') {
              const deviceLang = deviceLocale.split('-')[0];
              const langMap: Record<string, string> = {
                en: 'en',
                es: 'es',
                fr: 'fr',
                de: 'en',
                it: 'it',
                pt: 'pt',
                zh: 'zh',
                ar: 'ar',
              };
              langToUse = langMap[deviceLang] || 'en';
            }
          } catch (error) {
            console.error('Error detecting device locale:', error);
            // Keep default 'en'
          }
        }

        // Change i18n language
        await i18n.changeLanguage(langToUse);
        setCurrentLanguage(langToUse);
      } catch (error) {
        console.error('Error initializing language:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeLanguage();
  }, [session]);

  const changeLanguage = async (lang: string) => {
    try {
      await i18n.changeLanguage(lang);
      setCurrentLanguage(lang);
    } catch (error) {
      console.error('Error changing language:', error);
    }
  };

  return (
    <LanguageContext.Provider value={{ currentLanguage, changeLanguage, isLoading }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

