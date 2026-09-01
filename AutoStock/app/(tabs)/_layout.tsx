import {
  Ionicons,
} from '@expo/vector-icons';

import {
  Tabs,
} from 'expo-router';

import {
  HapticTab,
} from '@/components/haptic-tab';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,

        tabBarButton:
          HapticTab,

        tabBarActiveTintColor:
          '#E53935',

        tabBarInactiveTintColor:
          '#8E8E93',

        tabBarHideOnKeyboard:
          true,

        tabBarStyle: {
          backgroundColor:
            '#000000',

          borderTopColor:
            '#2D2D2D',

          borderTopWidth: 1,
        },

        tabBarLabelStyle: {
          fontSize: 11,

          fontWeight:
            '700',
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title:
            'Dashboard',

          tabBarIcon: ({
            color,
            size,
          }) => (
            <Ionicons
              name="home"
              size={size}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="atendimento"
        options={{
          title:
            'Atendimento',

          tabBarIcon: ({
            color,
            size,
          }) => (
            <Ionicons
              name="car-sport"
              size={size}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="estoque"
        options={{
          title:
            'Estoque',

          tabBarIcon: ({
            color,
            size,
          }) => (
            <Ionicons
              name="cube"
              size={size}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="financeiro"
        options={{
          title:
            'Financeiro',

          tabBarIcon: ({
            color,
            size,
          }) => (
            <Ionicons
              name="wallet"
              size={size}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="relatorios"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="minha-conta"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="notificacoes"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="sobre"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}