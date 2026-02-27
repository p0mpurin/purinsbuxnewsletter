import { NewsletterProvider } from '@/context/NewsletterContext';
import { NewsletterPage } from '@/components/NewsletterPage';

export default function Home() {
  return (
    <NewsletterProvider>
      <div className="min-h-screen min-h-[100dvh] flex flex-col bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100">
        <NewsletterPage />
      </div>
    </NewsletterProvider>
  );
}
