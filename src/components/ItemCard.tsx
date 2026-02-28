'use client';

import { useState, useCallback, type ReactNode } from 'react';
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
      <mark key={i} className="bg-amber-200 dark:bg-amber-900/60 rounded px-0.5 not-italic">
        {part}
      </mark>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

const PRIORITY_CONFIG = {
  HIGH: {
    bar: 'border-l-red-500 dark:border-l-red-500',
    badge: 'bg-red-50 dark:bg-red-900/25 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800',
    dot: 'bg-red-500',
  },
  MEDIUM: {
    bar: 'border-l-amber-400 dark:border-l-amber-400',
    badge: 'bg-amber-50 dark:bg-amber-900/25 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800',
    dot: 'bg-amber-400',
  },
  LOW: {
    bar: '',
    badge: 'bg-stone-50 dark:bg-stone-800 text-stone-500 dark:text-stone-400 border-stone-200 dark:border-stone-700',
    dot: 'bg-stone-400',
  },
} as const;

// SVG icon shortcuts
const Icon = {
  ChevronDown: () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><polyline points="6 9 12 15 18 9" /></svg>,
  ChevronUp: () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><polyline points="18 15 12 9 6 15" /></svg>,
  Download: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  ),
  Check: () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}><polyline points="20 6 9 17 4 12" /></svg>,
  Phone: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.77a16 16 0 0 0 6.29 6.29l.91-1.08a2 2 0 0 1 2.11-.45c.907.34 1.85.573 2.81.7a2 2 0 0 1 1.72 2.03z" />
    </svg>
  ),
  Mail: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" />
    </svg>
  ),
  User: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
    </svg>
  ),
  Expand: () => <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" /></svg>,
};

interface ItemCardProps {
  item: NewsletterItem;
  sectionTitle: string;
  visible: boolean;
  searchQuery?: string;
  isRead?: boolean;
  onToggleRead?: () => void;
}

export function ItemCard({ item, sectionTitle, visible, searchQuery = '', isRead = false, onToggleRead }: ItemCardProps) {
  const { lang } = useNewsletter();
  const [expanded, setExpanded] = useState(false);
  const [contactsOpen, setContactsOpen] = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);
  const [stockOpen, setStockOpen] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  if (!visible) return null;

  const priority = (item.priority || 'LOW') as 'HIGH' | 'MEDIUM' | 'LOW';
  const cfg = PRIORITY_CONFIG[priority] ?? PRIORITY_CONFIG.LOW;

  const hasMore =
    (item.content && item.content.split('\n').length > PREVIEW_LINES) ||
    (item.bullet_points && item.bullet_points.length > 0) ||
    (item.attachments && item.attachments.length > 0) ||
    (item.images && item.images.length > 0) ||
    (item.products && item.products.length > 0) ||
    (item.contacts && item.contacts.length > 0) ||
    (item.stock_updates && item.stock_updates.length > 0);

  const contentPreview = item.content ? truncateToLines(item.content, PREVIEW_LINES) : '';
  const showFullContent = expanded || !hasMore;

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 1500);
    });
  };

  return (
    <article
      className={`relative rounded-xl border border-l-4 p-4 sm:p-5
                  bg-white dark:bg-stone-900/50
                  border-stone-200 dark:border-stone-800
                  transition-all duration-200 hover:shadow-md hover:-translate-y-px
                  animate-fade-in-up
                  ${isRead ? 'opacity-60' : ''}
                  ${priority !== 'LOW' ? cfg.bar : 'border-l-stone-200 dark:border-l-stone-700'}`}
      data-priority={priority}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-3 mb-2.5">
        <h3 className={`text-sm font-semibold flex-1 leading-snug ${isRead ? 'text-stone-400 dark:text-stone-500 line-through decoration-stone-300' : 'text-stone-900 dark:text-stone-100'
          }`}>
          {item.title}
        </h3>
        <div className="flex items-center gap-1.5 shrink-0">
          {item.priority && (
            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wide border ${cfg.badge}`}>
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
              {t(lang, `priority_${priority.toLowerCase()}` as TranslationKey)}
            </span>
          )}
          {/* Mark as read toggle */}
          {onToggleRead && (
            <button
              type="button"
              onClick={onToggleRead}
              title={isRead ? 'Mark as unread' : 'Mark as read'}
              className={`w-6 h-6 flex items-center justify-center rounded-full border transition-all ${isRead
                  ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                  : 'border-stone-200 dark:border-stone-700 text-transparent hover:border-[--brand] hover:text-[--brand]'
                }`}
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {item.content && (
        <div
          className="reader-body text-sm text-stone-600 dark:text-stone-300 whitespace-pre-wrap mb-3 leading-relaxed max-w-[65ch]"
          style={{ fontFamily: 'var(--font-source-serif, Georgia, serif)', lineHeight: 1.72 }}
        >
          {showFullContent
            ? highlightText(item.content, searchQuery)
            : highlightText(contentPreview, searchQuery)}
        </div>
      )}

      {/* Read more */}
      {hasMore && !showFullContent && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold mb-3 transition-opacity hover:opacity-70"
          style={{ color: 'var(--brand)' }}
        >
          <Icon.ChevronDown />
          {t(lang, 'read_more')}
        </button>
      )}

      {/* Expanded content */}
      {showFullContent && (
        <>
          {item.bullet_points && item.bullet_points.length > 0 && (
            <ul className="space-y-1.5 text-sm text-stone-600 dark:text-stone-300 mb-3 leading-relaxed pl-1">
              {item.bullet_points.map((b, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-1.5 w-1 h-1 rounded-full shrink-0 bg-stone-400 dark:bg-stone-600" />
                  {b}
                </li>
              ))}
            </ul>
          )}

          {item.attachments && item.attachments.length > 0 && (
            <div className="mb-3">
              <p className="text-[11px] font-bold uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-2">
                {t(lang, 'attachments')}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {item.attachments.map((name, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleCopy(name, i)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium
                               bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700
                               transition-all hover:border-[--brand] hover:bg-[#00704A0d]"
                    style={{ color: copiedIdx === i ? 'var(--brand)' : undefined }}
                    title="Click to copy"
                  >
                    {copiedIdx === i ? <Icon.Check /> : <Icon.Download />}
                    <span className="text-stone-600 dark:text-stone-300">{name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {item.images && item.images.length > 0 && (
            <div className="mb-3">
              <p className="text-[11px] font-bold uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-2">
                {t(lang, 'images')}
              </p>
              <div className="flex flex-wrap gap-3">
                {item.images.map((img, i) => {
                  const src = typeof img === 'string' ? img : (img as { src?: string }).src || '';
                  const url = src.startsWith('http') || src.startsWith('/') ? src : IMAGES_BASE + src;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setLightboxSrc(url)}
                      className="group relative block rounded-xl overflow-hidden border border-stone-200 dark:border-stone-700
                                 bg-stone-50 dark:bg-stone-800 shadow-sm hover:shadow-lg hover:border-[--brand] transition-all"
                    >
                      <figure className="w-full max-w-[160px] sm:max-w-[200px]">
                        <div className="relative w-full aspect-[4/3] min-h-[110px]">
                          <Image
                            src={url}
                            alt=""
                            width={200}
                            height={150}
                            className="object-contain w-full h-full group-hover:scale-105 transition-transform duration-300"
                            unoptimized
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                          />
                          <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/25">
                            <span className="bg-white/90 dark:bg-stone-900/90 p-2 rounded-lg shadow">
                              <Icon.Expand />
                            </span>
                          </span>
                        </div>
                        <figcaption className="px-2 py-1.5 text-[11px] text-stone-400 dark:text-stone-500 truncate text-left">
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
                className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-2 hover:text-stone-600 dark:hover:text-stone-300 transition-colors"
              >
                {item.products.some((p) => p.old_code != null || p.new_code != null)
                  ? t(lang, 'code_changes')
                  : t(lang, 'products')}
                <span className="normal-case font-normal opacity-70">({item.products.length})</span>
                <span className={`transition-transform ${productsOpen ? 'rotate-180' : ''}`}>
                  <Icon.ChevronDown />
                </span>
              </button>
              {productsOpen && (
                <div className="overflow-x-auto rounded-xl border border-stone-200 dark:border-stone-700">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="bg-stone-50 dark:bg-stone-800/60 text-[11px] uppercase tracking-wider">
                        {item.products.some((p) => p.old_code != null || p.new_code != null) ? (
                          <>
                            <th className="text-left py-2 px-3 font-semibold text-stone-400 dark:text-stone-500 border-b border-stone-200 dark:border-stone-700">{t(lang, 'old_code')}</th>
                            <th className="text-left py-2 px-3 font-semibold text-stone-400 dark:text-stone-500 border-b border-stone-200 dark:border-stone-700">{t(lang, 'new_code')}</th>
                            <th className="text-left py-2 px-3 font-semibold text-stone-400 dark:text-stone-500 border-b border-stone-200 dark:border-stone-700">{t(lang, 'product')}</th>
                          </>
                        ) : (
                          <>
                            <th className="text-left py-2 px-3 font-semibold text-stone-400 dark:text-stone-500 border-b border-stone-200 dark:border-stone-700">{t(lang, 'code')}</th>
                            <th className="text-left py-2 px-3 font-semibold text-stone-400 dark:text-stone-500 border-b border-stone-200 dark:border-stone-700">{t(lang, 'name')}</th>
                            <th className="text-left py-2 px-3 font-semibold text-stone-400 dark:text-stone-500 border-b border-stone-200 dark:border-stone-700">{t(lang, 'price_store')}</th>
                            <th className="text-left py-2 px-3 font-semibold text-stone-400 dark:text-stone-500 border-b border-stone-200 dark:border-stone-700">{t(lang, 'price_airport')}</th>
                            <th className="text-left py-2 px-3 font-semibold text-stone-400 dark:text-stone-500 border-b border-stone-200 dark:border-stone-700">{t(lang, 'pack_size')}</th>
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {item.products.map((p, i) => (
                        <tr key={i} className="even:bg-stone-50/80 dark:even:bg-stone-800/20 hover:bg-[#00704A06] transition-colors">
                          {p.old_code != null || p.new_code != null ? (
                            <>
                              <td className="py-2 px-3 border-b border-stone-100 dark:border-stone-800">
                                <code className="text-xs bg-stone-100 dark:bg-stone-700 px-1.5 py-0.5 rounded font-mono">{p.old_code || ''}</code>
                              </td>
                              <td className="py-2 px-3 border-b border-stone-100 dark:border-stone-800">
                                <code className="text-xs bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 px-1.5 py-0.5 rounded font-mono">{p.new_code || ''}</code>
                              </td>
                              <td className="py-2 px-3 border-b border-stone-100 dark:border-stone-800 text-stone-700 dark:text-stone-300">{p.name || ''}</td>
                            </>
                          ) : (
                            <>
                              <td className="py-2 px-3 border-b border-stone-100 dark:border-stone-800 font-mono text-xs text-stone-600 dark:text-stone-400">{p.code || ''}</td>
                              <td className="py-2 px-3 border-b border-stone-100 dark:border-stone-800 text-stone-700 dark:text-stone-300">{p.name || ''}</td>
                              <td className="py-2 px-3 border-b border-stone-100 dark:border-stone-800 text-stone-600 dark:text-stone-400">{p.price_store || ''}</td>
                              <td className="py-2 px-3 border-b border-stone-100 dark:border-stone-800 text-stone-600 dark:text-stone-400">{p.price_airport || ''}</td>
                              <td className="py-2 px-3 border-b border-stone-100 dark:border-stone-800 text-stone-600 dark:text-stone-400">{p.pack_size || ''}</td>
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
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-stone-200 dark:border-stone-700
                           text-stone-600 dark:text-stone-400 hover:border-[--brand] hover:text-[--brand] transition-all touch-manipulation"
                aria-expanded={contactsOpen}
              >
                <Icon.User />
                {t(lang, 'view_contacts')} ({item.contacts.length})
              </button>
              {contactsOpen && (
                <div className="mt-2 divide-y divide-stone-100 dark:divide-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/40 overflow-hidden">
                  {item.contacts.map((c: Contact, i: number) => (
                    <div key={i} className="px-4 py-3">
                      <p className="font-semibold text-sm text-stone-900 dark:text-stone-100">{c.name}</p>
                      {c.role && <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">{c.role}</p>}
                      <div className="flex flex-wrap gap-4 mt-1.5">
                        {c.phone && (
                          <span className="inline-flex items-center gap-1 text-xs text-stone-600 dark:text-stone-300">
                            <Icon.Phone /> {c.phone}
                          </span>
                        )}
                        {c.email && (
                          <a
                            href={`mailto:${c.email}`}
                            className="inline-flex items-center gap-1 text-xs hover:underline transition-colors"
                            style={{ color: 'var(--brand)' }}
                          >
                            <Icon.Mail /> {c.email}
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
                className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-2 hover:text-stone-600 dark:hover:text-stone-300 transition-colors"
              >
                {t(lang, 'stock_updates')}
                <span className="normal-case font-normal opacity-70">({item.stock_updates.length})</span>
                <span className={`transition-transform ${stockOpen ? 'rotate-180' : ''}`}>
                  <Icon.ChevronDown />
                </span>
              </button>
              {stockOpen && (
                <ul className="space-y-1.5">
                  {item.stock_updates.map((s, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <span
                        className={`shrink-0 px-2 py-0.5 rounded-full text-[11px] font-bold ${stockStatusClass(s.status) === 'stock-status--limited'
                          ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                          : stockStatusClass(s.status) === 'stock-status--finished'
                            ? 'bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-400'
                            : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                          }`}
                      >
                        {s.status}
                      </span>
                      <span className="text-stone-700 dark:text-stone-300">
                        <strong className="font-mono text-xs text-stone-500 dark:text-stone-400">{s.code}</strong>{' '}
                        {s.name}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </>
      )}

      {/* Read less */}
      {showFullContent && hasMore && (
        <button
          type="button"
          onClick={() => setExpanded(false)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold mt-3 text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 transition-colors"
        >
          <Icon.ChevronUp />
          {t(lang, 'read_less')}
        </button>
      )}
    </article>
  );
}
