import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Условия использования | AIMAK',
  description: 'Условия использования AIMAK Auto Publisher',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="bg-white rounded-lg shadow-sm p-8 md:p-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Условия использования
          </h1>

          <p className="text-gray-600 text-sm mb-8">
            Последнее обновление: 18 декабря 2025 г.
          </p>

          <div className="prose prose-lg max-w-none">
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
              1. Принятие условий
            </h2>
            <p className="text-gray-700 mb-4">
              Используя AIMAK Auto Publisher, вы соглашаетесь с настоящими условиями использования.
              Если вы не согласны с какими-либо положениями, пожалуйста, не используйте сервис.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
              2. Описание сервиса
            </h2>
            <p className="text-gray-700 mb-4">
              AIMAK Auto Publisher - это инструмент для автоматической публикации новостных
              статей с сайта aimaqaqshamy.kz в социальные сети (Telegram и Instagram).
            </p>
            <p className="text-gray-700 mb-4">
              Сервис предназначен для:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
              <li>Автоматизации распространения новостного контента</li>
              <li>Синхронизации публикаций между веб-сайтом и социальными сетями</li>
              <li>Экономии времени журналистов и редакторов</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
              3. Регистрация и доступ
            </h2>
            <p className="text-gray-700 mb-4">
              Для использования сервиса необходимо:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
              <li>Иметь действующий аккаунт администратора на aimaqaqshamy.kz</li>
              <li>Иметь Instagram Business аккаунт, привязанный к Facebook Page</li>
              <li>Иметь Telegram Bot Token для публикации в Telegram канал</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
              4. Разрешенное использование
            </h2>
            <p className="text-gray-700 mb-4">
              Вы соглашаетесь:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
              <li>Использовать сервис только для публикации новостного контента</li>
              <li>Публиковать только контент, на который у вас есть права</li>
              <li>Соблюдать правила и политики платформ Instagram и Telegram</li>
              <li>Использовать только свои собственные аккаунты</li>
              <li>Не пытаться обойти ограничения или меры безопасности сервиса</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
              5. Запрещенное использование
            </h2>
            <p className="text-gray-700 mb-4">
              Вы НЕ можете:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
              <li>Использовать сервис для спама или массовой рассылки</li>
              <li>Публиковать чужой контент без разрешения правообладателей</li>
              <li>Нарушать авторские права, товарные знаки или другие права интеллектуальной собственности</li>
              <li>Публиковать незаконный, оскорбительный, дискриминационный или вредоносный контент</li>
              <li>Использовать сервис для распространения вредоносного ПО</li>
              <li>Продавать, передавать или сдавать в аренду доступ к сервису</li>
              <li>Вмешиваться в работу сервиса или серверов</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
              6. Контент пользователей
            </h2>
            <p className="text-gray-700 mb-4">
              Вы сохраняете все права на контент, который публикуете через сервис.
            </p>
            <p className="text-gray-700 mb-4">
              Публикуя контент, вы:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
              <li>Гарантируете, что имеете все необходимые права на публикацию</li>
              <li>Несете полную ответственность за опубликованный контент</li>
              <li>Предоставляете нам лицензию на использование контента исключительно для выполнения публикации</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
              7. Интеллектуальная собственность
            </h2>
            <p className="text-gray-700 mb-4">
              Все права на программное обеспечение, дизайн и материалы сервиса принадлежат
              aimaqaqshamy.kz. Вы получаете ограниченную, неисключительную лицензию на использование
              сервиса в соответствии с настоящими условиями.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
              8. Ограничения и отказ от гарантий
            </h2>
            <p className="text-gray-700 mb-4">
              Сервис предоставляется "как есть" без каких-либо гарантий:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
              <li>Мы не гарантируем 100% доступность сервиса</li>
              <li>Мы не гарантируем отсутствие ошибок или сбоев</li>
              <li>Мы можем временно приостановить сервис для обслуживания или обновлений</li>
              <li>Мы не несем ответственности за задержки или неудачи публикаций из-за технических проблем</li>
              <li>Мы не несем ответственности за изменения в API Instagram или Telegram</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
              9. Ограничение ответственности
            </h2>
            <p className="text-gray-700 mb-4">
              В максимальной степени, допустимой законом:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
              <li>Мы не несем ответственности за любой прямой, косвенный или случайный ущерб</li>
              <li>Мы не несем ответственности за потерю данных, прибыли или репутации</li>
              <li>Вы несете полную ответственность за контент, который публикуете</li>
              <li>Вы несете ответственность за соблюдение законов и правил платформ</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
              10. Ваша ответственность
            </h2>
            <p className="text-gray-700 mb-4">
              Вы несете полную ответственность за:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
              <li>Контент, который публикуете через сервис</li>
              <li>Соблюдение законов вашей страны и международного законодательства</li>
              <li>Соблюдение правил и политик Instagram, Facebook и Telegram</li>
              <li>Безопасность ваших учетных данных (пароли, токены)</li>
              <li>Действия, совершенные под вашей учетной записью</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
              11. Прекращение использования
            </h2>

            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">
              11.1 Со стороны пользователя
            </h3>
            <p className="text-gray-700 mb-4">
              Вы можете прекратить использование сервиса в любой момент:
            </p>
            <ol className="list-decimal list-inside text-gray-700 mb-4 space-y-2">
              <li>Удалив Access Token из настроек админ-панели</li>
              <li>Отозвав разрешения в настройках Facebook и Instagram</li>
            </ol>

            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">
              11.2 Со стороны сервиса
            </h3>
            <p className="text-gray-700 mb-4">
              Мы можем приостановить или прекратить предоставление сервиса:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
              <li>При нарушении настоящих условий</li>
              <li>При подозрении в незаконной деятельности</li>
              <li>По техническим причинам</li>
              <li>При прекращении работы aimaqaqshamy.kz</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
              12. Изменения условий
            </h2>
            <p className="text-gray-700 mb-4">
              Мы оставляем за собой право изменять настоящие условия в любое время.
              Существенные изменения будут объявлены на главной странице сайта.
            </p>
            <p className="text-gray-700 mb-4">
              Продолжение использования сервиса после внесения изменений означает
              принятие новых условий.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
              13. Применимое право
            </h2>
            <p className="text-gray-700 mb-4">
              Настоящие условия регулируются законодательством Республики Казахстан.
              Все споры подлежат разрешению в судах Республики Казахстан.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
              14. Связь с нами
            </h2>
            <p className="text-gray-700 mb-4">
              По вопросам, связанным с настоящими условиями, свяжитесь с нами:
            </p>
            <ul className="list-none text-gray-700 mb-4 space-y-2">
              <li>Email: <a href="mailto:admin@aimaqaqshamy.kz" className="text-blue-600 hover:underline">admin@aimaqaqshamy.kz</a></li>
              <li>Сайт: <a href="https://aimaqaqshamy.kz" className="text-blue-600 hover:underline">https://aimaqaqshamy.kz</a></li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
              15. Заключительные положения
            </h2>
            <p className="text-gray-700 mb-4">
              Если какое-либо положение настоящих условий будет признано недействительным,
              остальные положения сохраняют свою силу.
            </p>
            <p className="text-gray-700 mb-4">
              Отсутствие действий с нашей стороны в случае нарушения условий не означает
              отказ от наших прав.
            </p>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Дата последнего обновления: 18 декабря 2025 г.
            </p>
            <p className="text-sm text-gray-600 mt-2">
              Используя AIMAK Auto Publisher, вы подтверждаете, что прочитали и поняли
              настоящие условия использования и согласны их соблюдать.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
