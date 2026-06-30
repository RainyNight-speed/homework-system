import { useState, useEffect, useCallback } from 'react';
import { message } from 'antd';
import api from '../api';

export default function useApi(url, options = {}) {
  const { immediate = true, errorMsg = '加载失败' } = options;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(async (overrideUrl) => {
    setLoading(true);
    try {
      const res = await api.get(overrideUrl || url);
      setData(res.data);
      return res.data;
    } catch {
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [url, errorMsg]);

  useEffect(() => {
    if (immediate && url) fetch();
  }, [fetch, immediate]);

  return { data, loading, setData, refetch: fetch };
}
