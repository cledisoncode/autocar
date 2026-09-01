import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import {
  useRef,
  useState,
} from 'react';

import {
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import {
  useAppData,
} from '@/contexts/app-data-context';

const LARGURA_MENU = 285;

export function AppHeader() {
  const [
    menuAberto,
    setMenuAberto,
  ] = useState(false);

  const {
    sairUsuario,
  } = useAppData();

  const posicaoMenu =
    useRef(
      new Animated.Value(
        -LARGURA_MENU
      )
    ).current;

  function abrirMenu() {
    setMenuAberto(true);

    posicaoMenu.setValue(
      -LARGURA_MENU
    );

    requestAnimationFrame(() => {
      Animated.timing(
        posicaoMenu,
        {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }
      ).start();
    });
  }

  function fecharMenu(
    depois?: () => void
  ) {
    Animated.timing(
      posicaoMenu,
      {
        toValue:
          -LARGURA_MENU,
        duration: 180,
        useNativeDriver: true,
      }
    ).start(() => {
      setMenuAberto(false);

      if (depois) {
        depois();
      }
    });
  }

  function abrirMinhaConta() {
    fecharMenu(() => {
      router.push(
        '/minha-conta'
      );
    });
  }

  function abrirRelatorios() {
    fecharMenu(() => {
      router.push(
        '/relatorios'
      );
    });
  }

  function abrirSobre() {
    fecharMenu(() => {
      router.push(
        '/sobre'
      );
    });
  }

  function sair() {
    fecharMenu(() => {
      sairUsuario();

      router.replace(
        '/'
      );
    });
  }

  return (
    <>
      <View
        style={
          styles.header
        }
      >
        <TouchableOpacity
          style={
            styles.menuButton
          }
          onPress={
            abrirMenu
          }
          activeOpacity={0.7}
        >
          <Ionicons
            name="menu"
            size={30}
            color="#FFFFFF"
          />
        </TouchableOpacity>

        <View
          pointerEvents="none"
          style={
            styles.marca
          }
        >
          <Ionicons
            name="car-sport"
            size={25}
            color="#E53935"
          />

          <Text
            style={
              styles.marcaTexto
            }
          >
            AUTOCAR
          </Text>
        </View>

        <View
          style={
            styles.espacoDireita
          }
        />
      </View>

      <Modal
        visible={
          menuAberto
        }
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={() =>
          fecharMenu()
        }
      >
        <View
          style={
            styles.modalContainer
          }
        >
          <Pressable
            style={
              styles.overlay
            }
            onPress={() =>
              fecharMenu()
            }
          />

          <Animated.View
            style={[
              styles.menuLateral,

              {
                transform: [
                  {
                    translateX:
                      posicaoMenu,
                  },
                ],
              },
            ]}
          >
            <View
              style={
                styles.menuMarca
              }
            >
              <Ionicons
                name="car-sport"
                size={27}
                color="#E53935"
              />

              <Text
                style={
                  styles.menuMarcaTexto
                }
              >
                AUTOCAR
              </Text>
            </View>

            <View
              style={
                styles.divisor
              }
            />

            <TouchableOpacity
              style={
                styles.menuItem
              }
              onPress={
                abrirMinhaConta
              }
            >
              <Ionicons
                name="person-outline"
                size={22}
                color="#FFFFFF"
              />

              <Text
                style={
                  styles.menuItemTexto
                }
              >
                Minha Conta
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={
                styles.menuItem
              }
              onPress={
                abrirRelatorios
              }
            >
              <Ionicons
                name="bar-chart-outline"
                size={22}
                color="#FFFFFF"
              />

              <Text
                style={
                  styles.menuItemTexto
                }
              >
                Relatórios
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={
                styles.menuItem
              }
              onPress={
                abrirSobre
              }
            >
              <Ionicons
                name="information-circle-outline"
                size={22}
                color="#FFFFFF"
              />

              <Text
                style={
                  styles.menuItemTexto
                }
              >
                Sobre
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.menuItem,
                styles.sairItem,
              ]}
              onPress={
                sair
              }
            >
              <Ionicons
                name="log-out-outline"
                size={22}
                color="#E53935"
              />

              <Text
                style={
                  styles.sairTexto
                }
              >
                Sair
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
    </>
  );
}

const styles =
  StyleSheet.create({
    header: {
      height: 58,

      flexDirection:
        'row',

      alignItems:
        'center',

      justifyContent:
        'space-between',

      marginBottom: 18,

      position:
        'relative',
    },

    menuButton: {
      width: 48,

      height: 48,

      alignItems:
        'flex-start',

      justifyContent:
        'center',

      zIndex: 2,
    },

    espacoDireita: {
      width: 48,
    },

    marca: {
      position:
        'absolute',

      left: 48,

      right: 48,

      top: 0,

      bottom: 0,

      flexDirection:
        'row',

      alignItems:
        'center',

      justifyContent:
        'center',

      gap: 8,
    },

    marcaTexto: {
      color:
        '#FFFFFF',

      fontSize: 21,

      fontWeight:
        '900',

      letterSpacing: 0.8,
    },

    modalContainer: {
      flex: 1,
    },

    overlay: {
      ...StyleSheet.absoluteFillObject,

      backgroundColor:
        'rgba(0,0,0,0.65)',
    },

    menuLateral: {
      width:
        LARGURA_MENU,

      height: '100%',

      backgroundColor:
        '#000000',

      paddingTop: 60,

      paddingHorizontal: 20,

      paddingBottom: 35,

      borderRightWidth: 1,

      borderRightColor:
        '#333333',
    },

    menuMarca: {
      flexDirection:
        'row',

      alignItems:
        'center',

      gap: 9,

      height: 50,
    },

    menuMarcaTexto: {
      color:
        '#FFFFFF',

      fontSize: 21,

      fontWeight:
        '900',

      letterSpacing: 0.8,
    },

    divisor: {
      height: 1,

      backgroundColor:
        '#333333',

      marginVertical: 18,
    },

    menuItem: {
      height: 54,

      flexDirection:
        'row',

      alignItems:
        'center',

      gap: 15,

      borderRadius: 9,

      paddingHorizontal: 10,
    },

    menuItemTexto: {
      color:
        '#FFFFFF',

      fontSize: 16,

      fontWeight:
        '600',
    },

    sairItem: {
      marginTop:
        'auto',
    },

    sairTexto: {
      color:
        '#E53935',

      fontSize: 16,

      fontWeight:
        '700',
    },
  });