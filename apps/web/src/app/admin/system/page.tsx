'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pm2Api, PM2Process, systemSettingsApi, SystemSettings } from '@/lib/api';
import { useAdminLang } from '@/hooks/use-admin-lang';
import { getTranslations } from '@/lib/translations';

export default function SystemPage() {
  const { lang } = useAdminLang();
  const t = getTranslations(lang);
  const queryClient = useQueryClient();
  const [selectedProcess, setSelectedProcess] = useState<string | null>(null);
  const [showLogs, setShowLogs] = useState(false);

  const { data: pm2Status, isLoading, error, refetch } = useQuery({
    queryKey: ['pm2-status'],
    queryFn: async () => {
      const response = await pm2Api.getStatus();
      return response.data;
    },
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  // System settings
  const { data: systemSettings, isLoading: isLoadingSettings } = useQuery({
    queryKey: ['system-settings'],
    queryFn: async () => {
      const response = await systemSettingsApi.getSettings();
      return response.data;
    },
  });

  const updateSettingsMutation = useMutation({
    mutationFn: (data: Partial<Pick<SystemSettings, 'imageOptimizationEnabled' | 'maintenanceMode'>>) =>
      systemSettingsApi.updateSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-settings'] });
    },
  });

  const { data: logsData, isLoading: isLoadingLogs } = useQuery({
    queryKey: ['pm2-logs', selectedProcess],
    queryFn: async () => {
      if (!selectedProcess) return null;
      const response = await pm2Api.getLogs(selectedProcess, 100);
      return response.data;
    },
    enabled: !!selectedProcess && showLogs,
  });

  const restartMutation = useMutation({
    mutationFn: (processName: string) => pm2Api.restartProcess(processName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pm2-status'] });
    },
  });

  const stopMutation = useMutation({
    mutationFn: (processName: string) => pm2Api.stopProcess(processName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pm2-status'] });
    },
  });

  const startMutation = useMutation({
    mutationFn: (processName: string) => pm2Api.startProcess(processName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pm2-status'] });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'bg-green-100 text-green-800';
      case 'stopped':
        return 'bg-gray-100 text-gray-800';
      case 'errored':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
        return '●';
      case 'stopped':
        return '○';
      case 'errored':
        return '✕';
      default:
        return '?';
    }
  };

  const systemTranslations = {
    kz: {
      title: 'Жүйе күйі',
      subtitle: 'PM2 процестерін басқару',
      processName: 'Процесс',
      status: 'Күй',
      cpu: 'CPU',
      memory: 'Жады',
      uptime: 'Жұмыс уақыты',
      restarts: 'Қайта іске қосулар',
      actions: 'Әрекеттер',
      restart: 'Қайта іске қосу',
      stop: 'Тоқтату',
      start: 'Іске қосу',
      logs: 'Логтар',
      refresh: 'Жаңарту',
      loading: 'Жүктелуде...',
      noProcesses: 'PM2 процестері табылмады',
      pm2Unavailable: 'PM2 қолжетімсіз',
      pm2UnavailableDesc: 'PM2 осы жүйеде орнатылмаған немесе іске қосылмаған.',
      online: 'Белсенді',
      stopped: 'Тоқтатылған',
      errored: 'Қате',
      closeLogs: 'Логтарды жабу',
      logsFor: 'Логтар:',
      noLogs: 'Логтар жоқ',
      // System settings
      settingsTitle: 'Жүйе параметрлері',
      imageOptimization: 'Суреттерді оңтайландыру',
      imageOptimizationDesc: 'Суреттерді сервер жағында оңтайландыру (CPU жүктемесін арттырады)',
      enabled: 'Қосулы',
      disabled: 'Өшірулген',
      requiresRestart: 'Өзгерістер веб-серверді қайта іске қосқаннан кейін күшіне енеді',
    },
    ru: {
      title: 'Состояние системы',
      subtitle: 'Управление процессами PM2',
      processName: 'Процесс',
      status: 'Статус',
      cpu: 'CPU',
      memory: 'Память',
      uptime: 'Время работы',
      restarts: 'Перезапуски',
      actions: 'Действия',
      restart: 'Перезапустить',
      stop: 'Остановить',
      start: 'Запустить',
      logs: 'Логи',
      refresh: 'Обновить',
      loading: 'Загрузка...',
      noProcesses: 'Процессы PM2 не найдены',
      pm2Unavailable: 'PM2 недоступен',
      pm2UnavailableDesc: 'PM2 не установлен или не запущен на этой системе.',
      online: 'Активен',
      stopped: 'Остановлен',
      errored: 'Ошибка',
      closeLogs: 'Закрыть логи',
      logsFor: 'Логи:',
      noLogs: 'Логи отсутствуют',
      // System settings
      settingsTitle: 'Настройки системы',
      imageOptimization: 'Оптимизация изображений',
      imageOptimizationDesc: 'Оптимизация изображений на сервере (увеличивает нагрузку CPU)',
      enabled: 'Включено',
      disabled: 'Отключено',
      requiresRestart: 'Изменения вступят в силу после перезапуска веб-сервера',
    },
  };

  const st = systemTranslations[lang];

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">{st.loading}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2">{st.title}</h1>
          <p className="text-gray-600">{st.subtitle}</p>
        </div>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
        >
          {st.refresh}
        </button>
      </div>

      {/* System Settings Section */}
      <div className="mb-8 bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">{st.settingsTitle}</h2>

        <div className="flex items-center justify-between py-4 border-b">
          <div>
            <h3 className="font-medium text-gray-900">{st.imageOptimization}</h3>
            <p className="text-sm text-gray-500">{st.imageOptimizationDesc}</p>
            <p className="text-xs text-orange-600 mt-1">{st.requiresRestart}</p>
          </div>
          <div className="flex items-center space-x-3">
            <span className={`text-sm ${systemSettings?.imageOptimizationEnabled ? 'text-green-600' : 'text-gray-500'}`}>
              {systemSettings?.imageOptimizationEnabled ? st.enabled : st.disabled}
            </span>
            <button
              onClick={() => {
                updateSettingsMutation.mutate({
                  imageOptimizationEnabled: !systemSettings?.imageOptimizationEnabled,
                });
              }}
              disabled={updateSettingsMutation.isPending || isLoadingSettings}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 ${
                systemSettings?.imageOptimizationEnabled ? 'bg-green-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  systemSettings?.imageOptimizationEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {!pm2Status?.available ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">
            {st.pm2Unavailable}
          </h3>
          <p className="text-yellow-700">{st.pm2UnavailableDesc}</p>
          {pm2Status?.error && (
            <p className="text-sm text-yellow-600 mt-2">{pm2Status.error}</p>
          )}
        </div>
      ) : pm2Status.processes.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
          <p className="text-gray-600">{st.noProcesses}</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {st.processName}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {st.status}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {st.cpu}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {st.memory}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {st.uptime}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {st.restarts}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {st.actions}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pm2Status.processes.map((proc: PM2Process) => (
                  <tr key={proc.pm_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="font-medium text-gray-900">
                          {proc.name}
                        </span>
                        <span className="ml-2 text-xs text-gray-500">
                          (ID: {proc.pm_id})
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(proc.status)}`}
                      >
                        <span className="mr-1">{getStatusIcon(proc.status)}</span>
                        {proc.status === 'online'
                          ? st.online
                          : proc.status === 'stopped'
                            ? st.stopped
                            : proc.status === 'errored'
                              ? st.errored
                              : proc.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {proc.cpu}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {proc.memoryFormatted}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {proc.uptimeFormatted}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {proc.restarts}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => restartMutation.mutate(proc.name)}
                          disabled={restartMutation.isPending}
                          className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50"
                        >
                          {st.restart}
                        </button>
                        {proc.status === 'online' ? (
                          <button
                            onClick={() => stopMutation.mutate(proc.name)}
                            disabled={stopMutation.isPending}
                            className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 disabled:opacity-50"
                          >
                            {st.stop}
                          </button>
                        ) : (
                          <button
                            onClick={() => startMutation.mutate(proc.name)}
                            disabled={startMutation.isPending}
                            className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 disabled:opacity-50"
                          >
                            {st.start}
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setSelectedProcess(proc.name);
                            setShowLogs(true);
                          }}
                          className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                        >
                          {st.logs}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Logs Modal */}
      {showLogs && selectedProcess && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] m-4">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">
                {st.logsFor} {selectedProcess}
              </h3>
              <button
                onClick={() => {
                  setShowLogs(false);
                  setSelectedProcess(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                {st.closeLogs}
              </button>
            </div>
            <div className="p-4 overflow-auto max-h-[60vh]">
              {isLoadingLogs ? (
                <div className="text-center py-8 text-gray-500">{st.loading}</div>
              ) : logsData?.logs ? (
                <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-xs font-mono whitespace-pre-wrap overflow-x-auto">
                  {logsData.logs}
                </pre>
              ) : (
                <div className="text-center py-8 text-gray-500">{st.noLogs}</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
