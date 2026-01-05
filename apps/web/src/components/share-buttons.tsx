'use client';

import { useState, useEffect, useCallback } from 'react';
import { FaFacebookF, FaTwitter, FaTelegramPlane, FaWhatsapp } from 'react-icons/fa';

interface ShareButtonsProps {
  url: string;
  title: string;
  lang: 'kz' | 'ru';
}

export function ShareButtons({ url, title, lang }: ShareButtonsProps) {
  // Use the provided URL for SSR, then update to window.location.href after mount
  const [shareUrl, setShareUrl] = useState(url);

  useEffect(() => {
    // Update to current page URL after hydration
    setShareUrl(window.location.href);
  }, []);

  const getShareLinks = useCallback(() => {
    const encodedUrl = encodeURIComponent(shareUrl);
    const encodedTitle = encodeURIComponent(title);

    return {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
      telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`,
      whatsapp: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
    };
  }, [shareUrl, title]);

  const handleShare = (platform: 'facebook' | 'twitter' | 'telegram' | 'whatsapp') => {
    const shareLinks = getShareLinks();
    const width = 600;
    const height = 400;
    const left = window.innerWidth / 2 - width / 2;
    const top = window.innerHeight / 2 - height / 2;

    window.open(
      shareLinks[platform],
      '_blank',
      `width=${width},height=${height},left=${left},top=${top},toolbar=0,location=0,menubar=0`
    );
  };

  return (
    <div className="mt-8 pt-6 border-t">
      <h3 className="text-lg font-semibold mb-4">
        {lang === 'kz' ? 'Бөлісу' : 'Поделиться'}
      </h3>
      <div className="flex gap-3 flex-wrap">
        <button
          onClick={() => handleShare('facebook')}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#1877F2] text-white rounded-lg hover:bg-[#0C63D4] transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
          aria-label="Share on Facebook"
        >
          <FaFacebookF className="text-lg" />
          <span className="font-medium">Facebook</span>
        </button>
        <button
          onClick={() => handleShare('twitter')}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#1DA1F2] text-white rounded-lg hover:bg-[#0C8BD9] transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
          aria-label="Share on Twitter"
        >
          <FaTwitter className="text-lg" />
          <span className="font-medium">Twitter</span>
        </button>
        <button
          onClick={() => handleShare('telegram')}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#0088CC] text-white rounded-lg hover:bg-[#0077B5] transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
          aria-label="Share on Telegram"
        >
          <FaTelegramPlane className="text-lg" />
          <span className="font-medium">Telegram</span>
        </button>
        <button
          onClick={() => handleShare('whatsapp')}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#25D366] text-white rounded-lg hover:bg-[#1EBE57] transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
          aria-label="Share on WhatsApp"
        >
          <FaWhatsapp className="text-lg" />
          <span className="font-medium">WhatsApp</span>
        </button>
      </div>
    </div>
  );
}
