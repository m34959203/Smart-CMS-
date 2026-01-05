'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { IoCloudOutline, IoLocationOutline, IoChevronDown } from 'react-icons/io5';
import { WiHumidity, WiBarometer, WiStrongWind } from 'react-icons/wi';

interface WeatherData {
  temp: number;
  description: string;
  humidity: number;
  pressure: number;
  windSpeed: number;
  city: string;
}

const KAZAKHSTAN_CITIES = [
  // Города республиканского значения
  'Астана',
  'Алматы',
  'Шымкент',

  // Абайская область (центр - Семей)
  'Семей',
  'Аягоз',
  'Курчатов',

  // Акмолинская область (центр - Кокшетау)
  'Кокшетау',
  'Степногорск',
  'Щучинск',

  // Актюбинская область (центр - Актобе)
  'Актобе',
  'Хромтау',
  'Кандыагаш',

  // Алматинская область (центр - Конаев)
  'Талдыкорган',
  'Конаев',
  'Капчагай',
  'Текели',
  'Есик',

  // Атырауская область (центр - Атырау)
  'Атырау',
  'Кульсары',

  // Восточно-Казахстанская область (центр - Усть-Каменогорск)
  'Усть-Каменогорск',
  'Риддер',
  'Зыряновск',

  // Жамбылская область (центр - Тараз)
  'Тараз',
  'Каратау',

  // Жетысуская область (центр - Талдыкорган)
  'Ушарал',

  // Западно-Казахстанская область (центр - Уральск)
  'Уральск',
  'Аксай',

  // Карагандинская область (центр - Караганда)
  'Караганда',
  'Темиртау',
  'Жезказган',
  'Балхаш',
  'Сатпаев',
  'Абай',
  'Шахтинск',

  // Костанайская область (центр - Костанай)
  'Костанай',
  'Рудный',
  'Аркалык',
  'Лисаковск',

  // Кызылординская область (центр - Кызылорда)
  'Кызылорда',
  'Байконыр',

  // Мангистауская область (центр - Актау)
  'Актау',
  'Жанаозен',
  'Форт-Шевченко',

  // Павлодарская область (центр - Павлодар)
  'Павлодар',
  'Экибастуз',
  'Аксу',

  // Северо-Казахстанская область (центр - Петропавловск)
  'Петропавловск',
  'Булаево',

  // Туркестанская область (центр - Туркестан)
  'Туркестан',
  'Кентау',
  'Арысь',
  'Сарыагаш',

  // Улытауская область (центр - Жезказган)
  'Улытау',
  'Каражал',
].sort();

// Mapping for cities with different API names
const CITY_API_MAPPING: Record<string, string> = {
  'Сатпаев': 'Satbayev',  // OpenWeatherMap uses "Satbayev" instead of "Satpaev"
  'Усть-Каменогорск': 'Ust-Kamenogorsk',
  'Форт-Шевченко': 'Fort-Shevchenko',
};

interface WeatherWidgetProps {
  selectedCity?: string;
  onCityChange?: (city: string) => void;
  isOpen?: boolean;
  onToggle?: () => void;
}

export function WeatherWidget({
  selectedCity: initialCity = 'Сатпаев',
  onCityChange,
  isOpen: externalIsOpen,
  onToggle
}: WeatherWidgetProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
  const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false);
  const [selectedCity, setSelectedCity] = useState(initialCity);
  const [citySearchQuery, setCitySearchQuery] = useState('');
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const cityDropdownRef = useRef<HTMLDivElement>(null);

  // Sync with external city prop
  useEffect(() => {
    setSelectedCity(initialCity);
  }, [initialCity]);

  // Helper function to close the widget
  const closeWidget = useCallback(() => {
    if (onToggle && externalIsOpen !== undefined) {
      onToggle();
    } else {
      setInternalIsOpen(false);
    }
  }, [onToggle, externalIsOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      // Игнорируем правую кнопку мыши и другие кнопки (только левая кнопка: button === 0)
      if (event.button !== 0) {
        return;
      }

      // Закрываем основной popup только если он открыт
      if (isOpen && dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        closeWidget();
      }

      // Закрываем dropdown выбора города только если он открыт
      if (isCityDropdownOpen && cityDropdownRef.current && !cityDropdownRef.current.contains(event.target as Node)) {
        setIsCityDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [closeWidget, isOpen, isCityDropdownOpen]);

  // Fetch weather data function
  const fetchWeather = useCallback(async (city: string) => {
    setLoading(true);
    try {
      // Use mapped city name if available, otherwise use the original
      const apiCity = CITY_API_MAPPING[city] || city;
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${apiCity},KZ&units=metric&appid=aa8b515e87f73801f11cf922205790fd&lang=ru`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch weather data');
      }

      const data = await response.json();

      setWeather({
        temp: Math.round(data.main.temp),
        description: data.weather[0].description,
        humidity: data.main.humidity,
        pressure: data.main.pressure,
        windSpeed: Math.round(data.wind.speed),
        city: city,
      });
    } catch (error) {
      console.error('Failed to fetch weather:', error);
      // Fallback to mock data if API fails
      setWeather({
        temp: 0,
        description: 'Не удалось загрузить данные',
        humidity: 0,
        pressure: 0,
        windSpeed: 0,
        city: city,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch weather data on city change
  useEffect(() => {
    fetchWeather(selectedCity);
  }, [selectedCity, fetchWeather]);

  const handleCitySelect = (city: string) => {
    setSelectedCity(city);
    setIsCityDropdownOpen(false);
    setCitySearchQuery('');
    if (onCityChange) {
      onCityChange(city);
    }
  };

  // Фильтрация городов по поисковому запросу
  const filteredCities = KAZAKHSTAN_CITIES.filter((city) =>
    city.toLowerCase().includes(citySearchQuery.toLowerCase())
  );

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Compact view - не кликабельный, только отображение */}
      <div className="flex items-center gap-2 px-3 py-2">
        <IoCloudOutline className="text-xl text-gray-600" />
        <span className="font-semibold text-gray-800">
          {weather ? `${weather.temp}°C` : '--°C'}
        </span>
      </div>

      {/* Expanded view */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden z-50">
          {/* City selector */}
          <div className="relative border-b border-gray-100" ref={cityDropdownRef}>
            <button
              onClick={() => setIsCityDropdownOpen(!isCityDropdownOpen)}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <IoLocationOutline className="text-gray-400" />
                <span className="font-medium text-gray-700">{selectedCity}</span>
              </div>
              <IoChevronDown
                className={`text-gray-400 transition-transform ${
                  isCityDropdownOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* City dropdown */}
            {isCityDropdownOpen && (
              <div className="absolute top-full left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
                {/* Search input */}
                <div className="p-2 border-b border-gray-200">
                  <input
                    type="text"
                    value={citySearchQuery}
                    onChange={(e) => setCitySearchQuery(e.target.value)}
                    placeholder="Поиск города..."
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
                {/* City list */}
                <div className="max-h-60 overflow-y-auto">
                  {filteredCities.length > 0 ? (
                    filteredCities.map((city) => (
                      <button
                        key={city}
                        onClick={() => handleCitySelect(city)}
                        className={`w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors ${
                          city === selectedCity ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                        }`}
                      >
                        {city}
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-gray-500 text-sm text-center">
                      Город не найден
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Weather info */}
          {loading ? (
            <div className="p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            </div>
          ) : weather ? (
            <div className="p-4">
              {/* Temperature */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <IoCloudOutline className="text-5xl text-blue-400" />
                  <div>
                    <div className="text-4xl font-bold text-gray-800">
                      {weather.temp}°C
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      {weather.description}
                    </div>
                  </div>
                </div>
              </div>

              {/* Weather details */}
              <div className="grid grid-cols-3 gap-3 mt-4">
                {/* Wind */}
                <div className="flex items-center gap-2">
                  <WiStrongWind className="text-2xl text-gray-400" />
                  <div>
                    <div className="text-xs text-gray-500">Ветер</div>
                    <div className="text-sm font-medium text-gray-700">
                      {weather.windSpeed} м/с
                    </div>
                  </div>
                </div>

                {/* Humidity */}
                <div className="flex items-center gap-2">
                  <WiHumidity className="text-2xl text-gray-400" />
                  <div>
                    <div className="text-xs text-gray-500">Влажность</div>
                    <div className="text-sm font-medium text-gray-700">
                      {weather.humidity}%
                    </div>
                  </div>
                </div>

                {/* Pressure */}
                <div className="flex items-center gap-2">
                  <WiBarometer className="text-2xl text-gray-400" />
                  <div>
                    <div className="text-xs text-gray-500">Давление</div>
                    <div className="text-sm font-medium text-gray-700">
                      {weather.pressure} hPa
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 text-center text-gray-500">
              Не удалось загрузить погоду
            </div>
          )}
        </div>
      )}
    </div>
  );
}
