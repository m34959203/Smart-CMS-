'use client';

import { HiNewspaper } from 'react-icons/hi2';

interface ArticlePlaceholderProps {
  title: string;
  categorySlug?: string;
  variant?: 'hero' | 'vertical' | 'horizontal';
}

/**
 * Beautiful gradient placeholder for articles without images
 * Uses category-specific gradients and displays first letter of title
 */
export function ArticlePlaceholder({
  title,
  categorySlug,
  variant = 'horizontal',
}: ArticlePlaceholderProps) {
  // Category-specific gradient colors (very soft, professional)
  const getCategoryGradient = (slug?: string): string => {
    const gradients: Record<string, string> = {
      zhanalyqtar: 'from-blue-300 via-blue-400 to-indigo-400',
      ozekti: 'from-red-300 via-red-400 to-rose-400',
      sayasat: 'from-purple-300 via-purple-400 to-indigo-400',
      madeniyet: 'from-pink-300 via-pink-400 to-rose-400',
      qogam: 'from-green-300 via-green-400 to-emerald-400',
      kazakhmys: 'from-orange-300 via-orange-400 to-amber-400',
    };
    return gradients[slug || ''] || 'from-slate-300 via-slate-400 to-gray-400';
  };

  // Get first letter or word for display
  const getInitial = (text: string): string => {
    const words = text.trim().split(/\s+/);
    return words[0]?.charAt(0)?.toUpperCase() || 'A';
  };

  const gradient = getCategoryGradient(categorySlug);
  const initial = getInitial(title);

  const iconSize = variant === 'hero' ? 'text-7xl' : variant === 'vertical' ? 'text-6xl' : 'text-4xl';
  const textSize = variant === 'hero' ? 'text-9xl' : variant === 'vertical' ? 'text-8xl' : 'text-5xl';

  return (
    <div
      className={`relative w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center overflow-hidden opacity-85`}
    >
      {/* Animated background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `repeating-linear-gradient(
            45deg,
            transparent,
            transparent 35px,
            rgba(255,255,255,.1) 35px,
            rgba(255,255,255,.1) 70px
          )`
        }} />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center gap-4 text-white">
        {/* Large initial letter */}
        <div className={`font-bold opacity-15 ${textSize} leading-none select-none`}>
          {initial}
        </div>

        {/* Icon */}
        <div className={`${iconSize} opacity-60`}>
          <HiNewspaper />
        </div>
      </div>

      {/* Decorative circles */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/3 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/3 rounded-full translate-y-1/2 -translate-x-1/2" />
    </div>
  );
}
