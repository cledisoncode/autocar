import {
  DarkTheme,
  ThemeProvider,
} from '@react-navigation/native';

import {
  Stack,
} from 'expo-router';

import {
  StatusBar,
} from 'expo-status-bar';

import 'react-native-reanimated';

import {
  AppDataProvider,
} from '@/contexts/app-data-context';

export default function RootLayout() {
  return (
    <AppDataProvider>
      <ThemeProvider
        value={
          DarkTheme
        }
      >
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: {
              backgroundColor:
                '#000000',
            },
          }}
        >
          <Stack.Screen
            name="index"
          />

          <Stack.Screen
            name="cadastro"
          />

          <Stack.Screen
            name="recuperar-senha"
          />

          <Stack.Screen
            name="(tabs)"
          />
        </Stack>

        <StatusBar
          style="light"
        />
      </ThemeProvider>
    </AppDataProvider>
  );
}