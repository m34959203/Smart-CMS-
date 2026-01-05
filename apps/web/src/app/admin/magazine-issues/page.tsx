'use client';

import { useState } from 'react';
import { useMagazineIssues, useDeleteMagazineIssue, useCreateMagazineIssue } from '@/hooks/use-magazine-issues';
import { useUploadImage } from '@/hooks/use-media';
import type { CreateMagazineIssueDto } from '@/types';

export default function MagazineIssuesPage() {
  const [showForm, setShowForm] = useState(false);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState<CreateMagazineIssueDto>({
    issueNumber: 1,
    publishDate: new Date().toISOString().split('T')[0] + 'T00:00:00Z',
    titleKz: '',
    titleRu: '',
    pagesCount: undefined,
    coverImageUrl: '',
    isPublished: true,
    isPinned: false,
  });

  const { data: issues, isLoading, error } = useMagazineIssues();
  const deleteMutation = useDeleteMagazineIssue();
  const createMutation = useCreateMagazineIssue();
  const uploadImage = useUploadImage();

  const handleDelete = async (id: string, title: string) => {
    if (confirm(`Вы уверены, что хотите удалить выпуск "${title}"?`)) {
      await deleteMutation.mutateAsync(id);
    }
  };

  const handleCoverUpload = async () => {
    if (!coverFile) return;
    try {
      const response = await uploadImage.mutateAsync(coverFile);
      setFormData({ ...formData, coverImageUrl: response.data.url });
      setCoverFile(null);
    } catch (error) {
      alert('Ошибка загрузки обложки');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pdfFile) {
      alert('Выберите PDF файл');
      return;
    }

    setUploading(true);
    try {
      await createMutation.mutateAsync({ data: formData, file: pdfFile });
      setShowForm(false);
      setPdfFile(null);
      setFormData({
        issueNumber: 1,
        publishDate: new Date().toISOString().split('T')[0] + 'T00:00:00Z',
        titleKz: '',
        titleRu: '',
        pagesCount: undefined,
        coverImageUrl: '',
        isPublished: true,
        isPinned: false,
      });
    } catch (error: any) {
      alert(error.response?.data?.message || 'Ошибка при загрузке выпуска');
    } finally {
      setUploading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-600">Загрузка...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-red-800 font-bold mb-2">Ошибка загрузки</h2>
          <p className="text-red-600 mb-4">
            Не удалось загрузить выпуски журнала. Возможно, база данных еще не готова.
          </p>
          <p className="text-sm text-red-500">
            Технические детали: {(error as any)?.message || 'Неизвестная ошибка'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Управление выпусками журнала</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-[#16a34a] text-white rounded hover:bg-[#15803d] transition"
        >
          {showForm ? 'Отменить' : '+ Добавить выпуск'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-xl font-bold mb-4">Новый выпуск</h2>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Номер выпуска *</label>
            <input
              type="number"
              required
              min="1"
              value={formData.issueNumber}
              onChange={(e) => setFormData({ ...formData, issueNumber: Number(e.target.value) })}
              className="w-full px-3 py-2 border rounded"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Дата публикации *</label>
            <input
              type="date"
              required
              value={formData.publishDate.split('T')[0]}
              onChange={(e) => setFormData({ ...formData, publishDate: e.target.value + 'T00:00:00Z' })}
              className="w-full px-3 py-2 border rounded"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">Название (Қазақша) *</label>
              <input
                type="text"
                required
                value={formData.titleKz}
                onChange={(e) => setFormData({ ...formData, titleKz: e.target.value })}
                className="w-full px-3 py-2 border rounded"
                placeholder="Қаңтар айының шығарылымы"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Название (Русский) *</label>
              <input
                type="text"
                required
                value={formData.titleRu}
                onChange={(e) => setFormData({ ...formData, titleRu: e.target.value })}
                className="w-full px-3 py-2 border rounded"
                placeholder="Январский выпуск"
              />
            </div>
          </div>


          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">PDF файл *</label>
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
              className="w-full px-3 py-2 border rounded"
              required
            />
            {pdfFile && (
              <p className="text-sm text-gray-600 mt-1">
                Выбран: {pdfFile.name} ({(pdfFile.size / 1024 / 1024).toFixed(2)} МБ)
              </p>
            )}
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Обложка (изображение)</label>
            <div className="flex gap-2">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
                className="flex-1 px-3 py-2 border rounded"
              />
              {coverFile && (
                <button
                  type="button"
                  onClick={handleCoverUpload}
                  disabled={uploadImage.isPending}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                >
                  {uploadImage.isPending ? 'Загрузка...' : 'Загрузить'}
                </button>
              )}
            </div>
            {formData.coverImageUrl && (
              <img src={formData.coverImageUrl} alt="Cover" className="mt-2 h-32 object-cover rounded" />
            )}
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Количество страниц</label>
            <input
              type="number"
              min="1"
              value={formData.pagesCount || ''}
              onChange={(e) => setFormData({ ...formData, pagesCount: e.target.value ? Number(e.target.value) : undefined })}
              className="w-full px-3 py-2 border rounded"
            />
          </div>

          <div className="flex gap-4 mb-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.isPublished}
                onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                className="w-4 h-4"
              />
              <span className="text-sm">Опубликовать</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.isPinned}
                onChange={(e) => setFormData({ ...formData, isPinned: e.target.checked })}
                className="w-4 h-4"
              />
              <span className="text-sm">Закрепить</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={uploading || !pdfFile}
            className="w-full px-4 py-3 bg-[#16a34a] text-white rounded hover:bg-[#15803d] disabled:opacity-50 font-medium"
          >
            {uploading ? 'Загрузка...' : 'Создать выпуск'}
          </button>
        </form>
      )}

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Выпуск</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Название</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Дата</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Просмотры</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Скачивания</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Статус</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {issues?.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                  Нет выпусков. Добавьте первый выпуск журнала.
                </td>
              </tr>
            ) : (
              issues?.map((issue) => (
                <tr key={issue.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-medium">№{issue.issueNumber}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium">{issue.titleRu}</div>
                    <div className="text-sm text-gray-500">{issue.titleKz}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(issue.publishDate).toLocaleDateString('ru-RU')}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{issue.viewsCount}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{issue.downloadsCount}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      {issue.isPinned && (
                        <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded">
                          Закреплен
                        </span>
                      )}
                      <span className={`px-2 py-1 text-xs rounded ${
                        issue.isPublished
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {issue.isPublished ? 'Опубликован' : 'Черновик'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <a
                        href={issue.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Открыть
                      </a>
                      <button
                        onClick={() => handleDelete(issue.id, issue.titleRu)}
                        disabled={deleteMutation.isPending}
                        className="text-red-600 hover:text-red-800 text-sm disabled:opacity-50"
                      >
                        Удалить
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
