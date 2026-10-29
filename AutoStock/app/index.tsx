import { useFonts } from 'expo-font';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ErroApi, prepararConexaoApi } from '@/services/api';
import { AvisoDeEspera } from '@/components/aviso-de-espera';
import { KeyboardAvoidingView, KeyboardAwareScrollView } from 'react-native-keyboard-controller';

import {
  Ionicons,
} from '@expo/vector-icons';

import {
  router,
  Redirect,
} from 'expo-router';

import {
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Alert,
  Image,
  Keyboard,
  Platform,
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
  const [fonteSenhaCarregada, erroFonteSenha] = useFonts({
    AutocarSenhaOculta: require('@/assets/fonts/autocar-senha-oculta.ttf'),
  });
  const fonteSenhaVisivel = Platform.OS === 'ios' ? 'System' : 'sans-serif';

  const [entrando, setEntrando] = useState(false);
  const entrandoRef = useRef(false);
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
    usuarioLogado,
    restaurandoSessao,
  } = useAppData();

  useEffect(() => {
    void prepararConexaoApi();
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

  async function entrar() {
    if (entrandoRef.current) return;
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

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      Alert.alert(
        'Atenção',
        'Informe um e-mail válido.',
        [{ text: 'OK', onPress: () => emailRef.current?.focus() }]
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

    let loginCorreto = false;
    entrandoRef.current = true;
    setEntrando(true);

    try {
      loginCorreto =
        await entrarUsuario(
          email,
          senha
        );
    } catch (erro) {
      const credenciaisIncorretas = erro instanceof ErroApi && erro.status === 401;
      if (credenciaisIncorretas) setSenha('');

      setMostrarSenha(
        false
      );

      Alert.alert(
        'Falha no login',
        erro instanceof Error
          ? erro.message
          : 'Não foi possível entrar. Tente novamente.',
        [
          {
            text: 'OK',

            onPress: () => {
              if (credenciaisIncorretas) senhaRef.current?.focus();
            },
          },
        ]
      );

      return;
    } finally {
      entrandoRef.current = false;
      setEntrando(false);
    }

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

  function prepararTecladoLogin() {
    if (Platform.OS === 'android') setTecladoAberto(true);
  }

  function alternarSenha() {
    prepararTecladoLogin();
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

  if (erroFonteSenha) throw erroFonteSenha;

  if (restaurandoSessao) return <View style={{ flex: 1, backgroundColor: '#000000', alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color="#E53935" size="large" /></View>;
  if (usuarioLogado && !entrando) return <Redirect href="/(tabs)/dashboard" />;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={styles.scroll} behavior="height" enabled={Platform.OS === 'android'}>
      <KeyboardAwareScrollView bottomOffset={28} extraKeyboardSpace={24} enabled={Platform.OS !== 'android'}
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
            caretHidden={false}
              editable={!entrando}
            ref={emailRef}
            style={
              styles.input
            }
            placeholder="E-mail"
            onFocus={prepararTecladoLogin}
            onPressIn={prepararTecladoLogin}
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
              caretHidden={false}
              editable={!entrando && fonteSenhaCarregada}
              ref={senhaRef}
              style={[
                styles.senhaInputReal,
                { fontFamily: fonteSenhaCarregada && !mostrarSenha ? 'AutocarSenhaOculta' : fonteSenhaVisivel },
              ]}
              value={senha}
              onChangeText={
                setSenha
              }
              secureTextEntry={!mostrarSenha}
              placeholder="Senha"
              placeholderTextColor={mostrarSenha ? '#777777' : 'transparent'}
              accessibilityLabel="Senha"
              autoCapitalize="none"
              autoCorrect={
                false
              }
              returnKeyType="done"
              onPressIn={prepararTecladoLogin}
              onFocus={() => {
                prepararTecladoLogin();
                setSenhaFocada(
                  true
                );
              }}
              onBlur={() => {
                setSenhaFocada(
                  false
                );
              }}
              onSubmitEditing={() => Keyboard.dismiss()}
            />
            {!mostrarSenha && !senha && (
              <View pointerEvents="none" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.senhaPlaceholderArea}>
                <Text style={styles.senhaPlaceholderTexto}>Senha</Text>
              </View>
            )}


            <TouchableOpacity
              style={
                styles.olhoButton
              }
              disabled={entrando}
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
            disabled={entrando}
            accessibilityState={{ busy: entrando, disabled: entrando }}
            onPress={
              entrar
            }
            activeOpacity={0.8}
          >
            {entrando && <ActivityIndicator color="#FFFFFF" style={{ marginBottom: 4 }} />}
            <Text
              style={
                styles.entrarButtonText
              }
            >
              {entrando ? 'ENTRANDO...' : 'ENTRAR'}
            </Text>
          </TouchableOpacity>
          <AvisoDeEspera ativo={entrando} />

          <TouchableOpacity
            style={
              styles.linkButton
            }
            disabled={entrando}
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
              Redefinir Senha
            </Text>
          </TouchableOpacity>

          {!usuarioCadastrado && (
            <TouchableOpacity
              style={
                styles.criarContaButton
              }
              disabled={entrando}
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
      </KeyboardAwareScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
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
        '#111111',

      backgroundColor:
        'transparent',

      fontSize: 16,

      zIndex: 2,
    },

    senhaPlaceholderArea: {
      position: 'absolute', left: 16, right: 52, top: 0, bottom: 0,
      justifyContent: 'center', zIndex: 1,
    },
    senhaPlaceholderTexto: { color: '#777777', fontSize: 16 },

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
