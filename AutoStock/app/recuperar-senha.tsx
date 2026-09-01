import {
    Ionicons,
} from '@expo/vector-icons';

import {
    router,
} from 'expo-router';

import {
    useEffect,
    useRef,
    useState,
} from 'react';

import {
    Alert,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

import {
    SafeAreaView,
} from 'react-native-safe-area-context';

import {
    useAppData,
} from '@/contexts/app-data-context';

export default function RecuperarSenhaScreen() {
  const [
    email,
    setEmail,
  ] = useState('');

  const [
    tecladoAberto,
    setTecladoAberto,
  ] = useState(false);

  const emailRef =
    useRef<TextInput>(
      null
    );

  const scrollRef =
    useRef<ScrollView>(
      null
    );

  const {
    usuarioCadastrado,
  } = useAppData();

  useEffect(() => {
    const mostrar =
      Keyboard.addListener(
        'keyboardDidShow',
        () => {
          setTecladoAberto(
            true
          );

          setTimeout(() => {
            scrollRef.current
              ?.scrollToEnd({
                animated: true,
              });
          }, 100);
        }
      );

    const esconder =
      Keyboard.addListener(
        'keyboardDidHide',
        () => {
          setTecladoAberto(
            false
          );
        }
      );

    return () => {
      mostrar.remove();
      esconder.remove();
    };
  }, []);

  function normalizarEmail(
    texto: string
  ) {
    return texto
      .trim()
      .toLowerCase()
      .normalize('NFKC');
  }

  function focarEmail() {
    setTimeout(() => {
      emailRef.current?.focus();

      setTimeout(() => {
        scrollRef.current
          ?.scrollToEnd({
            animated: true,
          });
      }, 100);
    }, 180);
  }

  function recuperar() {
    const emailDigitado =
      normalizarEmail(
        email
      );

    if (!emailDigitado) {
      Keyboard.dismiss();

      Alert.alert(
        'Atenção',
        'Informe o e-mail cadastrado.',
        [
          {
            text: 'OK',

            onPress: () => {
              focarEmail();
            },
          },
        ],
        {
          cancelable: false,
        }
      );

      return;
    }

    if (!usuarioCadastrado) {
      Keyboard.dismiss();

      setEmail('');

      Alert.alert(
        'Nenhuma conta cadastrada',
        'Nenhuma conta de administrador foi encontrada nesta execução do aplicativo. Crie a conta novamente.',
        [
          {
            text: 'OK',

            onPress: () => {
              router.replace(
                '/'
              );
            },
          },
        ],
        {
          cancelable: false,
        }
      );

      return;
    }

    const emailCadastrado =
      normalizarEmail(
        usuarioCadastrado.email
      );

    if (
      emailDigitado !==
      emailCadastrado
    ) {
      Keyboard.dismiss();

      setEmail('');

      Alert.alert(
        'E-mail não encontrado',
        'O e-mail informado não corresponde ao e-mail cadastrado. Digite novamente.',
        [
          {
            text: 'OK',

            onPress: () => {
              focarEmail();
            },
          },
        ],
        {
          cancelable: false,
        }
      );

      return;
    }

    Keyboard.dismiss();

    Alert.alert(
      'E-mail confirmado',
      'O e-mail cadastrado foi encontrado. A recuperação real da senha será implementada posteriormente.',
      [
        {
          text: 'OK',

          onPress: () => {
            setEmail('');

            router.replace(
              '/'
            );
          },
        },
      ],
      {
        cancelable: false,
      }
    );
  }

  return (
    <SafeAreaView
      style={
        styles.safeArea
      }
      edges={[
        'top',
        'left',
        'right',
      ]}
    >
      <KeyboardAvoidingView
        style={
          styles.container
        }
        behavior={
          Platform.OS ===
          'ios'
            ? 'padding'
            : 'height'
        }
        keyboardVerticalOffset={
          0
        }
      >
        <ScrollView
          ref={scrollRef}
          style={
            styles.scroll
          }
          contentContainerStyle={[
            styles.content,

            tecladoAberto &&
              styles.contentTeclado,
          ]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={
            false
          }
        >
          <TouchableOpacity
            style={
              styles.voltarButton
            }
            onPress={() => {
              Keyboard.dismiss();

              router.replace(
                '/'
              );
            }}
            activeOpacity={0.7}
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color="#FFFFFF"
            />

            <Text
              style={
                styles.voltarText
              }
            >
              Voltar
            </Text>
          </TouchableOpacity>

          <View
            style={[
              styles.card,

              tecladoAberto &&
                styles.cardTeclado,
            ]}
          >
            {!tecladoAberto && (
              <View
                style={
                  styles.iconeArea
                }
              >
                <Ionicons
                  name="mail-outline"
                  size={34}
                  color="#E53935"
                />
              </View>
            )}

            <Text
              style={[
                styles.titulo,

                tecladoAberto &&
                  styles.tituloTeclado,
              ]}
            >
              Recuperar senha
            </Text>

            {!tecladoAberto && (
              <Text
                style={
                  styles.descricao
                }
              >
                Informe o e-mail cadastrado na conta do administrador.
              </Text>
            )}

            <TextInput
              ref={emailRef}
              style={
                styles.input
              }
              placeholder="E-mail"
              placeholderTextColor="#777777"
              value={email}
              onChangeText={(
                texto
              ) => {
                setEmail(
                  texto.replace(
                    /\s/g,
                    ''
                  )
                );
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={
                false
              }
              autoComplete="email"
              textContentType="emailAddress"
              returnKeyType="done"
              onFocus={() => {
                setTimeout(() => {
                  scrollRef.current
                    ?.scrollToEnd({
                      animated: true,
                    });
                }, 100);
              }}
              onSubmitEditing={
                recuperar
              }
            />

            <TouchableOpacity
              style={
                styles.recuperarButton
              }
              onPress={
                recuperar
              }
              activeOpacity={0.8}
            >
              <Text
                style={
                  styles.recuperarButtonText
                }
              >
                RECUPERAR SENHA
              </Text>
            </TouchableOpacity>

            {tecladoAberto && (
              <Text
                style={
                  styles.dicaTeclado
                }
              >
                Confira o e-mail e toque em Recuperar senha.
              </Text>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles =
  StyleSheet.create({
    safeArea: {
      flex: 1,

      backgroundColor:
        '#000000',
    },

    container: {
      flex: 1,

      backgroundColor:
        '#000000',
    },

    scroll: {
      flex: 1,

      backgroundColor:
        '#000000',
    },

    content: {
      flexGrow: 1,

      paddingHorizontal: 24,

      paddingTop: 14,

      paddingBottom: 40,
    },

    contentTeclado: {
      paddingTop: 8,

      paddingBottom: 25,
    },

    voltarButton: {
      flexDirection:
        'row',

      alignItems:
        'center',

      gap: 8,

      alignSelf:
        'flex-start',

      paddingVertical: 8,
    },

    voltarText: {
      color:
        '#FFFFFF',

      fontSize: 15,

      fontWeight:
        '700',
    },

    card: {
      width: '100%',

      maxWidth: 430,

      alignSelf:
        'center',

      backgroundColor:
        '#1E1E1E',

      borderWidth: 1,

      borderColor:
        '#333333',

      borderRadius: 14,

      padding: 22,

      marginTop: 65,
    },

    cardTeclado: {
      marginTop: 12,

      paddingTop: 20,

      paddingBottom: 20,
    },

    iconeArea: {
      width: 62,

      height: 62,

      borderRadius: 31,

      backgroundColor:
        '#2A2A2A',

      alignItems:
        'center',

      justifyContent:
        'center',

      alignSelf:
        'center',

      marginBottom: 15,
    },

    titulo: {
      color:
        '#FFFFFF',

      fontSize: 25,

      fontWeight:
        '900',

      textAlign:
        'center',
    },

    tituloTeclado: {
      fontSize: 22,

      marginBottom: 18,
    },

    descricao: {
      color:
        '#AAAAAA',

      fontSize: 14,

      lineHeight: 20,

      textAlign:
        'center',

      marginTop: 8,

      marginBottom: 24,
    },

    input: {
      height: 52,

      backgroundColor:
        '#FFFFFF',

      borderRadius: 10,

      paddingHorizontal: 16,

      color:
        '#111111',

      fontSize: 16,
    },

    recuperarButton: {
      height: 52,

      backgroundColor:
        '#E53935',

      borderRadius: 10,

      alignItems:
        'center',

      justifyContent:
        'center',

      marginTop: 14,
    },

    recuperarButtonText: {
      color:
        '#FFFFFF',

      fontSize: 15,

      fontWeight:
        '900',
    },

    dicaTeclado: {
      color:
        '#888888',

      fontSize: 12,

      textAlign:
        'center',

      marginTop: 12,
    },
  });