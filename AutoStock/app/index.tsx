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
  Image,
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
  useAppData,
} from '@/contexts/app-data-context';

export default function LoginScreen() {
  const [
    email,
    setEmail,
  ] = useState('');

  const [
    senha,
    setSenha,
  ] = useState('');

  const [
    mostrarSenha,
    setMostrarSenha,
  ] = useState(false);

  const [
    senhaFocada,
    setSenhaFocada,
  ] = useState(false);

  const [
    tecladoAberto,
    setTecladoAberto,
  ] = useState(false);

  const emailRef =
    useRef<TextInput>(
      null
    );

  const senhaRef =
    useRef<TextInput>(
      null
    );

  const {
    usuarioCadastrado,
    entrarUsuario,
  } = useAppData();

  useEffect(() => {
    const mostrar =
      Keyboard.addListener(
        'keyboardDidShow',
        () => {
          setTecladoAberto(
            true
          );
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

  function entrar() {
    Keyboard.dismiss();

    if (
      !email.trim()
    ) {
      Alert.alert(
        'Atenção',
        'Informe o e-mail.',
        [
          {
            text: 'OK',

            onPress: () => {
              emailRef.current?.focus();
            },
          },
        ]
      );

      return;
    }

    if (
      !senha
    ) {
      Alert.alert(
        'Atenção',
        'Informe a senha.',
        [
          {
            text: 'OK',

            onPress: () => {
              senhaRef.current?.focus();
            },
          },
        ]
      );

      return;
    }

    if (
      !usuarioCadastrado
    ) {
      setEmail('');

      setSenha('');

      setMostrarSenha(
        false
      );

      Alert.alert(
        'Primeiro acesso',
        'Nenhuma conta foi cadastrada ainda. Toque em Criar conta.'
      );

      return;
    }

    const loginCorreto =
      entrarUsuario(
        email,
        senha
      );

    if (
      !loginCorreto
    ) {
      /*
        Login incorreto:

        - mantém o e-mail;
        - apaga somente a senha;
        - fecha o olho da senha;
        - volta o foco para a senha.
      */
      setSenha('');

      setMostrarSenha(
        false
      );

      Alert.alert(
        'Acesso negado',
        'E-mail ou senha inválido(s). Digite novamente.',
        [
          {
            text: 'OK',

            onPress: () => {
              setTimeout(
                () => {
                  senhaRef.current?.focus();
                },
                150
              );
            },
          },
        ]
      );

      return;
    }

    /*
      Login correto:

      podemos limpar os dois campos
      antes de entrar no aplicativo.
    */
    setEmail('');

    setSenha('');

    setMostrarSenha(
      false
    );

    router.replace(
      '/dashboard'
    );
  }

  function alternarSenha() {
    setMostrarSenha(
      (valorAtual) =>
        !valorAtual
    );

    requestAnimationFrame(
      () => {
        senhaRef.current?.focus();
      }
    );
  }

  return (
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
        Platform.OS ===
        'ios'
          ? 20
          : 0
      }
    >
      <ScrollView
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
        <View
          style={
            styles.formulario
          }
        >
          <Image
            source={require(
              '@/assets/images/logo-autocar.png'
            )}
            style={[
              styles.logo,

              tecladoAberto &&
                styles.logoTeclado,
            ]}
            resizeMode="contain"
          />

          <TextInput
            ref={emailRef}
            style={
              styles.input
            }
            placeholder="E-mail"
            placeholderTextColor="#777777"
            value={email}
            onChangeText={
              setEmail
            }
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={
              false
            }
            returnKeyType="next"
            submitBehavior="submit"
            onSubmitEditing={() => {
              senhaRef.current?.focus();
            }}
          />

          <View
            style={[
              styles.senhaContainer,

              senhaFocada &&
                styles.campoFocado,
            ]}
          >
            <TextInput
              ref={senhaRef}
              style={
                styles.senhaInputReal
              }
              value={senha}
              onChangeText={
                setSenha
              }
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={
                false
              }
              returnKeyType="done"
              caretHidden
              selectionColor="transparent"
              onFocus={() => {
                setSenhaFocada(
                  true
                );
              }}
              onBlur={() => {
                setSenhaFocada(
                  false
                );
              }}
              onSubmitEditing={
                entrar
              }
            />

            <View
              pointerEvents="none"
              style={
                styles.senhaTextoArea
              }
            >
              <Text
                numberOfLines={1}
                style={[
                  styles.senhaTexto,

                  !senha &&
                    styles.placeholder,
                ]}
              >
                {senha
                  ? mostrarSenha
                    ? senha
                    : '*'.repeat(
                        senha.length
                      )
                  : 'Senha'}
              </Text>
            </View>

            <TouchableOpacity
              style={
                styles.olhoButton
              }
              onPress={
                alternarSenha
              }
              activeOpacity={0.7}
            >
              <Ionicons
                name={
                  mostrarSenha
                    ? 'eye-off-outline'
                    : 'eye-outline'
                }
                size={23}
                color="#555555"
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={
              styles.entrarButton
            }
            onPress={
              entrar
            }
            activeOpacity={0.8}
          >
            <Text
              style={
                styles.entrarButtonText
              }
            >
              ENTRAR
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={
              styles.linkButton
            }
            onPress={() => {
              Keyboard.dismiss();

              router.push(
                '/recuperar-senha'
              );
            }}
          >
            <Text
              style={
                styles.linkText
              }
            >
              Esqueci minha senha
            </Text>
          </TouchableOpacity>

          {!usuarioCadastrado && (
            <TouchableOpacity
              style={
                styles.criarContaButton
              }
              onPress={() => {
                Keyboard.dismiss();

                router.push(
                  '/cadastro'
                );
              }}
            >
              <Text
                style={
                  styles.criarContaText
                }
              >
                Primeiro acesso?{' '}

                <Text
                  style={
                    styles.criarContaDestaque
                  }
                >
                  Criar conta
                </Text>
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles =
  StyleSheet.create({
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

      justifyContent:
        'center',

      paddingHorizontal: 28,

      paddingTop: 25,

      paddingBottom: 30,
    },

    contentTeclado: {
      justifyContent:
        'flex-start',

      paddingTop: 12,

      paddingBottom: 25,
    },

    formulario: {
      width: '100%',

      maxWidth: 430,

      alignSelf:
        'center',
    },

    logo: {
      width: 250,

      height: 210,

      alignSelf:
        'center',

      marginBottom: 12,
    },

    logoTeclado: {
      width: 150,

      height: 105,

      marginBottom: 8,
    },

    input: {
      height: 54,

      backgroundColor:
        '#FFFFFF',

      borderRadius: 10,

      paddingHorizontal: 16,

      marginBottom: 14,

      color:
        '#111111',

      fontSize: 16,

      borderWidth: 2,

      borderColor:
        '#FFFFFF',
    },

    senhaContainer: {
      height: 54,

      backgroundColor:
        '#FFFFFF',

      borderRadius: 10,

      flexDirection:
        'row',

      alignItems:
        'center',

      marginBottom: 14,

      borderWidth: 2,

      borderColor:
        '#FFFFFF',

      position:
        'relative',

      overflow:
        'hidden',
    },

    campoFocado: {
      borderColor:
        '#E53935',
    },

    senhaInputReal: {
      position:
        'absolute',

      left: 0,

      right: 50,

      top: 0,

      bottom: 0,

      paddingHorizontal: 16,

      color:
        'transparent',

      backgroundColor:
        'transparent',

      fontSize: 16,

      zIndex: 2,
    },

    senhaTextoArea: {
      position:
        'absolute',

      left: 16,

      right: 52,

      top: 0,

      bottom: 0,

      justifyContent:
        'center',

      zIndex: 1,
    },

    senhaTexto: {
      color:
        '#111111',

      fontSize: 16,
    },

    placeholder: {
      color:
        '#777777',
    },

    olhoButton: {
      width: 50,

      height: 52,

      marginLeft:
        'auto',

      alignItems:
        'center',

      justifyContent:
        'center',

      zIndex: 3,
    },

    entrarButton: {
      height: 54,

      backgroundColor:
        '#E53935',

      borderRadius: 10,

      alignItems:
        'center',

      justifyContent:
        'center',

      marginTop: 4,
    },

    entrarButtonText: {
      color:
        '#FFFFFF',

      fontSize: 16,

      fontWeight:
        '900',

      letterSpacing: 0.6,
    },

    linkButton: {
      alignSelf:
        'center',

      paddingVertical: 14,

      paddingHorizontal: 10,
    },

    linkText: {
      color:
        '#BBBBBB',

      fontSize: 14,

      fontWeight:
        '600',
    },

    criarContaButton: {
      alignSelf:
        'center',

      paddingVertical: 8,

      paddingHorizontal: 10,
    },

    criarContaText: {
      color:
        '#BBBBBB',

      fontSize: 14,

      fontWeight:
        '600',
    },

    criarContaDestaque: {
      color:
        '#E53935',

      fontWeight:
        '800',
    },
  });