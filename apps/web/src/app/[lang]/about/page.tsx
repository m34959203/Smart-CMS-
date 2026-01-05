'use client';

import { useParams } from 'next/navigation';

export default function AboutPage() {
  const params = useParams();
  const lang = (params.lang as 'kz' | 'ru') || 'kz';

  const content = {
    kz: {
      title: 'Біз туралы',
      subtitle: 'Қоғамдық-саяси желілік басылым',
      history: {
        title: 'Біздің тарих',
        content: `«Аймақ ақшамы» - бұл қоғамдық-саяси желілік басылым. Біз Қарағанды облысы мен Ұлытау облысының тұрғындарына өзекті жаңалықтар, қоғамдық оқиғалар және маңызды ақпарат ұсынамыз.

Біз баспа басылымынан заманауи желілік басылымға айналдық. Бүгінде біз оқырмандарымызға жедел және сапалы ақпаратты интернет арқылы жеткіземіз.

Біздің миссиямыз - объективті, сапалы және уақытылы ақпарат беру арқылы аймақ тұрғындарын хабардар ету және қоғамдық даму процесіне үлес қосу.`,
      },
      mission: {
        title: 'Біздің миссия',
        items: [
          'Объективті және сенімді ақпарат беру',
          'Аймақтық және облыстық жаңалықтарды жария ету',
          'Қоғамдық мәселелерді көтеру',
          'Мәдени және әлеуметтік дамуға ықпал ету'
        ]
      },
      team: {
        title: 'Біздің команда',
        content: `Біздің редакция тәжірибелі журналистер, редакторлар және техникалық мамандардан тұрады. Әрбір командалық мүше өз ісінің кәсіпқойы және сапалы контент жасауға ұмтылады.`
      }
    },
    ru: {
      title: 'О нас',
      subtitle: 'Общественно-политическое сетевое издание',
      history: {
        title: 'Наша история',
        content: `«Аймақ ақшамы» - это общественно-политическое сетевое издание. Мы предоставляем актуальные новости, общественные события и важную информацию для жителей Карагандинской и Улытауской областей.

Мы прошли путь от печатного издания до современного сетевого СМИ. Сегодня мы доставляем нашим читателям оперативную и качественную информацию через интернет.

Наша миссия - информировать жителей региона через объективную, качественную и своевременную информацию, а также вносить вклад в процесс общественного развития.`,
      },
      mission: {
        title: 'Наша миссия',
        items: [
          'Предоставление объективной и достоверной информации',
          'Публикация региональных и областных новостей',
          'Поднятие общественных вопросов',
          'Содействие культурному и социальному развитию'
        ]
      },
      team: {
        title: 'Наша команда',
        content: `Наша редакция состоит из опытных журналистов, редакторов и технических специалистов. Каждый член команды является профессионалом своего дела и стремится создавать качественный контент.`
      }
    }
  };

  const t = content[lang];

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-4">{t.title}</h1>
        <p className="text-xl text-gray-600 mb-12">{t.subtitle}</p>

        <div className="space-y-12">
          <section className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold mb-4">{t.history.title}</h2>
            <p className="text-gray-700 whitespace-pre-line leading-relaxed">
              {t.history.content}
            </p>
          </section>

          <section className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold mb-4">{t.mission.title}</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              {t.mission.items.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </section>

          <section className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold mb-4">{t.team.title}</h2>
            <p className="text-gray-700 leading-relaxed">{t.team.content}</p>
          </section>
        </div>
      </div>
    </div>
  );
}
