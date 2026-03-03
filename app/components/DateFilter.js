import React from 'react';
import { FilterChip } from './FilterChip';
import { formatDate } from '../utils/trial';

export function DateFilter({ dates, selectedDate, onSelectDate }) {
  return (
    <FilterChip
      items={dates}
      selected={selectedDate}
      onSelect={onSelectDate}
      formatItem={formatDate}
      allLabel="すべて"
    />
  );
}
