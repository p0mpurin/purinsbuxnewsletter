'use client';

import { useState, type ReactNode } from 'react';
import Image from 'next/image';
import { useNewsletter } from '@/context/NewsletterContext';
import { translations, type TranslationKey } from '@/lib/translations';
import { stockStatusClass } from '@/lib/utils';
import { ImageLightbox } from './ImageLightbox';
import type { NewsletterItem, Contact } from '@/lib/types';

function t(lang: 'it' | 'en', key: TranslationKey) {
  return translations[lang][key] ?? translations.en[key] ?? key;
}

const IMAGES_BASE = '/images/';
const PREVIEW_LINES = 2;

function truncateToLines(text: string, lines: number): string {
  const parts = text.split('\n');
  const first = parts.slice(0, lines).join('\n');
  if (parts.length <= lines) return first;
  return first + '…';
}

function highlightText(text: string, query: string): ReactNode {
  if (!query.trim() || !text) return text;
  const q = query.trim();
  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');
  const parts = text.split(regex);
  const exactMatch = new RegExp(`^${escaped}$`, 'i');
  return parts.map((part, i) =>
    exactMatch.test(part) ? (
      <mark key={i} className="bg-amber-200 dark:bg-amber-900/50 rounded px-0.5">
        {part}
      </mark>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

interface ItemCardProps {
  item: NewsletterItem;
  sectionTitle: string;
  visible: boolean;
  searchQuery?: string;
}

export function ItemCard({ item, sectionTitle, visible, searchQuery = '' }: ItemCardProps) {
  const { lang } = useNewsletter();
  const [expanded, setExpanded] = useState(false);
  const [contactsOpen, setContactsOpen] = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);
  const [stockOpen, setStockOpen] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  if (!visible) return null;

  const priority = item.priority || 'LOW';
  const hasMore =
    (item.content && item.content.split('\n').length > PREVIEW_LINES) ||
    (item.bullet_points && item.bullet_points.length > 0) ||
    (item.attachments && item.attachments.length > 0) ||
    (item.images && item.images.length > 0) ||
    (item.products && item.products.length > 0) ||
    (item.contacts && item.contacts.length > 0) ||
    (item.stock_updates && item.stock_updates.length > 0);

  const contentPreview = item.content
    ? truncateToLines(item.content, PREVIEW_LINES)
    : '';
  const showFullContent = expanded || !hasMore;

  return (
    <article
      className={`relative rounded-xl border p-4 sm:p-5 bg-stone-50 dark:bg-stone-900/50 border-stone-200 dark:border-stone-700 transition-all ${
        priority === 'HIGH'
          ? 'border-l-4 border-l-red-500 dark:border-l-red-400'
          : priority === 'MEDIUM'
          ? 'border-l-4 border-l-amber-500 dark:border-l-amber-400'
          : 'border-l-4 border-l-teal-500 dark:border-l-teal-400'
      }`}
      data-priority={priority}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <h3 className="text-base font-semibold text-stone-900 dark:text-stone-100 flex-1 leading-snug">
          {item.title}
        </h3>
        {item.priority && (
          <span
            className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-semibold uppercase ${
              priority === 'HIGH'
                ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                : priority === 'MEDIUM'
                ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                : 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400'
            }`}
          >
            {t(lang, `priority_${priority.toLowerCase()}` as TranslationKey)}
          </span>
        )}
      </div>

      {item.content && (
        <div
          className="reader-body text-sm text-stone-700 dark:text-stone-300 whitespace-pre-wrap mb-3 leading-relaxed max-w-[65ch] font-[family-name:var(--font-serif)]"
          style={{ lineHeight: 1.65 }}
        >
          {showFullContent ? (
            highlightText(item.content, searchQuery)
          ) : (
            highlightText(contentPreview, searchQuery)
          )}
        </div>
      )}

      {hasMore && !showFullContent && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="text-sm font-medium text-teal-600 dark:text-teal-400 hover:underline mb-3"
        >
          {t(lang, 'read_more')}
        </button>
      )}

      {showFullContent && (
        <>
          {item.bullet_points && item.bullet_points.length > 0 && (
            <ul className="list-disc pl-5 space-y-1 text-sm text-stone-700 dark:text-stone-300 mb-3 leading-relaxed">
              {item.bullet_points.map((b, i) => (
                <li key={i}>{b}</li>
              ))}
            </ul>
          )}

          {item.attachments && item.attachments.length > 0 && (
            <div className="mb-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-1.5">
                {t(lang, 'attachments')}
              </h4>
              <div className="flex flex-wrap gap-2">
                {item.attachments.map((name, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-600 text-teal-600 dark:text-teal-400 text-sm font-medium"
                  >
                    ↓ {name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {item.images && item.images.length > 0 && (
            <div className="mb-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-1.5">
                {t(lang, 'images')}
              </h4>
              <div className="flex flex-wrap gap-3">
                {item.images.map((img, i) => {
                  const src = typeof img === 'string' ? img : (img as { src?: string }).src || '';
                  const url = src.startsWith('http') || src.startsWith('/') ? src : IMAGES_BASE + src;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setLightboxSrc(url)}
                      className="group block text-left rounded-xl overflow-hidden border border-stone-200 dark:border-stone-600 bg-white dark:bg-stone-800 shadow-sm hover:shadow-md hover:border-teal-400 dark:hover:border-teal-500 transition-all focus:outline-none focus:ring-2 focus:ring-teal-500 touch-manipulation"
                    >
                      <figure className="w-full max-w-[180px] sm:max-w-[200px]">
                        <div className="relative w-full aspect-[4/3] min-h-[120px] bg-stone-100 dark:bg-stone-700">
                          <Image
                            src={url}
                            alt=""
                            width={200}
                            height={150}
                            className="object-contain w-full h-full group-hover:scale-[1.02] transition-transform"
                            unoptimized
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                          <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30 rounded-t-xl">
                            <svg className="w-10 h-10 text-white drop-shadow-lg" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                              <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
                            </svg>
                          </span>
                        </div>
                        <figcaption className="px-2 py-1.5 text-xs text-stone-500 dark:text-stone-400 truncate">
                          {typeof img === 'string' ? img : (img as { alt?: string }).alt || src}
                        </figcaption>
                      </figure>
                    </button>
                  );
                })}
              </div>
              {lightboxSrc && (
                <ImageLightbox src={lightboxSrc} alt="" onClose={() => setLightboxSrc(null)} />
              )}
            </div>
          )}

          {item.products && item.products.length > 0 && (
            <div className="mb-3">
              <button
                type="button"
                onClick={() => setProductsOpen(!productsOpen)}
                className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-1.5 hover:text-stone-700 dark:hover:text-stone-300"
              >
                {item.products.some((p) => p.old_code != null || p.new_code != null)
                  ? t(lang, 'code_changes')
                  : t(lang, 'products')}
                ({item.products.length})
                <span className={`transition-transform ${productsOpen ? 'rotate-180' : ''}`}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </span>
              </button>
              {productsOpen && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr>
                        {item.products.some((p) => p.old_code != null || p.new_code != null) ? (
                          <>
                            <th className="text-left py-2 px-2 border border-stone-200 dark:border-stone-600 font-semibold text-stone-500 dark:text-stone-400">
                              {t(lang, 'old_code')}
                            </th>
                            <th className="text-left py-2 px-2 border border-stone-200 dark:border-stone-600 font-semibold text-stone-500 dark:text-stone-400">
                              {t(lang, 'new_code')}
                            </th>
                            <th className="text-left py-2 px-2 border border-stone-200 dark:border-stone-600 font-semibold text-stone-500 dark:text-stone-400">
                              {t(lang, 'product')}
                            </th>
                          </>
                        ) : (
                          <>
                            <th className="text-left py-2 px-2 border border-stone-200 dark:border-stone-600 font-semibold text-stone-500 dark:text-stone-400">
                              {t(lang, 'code')}
                            </th>
                            <th className="text-left py-2 px-2 border border-stone-200 dark:border-stone-600 font-semibold text-stone-500 dark:text-stone-400">
                              {t(lang, 'name')}
                            </th>
                            <th className="text-left py-2 px-2 border border-stone-200 dark:border-stone-600 font-semibold text-stone-500 dark:text-stone-400">
                              {t(lang, 'price_store')}
                            </th>
                            <th className="text-left py-2 px-2 border border-stone-200 dark:border-stone-600 font-semibold text-stone-500 dark:text-stone-400">
                              {t(lang, 'price_airport')}
                            </th>
                            <th className="text-left py-2 px-2 border border-stone-200 dark:border-stone-600 font-semibold text-stone-500 dark:text-stone-400">
                              {t(lang, 'pack_size')}
                            </th>
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {item.products.map((p, i) => (
                        <tr key={i} className="even:bg-stone-100/50 dark:even:bg-stone-800/30">
                          {p.old_code != null || p.new_code != null ? (
                            <>
                              <td className="py-2 px-2 border border-stone-200 dark:border-stone-600">
                                <code className="text-xs bg-stone-200 dark:bg-stone-700 px-1.5 py-0.5 rounded">
                                  {p.old_code || ''}
                                </code>
                              </td>
                              <td className="py-2 px-2 border border-stone-200 dark:border-stone-600">
                                <code className="text-xs bg-stone-200 dark:bg-stone-700 px-1.5 py-0.5 rounded">
                                  {p.new_code || ''}
                                </code>
                              </td>
                              <td className="py-2 px-2 border border-stone-200 dark:border-stone-600">
                                {p.name || ''}
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="py-2 px-2 border border-stone-200 dark:border-stone-600">
                                {p.code || ''}
                              </td>
                              <td className="py-2 px-2 border border-stone-200 dark:border-stone-600">
                                {p.name || ''}
                              </td>
                              <td className="py-2 px-2 border border-stone-200 dark:border-stone-600">
                                {p.price_store || ''}
                              </td>
                              <td className="py-2 px-2 border border-stone-200 dark:border-stone-600">
                                {p.price_airport || ''}
                              </td>
                              <td className="py-2 px-2 border border-stone-200 dark:border-stone-600">
                                {p.pack_size || ''}
                              </td>
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {item.contacts && item.contacts.length > 0 && (
            <div className="mb-3">
              <button
                type="button"
                onClick={() => setContactsOpen(!contactsOpen)}
                className="px-4 py-2 text-sm font-medium rounded-xl border border-stone-200 dark:border-stone-600 hover:border-teal-500 dark:hover:border-teal-500 hover:bg-teal-50 dark:hover:bg-teal-950/30 transition-colors touch-manipulation"
                aria-expanded={contactsOpen}
              >
                {t(lang, 'view_contacts')} ({item.contacts.length})
              </button>
              {contactsOpen && (
                <div className="mt-2 p-3 rounded-lg border border-stone-200 dark:border-stone-600 bg-white dark:bg-stone-800 space-y-2">
                  {item.contacts.map((c: Contact, i: number) => (
                    <div key={i} className="pb-2 border-b border-stone-200 dark:border-stone-600 last:border-0 last:pb-0">
                      <p className="font-semibold text-stone-900 dark:text-stone-100">{c.name}</p>
                      <p className="text-sm text-stone-500 dark:text-stone-400">{c.role}</p>
                      <div className="text-sm mt-1">
                        {c.phone && <span>Tel: {c.phone}</span>}
                        {c.email && (
                          <a
                            href={`mailto:${c.email}`}
                            className="text-teal-600 dark:text-teal-400 hover:underline ml-2"
                          >
                            {c.email}
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {item.stock_updates && item.stock_updates.length > 0 && (
            <div>
              <button
                type="button"
                onClick={() => setStockOpen(!stockOpen)}
                className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-1.5 hover:text-stone-700 dark:hover:text-stone-300"
              >
                {t(lang, 'stock_updates')} ({item.stock_updates.length})
                <span className={`transition-transform ${stockOpen ? 'rotate-180' : ''}`}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </span>
              </button>
              {stockOpen && (
                <ul className="space-y-1.5">
                  {item.stock_updates.map((s, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <span
                        className={`shrink-0 px-2 py-0.5 rounded text-xs font-semibold ${
                          stockStatusClass(s.status) === 'stock-status--limited'
                            ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                            : stockStatusClass(s.status) === 'stock-status--finished'
                            ? 'bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-400'
                            : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                        }`}
                      >
                        {s.status}
                      </span>
                      <span>
                        <strong>{s.code}</strong> {s.name}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </>
      )}

      {showFullContent && hasMore && (
        <button
          type="button"
          onClick={() => setExpanded(false)}
          className="text-sm font-medium text-stone-500 dark:text-stone-400 hover:underline mt-2"
        >
          {t(lang, 'read_less')}
        </button>
      )}
    </article>
  );
}
