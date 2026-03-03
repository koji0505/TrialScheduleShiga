import { useState, useEffect, useMemo } from 'react';
import { DATA_URL } from '../constants';
import { getAvailableDates, todayStr } from '../utils/trial';

export function useTrial() {
  const [rawData,    setRawData]    = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error,      setError]      = useState(null);
  const [updatedAt,  setUpdatedAt]  = useState('');

  const loadData = async () => {
    try {
      const resp = await fetch(DATA_URL);
      const data = await resp.json();
      setRawData(data);
      if (data.updated_at) {
        setUpdatedAt(new Date(data.updated_at).toLocaleString('ja-JP'));
      }
      setError(null);
    } catch {
      setError('データの読み込みに失敗しました');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const courtNames = useMemo(
    () => rawData ? Object.keys(rawData.courts) : [],
    [rawData]
  );

  const availableDates = useMemo(
    () => rawData ? getAvailableDates(rawData) : [],
    [rawData]
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  return { rawData, courtNames, availableDates, loading, refreshing, error, updatedAt, onRefresh };
}
