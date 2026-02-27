'use client';

import { useState } from 'react';
import { useNewsletter } from '@/context/NewsletterContext';
import { translations, type TranslationKey } from '@/lib/translations';
import { ItemCard } from './ItemCard';
import type { Section as SectionType, NewsletterItem } from '@/lib/types';

function t(lang: 'it' | 'en', key: TranslationKey) {
  return translations[lang][key] ?? translations.en[key] ?? key;
}

interface SectionProps {
  section: SectionType;
  index: number;
  visibleCount: number;
  isOpen: boolean;
  onToggle: () => void;
  itemMatches: (item: NewsletterItem) => boolean;
  searchQuery?: string;
}

export function Section({
  section,
  index,
  visibleCount,
  isOpen,
  onToggle,
  itemMatches,
  searchQuery,
}: SectionProps) {
  const { lang } = useNewsletter();
  const countLabel =
    section.items.length === 1
      ? `1 ${t(lang, 'stat_item')}`
      : `${section.items.length} ${t(lang, 'stat_items')}`;

  return (
    <div
      className={`rounded-2xl sm:rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 shadow-sm overflow-hidden transition-all ${
        visibleCount === 0 ? 'hidden' : ''
      }`}
      id={`section-${index}`}
      data-section-id={`section-${index}`}
    >
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 sm:px-5 py-4 text-left hover:bg-stone-50 dark:hover:bg-stone-800/50 active:bg-stone-100 dark:active:bg-stone-800 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-inset touch-manipulation"
        aria-expanded={isOpen}
        aria-controls={`section-${index}-body`}
      >
        <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100">
          {section.title}
          <span className="ml-2 text-sm font-normal text-stone-500 dark:text-stone-400">
            {countLabel}
          </span>
        </h2>
        <span
          className={`shrink-0 w-8 h-8 flex items-center justify-center text-stone-500 dark:text-stone-400 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
          aria-hidden
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </span>
      </button>
      <div
        id={`section-${index}-body`}
        className={`grid transition-[grid-template-rows] duration-300 ease-out ${
          isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
      >
        <div className="overflow-hidden">
          <div className="px-4 sm:px-5 pb-5 pt-0 border-t border-stone-200 dark:border-stone-700">
            <div className="space-y-3 mt-3">
              {section.items.map((item, i) => (
                <ItemCard
                  key={i}
                  item={item}
                  sectionTitle={section.title}
                  visible={itemMatches(item)}
                  searchQuery={searchQuery}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
