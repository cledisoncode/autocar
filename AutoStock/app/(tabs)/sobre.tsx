import {
    Ionicons,
} from '@expo/vector-icons';

import {
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import {
    AppHeader,
} from '@/components/app-header';

export default function SobreScreen() {
  return (
    <ScrollView
      style={
        styles.container
      }
      contentContainerStyle={
        styles.content
      }
      showsVerticalScrollIndicator={
        false
      }
    >
      <AppHeader />

      <View
        style={
          styles.tituloArea
        }
      >
        <View
          style={
            styles.tituloIcone
          }
        >
          <Ionicons
            name="information-circle"
            size={28}
            color="#FFFFFF"
          />
        </View>

        <Text
          style={
            styles.titulo
          }
        >
          Sobre
        </Text>
      </View>

      <View
        style={
          styles.marcaCard
        }
      >
        <View
          style={
            styles.logoArea
          }
        >
          <Ionicons
            name="car-sport"
            size={42}
            color="#E53935"
          />
        </View>

        <Text
          style={
            styles.nomeApp
          }
        >
          AUTOCAR
        </Text>

        <Text
          style={
            styles.descricaoApp
          }
        >
          Sistema de controle para
          estética automotiva.
        </Text>

        <View
          style={
            styles.versaoBadge
          }
        >
          <Text
            style={
              styles.versaoTexto
            }
          >
            Versão 1.0.0
          </Text>
        </View>
      </View>

      <Text
        style={
          styles.secaoTitulo
        }
      >
        Sobre o aplicativo
      </Text>

      <View
        style={
          styles.card
        }
      >
        <Text
          style={
            styles.cardTexto
          }
        >
          O AUTOCAR foi desenvolvido
          para auxiliar no controle das
          principais atividades de uma
          estética automotiva,
          reunindo atendimentos,
          estoque, alertas e informações
          financeiras em um único
          aplicativo.
        </Text>
      </View>

      <Text
        style={
          styles.secaoTitulo
        }
      >
        Principais funções
      </Text>

      <View
        style={
          styles.card
        }
      >
        <View
          style={
            styles.funcaoLinha
          }
        >
          <View
            style={
              styles.funcaoIcone
            }
          >
            <Ionicons
              name="car-sport-outline"
              size={21}
              color="#FFFFFF"
            />
          </View>

          <View
            style={
              styles.funcaoInfo
            }
          >
            <Text
              style={
                styles.funcaoTitulo
              }
            >
              Atendimento
            </Text>

            <Text
              style={
                styles.funcaoDescricao
              }
            >
              Registro dos serviços
              realizados nos veículos.
            </Text>
          </View>
        </View>

        <View
          style={
            styles.divisor
          }
        />

        <View
          style={
            styles.funcaoLinha
          }
        >
          <View
            style={
              styles.funcaoIcone
            }
          >
            <Ionicons
              name="cube-outline"
              size={21}
              color="#FFFFFF"
            />
          </View>

          <View
            style={
              styles.funcaoInfo
            }
          >
            <Text
              style={
                styles.funcaoTitulo
              }
            >
              Estoque
            </Text>

            <Text
              style={
                styles.funcaoDescricao
              }
            >
              Controle de produtos,
              compras, quantidades,
              categorias e vencimentos.
            </Text>
          </View>
        </View>

        <View
          style={
            styles.divisor
          }
        />

        <View
          style={
            styles.funcaoLinha
          }
        >
          <View
            style={
              styles.funcaoIcone
            }
          >
            <Ionicons
              name="notifications-outline"
              size={21}
              color="#FFFFFF"
            />
          </View>

          <View
            style={
              styles.funcaoInfo
            }
          >
            <Text
              style={
                styles.funcaoTitulo
              }
            >
              Alertas
            </Text>

            <Text
              style={
                styles.funcaoDescricao
              }
            >
              Avisos de estoque baixo,
              produtos próximos do
              vencimento e vencidos.
            </Text>
          </View>
        </View>

        <View
          style={
            styles.divisor
          }
        />

        <View
          style={
            styles.funcaoLinha
          }
        >
          <View
            style={
              styles.funcaoIcone
            }
          >
            <Ionicons
              name="wallet-outline"
              size={21}
              color="#FFFFFF"
            />
          </View>

          <View
            style={
              styles.funcaoInfo
            }
          >
            <Text
              style={
                styles.funcaoTitulo
              }
            >
              Financeiro
            </Text>

            <Text
              style={
                styles.funcaoDescricao
              }
            >
              Controle das entradas,
              despesas e resultado
              financeiro.
            </Text>
          </View>
        </View>
      </View>

      <Text
        style={
          styles.secaoTitulo
        }
      >
        Tecnologia
      </Text>

      <View
        style={
          styles.card
        }
      >
        <View
          style={
            styles.tecnologiaLinha
          }
        >
          <View
            style={
              styles.tecnologiaIcone
            }
          >
            <Ionicons
              name="code-slash"
              size={22}
              color="#E53935"
            />
          </View>

          <View
            style={
              styles.funcaoInfo
            }
          >
            <Text
              style={
                styles.funcaoTitulo
              }
            >
              React Native + Expo
            </Text>

            <Text
              style={
                styles.funcaoDescricao
              }
            >
              Aplicativo desenvolvido
              utilizando tecnologias
              para dispositivos móveis.
            </Text>
          </View>
        </View>
      </View>

      <Text
        style={
          styles.rodape
        }
      >
        AUTOCAR • 2026
      </Text>
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
      paddingBottom: 80,
    },

    tituloArea: {
      flexDirection:
        'row',
      alignItems:
        'center',
      marginBottom: 18,
    },

    tituloIcone: {
      width: 48,
      height: 48,
      borderRadius: 12,
      backgroundColor:
        '#E53935',
      alignItems:
        'center',
      justifyContent:
        'center',
      marginRight: 12,
    },

    titulo: {
      color:
        '#FFFFFF',
      fontSize: 24,
      fontWeight:
        '900',
    },

    marcaCard: {
      backgroundColor:
        '#1E1E1E',
      borderWidth: 1,
      borderColor:
        '#333333',
      borderRadius: 14,
      padding: 24,
      alignItems:
        'center',
      marginBottom: 26,
    },

    logoArea: {
      width: 76,
      height: 76,
      borderRadius: 20,
      backgroundColor:
        '#151515',
      alignItems:
        'center',
      justifyContent:
        'center',
      marginBottom: 14,
    },

    nomeApp: {
      color:
        '#FFFFFF',
      fontSize: 26,
      fontWeight:
        '900',
      letterSpacing: 1,
    },

    descricaoApp: {
      color:
        '#999999',
      fontSize: 13,
      lineHeight: 19,
      textAlign:
        'center',
      marginTop: 5,
    },

    versaoBadge: {
      backgroundColor:
        '#E53935',
      borderRadius: 7,
      paddingHorizontal: 12,
      paddingVertical: 6,
      marginTop: 15,
    },

    versaoTexto: {
      color:
        '#FFFFFF',
      fontSize: 11,
      fontWeight:
        '800',
    },

    secaoTitulo: {
      color:
        '#FFFFFF',
      fontSize: 18,
      fontWeight:
        '900',
      marginBottom: 11,
      marginTop: 3,
    },

    card: {
      backgroundColor:
        '#1E1E1E',
      borderWidth: 1,
      borderColor:
        '#333333',
      borderRadius: 13,
      padding: 15,
      marginBottom: 24,
    },

    cardTexto: {
      color:
        '#BBBBBB',
      fontSize: 13,
      lineHeight: 21,
    },

    funcaoLinha: {
      flexDirection:
        'row',
      alignItems:
        'center',
      minHeight: 62,
    },

    funcaoIcone: {
      width: 40,
      height: 40,
      borderRadius: 10,
      backgroundColor:
        '#E53935',
      alignItems:
        'center',
      justifyContent:
        'center',
      marginRight: 12,
    },

    funcaoInfo: {
      flex: 1,
    },

    funcaoTitulo: {
      color:
        '#FFFFFF',
      fontSize: 14,
      fontWeight:
        '800',
    },

    funcaoDescricao: {
      color:
        '#999999',
      fontSize: 11,
      lineHeight: 16,
      marginTop: 3,
    },

    divisor: {
      height: 1,
      backgroundColor:
        '#333333',
      marginVertical: 6,
    },

    tecnologiaLinha: {
      flexDirection:
        'row',
      alignItems:
        'center',
      minHeight: 58,
    },

    tecnologiaIcone: {
      width: 40,
      height: 40,
      borderRadius: 10,
      backgroundColor:
        '#151515',
      alignItems:
        'center',
      justifyContent:
        'center',
      marginRight: 12,
    },

    rodape: {
      color:
        '#666666',
      fontSize: 11,
      fontWeight:
        '700',
      textAlign:
        'center',
      marginTop: 3,
    },
  });