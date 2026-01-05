'use client';

import { useState } from 'react';
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from '@/hooks/use-categories';

interface Category {
  id: string;
  slug: string;
  nameKz: string;
  nameRu: string;
  descriptionKz?: string;
  descriptionRu?: string;
  _count?: { articles: number };
}

export default function AdminCategoriesPage() {
  const { data: categories, isLoading } = useCategories();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [nameKz, setNameKz] = useState('');
  const [nameRu, setNameRu] = useState('');
  const [descriptionKz, setDescriptionKz] = useState('');
  const [descriptionRu, setDescriptionRu] = useState('');
  const [slug, setSlug] = useState('');

  const generateSlug = (text: string) => {
    // Транслитерация казахских и русских символов в латиницу
    const translitMap: { [key: string]: string } = {
      // Казахские специфичные буквы
      'ә': 'a', 'Ә': 'A',
      'і': 'i', 'І': 'I',
      'ң': 'n', 'Ң': 'N',
      'ғ': 'g', 'Ғ': 'G',
      'ү': 'u', 'Ү': 'U',
      'ұ': 'u', 'Ұ': 'U',
      'қ': 'q', 'Қ': 'Q',
      'ө': 'o', 'Ө': 'O',
      'һ': 'h', 'Һ': 'H',
      // Общие кириллические буквы
      'а': 'a', 'А': 'A',
      'б': 'b', 'Б': 'B',
      'в': 'v', 'В': 'V',
      'г': 'g', 'Г': 'G',
      'д': 'd', 'Д': 'D',
      'е': 'e', 'Е': 'E',
      'ё': 'yo', 'Ё': 'Yo',
      'ж': 'zh', 'Ж': 'Zh',
      'з': 'z', 'З': 'Z',
      'и': 'i', 'И': 'I',
      'й': 'y', 'Й': 'Y',
      'к': 'k', 'К': 'K',
      'л': 'l', 'Л': 'L',
      'м': 'm', 'М': 'M',
      'н': 'n', 'Н': 'N',
      'о': 'o', 'О': 'O',
      'п': 'p', 'П': 'P',
      'р': 'r', 'Р': 'R',
      'с': 's', 'С': 'S',
      'т': 't', 'Т': 'T',
      'у': 'u', 'У': 'U',
      'ф': 'f', 'Ф': 'F',
      'х': 'kh', 'Х': 'Kh',
      'ц': 'ts', 'Ц': 'Ts',
      'ч': 'ch', 'Ч': 'Ch',
      'ш': 'sh', 'Ш': 'Sh',
      'щ': 'shch', 'Щ': 'Shch',
      'ъ': '', 'Ъ': '',
      'ы': 'y', 'Ы': 'Y',
      'ь': '', 'Ь': '',
      'э': 'e', 'Э': 'E',
      'ю': 'yu', 'Ю': 'Yu',
      'я': 'ya', 'Я': 'Ya',
    };

    // Транслитерация
    let transliterated = text.split('').map(char => translitMap[char] || char).join('');

    // Генерация slug: только латиница и цифры
    return transliterated
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')  // Только латиница и цифры!
      .replace(/(^-|-$)/g, '');
  };

  const handleNameKzChange = (value: string) => {
    setNameKz(value);
    if (!slug && !editingCategory) {
      setSlug(generateSlug(value));
    }
  };

  const resetForm = () => {
    setNameKz('');
    setNameRu('');
    setDescriptionKz('');
    setDescriptionRu('');
    setSlug('');
    setEditingCategory(null);
    setShowForm(false);
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setNameKz(category.nameKz);
    setNameRu(category.nameRu);
    setDescriptionKz(category.descriptionKz || '');
    setDescriptionRu(category.descriptionRu || '');
    setSlug(category.slug);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const data = {
      slug: slug || generateSlug(nameKz),
      nameKz,
      nameRu,
      descriptionKz: descriptionKz || undefined,
      descriptionRu: descriptionRu || undefined,
    };

    if (editingCategory) {
      updateCategory.mutate(
        { id: editingCategory.id, data },
        {
          onSuccess: () => {
            alert('Категория успешно обновлена!');
            resetForm();
          },
          onError: (error) => {
            console.error('Update error:', error);
            alert('Ошибка при обновлении категории: ' + (error as Error).message);
          },
        }
      );
    } else {
      createCategory.mutate(data, {
        onSuccess: () => {
          alert('Категория успешно создана!');
          resetForm();
        },
        onError: (error) => {
          console.error('Create error:', error);
          alert('Ошибка при создании категории: ' + (error as Error).message);
        },
      });
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Вы уверены, что хотите удалить эту категорию?')) {
      deleteCategory.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <p className="text-center">Загрузка...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">Управление категориями</h1>
        <button
          onClick={() => {
            if (showForm) {
              resetForm();
            } else {
              setShowForm(true);
            }
          }}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          {showForm ? 'Отмена' : 'Добавить категорию'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white shadow-md rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4">
            {editingCategory ? 'Редактирование категории' : 'Новая категория'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            {(createCategory.isError || updateCategory.isError) && (
              <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                Ошибка при {editingCategory ? 'обновлении' : 'создании'} категории
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Название (Қазақша) *
                </label>
                <input
                  type="text"
                  value={nameKz}
                  onChange={(e) => handleNameKzChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Мысалы: Жаңалықтар"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Название (Русский) *
                </label>
                <input
                  type="text"
                  value={nameRu}
                  onChange={(e) => setNameRu(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Например: Новости"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Slug (URL) *
              </label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="zhanalyqtar"
                required
                disabled={!!editingCategory}
              />
              <p className="text-xs text-gray-500 mt-1">
                {editingCategory
                  ? 'Slug нельзя изменить после создания'
                  : 'Автоматически генерируется из казахского названия'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Описание (Қазақша)
              </label>
              <textarea
                value={descriptionKz}
                onChange={(e) => setDescriptionKz(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Санаттың сипаттамасы (міндетті емес)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Описание (Русский)
              </label>
              <textarea
                value={descriptionRu}
                onChange={(e) => setDescriptionRu(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Описание категории (опционально)"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={createCategory.isPending || updateCategory.isPending}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
              >
                {(createCategory.isPending || updateCategory.isPending)
                  ? 'Сохранение...'
                  : editingCategory ? 'Сохранить' : 'Создать'}
              </button>
              {editingCategory && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
                >
                  Отмена
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      {categories && categories.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-600">Категорий пока нет</p>
        </div>
      )}

      {categories && categories.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category: Category) => (
            <div
              key={category.id}
              className="bg-white shadow-md rounded-lg p-6 border hover:shadow-lg transition-shadow"
            >
              <div className="mb-2">
                <h3 className="text-xl font-bold">{category.nameKz}</h3>
                <p className="text-sm text-gray-500">{category.nameRu}</p>
              </div>
              {category.descriptionKz && (
                <p className="text-gray-600 mb-2 text-sm">{category.descriptionKz}</p>
              )}
              {category.descriptionRu && (
                <p className="text-gray-500 mb-4 text-xs italic">{category.descriptionRu}</p>
              )}
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="text-xs text-gray-500">
                  <div>Slug: <span className="font-mono">{category.slug}</span></div>
                  <div>{category._count?.articles || 0} статей</div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(category)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-semibold"
                  >
                    Редактировать
                  </button>
                  <button
                    onClick={() => handleDelete(category.id)}
                    className="text-red-600 hover:text-red-800 text-sm font-semibold"
                  >
                    Удалить
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
