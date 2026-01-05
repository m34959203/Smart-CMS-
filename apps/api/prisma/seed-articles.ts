import { PrismaClient, ArticleStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting articles seeding...');

  // Получаем все категории
  const categories = await prisma.category.findMany();

  if (categories.length === 0) {
    console.log('❌ No categories found. Please run main seed first.');
    return;
  }

  // Получаем админа для авторства
  const admin = await prisma.user.findFirst({
    where: { role: 'ADMIN' },
  });

  if (!admin) {
    console.log('❌ No admin user found. Please run main seed first.');
    return;
  }

  console.log(`✅ Found ${categories.length} categories and admin user`);

  // Проверяем, есть ли уже статьи
  const existingArticles = await prisma.article.count();

  if (existingArticles > 0) {
    console.log(`ℹ️  Database already has ${existingArticles} articles`);
    const shouldContinue = process.env.FORCE_SEED === 'true';
    if (!shouldContinue) {
      console.log('ℹ️  Skipping article seeding. Use FORCE_SEED=true to force.');
      return;
    }
  }

  // Создаем по 3-5 статей для каждой категории
  const articles = [
    // Новости
    {
      titleKz: 'Қалада жаңа саябақ ашылды',
      titleRu: 'В городе открылся новый парк',
      slugKz: 'qalada-zhana-sayabaq-ashyldy',
      slugRu: 'new-park-opened',
      contentKz: JSON.stringify({
        blocks: [
          { type: 'paragraph', data: { text: 'Қала әкімдігі бүгін жаңа саябақтың ашылу салтанатын өткізді. Саябақ тұрғындар мен қонақтар үшін жаңа демалыс орнына айналады.' } },
          { type: 'paragraph', data: { text: 'Саябақта балалар алаңы, спорттық алаңкалар және серуендеуге арналған жолдар бар.' } }
        ]
      }),
      contentRu: JSON.stringify({
        blocks: [
          { type: 'paragraph', data: { text: 'Городская администрация сегодня провела торжественное открытие нового парка. Парк станет новым местом отдыха для жителей и гостей города.' } },
          { type: 'paragraph', data: { text: 'В парке есть детская площадка, спортивные площадки и дорожки для прогулок.' } }
        ]
      }),
      excerptKz: 'Қалада жаңа саябақ ашылды',
      excerptRu: 'В городе открылся новый парк',
      categorySlug: 'news',
      status: ArticleStatus.PUBLISHED,
    },
    {
      titleKz: 'Қалалық кітапханада жаңа бөлім ашылды',
      titleRu: 'В городской библиотеке открылся новый отдел',
      slugKz: 'qalalyq-kitaphanada-zhana-bolim-ashyldy',
      slugRu: 'library-new-section',
      contentKz: JSON.stringify({
        blocks: [
          { type: 'paragraph', data: { text: 'Орталық кітапханада балаларға арналған жаңа бөлім ашылды. Бұл жерде кішкентай оқырмандар өздеріне қызықты кітаптар таба алады.' } }
        ]
      }),
      contentRu: JSON.stringify({
        blocks: [
          { type: 'paragraph', data: { text: 'В центральной библиотеке открылся новый детский отдел. Здесь маленькие читатели смогут найти интересные книги для себя.' } }
        ]
      }),
      excerptKz: 'Кітапханада балаларға арналған бөлім',
      excerptRu: 'Детский отдел в библиотеке',
      categorySlug: 'news',
      status: ArticleStatus.PUBLISHED,
    },
    // Политика
    {
      titleKz: 'Қала әкімі жыл қорытындысын шығарды',
      titleRu: 'Аким города подвел итоги года',
      slugKz: 'qala-akimi-zhyl-qorytyndysyn-shygardy',
      slugRu: 'mayor-annual-results',
      contentKz: JSON.stringify({
        blocks: [
          { type: 'paragraph', data: { text: 'Қала әкімі өткен жылдың қорытындысын шығарып, келесі жылға жоспарларды жариялады.' } },
          { type: 'paragraph', data: { text: 'Басты жетістіктерге жаңа мектептер мен балабақшалар салу, жолдарды жөндеу және коммуналдық қызметтерді жақсарту жатады.' } }
        ]
      }),
      contentRu: JSON.stringify({
        blocks: [
          { type: 'paragraph', data: { text: 'Аким города подвел итоги прошедшего года и объявил планы на следующий год.' } },
          { type: 'paragraph', data: { text: 'К основным достижениям относятся строительство новых школ и детских садов, ремонт дорог и улучшение коммунальных услуг.' } }
        ]
      }),
      excerptKz: 'Әкім жылдық есеп берді',
      excerptRu: 'Аким отчитался за год',
      categorySlug: 'politics',
      status: ArticleStatus.PUBLISHED,
    },
    // Экономика
    {
      titleKz: 'Қалада жаңа кәсіпорындар ашылуда',
      titleRu: 'В городе открываются новые предприятия',
      slugKz: 'qalada-zhana-kasiporyndar-ashyluda',
      slugRu: 'new-businesses-opening',
      contentKz: JSON.stringify({
        blocks: [
          { type: 'paragraph', data: { text: 'Биыл қалада 50-ден астам жаңа кәсіпорын ашылды. Бұл мыңдаған жұмыс орнын құруға мүмкіндік берді.' } },
          { type: 'paragraph', data: { text: 'Әсіресе шағын және орта бизнес белсенді дамуда.' } }
        ]
      }),
      contentRu: JSON.stringify({
        blocks: [
          { type: 'paragraph', data: { text: 'В этом году в городе открылось более 50 новых предприятий. Это позволило создать тысячи рабочих мест.' } },
          { type: 'paragraph', data: { text: 'Особенно активно развивается малый и средний бизнес.' } }
        ]
      }),
      excerptKz: 'Жаңа кәсіпорындар ашылуда',
      excerptRu: 'Открываются новые предприятия',
      categorySlug: 'economy',
      status: ArticleStatus.PUBLISHED,
    },
    {
      titleKz: 'Қалалық базарда бағалар тұрақталды',
      titleRu: 'Цены на городском рынке стабилизировались',
      slugKz: 'qalalyq-bazarda-bagalar-turaqtaldy',
      slugRu: 'market-prices-stable',
      contentKz: JSON.stringify({
        blocks: [
          { type: 'paragraph', data: { text: 'Қалалық базарларда тамақ өнімдерінің бағалары тұрақталды. Мамандар бағаның төмендеуін күтуде.' } }
        ]
      }),
      contentRu: JSON.stringify({
        blocks: [
          { type: 'paragraph', data: { text: 'Цены на продукты питания на городских рынках стабилизировались. Эксперты ожидают снижения цен.' } }
        ]
      }),
      excerptKz: 'Базарда бағалар тұрақталды',
      excerptRu: 'Стабилизация цен на рынке',
      categorySlug: 'economy',
      status: ArticleStatus.PUBLISHED,
    },
    // Культура
    {
      titleKz: 'Қалалық театрда жаңа қойылым',
      titleRu: 'Новая постановка в городском театре',
      slugKz: 'qalalyq-teatrda-zhana-qoylym',
      slugRu: 'new-theater-play',
      contentKz: JSON.stringify({
        blocks: [
          { type: 'paragraph', data: { text: 'Қалалық драма театры жаңа қойылымды ұсынады. Бұл қазақ классикалық әдебиетінен алынған пьеса.' } },
          { type: 'paragraph', data: { text: 'Премьера келесі аптада өтеді. Билеттерді қазірден сатып алуға болады.' } }
        ]
      }),
      contentRu: JSON.stringify({
        blocks: [
          { type: 'paragraph', data: { text: 'Городской драматический театр представляет новую постановку. Это пьеса по мотивам казахской классической литературы.' } },
          { type: 'paragraph', data: { text: 'Премьера состоится на следующей неделе. Билеты можно приобрести уже сейчас.' } }
        ]
      }),
      excerptKz: 'Театрда жаңа қойылым',
      excerptRu: 'Новая пьеса в театре',
      categorySlug: 'culture',
      status: ArticleStatus.PUBLISHED,
    },
    {
      titleKz: 'Қалалық мұражайда жаңа көрме',
      titleRu: 'Новая выставка в городском музее',
      slugKz: 'qalalyq-murazhajda-zhana-korme',
      slugRu: 'museum-new-exhibition',
      contentKz: JSON.stringify({
        blocks: [
          { type: 'paragraph', data: { text: 'Тарихи мұражайда қазақ ұлттық өнеріне арналған көрме ашылды. Көрмеде ұлттық киімдер, аспаптар және қолөнер бұйымдары көрсетілген.' } }
        ]
      }),
      contentRu: JSON.stringify({
        blocks: [
          { type: 'paragraph', data: { text: 'В историческом музее открылась выставка, посвященная казахскому национальному искусству. На выставке представлены национальные костюмы, инструменты и изделия ручной работы.' } }
        ]
      }),
      excerptKz: 'Мұражайда жаңа көрме',
      excerptRu: 'Выставка в музее',
      categorySlug: 'culture',
      status: ArticleStatus.PUBLISHED,
    },
    // Спорт
    {
      titleKz: 'Қалалық футбол командасы жеңіске жетті',
      titleRu: 'Городская футбольная команда одержала победу',
      slugKz: 'qalalyq-futbol-komandasy-zheniske-zhetti',
      slugRu: 'football-team-victory',
      contentKz: JSON.stringify({
        blocks: [
          { type: 'paragraph', data: { text: 'Қалалық футбол командасы облыстық чемпионатта маңызды жеңіске жетті. Команда 3:1 есебімен жеңіп, турнирлік кестеде көш бастап тұр.' } }
        ]
      }),
      contentRu: JSON.stringify({
        blocks: [
          { type: 'paragraph', data: { text: 'Городская футбольная команда одержала важную победу в областном чемпионате. Команда выиграла со счетом 3:1 и лидирует в турнирной таблице.' } }
        ]
      }),
      excerptKz: 'Футбол командасы жеңді',
      excerptRu: 'Победа футбольной команды',
      categorySlug: 'sport',
      status: ArticleStatus.PUBLISHED,
    },
    {
      titleKz: 'Қалада жаңа спорт кешені салынады',
      titleRu: 'В городе построят новый спортивный комплекс',
      slugKz: 'qalada-zhana-sport-kesheni-salynady',
      slugRu: 'new-sports-complex',
      contentKz: JSON.stringify({
        blocks: [
          { type: 'paragraph', data: { text: 'Қала әкімдігі жаңа спорт кешенінің құрылысын жариялады. Кешенде жүзу бассейні, спорт залдары және фитнес орталығы болады.' } },
          { type: 'paragraph', data: { text: 'Құрылыс келесі айда басталады және екі жылда аяқталады деп жоспарланған.' } }
        ]
      }),
      contentRu: JSON.stringify({
        blocks: [
          { type: 'paragraph', data: { text: 'Городская администрация объявила о строительстве нового спортивного комплекса. В комплексе будут бассейн, спортивные залы и фитнес-центр.' } },
          { type: 'paragraph', data: { text: 'Строительство начнется в следующем месяце и планируется завершить за два года.' } }
        ]
      }),
      excerptKz: 'Жаңа спорт кешені салынады',
      excerptRu: 'Строительство спорткомплекса',
      categorySlug: 'sport',
      status: ArticleStatus.PUBLISHED,
    },
  ];

  // Создаем статьи
  let created = 0;
  for (const articleData of articles) {
    const { categorySlug, ...data } = articleData;

    const category = categories.find(c => c.slug === categorySlug);
    if (!category) {
      console.log(`⚠️  Category ${categorySlug} not found, skipping article`);
      continue;
    }

    // Проверяем, существует ли статья с таким slugKz
    const existing = await prisma.article.findUnique({
      where: { slugKz: data.slugKz },
    });

    if (existing) {
      console.log(`ℹ️  Article ${data.slugKz} already exists, skipping`);
      continue;
    }

    await prisma.article.create({
      data: {
        ...data,
        categoryId: category.id,
        authorId: admin.id,
        publishedAt: new Date(),
        views: Math.floor(Math.random() * 1000), // Случайные просмотры
      },
    });

    created++;
    console.log(`✅ Created article: ${data.titleRu}`);
  }

  console.log(`🎉 Article seeding completed! Created ${created} new articles.`);
}

main()
  .catch((e) => {
    console.error('❌ Error during article seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
