import Link from 'next/link';

export const metadata = { title: 'Page not found' };

export default function NotFound() {
  return (
    <div className="min-h-[70vh] bg-[#F7F2E6] flex items-center justify-center px-4 py-16">
      <div className="max-w-md text-center space-y-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#B88556]">Error 404</p>
        <h1 className="font-serif text-4xl sm:text-5xl text-neutral-900">This page has drifted away</h1>
        <p className="text-sm text-neutral-600 leading-relaxed">
          The page you are looking for doesn&apos;t exist or has been moved. Explore our fragrances instead.
        </p>
        <div className="flex flex-wrap gap-3 justify-center pt-2">
          <Link
            href="/shop"
            className="px-6 py-3 rounded-xl bg-[#033528] hover:bg-[#022A20] text-white text-xs font-semibold uppercase tracking-wider"
          >
            Shop fragrances
          </Link>
          <Link
            href="/"
            className="px-6 py-3 rounded-xl border border-neutral-300 hover:border-neutral-900 text-xs font-semibold uppercase tracking-wider text-neutral-800"
          >
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
