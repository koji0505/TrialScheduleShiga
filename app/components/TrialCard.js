import React from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity, Linking,
} from 'react-native';
import { COLORS, COURTS_INFO } from '../constants';
import { formatDate } from '../utils/trial';

export function TrialCard({ trial }) {
  const { courtName, caseName, caseNumber, sessions } = trial;
  const info = COURTS_INFO[courtName] || {};

  const openAccess = () => {
    if (info.accessUrl) Linking.openURL(info.accessUrl);
  };

  const openMaps = () => {
    if (info.address) {
      const query = encodeURIComponent(info.address);
      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`);
    }
  };

  return (
    <View style={styles.card}>
      {/* ヘッダー：裁判所名 + アクセスボタン */}
      <View style={styles.cardHeader}>
        <Text style={styles.courtName} numberOfLines={1}>{courtName}</Text>
        <View style={styles.linkBtns}>
          {info.accessUrl && (
            <TouchableOpacity onPress={openAccess} style={styles.linkBtn}>
              <Text style={styles.linkBtnText}>🏛 アクセス</Text>
            </TouchableOpacity>
          )}
          {info.address && (
            <TouchableOpacity onPress={openMaps} style={styles.linkBtn}>
              <Text style={styles.linkBtnText}>🗺 地図</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* 本体 */}
      <View style={styles.cardBody}>
        {info.address && (
          <Text style={styles.address}>📌 {info.address}</Text>
        )}
        <Text style={styles.caseName}>{caseName}</Text>
        {caseNumber ? (
          <Text style={styles.caseNumber}>{caseNumber}</Text>
        ) : null}

        {sessions.map(s => (
          <View key={`${s.date}-${s.time}`} style={styles.sessionRow}>
            <Text style={styles.sessionDate}>{formatDate(s.date)}</Text>
            <Text style={styles.sessionTime}>{s.time}</Text>
            <Text style={styles.sessionRound}>{s.session}</Text>
            <Text style={styles.sessionLoc} numberOfLines={1}>📍{s.location}</Text>
            {s.note ? <Text style={styles.sessionNote}>※{s.note}</Text> : null}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    overflow: 'hidden',
  },
  cardHeader: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  courtName: {
    flex: 1,
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '700',
  },
  linkBtns: { flexDirection: 'row', gap: 6 },
  linkBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  linkBtnText: { color: COLORS.white, fontSize: 11, fontWeight: '600' },

  cardBody: { padding: 12 },
  address: {
    fontSize: 12,
    color: COLORS.textLight,
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  caseName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#222',
    lineHeight: 20,
    marginBottom: 2,
  },
  caseNumber: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginBottom: 8,
  },
  sessionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 5,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  sessionDate: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
    minWidth: 72,
  },
  sessionTime: {
    fontSize: 12,
    backgroundColor: '#e3f2fd',
    color: COLORS.primary,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  sessionRound: { fontSize: 12, color: '#555' },
  sessionLoc:   { fontSize: 12, color: COLORS.textLight, flex: 1 },
  sessionNote:  { fontSize: 11, color: '#e65100', width: '100%' },
});
