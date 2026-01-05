'use client';

import { useState, useEffect } from 'react';
import { getApiEndpoint } from '@/lib/api-url';

interface Advertisement {
  id: string;
  code: string;
  nameKz: string;
  nameRu: string;
  type: 'CUSTOM' | 'YANDEX_DIRECT' | 'GOOGLE_ADSENSE';
  position: string;
  size: string;
  isActive: boolean;
  customHtml?: string;
  imageUrl?: string;
  clickUrl?: string;
  yandexBlockId?: string;
  googleAdSlot?: string;
  googleAdClient?: string;
}

export default function AdminAdvertisementsPage() {
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [code, setCode] = useState('');
  const [nameKz, setNameKz] = useState('');
  const [nameRu, setNameRu] = useState('');
  const [type, setType] = useState<'CUSTOM' | 'YANDEX_DIRECT' | 'GOOGLE_ADSENSE'>('CUSTOM');
  const [position, setPosition] = useState('HOME_TOP');
  const [size, setSize] = useState('BANNER_728x90');
  const [customHtml, setCustomHtml] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [clickUrl, setClickUrl] = useState('');
  const [yandexBlockId, setYandexBlockId] = useState('');
  const [googleAdSlot, setGoogleAdSlot] = useState('');
  const [googleAdClient, setGoogleAdClient] = useState('');
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    fetchAds();
  }, []);

  const fetchAds = async () => {
    try {
      const response = await fetch(getApiEndpoint('/advertisements'));
      const data = await response.json();
      setAds(data);
    } catch (error) {
      console.error('Error fetching ads:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (ad: Advertisement) => {
    setCode(ad.code);
    setNameKz(ad.nameKz);
    setNameRu(ad.nameRu);
    setType(ad.type);
    setPosition(ad.position);
    setSize(ad.size);
    setCustomHtml(ad.customHtml || '');
    setImageUrl(ad.imageUrl || '');
    setClickUrl(ad.clickUrl || '');
    setYandexBlockId(ad.yandexBlockId || '');
    setGoogleAdSlot(ad.googleAdSlot || '');
    setGoogleAdClient(ad.googleAdClient || '');
    setIsActive(ad.isActive);
    setEditingId(ad.id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const token = localStorage.getItem('accessToken');
    const payload: any = {
      code,
      nameKz,
      nameRu,
      type,
      position,
      size,
      isActive,
    };

    if (type === 'CUSTOM') {
      if (customHtml) payload.customHtml = customHtml;
      if (imageUrl) payload.imageUrl = imageUrl;
      if (clickUrl) payload.clickUrl = clickUrl;
    } else if (type === 'YANDEX_DIRECT') {
      payload.yandexBlockId = yandexBlockId;
    } else if (type === 'GOOGLE_ADSENSE') {
      payload.googleAdSlot = googleAdSlot;
      payload.googleAdClient = googleAdClient;
    }

    try {
      const url = editingId
        ? getApiEndpoint(`/advertisements/${editingId}`)
        : getApiEndpoint('/advertisements');
      const method = editingId ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const successMessage = editingId ? 'Реклама обновлена успешно' : 'Реклама создана успешно';
        alert(successMessage);
        setShowForm(false);
        resetForm();
        setEditingId(null);
        fetchAds();
      } else {
        const errorMessage = editingId ? 'Ошибка при обновлении рекламы' : 'Ошибка при создании рекламы';
        alert(errorMessage);
      }
    } catch (error) {
      console.error('Error submitting ad:', error);
      const errorMessage = editingId ? 'Ошибка при обновлении рекламы' : 'Ошибка при создании рекламы';
      alert(errorMessage);
    }
  };

  const resetForm = () => {
    setCode('');
    setNameKz('');
    setNameRu('');
    setType('CUSTOM');
    setPosition('HOME_TOP');
    setSize('BANNER_728x90');
    setCustomHtml('');
    setImageUrl('');
    setClickUrl('');
    setYandexBlockId('');
    setGoogleAdSlot('');
    setGoogleAdClient('');
    setIsActive(true);
    setEditingId(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Вы уверены, что хотите удалить эту рекламу?')) return;

    const token = localStorage.getItem('accessToken');
    try {
      const response = await fetch(getApiEndpoint(`/advertisements/${id}`), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        alert('Реклама удалена');
        fetchAds();
      } else {
        alert('Ошибка при удалении рекламы');
      }
    } catch (error) {
      console.error('Error deleting ad:', error);
      alert('Ошибка при удалении рекламы');
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    const token = localStorage.getItem('accessToken');
    try {
      const response = await fetch(getApiEndpoint(`/advertisements/${id}`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (response.ok) {
        fetchAds();
      }
    } catch (error) {
      console.error('Error toggling ad:', error);
    }
  };

  if (loading) {
    return <div className="container mx-auto px-4 py-12"><p className="text-center">Загрузка...</p></div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">Управление рекламой</h1>
        <button
          onClick={() => {
            setShowForm(!showForm);
            if (showForm) {
              resetForm();
            }
          }}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          {showForm ? 'Отмена' : 'Добавить рекламу'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white shadow-md rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4">
            {editingId ? 'Редактировать рекламу' : 'Новая реклама'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Код *
                  <span className="ml-2 text-xs text-gray-500 font-normal">
                    Уникальный идентификатор рекламы (например: banner-home-1)
                  </span>
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="banner-home-1"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Тип *
                  <span className="ml-2 text-xs text-gray-500 font-normal">
                    Выберите тип рекламного блока
                  </span>
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="CUSTOM">Собственная реклама (HTML/изображение)</option>
                  <option value="YANDEX_DIRECT">Яндекс.Директ</option>
                  <option value="GOOGLE_ADSENSE">Google AdSense</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Название (KZ) *
                  <span className="ml-2 text-xs text-gray-500 font-normal">
                    Внутреннее название на казахском языке для идентификации
                  </span>
                </label>
                <input
                  type="text"
                  value={nameKz}
                  onChange={(e) => setNameKz(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="Басты бет баннері"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Название (RU) *
                  <span className="ml-2 text-xs text-gray-500 font-normal">
                    Внутреннее название на русском языке для идентификации
                  </span>
                </label>
                <input
                  type="text"
                  value={nameRu}
                  onChange={(e) => setNameRu(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="Баннер на главной странице"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Позиция *
                  <span className="ml-2 text-xs text-gray-500 font-normal">
                    Место размещения рекламы на сайте
                  </span>
                </label>
                <select
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="HOME_TOP">Верх главной страницы (горизонтальный баннер)</option>
                  <option value="HOME_SIDEBAR">Боковая панель главной (вертикальный блок)</option>
                  <option value="ARTICLE_TOP">Верх страницы статьи (над текстом)</option>
                  <option value="ARTICLE_SIDEBAR">Боковая панель статьи (справа от текста)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Размер *
                  <span className="ml-2 text-xs text-gray-500 font-normal">
                    Размер рекламного блока в пикселях
                  </span>
                </label>
                <select
                  value={size}
                  onChange={(e) => setSize(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="BANNER_728x90">728x90 - Стандартный баннер (десктоп)</option>
                  <option value="LARGE_BANNER_970x90">970x90 - Большой баннер (десктоп)</option>
                  <option value="RECTANGLE_300x250">300x250 - Средний прямоугольник</option>
                  <option value="HALF_PAGE_300x600">300x600 - Половина страницы (скайскрейпер)</option>
                  <option value="MOBILE_BANNER_320x50">320x50 - Мобильный баннер</option>
                </select>
              </div>
            </div>

            {type === 'CUSTOM' && (
              <>
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
                  <h3 className="text-sm font-semibold text-blue-900 mb-2">Настройки собственной рекламы</h3>
                  <p className="text-xs text-blue-700">
                    Вы можете использовать либо HTML-код, либо изображение со ссылкой.
                    Если указан HTML-код, он будет использован. Иначе будет показано изображение.
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    HTML код
                    <span className="ml-2 text-xs text-gray-500 font-normal">
                      (Опционально) Произвольный HTML-код для рекламного блока
                    </span>
                  </label>
                  <textarea
                    value={customHtml}
                    onChange={(e) => setCustomHtml(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md font-mono text-sm"
                    rows={4}
                    placeholder='<div style="background: #f0f0f0; padding: 20px; text-align: center;">
  <h2>Ваша реклама</h2>
  <p>Описание</p>
</div>'
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Используйте для вставки кастомного HTML, JavaScript или виджетов сторонних сервисов
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    URL изображения
                    <span className="ml-2 text-xs text-gray-500 font-normal">
                      (Опционально) Ссылка на изображение баннера
                    </span>
                  </label>
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="https://example.com/banner.jpg"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Укажите полный URL изображения. Рекомендуется использовать изображение нужного размера
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    URL ссылки
                    <span className="ml-2 text-xs text-gray-500 font-normal">
                      (Опционально) Адрес, на который ведет баннер при клике
                    </span>
                  </label>
                  <input
                    type="url"
                    value={clickUrl}
                    onChange={(e) => setClickUrl(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="https://example.com/landing-page"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Укажите URL страницы, на которую будут переходить пользователи при клике на изображение
                  </p>
                </div>
              </>
            )}

            {type === 'YANDEX_DIRECT' && (
              <>
                <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
                  <h3 className="text-sm font-semibold text-red-900 mb-2">Настройки Яндекс.Директ</h3>
                  <p className="text-xs text-red-700 mb-2">
                    Для использования Яндекс.Директ необходимо иметь аккаунт в Яндекс.Директ и созданный рекламный блок.
                  </p>
                  <a
                    href="https://direct.yandex.ru"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-red-600 underline hover:text-red-800"
                  >
                    Перейти в Яндекс.Директ →
                  </a>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Yandex Block ID *
                    <span className="ml-2 text-xs text-gray-500 font-normal">
                      ID рекламного блока из личного кабинета Яндекс.Директ
                    </span>
                  </label>
                  <input
                    type="text"
                    value={yandexBlockId}
                    onChange={(e) => setYandexBlockId(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md font-mono"
                    placeholder="R-A-123456-1"
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Найдите ID блока в разделе "Площадки" → "Код для вставки на сайт"
                  </p>
                </div>
              </>
            )}

            {type === 'GOOGLE_ADSENSE' && (
              <>
                <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-4">
                  <h3 className="text-sm font-semibold text-green-900 mb-2">Настройки Google AdSense</h3>
                  <p className="text-xs text-green-700 mb-2">
                    Для использования Google AdSense необходимо иметь одобренный аккаунт в Google AdSense и созданный рекламный блок.
                  </p>
                  <a
                    href="https://www.google.com/adsense"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-green-600 underline hover:text-green-800"
                  >
                    Перейти в Google AdSense →
                  </a>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Google Ad Client *
                    <span className="ml-2 text-xs text-gray-500 font-normal">
                      Идентификатор издателя (Publisher ID)
                    </span>
                  </label>
                  <input
                    type="text"
                    value={googleAdClient}
                    onChange={(e) => setGoogleAdClient(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md font-mono"
                    placeholder="ca-pub-1234567890123456"
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Начинается с "ca-pub-". Найдите в разделе AdSense → "Аккаунт" → "Информация об аккаунте"
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Google Ad Slot *
                    <span className="ml-2 text-xs text-gray-500 font-normal">
                      Идентификатор рекламного блока (Ad unit ID)
                    </span>
                  </label>
                  <input
                    type="text"
                    value={googleAdSlot}
                    onChange={(e) => setGoogleAdSlot(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md font-mono"
                    placeholder="1234567890"
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Найдите в разделе "Реклама" → "Рекламные блоки" → выберите блок → скопируйте data-ad-slot
                  </p>
                </div>
              </>
            )}

            <div className="border-t pt-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="mr-2 h-4 w-4"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                  Активна
                  <span className="ml-2 text-xs text-gray-500 font-normal">
                    Если отключено, реклама не будет показываться на сайте
                  </span>
                </label>
              </div>
              <p className="mt-2 text-xs text-gray-500 ml-6">
                Используйте эту настройку для временного отключения рекламы без удаления
              </p>
            </div>

            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              {editingId ? 'Обновить' : 'Создать'}
            </button>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6">
        {ads.map((ad) => (
          <div key={ad.id} className="bg-white shadow-md rounded-lg p-6 border">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold">{ad.nameKz} / {ad.nameRu}</h3>
                <p className="text-sm text-gray-500">Код: {ad.code}</p>
                <p className="text-sm text-gray-500">Тип: {ad.type}</p>
                <p className="text-sm text-gray-500">Позиция: {ad.position}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(ad)}
                  className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                >
                  Редактировать
                </button>
                <button
                  onClick={() => toggleActive(ad.id, ad.isActive)}
                  className={`px-3 py-1 rounded text-sm ${
                    ad.isActive
                      ? 'bg-green-500 text-white hover:bg-green-600'
                      : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                  }`}
                >
                  {ad.isActive ? 'Активна' : 'Неактивна'}
                </button>
                <button
                  onClick={() => handleDelete(ad.id)}
                  className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                >
                  Удалить
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
