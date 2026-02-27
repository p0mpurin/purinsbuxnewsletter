'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNewsletter } from '@/context/NewsletterContext';
import { translations, type TranslationKey } from '@/lib/translations';
import type { NewsletterData } from '@/lib/types';

function t(lang: 'it' | 'en', key: TranslationKey) {
  return translations[lang][key] ?? translations.en[key] ?? key;
}

interface QuickBarProps {
  search: string;
  setSearch: (s: string) => void;
  filterPriority: string;
  setFilterPriority: (s: string) => void;
  onExpandAll: () => void;
  onCollapseAll: () => void;
  onOpenFilters: () => void;
  searchInputRef?: React.RefObject<HTMLInputElement | null>;
}

function countByPriority(data: NewsletterData | null, priority: string): number {
  if (!data?.sections) return 0;
  return data.sections.reduce(
    (acc, sec) =>
      acc + (sec.items ?? []).filter((i) => i.priority === priority).length,
    0
  );
}

export function QuickBar({
  search,
  setSearch,
  filterPriority,
  setFilterPriority,
  onExpandAll,
  onCollapseAll,
  onOpenFilters,
  searchInputRef,
}: QuickBarProps) {
  const { lang, data } = useNewsletter();
  const [localSearch, setLocalSearch] = useState(search);
  const localRef = useRef<HTMLInputElement>(null);
  const inputRef = searchInputRef ?? localRef;

  useEffect(() => {
    setLocalSearch(search);
  }, [search]);

  const debouncedSetSearch = useMemo(() => {
    let timeout: ReturnType<typeof setTimeout>;
    return (v: string) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => setSearch(v), 80);
    };
  }, [setSearch]);

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = e.target.value;
      setLocalSearch(v);
      debouncedSetSearch(v);
    },
    [debouncedSetSearch]
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        e.preventDefault();
        (inputRef as React.RefObject<HTMLInputElement>)?.current?.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [inputRef]);

  const highCount = countByPriority(data, 'HIGH');
  const mediumCount = countByPriority(data, 'MEDIUM');
  const lowCount = countByPriority(data, 'LOW');

  const chips = [
    { value: '', label: t(lang, 'filter_all_priorities') },
    { value: 'HIGH', label: t(lang, 'priority_high'), count: highCount },
    { value: 'MEDIUM', label: t(lang, 'priority_medium'), count: mediumCount },
    { value: 'LOW', label: t(lang, 'priority_low'), count: lowCount },
  ];

  return (
    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center mb-4 sm:mb-6 print:hidden">
      <div className="relative flex-1 min-w-0">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 dark:text-stone-500 pointer-events-none">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
        </span>
        <input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          type="search"
          value={localSearch}
          onChange={handleSearchChange}
          placeholder={t(lang, 'search_placeholder')}
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-600 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
          aria-label={t(lang, 'search_label')}
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 dark:text-stone-500 text-xs hidden sm:inline">
          /
        </span>
      </div>
      <div className="flex flex-wrap gap-2 items-center">
        {chips.map(({ value, label, count }) => (
          <button
            key={value || 'all'}
            type="button"
            onClick={() => setFilterPriority(value)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors touch-manipulation ${
              filterPriority === value
                ? value === 'HIGH'
                  ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300'
                  : value === 'MEDIUM'
                  ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'
                  : value === 'LOW'
                  ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                  : 'bg-stone-200 dark:bg-stone-700 text-stone-800 dark:text-stone-200'
                : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700'
            }`}
          >
            {label}
            {count != null && count > 0 && (
              <span className="ml-1 opacity-80">({count})</span>
            )}
          </button>
        ))}
        <button
          type="button"
          onClick={onOpenFilters}
          className="px-3 py-1.5 rounded-full text-sm font-medium bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors touch-manipulation border border-stone-200 dark:border-stone-600"
        >
          {t(lang, 'filters')}
        </button>
        <div className="hidden sm:flex gap-1">
          <button
            type="button"
            onClick={onExpandAll}
            className="p-2 rounded-lg border border-stone-200 dark:border-stone-600 hover:border-teal-500 dark:hover:border-teal-500 hover:bg-teal-50 dark:hover:bg-teal-950/30 transition-colors"
            aria-label={t(lang, 'expand_all')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
          <button
            type="button"
            onClick={onCollapseAll}
            className="p-2 rounded-lg border border-stone-200 dark:border-stone-600 hover:border-teal-500 dark:hover:border-teal-500 hover:bg-teal-50 dark:hover:bg-teal-950/30 transition-colors"
            aria-label={t(lang, 'collapse_all')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <polyline points="18 15 12 9 6 15" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
