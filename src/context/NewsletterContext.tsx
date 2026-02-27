'use client';

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { NewsletterData } from '@/lib/types';
import type { Lang } from '@/lib/translations';

type Theme = 'light' | 'dark';

interface NewsletterContextValue {
  data: NewsletterData | null;
  setData: (data: NewsletterData | null) => void;
  lang: Lang;
  setLang: (lang: Lang) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  readerMode: boolean;
  setReaderMode: (v: boolean) => void;
  error: string | null;
  setError: (err: string | null) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

const NewsletterContext = createContext<NewsletterContextValue | null>(null);

const LANG_KEY = 'partner-newsletter-lang';
const THEME_KEY = 'partner-newsletter-theme';
const READER_MODE_KEY = 'partner-newsletter-reader-mode';

export function NewsletterProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<NewsletterData | null>(null);
  const [lang, setLangState] = useState<Lang>('it');
  const [theme, setThemeState] = useState<Theme>('light');
  const [readerMode, setReaderModeState] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem(LANG_KEY) as Lang | null;
    if (stored === 'it' || stored === 'en') setLangState(stored);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem(THEME_KEY) as Theme | null;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (stored === 'dark' || stored === 'light') {
      setThemeState(stored);
    } else {
      setThemeState(prefersDark ? 'dark' : 'light');
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(LANG_KEY, lang);
  }, [lang]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(THEME_KEY, theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem(READER_MODE_KEY);
    if (stored === 'true') setReaderModeState(true);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(READER_MODE_KEY, String(readerMode));
    document.documentElement.classList.toggle('reader-mode', readerMode);
  }, [readerMode]);

  const setLang = useCallback((l: Lang) => setLangState(l), []);
  const setTheme = useCallback((t: Theme) => setThemeState(t), []);
  const setReaderMode = useCallback((v: boolean) => setReaderModeState(v), []);

  return (
    <NewsletterContext.Provider
      value={{
        data,
        setData,
        lang,
        setLang,
        theme,
        setTheme,
        readerMode,
        setReaderMode,
        error,
        setError,
        loading,
        setLoading,
      }}
    >
      {children}
    </NewsletterContext.Provider>
  );
}

export function useNewsletter() {
  const ctx = useContext(NewsletterContext);
  if (!ctx) throw new Error('useNewsletter must be used within NewsletterProvider');
  return ctx;
}
