import React, { useState, useMemo } from 'react';
import {
  StyleSheet, View, Text, FlatList,
  TouchableOpacity, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { COLORS } from '../constants';
import { useTrialContext } from '../context/TrialContext';
import { filterTrials, todayStr } from '../utils/trial';
import { DateFilter } from '../components/DateFilter';
import { CourtFilter } from '../components/CourtFilter';
import { TrialCard } from '../components/TrialCard';

export function MainScreen() {
  const {
    rawData, courtNames, availableDates,
    loading, refreshing, error, updatedAt, onRefresh,
  } = useTrialContext();

  const [selectedDate,  setSelectedDate]  = useState(todayStr());
  const [selectedCourt, setSelectedCourt] = useState('');

  const trials = useMemo(
    () => rawData ? filterTrials(rawData, selectedDate, selectedCourt) : [],
    [rawData, selectedDate, selectedCourt]
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" backgroundColor={COLORS.primary} />

      {/* ヘッダー */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>⚖️ 近畿 裁判員裁判 開廷スケジュール</Text>
        {updatedAt ? <Text style={styles.updatedAt}>最終更新: {updatedAt}</Text> : null}
      </View>

      {/* 注意書き */}
      <View style={styles.notice}>
        <Text style={styles.noticeText}>
          ※ 裁判員裁判のみ掲載。一般の刑事・民事裁判は含まれません。
        </Text>
      </View>

      {/* フィルター */}
      <View style={styles.controls}>
        {/* 今日ボタン + 日付フィルター */}
        <View style={styles.dateRow}>
          <TouchableOpacity
            style={styles.todayBtn}
            onPress={() => setSelectedDate(todayStr())}
          >
            <Text style={styles.todayBtnText}>今日</Text>
          </TouchableOpacity>
          <DateFilter
            dates={availableDates}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
          />
        </View>
        {/* 裁判所フィルター */}
        <CourtFilter
          courts={courtNames}
          selectedCourt={selectedCourt}
          onSelectCourt={setSelectedCourt}
        />
      </View>

      {/* コンテンツ */}
      {loading ? (
        <ActivityIndicator style={styles.loader} size="large" color={COLORS.primary} />
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : (
        <FlatList
          data={trials}
          keyExtractor={item => `${item.courtName}-${item.caseNumber}`}
          renderItem={({ item }) => <TrialCard trial={item} />}
          ListEmptyComponent={
            <Text style={styles.noResult}>
              {selectedDate ? `${selectedDate} の` : ''}開廷情報はありません
            </Text>
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[COLORS.primary]}
            />
          }
          contentContainerStyle={styles.listContent}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  header: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  updatedAt: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 11,
    marginTop: 3,
  },

  notice: {
    backgroundColor: COLORS.warning,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.accent,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  noticeText: {
    fontSize: 11,
    color: COLORS.warningText,
    lineHeight: 16,
  },

  controls: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  todayBtn: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    flexShrink: 0,
  },
  todayBtnText: { color: COLORS.white, fontSize: 13, fontWeight: '700' },

  loader:    { marginTop: 60 },
  errorText: { textAlign: 'center', color: COLORS.error, padding: 40 },
  noResult:  { textAlign: 'center', color: COLORS.textMuted, padding: 60, fontSize: 15 },
  listContent: { padding: 12 },
});
