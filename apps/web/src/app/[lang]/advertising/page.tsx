'use client';

import { useParams } from 'next/navigation';
import { FaPhone, FaEnvelope } from 'react-icons/fa';

export default function AdvertisingPage() {
  const params = useParams();
  const lang = (params.lang as 'kz' | 'ru') || 'kz';

  const content = {
    kz: {
      title: 'Жарнама',
      subtitle: 'Біздің басылымда жарнама орналастырыңыз',
      intro: 'Біз іскерлік серіктестікке және ынтымақтастыққа ашықпыз. «Аймақ ақшамы» желілік басылымы Қарағанды және Ұлытау облыстарында кең оқырман аудиториясына ие.',
      services: {
        title: 'Біз ұсынамыз',
        items: [
          {
            title: 'Интернет жарнама',
            description: 'Веб-сайтта әртүрлі форматтағы жарнамалық материалдарды орналастыру'
          },
          {
            title: 'Онлайн жарнама',
            description: 'Біздің веб-сайтта баннерлер мен жарнамалық блоктар'
          },
          {
            title: 'Мақалалар',
            description: 'Сіздің компания туралы мақалалар мен репортаждар жариялау'
          },
          {
            title: 'Әлеуметтік желілер',
            description: 'Әлеуметтік желілеріміздегі жарнамалық жариялаулар'
          }
        ]
      },
      pricing: {
        title: 'Баға белгілеу',
        description: 'Жарнама орналастырудың құны форматқа, орналасуына және жариялау жиілігіне байланысты. Толық прайс-лист алу және жеке ұсыныс алу үшін бізбен байланысыңыз.'
      },
      contact: {
        title: 'Байланыс',
        description: 'Жарнамалық бөлім:',
        phone: '+7 (7212) 50-05-01',
        email: 'reklama@aimakakshamy.kz',
        hours: 'Жұмыс уақыты: Дүйсенбі - Жұма, 9:00 - 18:00'
      }
    },
    ru: {
      title: 'Реклама',
      subtitle: 'Размещайте рекламу в нашем издании',
      intro: 'Мы открыты для делового партнерства и сотрудничества. Сетевое издание «Аймақ ақшамы» имеет широкую читательскую аудиторию в Карагандинской и Улытауской областях.',
      services: {
        title: 'Мы предлагаем',
        items: [
          {
            title: 'Интернет-реклама',
            description: 'Размещение рекламных материалов различных форматов на веб-сайте'
          },
          {
            title: 'Онлайн реклама',
            description: 'Баннеры и рекламные блоки на нашем веб-сайте'
          },
          {
            title: 'Статьи',
            description: 'Публикация статей и репортажей о вашей компании'
          },
          {
            title: 'Социальные сети',
            description: 'Рекламные публикации в наших социальных сетях'
          }
        ]
      },
      pricing: {
        title: 'Ценообразование',
        description: 'Стоимость размещения рекламы зависит от формата, расположения и частоты публикации. Свяжитесь с нами для получения полного прайс-листа и индивидуального предложения.'
      },
      contact: {
        title: 'Контакты',
        description: 'Рекламный отдел:',
        phone: '+7 (7212) 50-05-01',
        email: 'reklama@aimakakshamy.kz',
        hours: 'Время работы: Понедельник - Пятница, 9:00 - 18:00'
      }
    }
  };

  const t = content[lang];

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-4">{t.title}</h1>
        <p className="text-xl text-gray-600 mb-8">{t.subtitle}</p>

        <div className="space-y-8">
          <div className="bg-white rounded-lg shadow-md p-8">
            <p className="text-gray-700 text-lg leading-relaxed">{t.intro}</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold mb-6">{t.services.title}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {t.services.items.map((item, index) => (
                <div key={index} className="border-l-4 border-green-600 pl-4">
                  <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                  <p className="text-gray-600">{item.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold mb-4">{t.pricing.title}</h2>
            <p className="text-gray-700">{t.pricing.description}</p>
          </div>

          <div className="bg-green-50 rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold mb-4">{t.contact.title}</h2>
            <p className="text-gray-700 mb-4">{t.contact.description}</p>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <FaPhone className="text-green-600" />
                <a href={`tel:${t.contact.phone}`} className="text-lg font-semibold hover:text-green-600">
                  {t.contact.phone}
                </a>
              </div>
              <div className="flex items-center gap-3">
                <FaEnvelope className="text-green-600" />
                <a href={`mailto:${t.contact.email}`} className="text-lg font-semibold hover:text-green-600">
                  {t.contact.email}
                </a>
              </div>
              <p className="text-gray-600 mt-4">{t.contact.hours}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
