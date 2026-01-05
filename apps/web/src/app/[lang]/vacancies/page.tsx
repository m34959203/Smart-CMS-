'use client';

import { useParams } from 'next/navigation';
import { FaEnvelope, FaPaperPlane } from 'react-icons/fa';

export default function VacanciesPage() {
  const params = useParams();
  const lang = (params.lang as 'kz' | 'ru') || 'kz';

  const content = {
    kz: {
      title: 'Вакансиялар',
      subtitle: 'Біздің командаға қосылыңыз',
      intro: '«Аймақ ақшамы» желілік басылымы үнемі дарынды және жігерлі мамандарды іздеуде. Егер сіз журналистика саласында жұмыс істегіңіз келсе, біз сізді күтеміз!',
      positions: {
        title: 'Ашық вакансиялар',
        none: 'Қазіргі уақытта ашық вакансиялар жоқ',
        check: 'Жаңа вакансиялар туралы әлеуметтік желілерімізді және веб-сайтымызды қадағалап отырыңыз.'
      },
      requirements: {
        title: 'Біз іздеп отырмыз',
        items: [
          'Журналистер - жаңалықтар, репортаждар және мақалалар дайындау',
          'Редакторлар - контентке жауапты және сапаны қадағалау',
          'Фотографтар - оқиғаларды бейнелеу және суреттер дайындау',
          'SMM-мамандар - әлеуметтік желілерді басқару',
          'Веб-әзірлеушілер - сайтты әзірлеу және қолдау'
        ]
      },
      howToApply: {
        title: 'Резюме қалай жіберу керек',
        description: 'Өзіңіз туралы резюме мен қысқаша хатты мына электрондық поштаға жіберіңіз:',
        email: 'hr@aimakakshamy.kz',
        note: 'Тақырыпта қызметіңізді көрсетіңіз. Біз барлық өтініштерді қарастырамыз және үміткерлермен байланысамыз.'
      },
      benefits: {
        title: 'Біздің артықшылықтарымыз',
        items: [
          'Бәсекеге қабілетті жалақы',
          'Кәсіби даму мүмкіндіктері',
          'Достық және креативті команда',
          'Икемді жұмыс кестесі',
          'Әлеуметтік кепілдіктер'
        ]
      }
    },
    ru: {
      title: 'Вакансии',
      subtitle: 'Присоединяйтесь к нашей команде',
      intro: 'Сетевое издание «Аймақ ақшамы» постоянно находится в поиске талантливых и энергичных специалистов. Если вы хотите работать в сфере журналистики, мы ждем вас!',
      positions: {
        title: 'Открытые вакансии',
        none: 'В настоящее время открытых вакансий нет',
        check: 'Следите за новыми вакансиями в наших социальных сетях и на веб-сайте.'
      },
      requirements: {
        title: 'Кого мы ищем',
        items: [
          'Журналисты - подготовка новостей, репортажей и статей',
          'Редакторы - ответственные за контент и контроль качества',
          'Фотографы - съемка событий и подготовка изображений',
          'SMM-специалисты - управление социальными сетями',
          'Веб-разработчики - разработка и поддержка сайта'
        ]
      },
      howToApply: {
        title: 'Как подать резюме',
        description: 'Отправьте резюме и краткое сопроводительное письмо на электронную почту:',
        email: 'hr@aimakakshamy.kz',
        note: 'В теме письма укажите должность. Мы рассматриваем все заявки и связываемся с кандидатами.'
      },
      benefits: {
        title: 'Наши преимущества',
        items: [
          'Конкурентная заработная плата',
          'Возможности профессионального развития',
          'Дружная и креативная команда',
          'Гибкий график работы',
          'Социальные гарантии'
        ]
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
            <h2 className="text-2xl font-bold mb-6">{t.positions.title}</h2>
            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-4">
              <p className="font-semibold">{t.positions.none}</p>
              <p className="text-sm text-gray-600 mt-2">{t.positions.check}</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold mb-6">{t.requirements.title}</h2>
            <ul className="space-y-3">
              {t.requirements.items.map((item, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="text-green-600 font-bold">•</span>
                  <span className="text-gray-700">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-green-50 rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold mb-4">{t.howToApply.title}</h2>
            <p className="text-gray-700 mb-4">{t.howToApply.description}</p>
            <div className="flex items-center gap-3 mb-4">
              <FaEnvelope className="text-green-600 text-xl" />
              <a
                href={`mailto:${t.howToApply.email}`}
                className="text-xl font-semibold text-green-600 hover:text-green-700"
              >
                {t.howToApply.email}
              </a>
            </div>
            <p className="text-sm text-gray-600">{t.howToApply.note}</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold mb-6">{t.benefits.title}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {t.benefits.items.map((item, index) => (
                <div key={index} className="flex items-center gap-3 bg-gray-50 p-4 rounded">
                  <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                  <span className="text-gray-700">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
