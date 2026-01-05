'use client';

import Link from 'next/link';
import {
  FaInstagram,
  FaTelegram,
  FaVk,
  FaFacebook,
  FaTwitter,
  FaYoutube,
  FaTiktok,
  FaWhatsapp
} from 'react-icons/fa';

interface FooterProps {
  lang?: 'kz' | 'ru';
}

export function TengriFooter({ lang = 'kz' }: FooterProps) {
  const t = {
    kz: {
      about: 'Біз туралы',
      contacts: 'Байланыс',
      advertising: 'Жарнама',
      vacancies: 'Вакансиялар',
      privacy: 'Құпиялылық саясаты',
      terms: 'Пайдалану шарттары',
      sitemap: 'Сайт картасы',
      editorial: 'Редакция',
      adDepartment: 'Жарнама бөлімі',
      followUs: 'Бізді іздеңіз',
      copyright: 'Барлық құқықтар қорғалған',
      aboutText: '«Аймақ ақшамы» - қоғамдық-саяси желілік басылым',
    },
    ru: {
      about: 'О нас',
      contacts: 'Контакты',
      advertising: 'Реклама',
      vacancies: 'Вакансии',
      privacy: 'Политика конфиденциальности',
      terms: 'Правила использования',
      sitemap: 'Карта сайта',
      editorial: 'Редакция',
      adDepartment: 'Рекламный отдел',
      followUs: 'Мы в соцсетях',
      copyright: 'Все права защищены',
      aboutText: '«Аймақ ақшамы» - общественно-политическое сетевое издание',
    },
  };

  // Fallback to 'kz' if lang is not valid to prevent SSR crash
  const text = t[lang] || t['kz'];

  const socialLinks = [
    { name: 'Instagram', icon: FaInstagram, url: 'https://www.instagram.com/aimaqaqshamy.kz?igsh=MTlnam1leGFocDE4Ng==' },
    { name: 'Telegram', icon: FaTelegram, url: 'https://t.me/aimaqaqshamy' },
    { name: 'YouTube', icon: FaYoutube, url: 'https://www.youtube.com/@AimaqAqshamy' },
    { name: 'TikTok', icon: FaTiktok, url: 'https://tiktok.com/@aimaqaqshamy' },
    { name: 'WhatsApp', icon: FaWhatsapp, url: 'https://wa.me/77773024679' },
  ];

  const categories = [
    { slug: 'zhanalyqtar', nameKz: 'Жаңалықтар', nameRu: 'Новости' },
    { slug: 'ozekti', nameKz: 'Өзекті', nameRu: 'Актуально' },
    { slug: 'sayasat', nameKz: 'Саясат', nameRu: 'Политика' },
    { slug: 'madeniyet', nameKz: 'Мәдениет', nameRu: 'Культура' },
    { slug: 'qogam', nameKz: 'Қоғам', nameRu: 'Общество' },
  ];

  return (
    <footer className="bg-gray-900 text-gray-300">
      {/* Main Footer Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* About */}
          <div>
            <h3 className="text-xl font-bold text-white mb-4">
              <span className="text-green-500">АЙМАҚ</span> АҚШАМЫ
            </h3>
            <p className="text-sm mb-4">{text.aboutText}</p>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-semibold text-white">{text.editorial}:</span>
                <br />
                <a href="tel:+77773024679" className="hover:text-green-500">
                  +7 (777) 302-46-79
                </a>
              </div>
              <div>
                <span className="font-semibold text-white">{text.adDepartment}:</span>
                <br />
                <a href="tel:+77773024679" className="hover:text-green-500">
                  +7 (777) 302-46-79
                </a>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-white mb-4 uppercase text-sm">
              {text.sitemap}
            </h4>
            <ul className="space-y-2 text-sm">
              {categories.map((cat) => (
                <li key={cat.slug}>
                  <Link
                    href={`/${lang}/${cat.slug}`}
                    className="hover:text-green-500 transition"
                  >
                    {lang === 'kz' ? cat.nameKz : cat.nameRu}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="font-semibold text-white mb-4 uppercase text-sm">
              {text.about}
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href={`/${lang}/about`} className="hover:text-green-500 transition">
                  {text.about}
                </Link>
              </li>
              <li>
                <Link href={`/${lang}/contacts`} className="hover:text-green-500 transition">
                  {text.contacts}
                </Link>
              </li>
              <li>
                <Link href={`/${lang}/advertising`} className="hover:text-green-500 transition">
                  {text.advertising}
                </Link>
              </li>
              <li>
                <Link href={`/${lang}/vacancies`} className="hover:text-green-500 transition">
                  {text.vacancies}
                </Link>
              </li>
              <li>
                <Link href={`/${lang}/privacy`} className="hover:text-green-500 transition">
                  {text.privacy}
                </Link>
              </li>
            </ul>
          </div>

          {/* Social & Apps */}
          <div>
            <h4 className="font-semibold text-white mb-4 uppercase text-sm">
              {text.followUs}
            </h4>
            <div className="grid grid-cols-4 gap-2">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.name}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 bg-gray-800 rounded flex items-center justify-center hover:bg-green-600 transition text-xl"
                    title={social.name}
                  >
                    <Icon />
                  </a>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm">
            <div className="text-gray-400" suppressHydrationWarning>
              © {new Date().getFullYear()} Аймақ ақшамы. {text.copyright}
            </div>
            <div className="flex gap-6">
              <Link href={`/${lang}/privacy`} className="hover:text-green-500 transition">
                {text.privacy}
              </Link>
              <Link href={`/${lang}/terms`} className="hover:text-green-500 transition">
                {text.terms}
              </Link>
              <Link href={`/${lang}/sitemap`} className="hover:text-green-500 transition">
                {text.sitemap}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
