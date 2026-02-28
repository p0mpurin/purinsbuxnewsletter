'use client';

import { useCallback, useEffect, useState } from 'react';

// ─── Mark as read ────────────────────────────────────────────────

const READ_KEY = 'partner-newsletter-read';

function makeItemKey(week: string | undefined, sectionTitle: string, itemTitle: string | undefined) {
    return `${week ?? 'no-week'}::${sectionTitle}::${itemTitle ?? 'untitled'}`;
}

function loadReadSet(): Set<string> {
    if (typeof window === 'undefined') return new Set();
    try {
        const raw = localStorage.getItem(READ_KEY);
        if (!raw) return new Set();
        return new Set(JSON.parse(raw) as string[]);
    } catch {
        return new Set();
    }
}

function saveReadSet(set: Set<string>) {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem(READ_KEY, JSON.stringify([...set]));
    } catch { }
}

export function useReadState(week: string | undefined) {
    const [readSet, setReadSet] = useState<Set<string>>(() => loadReadSet());

    const isRead = useCallback(
        (sectionTitle: string, itemTitle: string | undefined) =>
            readSet.has(makeItemKey(week, sectionTitle, itemTitle)),
        [readSet, week]
    );

    const toggleRead = useCallback(
        (sectionTitle: string, itemTitle: string | undefined) => {
            setReadSet((prev) => {
                const next = new Set(prev);
                const key = makeItemKey(week, sectionTitle, itemTitle);
                if (next.has(key)) {
                    next.delete(key);
                } else {
                    next.add(key);
                }
                saveReadSet(next);
                return next;
            });
        },
        [week]
    );

    const readCount = useCallback(
        (sectionTitle: string, items: { title?: string }[]) =>
            items.filter((i) => readSet.has(makeItemKey(week, sectionTitle, i.title))).length,
        [readSet, week]
    );

    return { isRead, toggleRead, readCount };
}

// ─── New week badge ───────────────────────────────────────────────

const LAST_WEEK_KEY = 'partner-newsletter-last-week';

export function useNewWeekBadge(week: string | undefined): { isNewWeek: boolean; dismiss: () => void } {
    const [isNewWeek, setIsNewWeek] = useState(false);

    useEffect(() => {
        if (!week || typeof window === 'undefined') return;
        const stored = localStorage.getItem(LAST_WEEK_KEY);
        if (stored !== week) {
            setIsNewWeek(true);
        }
    }, [week]);

    const dismiss = useCallback(() => {
        if (week) {
            localStorage.setItem(LAST_WEEK_KEY, week);
        }
        setIsNewWeek(false);
    }, [week]);

    return { isNewWeek, dismiss };
}
