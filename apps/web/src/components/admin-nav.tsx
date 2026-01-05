'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAdminLang } from '@/hooks/use-admin-lang';
import { getTranslations } from '@/lib/translations';
import { Menu, X, Home, FileText, FolderOpen, Tag, Megaphone, Share2, Settings, ExternalLink, ChevronDown } from 'lucide-react';

// Custom hook for device detection - returns undefined during SSR to prevent hydration mismatch
function useDeviceType(): 'mobile' | 'tablet' | 'desktop' | undefined {
  const [deviceType, setDeviceType] = useState<'mobile' | 'tablet' | 'desktop' | undefined>(undefined);

  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth;
      if (width < 640) {
        setDeviceType('mobile');
      } else if (width < 1024) {
        setDeviceType('tablet');
      } else {
        setDeviceType('desktop');
      }
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  return deviceType;
}

export function AdminNav() {
  const pathname = usePathname();
  const { lang, setLang } = useAdminLang();
  const t = getTranslations(lang);
  const deviceType = useDeviceType();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const systemLabel = lang === 'kz' ? 'Жүйе' : 'Система';

  const navLinks = [
    { href: '/admin', label: t.adminNav.home, icon: Home },
    { href: '/admin/articles', label: t.adminNav.articles, icon: FileText },
    { href: '/admin/categories', label: t.adminNav.categories, icon: FolderOpen },
    { href: '/admin/tags', label: t.adminNav.tags, icon: Tag },
    { href: '/admin/advertisements', label: t.adminNav.advertisements, icon: Megaphone },
    { href: '/admin/settings/social-media', label: t.adminNav.socialMedia, icon: Share2 },
    { href: '/admin/system', label: systemLabel, icon: Settings },
  ];

  const closeMenu = () => setIsMenuOpen(false);

  // Show minimal nav skeleton during SSR/hydration to prevent mismatch
  if (deviceType === undefined) {
    return (
      <nav className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="px-4">
          <div className="flex items-center justify-between h-14">
            <span className="text-lg font-bold text-gray-900">{t.adminNav.title}</span>
          </div>
        </div>
      </nav>
    );
  }

  // Mobile Navigation (< 640px)
  if (deviceType === 'mobile') {
    return (
      <>
        <nav className="bg-white shadow-sm border-b sticky top-0 z-40">
          <div className="px-4">
            <div className="flex items-center justify-between h-14">
              {/* Logo/Title */}
              <Link href="/admin" className="text-lg font-bold text-gray-900 truncate max-w-[140px]">
                {t.adminNav.title}
              </Link>

              {/* Right side: Language + Menu */}
              <div className="flex items-center gap-2">
                {/* Compact Language Switcher */}
                <div className="flex border rounded overflow-hidden">
                  <button
                    onClick={() => setLang('kz')}
                    className={`px-2 py-1 text-xs font-medium transition-colors ${
                      lang === 'kz'
                        ? 'bg-blue-500 text-white'
                        : 'text-gray-600 bg-gray-50'
                    }`}
                  >
                    ҚАЗ
                  </button>
                  <button
                    onClick={() => setLang('ru')}
                    className={`px-2 py-1 text-xs font-medium transition-colors ${
                      lang === 'ru'
                        ? 'bg-blue-500 text-white'
                        : 'text-gray-600 bg-gray-50'
                    }`}
                  >
                    РУС
                  </button>
                </div>

                {/* Hamburger Menu Button */}
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  aria-label="Menu"
                >
                  {isMenuOpen ? (
                    <X className="w-6 h-6 text-gray-700" />
                  ) : (
                    <Menu className="w-6 h-6 text-gray-700" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* Mobile Menu Overlay */}
        {isMenuOpen && (
          <>
            <div
              className="fixed inset-0 bg-black/30 z-40"
              onClick={closeMenu}
            />
            <div className="fixed top-14 left-0 right-0 bg-white z-50 shadow-lg border-b max-h-[calc(100vh-3.5rem)] overflow-y-auto">
              <div className="py-2">
                {navLinks.map((link) => {
                  const IconComponent = link.icon;
                  const isActive = pathname === link.href ||
                    (link.href !== '/admin' && pathname.startsWith(link.href));

                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={closeMenu}
                      className={`flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-500'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <IconComponent className="w-5 h-5" />
                      {link.label}
                    </Link>
                  );
                })}

                {/* Divider */}
                <div className="my-2 border-t border-gray-200" />

                {/* Link to site */}
                <Link
                  href="/kz"
                  onClick={closeMenu}
                  className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50"
                >
                  <ExternalLink className="w-5 h-5" />
                  {t.adminNav.toSite}
                </Link>
              </div>
            </div>
          </>
        )}
      </>
    );
  }

  // Tablet Navigation (640px - 1024px)
  if (deviceType === 'tablet') {
    return (
      <>
        <nav className="bg-white shadow-sm border-b sticky top-0 z-40">
          <div className="px-4">
            <div className="flex items-center justify-between h-14">
              {/* Logo/Title */}
              <Link href="/admin" className="text-lg font-bold text-gray-900">
                {t.adminNav.title}
              </Link>

              {/* Center: Icon navigation for main items */}
              <div className="flex items-center gap-1">
                {navLinks.slice(0, 4).map((link) => {
                  const IconComponent = link.icon;
                  const isActive = pathname === link.href ||
                    (link.href !== '/admin' && pathname.startsWith(link.href));

                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                        isActive
                          ? 'bg-blue-500 text-white'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                      title={link.label}
                    >
                      <IconComponent className="w-4 h-4" />
                      <span className="hidden sm:inline">{link.label}</span>
                    </Link>
                  );
                })}

                {/* More menu for remaining items */}
                <div className="relative">
                  <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className={`flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                      isMenuOpen ? 'bg-gray-100' : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <span>{lang === 'kz' ? 'Көбірек' : 'Ещё'}</span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isMenuOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-30"
                        onClick={closeMenu}
                      />
                      <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border z-40 min-w-[200px] py-1">
                        {navLinks.slice(4).map((link) => {
                          const IconComponent = link.icon;
                          const isActive = pathname === link.href ||
                            (link.href !== '/admin' && pathname.startsWith(link.href));

                          return (
                            <Link
                              key={link.href}
                              href={link.href}
                              onClick={closeMenu}
                              className={`flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors ${
                                isActive
                                  ? 'bg-blue-50 text-blue-600'
                                  : 'text-gray-700 hover:bg-gray-50'
                              }`}
                            >
                              <IconComponent className="w-4 h-4" />
                              {link.label}
                            </Link>
                          );
                        })}
                        <div className="my-1 border-t border-gray-200" />
                        <Link
                          href="/kz"
                          onClick={closeMenu}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
                        >
                          <ExternalLink className="w-4 h-4" />
                          {t.adminNav.toSite}
                        </Link>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Right side: Language Switcher */}
              <div className="flex border rounded overflow-hidden">
                <button
                  onClick={() => setLang('kz')}
                  className={`px-2 py-1 text-xs font-medium transition-colors ${
                    lang === 'kz'
                      ? 'bg-blue-500 text-white'
                      : 'text-gray-600 bg-gray-50'
                  }`}
                >
                  ҚАЗ
                </button>
                <button
                  onClick={() => setLang('ru')}
                  className={`px-2 py-1 text-xs font-medium transition-colors ${
                    lang === 'ru'
                      ? 'bg-blue-500 text-white'
                      : 'text-gray-600 bg-gray-50'
                  }`}
                >
                  РУС
                </button>
              </div>
            </div>
          </div>
        </nav>
      </>
    );
  }

  // Desktop Navigation (>= 1024px)
  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link href="/admin" className="text-xl font-bold text-gray-900">
              {t.adminNav.title}
            </Link>
            <div className="flex space-x-2">
              {navLinks.map((link) => {
                const IconComponent = link.icon;
                const isActive = pathname === link.href ||
                  (link.href !== '/admin' && pathname.startsWith(link.href));

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-500 text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <IconComponent className="w-4 h-4" />
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* Language Switcher */}
            <div className="flex gap-1 border rounded">
              <button
                onClick={() => setLang('kz')}
                className={`px-3 py-1 text-xs font-medium transition-colors ${
                  lang === 'kz'
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                ҚАЗ
              </button>
              <button
                onClick={() => setLang('ru')}
                className={`px-3 py-1 text-xs font-medium transition-colors ${
                  lang === 'ru'
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                РУС
              </button>
            </div>
            <Link
              href="/kz"
              className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              {t.adminNav.toSite}
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
