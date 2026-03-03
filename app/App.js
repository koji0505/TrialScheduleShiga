import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { TrialProvider } from './context/TrialContext';
import { MainScreen } from './screens/MainScreen';

export default function App() {
  return (
    <SafeAreaProvider>
      <TrialProvider>
        <MainScreen />
      </TrialProvider>
    </SafeAreaProvider>
  );
}
