'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useStudySpace } from '@/context/StudySpaceContext';
import { DeskItem } from '@/types/studyspace';

export interface StorageItemInfo {
  id: string;
  title: string;
  type: string;
  pageCount: number;
  approxSizeBytes: number;
  approxSizeFormatted: string;
  lastAccessedAt: number;
  lastAccessedFormatted: string;
  isStale: boolean; // > 30 days
  rawItem: DeskItem;
}

export interface StorageUsage {
  usageBytes: number;
  quotaBytes: number;
  usageFormatted: string;
  quotaFormatted: string;
  percent: number;
}

function formatBytes(bytes: number): string {
  if (bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const val = bytes / Math.pow(1024, i);
  return `${val.toFixed(val < 10 && i > 0 ? 1 : 0)} ${units[i] || 'MB'}`;
}

function formatDaysAgo(timestamp: number): string {
  const diffMs = Date.now() - timestamp;
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (days <= 0) return 'Hôm nay';
  if (days === 1) return 'Hôm qua';
  return `${days} ngày trước`;
}

const ACCESS_LOG_KEY = 'greenlearn_doc_access_log';

export function getDocAccessLog(): Record<string, number> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(ACCESS_LOG_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function recordDocAccess(itemId: string): void {
  if (typeof window === 'undefined' || !itemId) return;
  try {
    const log = getDocAccessLog();
    log[itemId] = Date.now();
    localStorage.setItem(ACCESS_LOG_KEY, JSON.stringify(log));
  } catch {}
}

export function useStorageManager() {
  const { activeSpace, spaces, removeDeskItem } = useStudySpace();

  const [usage, setUsage] = useState<StorageUsage>({
    usageBytes: 0,
    quotaBytes: 0,
    usageFormatted: 'Đang tính...',
    quotaFormatted: '...',
    percent: 0,
  });

  const [accessLog, setAccessLog] = useState<Record<string, number>>({});

  const refreshUsage = useCallback(async () => {
    if (typeof window === 'undefined') return;

    setAccessLog(getDocAccessLog());

    if (navigator.storage && navigator.storage.estimate) {
      try {
        const estimate = await navigator.storage.estimate();
        const usageBytes = estimate.usage || 0;
        const quotaBytes = estimate.quota || 1;
        const percent = Math.min(100, Math.round((usageBytes / quotaBytes) * 100));

        setUsage({
          usageBytes,
          quotaBytes,
          usageFormatted: formatBytes(usageBytes),
          quotaFormatted: formatBytes(quotaBytes),
          percent,
        });
      } catch {
        // Fallback calculation from localStorage
        let localBytes = 0;
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key) {
            localBytes += (localStorage.getItem(key) || '').length * 2;
          }
        }
        setUsage({
          usageBytes: localBytes,
          quotaBytes: 50 * 1024 * 1024,
          usageFormatted: formatBytes(localBytes),
          quotaFormatted: '50 MB (Bộ nhớ cục bộ)',
          percent: Math.min(100, Math.round((localBytes / (50 * 1024 * 1024)) * 100)),
        });
      }
    }
  }, []);

  useEffect(() => {
    refreshUsage();
  }, [refreshUsage]);

  const itemsInfo: StorageItemInfo[] = useMemo(() => {
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

    return (activeSpace?.items || []).map((item) => {
      // Calculate approximate size in bytes
      let approxBytes = 0;
      try {
        approxBytes = new Blob([JSON.stringify(item)]).size;
      } catch {
        approxBytes = 5000;
      }

      // Read access time
      const lastAccess = accessLog[item.id] || Date.now();
      const isStale = lastAccess < thirtyDaysAgo;

      return {
        id: item.id,
        title: item.title || 'Tài liệu không tên',
        type: item.type,
        pageCount: item.pageCount || (item.pages?.length || 1),
        approxSizeBytes: approxBytes,
        approxSizeFormatted: formatBytes(approxBytes),
        lastAccessedAt: lastAccess,
        lastAccessedFormatted: formatDaysAgo(lastAccess),
        isStale,
        rawItem: item,
      };
    });
  }, [activeSpace?.items, accessLog]);

  const staleItems = useMemo(() => itemsInfo.filter((i) => i.isStale), [itemsInfo]);
  const staleTotalBytes = useMemo(
    () => staleItems.reduce((acc, curr) => acc + curr.approxSizeBytes, 0),
    [staleItems]
  );

  const exportItemBackup = useCallback((item: DeskItem) => {
    try {
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(item, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `greenlearn_backup_${item.title.replace(/\s+/g, '_')}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (err) {
      console.error('Lỗi tải backup:', err);
    }
  }, []);

  const exportAllSpacesBackup = useCallback(() => {
    try {
      const backupData = {
        exportedAt: new Date().toISOString(),
        spaces,
      };
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupData, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `greenlearn_full_spaces_backup_${Date.now()}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (err) {
      console.error('Lỗi tải toàn bộ backup:', err);
    }
  }, [spaces]);

  const deleteItem = useCallback(
    (itemId: string) => {
      removeDeskItem(itemId);
      // Clean access log
      try {
        const log = getDocAccessLog();
        delete log[itemId];
        localStorage.setItem(ACCESS_LOG_KEY, JSON.stringify(log));
        setAccessLog(log);
      } catch {}
      refreshUsage();
    },
    [removeDeskItem, refreshUsage]
  );

  return {
    usage,
    itemsInfo,
    staleItems,
    staleCount: staleItems.length,
    staleTotalBytesFormatted: formatBytes(staleTotalBytes),
    exportItemBackup,
    exportAllSpacesBackup,
    deleteItem,
    refreshUsage,
  };
}
