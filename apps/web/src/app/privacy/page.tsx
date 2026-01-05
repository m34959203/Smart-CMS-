import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Политика конфиденциальности | AIMAK',
  description: 'Политика конфиденциальности AIMAK Auto Publisher',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="bg-white rounded-lg shadow-sm p-8 md:p-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Политика конфиденциальности
          </h1>

          <p className="text-gray-600 text-sm mb-8">
            Последнее обновление: 18 декабря 2025 г.
          </p>

          <div className="prose prose-lg max-w-none">
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
              1. Введение
            </h2>
            <p className="text-gray-700 mb-4">
              AIMAK Auto Publisher - это приложение для автоматической публикации новостей
              с сайта aimaqaqshamy.kz в социальные сети (Telegram и Instagram). Мы серьезно
              относимся к защите ваших данных и конфиденциальности.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
              2. Какие данные мы собираем
            </h2>

            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">
              2.1 Данные Facebook Page
            </h3>
            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
              <li>ID страницы</li>
              <li>Название страницы</li>
              <li>Access Token для публикации</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">
              2.2 Данные Instagram Business Account
            </h3>
            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
              <li>ID Instagram аккаунта</li>
              <li>Username Instagram</li>
              <li>Access Token для публикации</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">
              2.3 Публикуемый контент
            </h3>
            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
              <li>Заголовки статей</li>
              <li>Изображения статей</li>
              <li>Текст анонсов</li>
              <li>Ссылки на полные статьи</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
              3. Как мы используем данные
            </h2>
            <p className="text-gray-700 mb-4">
              Мы используем собранные данные только для:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
              <li>Автоматической публикации новостных статей в ваш Instagram аккаунт</li>
              <li>Автоматической публикации новостных статей в ваш Telegram канал</li>
            </ul>

            <p className="text-gray-700 mb-4 font-semibold">
              Мы НЕ:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
              <li>Не передаем ваши данные третьим лицам</li>
              <li>Не продаем ваши данные</li>
              <li>Не используем данные для рекламы</li>
              <li>Не храним данные дольше, чем необходимо</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
              4. Какие разрешения мы запрашиваем
            </h2>

            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">
              4.1 Instagram API разрешения
            </h3>
            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
              <li>
                <code className="bg-gray-100 px-2 py-1 rounded text-sm">instagram_basic</code> -
                для доступа к базовой информации вашего Instagram аккаунта
              </li>
              <li>
                <code className="bg-gray-100 px-2 py-1 rounded text-sm">instagram_content_publish</code> -
                для публикации контента в ваш Instagram
              </li>
              <li>
                <code className="bg-gray-100 px-2 py-1 rounded text-sm">pages_show_list</code> -
                для получения списка ваших Facebook Pages
              </li>
              <li>
                <code className="bg-gray-100 px-2 py-1 rounded text-sm">pages_read_engagement</code> -
                для чтения данных о вовлеченности
              </li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
              5. Хранение данных
            </h2>
            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
              <li>Access Tokens хранятся в зашифрованном виде в защищенной базе данных</li>
              <li>Данные публикаций хранятся локально на защищенном сервере</li>
              <li>Мы не храним историю ваших постов после публикации</li>
              <li>Все данные защищены с помощью современных криптографических методов</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
              6. Удаление данных
            </h2>
            <p className="text-gray-700 mb-4">
              Вы можете в любой момент:
            </p>
            <ol className="list-decimal list-inside text-gray-700 mb-4 space-y-2">
              <li>Удалить Access Token из настроек приложения в админ-панели</li>
              <li>Отозвать разрешения приложения в настройках вашего Facebook аккаунта</li>
              <li>Запросить полное удаление всех данных по email: <a href="mailto:admin@aimaqaqshamy.kz" className="text-blue-600 hover:underline">admin@aimaqaqshamy.kz</a></li>
            </ol>
            <p className="text-gray-700 mb-4">
              После удаления токенов все ваши данные будут удалены из нашей системы в течение 30 дней.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
              7. Безопасность
            </h2>
            <p className="text-gray-700 mb-4">
              Мы применяем следующие меры безопасности:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
              <li>HTTPS шифрование для всех соединений</li>
              <li>Защищенное хранилище токенов с шифрованием</li>
              <li>Регулярные обновления безопасности</li>
              <li>Ограниченный доступ к данным (только для автоматизации публикаций)</li>
              <li>Мониторинг подозрительной активности</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
              8. Соответствие законодательству
            </h2>
            <p className="text-gray-700 mb-4">
              Мы соблюдаем требования:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
              <li>GDPR (Общий регламент по защите данных ЕС)</li>
              <li>Законодательство Республики Казахстан о персональных данных</li>
              <li>Политики конфиденциальности Facebook и Instagram</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
              9. Контакты
            </h2>
            <p className="text-gray-700 mb-4">
              По вопросам конфиденциальности свяжитесь с нами:
            </p>
            <ul className="list-none text-gray-700 mb-4 space-y-2">
              <li>Email: <a href="mailto:admin@aimaqaqshamy.kz" className="text-blue-600 hover:underline">admin@aimaqaqshamy.kz</a></li>
              <li>Сайт: <a href="https://aimaqaqshamy.kz" className="text-blue-600 hover:underline">https://aimaqaqshamy.kz</a></li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
              10. Изменения политики
            </h2>
            <p className="text-gray-700 mb-4">
              Мы можем обновлять эту политику конфиденциальности. Все изменения вступают в силу
              после публикации обновленной версии на этой странице. Существенные изменения будут
              дополнительно объявлены на главной странице сайта.
            </p>
            <p className="text-gray-700 mb-4">
              Мы рекомендуем периодически просматривать эту страницу для ознакомления с актуальной
              информацией о том, как мы защищаем ваши данные.
            </p>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Дата последнего обновления: 18 декабря 2025 г.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
