'use client';

import { useParams } from 'next/navigation';
import { FaPhone, FaEnvelope, FaMapMarkerAlt, FaClock } from 'react-icons/fa';

export default function ContactsPage() {
  const params = useParams();
  const lang = (params.lang as 'kz' | 'ru') || 'kz';

  const content = {
    kz: {
      title: 'Байланыс',
      subtitle: 'Бізбен байланысыңыз',
      editorial: {
        title: 'Редакция',
        phone: '+7 (7212) 50-05-00',
        email: 'redakciya@aimakakshamy.kz',
      },
      advertising: {
        title: 'Жарнама бөлімі',
        phone: '+7 (7212) 50-05-01',
        email: 'reklama@aimakakshamy.kz',
      },
      address: {
        title: 'Мекенжай',
        street: 'Сәтбаев қаласы, ак. Қ. Сәтбаев даңғылы, 104/1, 11-пәтер',
        postal: 'Индекс: 101301',
      },
      hours: {
        title: 'Жұмыс уақыты',
        weekdays: 'Дүйсенбі - Жұма: 9:00 - 18:00',
        weekend: 'Сенбі - Жексенбі: Демалыс',
      },
      social: {
        title: 'Әлеуметтік желілер',
        description: 'Әлеуметтік желілерде бізді іздеңіз:'
      }
    },
    ru: {
      title: 'Контакты',
      subtitle: 'Свяжитесь с нами',
      editorial: {
        title: 'Редакция',
        phone: '+7 (7212) 50-05-00',
        email: 'redakciya@aimakakshamy.kz',
      },
      advertising: {
        title: 'Рекламный отдел',
        phone: '+7 (7212) 50-05-01',
        email: 'reklama@aimakakshamy.kz',
      },
      address: {
        title: 'Адрес',
        street: 'г. Сатпаев, пр. ак. К. Сатпаева, 104/1, кв. 11',
        postal: 'Индекс: 101301',
      },
      hours: {
        title: 'Время работы',
        weekdays: 'Понедельник - Пятница: 9:00 - 18:00',
        weekend: 'Суббота - Воскресенье: Выходной',
      },
      social: {
        title: 'Социальные сети',
        description: 'Следите за нами в социальных сетях:'
      }
    }
  };

  const t = content[lang];

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-4">{t.title}</h1>
        <p className="text-xl text-gray-600 mb-12">{t.subtitle}</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {/* Editorial */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">{t.editorial.title}</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <FaPhone className="text-green-600" />
                <a href={`tel:${t.editorial.phone}`} className="hover:text-green-600">
                  {t.editorial.phone}
                </a>
              </div>
              <div className="flex items-center gap-3">
                <FaEnvelope className="text-green-600" />
                <a href={`mailto:${t.editorial.email}`} className="hover:text-green-600">
                  {t.editorial.email}
                </a>
              </div>
            </div>
          </div>

          {/* Advertising */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">{t.advertising.title}</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <FaPhone className="text-green-600" />
                <a href={`tel:${t.advertising.phone}`} className="hover:text-green-600">
                  {t.advertising.phone}
                </a>
              </div>
              <div className="flex items-center gap-3">
                <FaEnvelope className="text-green-600" />
                <a href={`mailto:${t.advertising.email}`} className="hover:text-green-600">
                  {t.advertising.email}
                </a>
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">{t.address.title}</h2>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <FaMapMarkerAlt className="text-green-600 mt-1" />
                <div>
                  <p>{t.address.street}</p>
                  <p className="text-gray-600">{t.address.postal}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Hours */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">{t.hours.title}</h2>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <FaClock className="text-green-600 mt-1" />
                <div>
                  <p>{t.hours.weekdays}</p>
                  <p className="text-gray-600">{t.hours.weekend}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Social Media */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold mb-4">{t.social.title}</h2>
          <p className="text-gray-700 mb-6">{t.social.description}</p>
          <div className="flex gap-4 flex-wrap">
            <a href="https://instagram.com/aimakakshamy" target="_blank" rel="noopener noreferrer"
               className="px-4 py-2 bg-pink-600 text-white rounded hover:bg-pink-700 transition">
              Instagram
            </a>
            <a href="https://t.me/aimakakshamy" target="_blank" rel="noopener noreferrer"
               className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition">
              Telegram
            </a>
            <a href="https://facebook.com/aimakakshamy" target="_blank" rel="noopener noreferrer"
               className="px-4 py-2 bg-blue-700 text-white rounded hover:bg-blue-800 transition">
              Facebook
            </a>
            <a href="https://vk.com/aimakakshamy" target="_blank" rel="noopener noreferrer"
               className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition">
              VK
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
