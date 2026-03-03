import React from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, Text } from 'react-native';
import { COLORS } from '../constants';

export function FilterChip({ items, selected, onSelect, formatItem, allLabel }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {['', ...items].map(item => (
        <TouchableOpacity
          key={item || 'all'}
          onPress={() => onSelect(item)}
          style={[styles.btn, selected === item && styles.btnActive]}
        >
          <Text style={[styles.btnText, selected === item && styles.btnTextActive]}>
            {item === '' ? allLabel : formatItem ? formatItem(item) : item}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingBottom: 8, gap: 6 },
  btn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    flexShrink: 0,
  },
  btnActive:     { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  btnText:       { fontSize: 13, color: '#555' },
  btnTextActive: { color: COLORS.white },
});
