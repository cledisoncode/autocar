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
import { KeyboardProvider } from 'react-native-keyboard-controller';

import {
  AppDataProvider,
} from '@/contexts/app-data-context';

export default function RootLayout() {
  return (
    <KeyboardProvider statusBarTranslucent navigationBarTranslucent>
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
    </KeyboardProvider>
  );
}
