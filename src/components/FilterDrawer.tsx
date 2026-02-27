'use client';

import { useNewsletter } from '@/context/NewsletterContext';
import { translations, type TranslationKey } from '@/lib/translations';

function t(lang: 'it' | 'en', key: TranslationKey) {
  return translations[lang][key] ?? translations.en[key] ?? key;
}

interface FilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  filterSection: string;
  setFilterSection: (s: string) => void;
  filterProduct: string;
  setFilterProduct: (s: string) => void;
  onClearFilters: () => void;
  sectionOptions: string[];
  productOptions: string[];
}

export function FilterDrawer({
  isOpen,
  onClose,
  filterSection,
  setFilterSection,
  filterProduct,
  setFilterProduct,
  onClearFilters,
  sectionOptions,
  productOptions,
}: FilterDrawerProps) {
  const { lang } = useNewsletter();

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm sm:bg-black/20"
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className="fixed bottom-0 left-0 right-0 z-50 max-h-[70vh] rounded-t-2xl bg-white dark:bg-stone-900 shadow-xl flex flex-col sm:bottom-auto sm:top-0 sm:left-auto sm:right-0 sm:max-h-none sm:rounded-none sm:w-80 sm:max-w-sm"
        role="dialog"
        aria-label={t(lang, 'filters')}
      >
        <div className="flex items-center justify-between p-4 border-b border-stone-200 dark:border-stone-700">
          <h3 className="font-semibold text-stone-900 dark:text-stone-100">
            {t(lang, 'filters')}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            aria-label="Close"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-2">
              {t(lang, 'filter_section')}
            </label>
            <select
              value={filterSection}
              onChange={(e) => setFilterSection(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-600 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">{t(lang, 'filter_all_sections')}</option>
              {sectionOptions.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-2">
              {t(lang, 'filter_product')}
            </label>
            <select
              value={filterProduct}
              onChange={(e) => setFilterProduct(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-600 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">{t(lang, 'filter_all_products')}</option>
              {productOptions.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={() => {
              onClearFilters();
              onClose();
            }}
            className="w-full px-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-600 hover:bg-stone-100 dark:hover:bg-stone-800 text-sm font-medium transition-colors"
          >
            {t(lang, 'clear_filters')}
          </button>
        </div>
      </aside>
    </>
  );
}
