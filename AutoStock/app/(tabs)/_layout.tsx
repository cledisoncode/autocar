import { AvisoDeEspera } from '@/components/aviso-de-espera';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppData } from '@/contexts/app-data-context';
import {
  Ionicons,
} from '@expo/vector-icons';

import {
  Tabs,
  Redirect,
  router,
} from 'expo-router';

import {
  HapticTab,
} from '@/components/haptic-tab';

export default function TabLayout() {
  const { usuarioLogado, estadoDados, erroCarregamento, recarregarDados, sairUsuario } = useAppData();
  if (!usuarioLogado) return <Redirect href="/" />;
  if (estadoDados !== 'pronto') {
    const carregando = estadoDados !== 'erro';
    return (
      <SafeAreaView style={styles.espera}>
        <View style={styles.aviso} accessibilityLiveRegion="polite">
          {carregando && <ActivityIndicator size="large" color="#E53935" />}
          <Text style={styles.titulo}>{carregando ? 'Carregando seus dados...' : 'Não foi possível atualizar os dados'}</Text>
          <Text style={styles.mensagem}>{carregando
            ? 'Aguarde enquanto buscamos o estoque e os atendimentos.'
            : erroCarregamento}</Text>
          <AvisoDeEspera ativo={carregando} />
          {!carregando && <TouchableOpacity style={styles.botao} onPress={() => { void recarregarDados().catch(() => {}); }}>
            <Text style={styles.botaoTexto}>TENTAR NOVAMENTE</Text>
          </TouchableOpacity>}
          <TouchableOpacity style={styles.sair} onPress={() => { sairUsuario(); router.replace('/'); }}>
            <Text style={styles.mensagem}>Voltar ao login</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }
  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  espera: { flex: 1, backgroundColor: '#000000', justifyContent: 'center', padding: 28 },
  aviso: { alignItems: 'center', gap: 18 },
  titulo: { color: '#FFFFFF', fontSize: 20, fontWeight: '800', textAlign: 'center' },
  mensagem: { color: '#BBBBBB', fontSize: 15, textAlign: 'center', lineHeight: 22 },
  botao: { backgroundColor: '#E53935', borderRadius: 12, paddingVertical: 16, paddingHorizontal: 24 },
  botaoTexto: { color: '#FFFFFF', fontWeight: '800' },
  sair: { padding: 14 },
});
