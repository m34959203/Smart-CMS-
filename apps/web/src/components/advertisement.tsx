'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { getApiEndpoint } from '@/lib/api-url';
import { getImageUrl } from '@/lib/image-url';

interface AdvertisementProps {
  position: 'HOME_TOP' | 'HOME_SIDEBAR' | 'ARTICLE_TOP' | 'ARTICLE_SIDEBAR';
  className?: string;
}

interface Ad {
  id: string;
  type: 'CUSTOM' | 'YANDEX_DIRECT' | 'GOOGLE_ADSENSE';
  customHtml?: string;
  imageUrl?: string;
  clickUrl?: string;
  yandexBlockId?: string;
  googleAdSlot?: string;
  googleAdClient?: string;
  size: string;
}

export function Advertisement({ position, className = '' }: AdvertisementProps) {
  const [ad, setAd] = useState<Ad | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAd();
  }, [position]);

  const fetchAd = async () => {
    try {
      const response = await fetch(getApiEndpoint(`/advertisements/position/${position}`));
      const data = await response.json();
      if (data && data.length > 0) {
        setAd(data[0]);
        // Increment impression count
        fetch(getApiEndpoint(`/advertisements/${data[0].id}/impression`), {
          method: 'POST',
        });
      }
    } catch (error) {
      console.error('Error fetching ad:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClick = () => {
    if (ad) {
      fetch(getApiEndpoint(`/advertisements/${ad.id}/click`), {
        method: 'POST',
      });
    }
  };

  if (loading || !ad) {
    return null;
  }

  // Custom HTML ad
  if (ad.type === 'CUSTOM') {
    if (ad.customHtml) {
      // Remove Tailwind CDN script to avoid production warnings
      const cleanHtml = ad.customHtml
        .replace(/<script[^>]*src=["']https:\/\/cdn\.tailwindcss\.com["'][^>]*><\/script>/g, '')
        .replace(/\n\s*<script[^>]*>[\s\S]*?tailwind\.config\s*=[\s\S]*?<\/script>/g, '');

      return (
        <div
          className={className}
          dangerouslySetInnerHTML={{ __html: cleanHtml }}
          onClick={handleClick}
        />
      );
    }

    if (ad.imageUrl) {
      const imageUrl = getImageUrl(ad.imageUrl);
      const content = (
        <div className={`relative overflow-hidden ${className}`}>
          <Image
            src={imageUrl!}
            alt="Advertisement"
            fill
            className="object-contain"
          />
        </div>
      );

      if (ad.clickUrl) {
        return (
          <a
            href={ad.clickUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleClick}
            className="block"
          >
            {content}
          </a>
        );
      }

      return content;
    }
  }

  // Yandex Direct
  if (ad.type === 'YANDEX_DIRECT' && ad.yandexBlockId) {
    useEffect(() => {
      // Load Yandex.Direct script
      const script = document.createElement('script');
      script.src = 'https://yandex.ru/ads/system/context.js';
      script.async = true;
      document.body.appendChild(script);

      return () => {
        document.body.removeChild(script);
      };
    }, []);

    return (
      <div className={className}>
        <div id={`yandex_rtb_${ad.yandexBlockId}`}></div>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.yaContextCb.push(() => {
                Ya.Context.AdvManager.render({
                  blockId: "${ad.yandexBlockId}",
                  renderTo: "yandex_rtb_${ad.yandexBlockId}"
                });
              });
            `,
          }}
        />
      </div>
    );
  }

  // Google AdSense
  if (ad.type === 'GOOGLE_ADSENSE' && ad.googleAdClient && ad.googleAdSlot) {
    useEffect(() => {
      // Load Google AdSense script
      const script = document.createElement('script');
      script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js';
      script.async = true;
      script.setAttribute('data-ad-client', ad.googleAdClient!);
      document.body.appendChild(script);

      // Initialize ad
      try {
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
      } catch (e) {
        console.error('AdSense error:', e);
      }

      return () => {
        document.body.removeChild(script);
      };
    }, []);

    return (
      <div className={className}>
        <ins
          className="adsbygoogle"
          style={{ display: 'block' }}
          data-ad-client={ad.googleAdClient}
          data-ad-slot={ad.googleAdSlot}
          data-ad-format="auto"
          data-full-width-responsive="true"
        ></ins>
      </div>
    );
  }

  return null;
}
