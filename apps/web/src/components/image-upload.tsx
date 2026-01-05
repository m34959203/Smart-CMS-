'use client';

import { useState } from 'react';

interface ImageUploadProps {
  onImageUrl: (url: string) => void;
  currentUrl?: string;
}

export function ImageUpload({ onImageUrl, currentUrl }: ImageUploadProps) {
  const [imageUrl, setImageUrl] = useState(currentUrl || '');
  const [previewUrl, setPreviewUrl] = useState(currentUrl || '');

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setImageUrl(url);
    setPreviewUrl(url);
    onImageUrl(url);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          URL изображения
        </label>
        <input
          type="url"
          value={imageUrl}
          onChange={handleUrlChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="https://example.com/image.jpg"
        />
        <p className="text-xs text-gray-500 mt-1">
          Вставьте URL изображения или используйте сервисы вроде Imgur, Cloudinary
        </p>
      </div>

      {previewUrl && (
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Предпросмотр:</p>
          <div className="border rounded-lg overflow-hidden max-w-md">
            <img
              src={previewUrl}
              alt="Preview"
              className="w-full h-auto"
              onError={() => setPreviewUrl('')}
            />
          </div>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Совет:</strong> Для загрузки изображений используйте бесплатные сервисы:
        </p>
        <ul className="text-sm text-blue-700 mt-2 ml-4 list-disc">
          <li>Imgur.com - простая загрузка изображений</li>
          <li>Cloudinary.com - профессиональное CDN</li>
          <li>ImgBB.com - быстрый хостинг изображений</li>
        </ul>
      </div>
    </div>
  );
}
