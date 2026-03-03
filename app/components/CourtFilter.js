import React from 'react';
import { FilterChip } from './FilterChip';

export function CourtFilter({ courts, selectedCourt, onSelectCourt }) {
  return (
    <FilterChip
      items={courts}
      selected={selectedCourt}
      onSelect={onSelectCourt}
      allLabel="すべての裁判所"
    />
  );
}
