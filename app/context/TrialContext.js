import React, { createContext, useContext } from 'react';
import { useTrial } from '../hooks/useTrial';

const TrialContext = createContext(null);

export function TrialProvider({ children }) {
  const value = useTrial();
  return <TrialContext.Provider value={value}>{children}</TrialContext.Provider>;
}

export function useTrialContext() {
  return useContext(TrialContext);
}
