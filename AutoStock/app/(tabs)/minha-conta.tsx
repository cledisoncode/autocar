import {
    Ionicons,
} from '@expo/vector-icons';

import {
    router,
} from 'expo-router';

import {
    useEffect,
} from 'react';

import {
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import {
    AppHeader,
} from '@/components/app-header';

import {
    useAppData,
} from '@/contexts/app-data-context';

export default function MinhaContaScreen() {
  const {
    usuarioLogado,
  } = useAppData();

  useEffect(() => {
    if (
      !usuarioLogado
    ) {
      router.replace(
        '/'
      );
    }
  }, [
    usuarioLogado,
  ]);

  if (
    !usuarioLogado
  ) {
    return (
      <View
        style={
          styles.carregando
        }
      >
        <Text
          style={
            styles.carregandoText
          }
        >
          Redirecionando...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={
        styles.container
      }
      contentContainerStyle={
        styles.content
      }
    >
      <AppHeader />

      <View
        style={
          styles.perfilCard
        }
      >
        <View
          style={
            styles.avatar
          }
        >
          <Ionicons
            name="person"
            size={38}
            color="#FFFFFF"
          />
        </View>

        <Text
          style={
            styles.nome
          }
        >
          {
            usuarioLogado.nome
          }{' '}
          {
            usuarioLogado.sobrenome
          }
        </Text>

        <Text
          style={
            styles.email
          }
        >
          {
            usuarioLogado.email
          }
        </Text>
      </View>

      <View
        style={
          styles.infoCard
        }
      >
        <Text
          style={
            styles.cardTitulo
          }
        >
          Informações da conta
        </Text>

        <View
          style={
            styles.infoLinha
          }
        >
          <Text
            style={
              styles.infoLabel
            }
          >
            Nome
          </Text>

          <Text
            style={
              styles.infoValor
            }
          >
            {
              usuarioLogado.nome
            }
          </Text>
        </View>

        <View
          style={
            styles.divisor
          }
        />

        <View
          style={
            styles.infoLinha
          }
        >
          <Text
            style={
              styles.infoLabel
            }
          >
            Sobrenome
          </Text>

          <Text
            style={
              styles.infoValor
            }
          >
            {
              usuarioLogado.sobrenome
            }
          </Text>
        </View>

        <View
          style={
            styles.divisor
          }
        />

        <View
          style={
            styles.infoLinha
          }
        >
          <Text
            style={
              styles.infoLabel
            }
          >
            E-mail
          </Text>

          <Text
            style={[
              styles.infoValor,

              styles.emailValor,
            ]}
          >
            {
              usuarioLogado.email
            }
          </Text>
        </View>

        <View
          style={
            styles.divisor
          }
        />

        <View
          style={
            styles.infoLinha
          }
        >
          <Text
            style={
              styles.infoLabel
            }
          >
            Tipo de acesso
          </Text>

          <View
            style={
              styles.adminBadge
            }
          >
            <Text
              style={
                styles.adminBadgeText
              }
            >
              Administrador
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles =
  StyleSheet.create({
    container: {
      flex: 1,

      backgroundColor:
        '#000000',
    },

    content: {
      paddingHorizontal: 20,

      paddingTop: 50,

      paddingBottom: 40,
    },

    carregando: {
      flex: 1,

      backgroundColor:
        '#000000',

      alignItems:
        'center',

      justifyContent:
        'center',
    },

    carregandoText: {
      color:
        '#AAAAAA',
    },

    perfilCard: {
      backgroundColor:
        '#1E1E1E',

      borderWidth: 1,

      borderColor:
        '#333333',

      borderRadius: 14,

      padding: 22,

      alignItems:
        'center',

      marginBottom: 16,
    },

    avatar: {
      width: 76,

      height: 76,

      borderRadius: 38,

      backgroundColor:
        '#E53935',

      alignItems:
        'center',

      justifyContent:
        'center',

      marginBottom: 13,
    },

    nome: {
      color:
        '#FFFFFF',

      fontSize: 22,

      fontWeight:
        '900',

      textAlign:
        'center',
    },

    email: {
      color:
        '#AAAAAA',

      fontSize: 14,

      fontWeight:
        '600',

      marginTop: 5,
    },

    infoCard: {
      backgroundColor:
        '#1E1E1E',

      borderWidth: 1,

      borderColor:
        '#333333',

      borderRadius: 14,

      padding: 18,
    },

    cardTitulo: {
      color:
        '#FFFFFF',

      fontSize: 18,

      fontWeight:
        '800',

      marginBottom: 12,
    },

    infoLinha: {
      minHeight: 54,

      flexDirection:
        'row',

      alignItems:
        'center',

      justifyContent:
        'space-between',

      gap: 16,
    },

    infoLabel: {
      color:
        '#999999',

      fontSize: 14,

      fontWeight:
        '600',
    },

    infoValor: {
      flexShrink: 1,

      color:
        '#FFFFFF',

      fontSize: 14,

      fontWeight:
        '700',

      textAlign:
        'right',
    },

    emailValor: {
      maxWidth:
        '65%',
    },

    divisor: {
      height: 1,

      backgroundColor:
        '#303030',
    },

    adminBadge: {
      backgroundColor:
        '#E53935',

      borderRadius: 7,

      paddingHorizontal: 10,

      paddingVertical: 6,
    },

    adminBadgeText: {
      color:
        '#FFFFFF',

      fontSize: 12,

      fontWeight:
        '900',
    },
  });