import { useFonts } from 'expo-font';
import { AvisoDeEspera } from '@/components/aviso-de-espera';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

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
  SafeAreaView,
} from 'react-native-safe-area-context';

import {
  useAppData,
} from '@/contexts/app-data-context';

export default function CadastroScreen() {
  const [fonteSenhaCarregada, erroFonteSenha] = useFonts({
    AutocarSenhaOculta: require('@/assets/fonts/autocar-senha-oculta.ttf'),
  });
  const fonteSenhaVisivel = Platform.OS === 'ios' ? 'System' : 'sans-serif';

  const [cadastrando, setCadastrando] = useState(false);
  const cadastrandoRef = useRef(false);
  const [
    nome,
    setNome,
  ] = useState('');

  const [
    sobrenome,
    setSobrenome,
  ] = useState('');

  const [
    email,
    setEmail,
  ] = useState('');

  const [
    senha,
    setSenha,
  ] = useState('');

  const [
    repetirSenha,
    setRepetirSenha,
  ] = useState('');

  const [
    mostrarSenha,
    setMostrarSenha,
  ] = useState(false);

  const [
    mostrarRepetirSenha,
    setMostrarRepetirSenha,
  ] = useState(false);

  const [
    senhaFocada,
    setSenhaFocada,
  ] = useState(false);

  const [
    repetirSenhaFocada,
    setRepetirSenhaFocada,
  ] = useState(false);

  const cadastroConcluidoRef =
    useRef(false);

  const nomeRef =
    useRef<TextInput>(
      null
    );

  const sobrenomeRef =
    useRef<TextInput>(
      null
    );

  const emailRef =
    useRef<TextInput>(
      null
    );

  const senhaRef =
    useRef<TextInput>(
      null
    );

  const repetirSenhaRef =
    useRef<TextInput>(
      null
    );

  const {
    usuarioCadastrado,
    cadastrarUsuario,
  } = useAppData();

  useEffect(() => {
    if (
      usuarioCadastrado &&
      !cadastroConcluidoRef.current
    ) {
      router.replace(
        '/'
      );
    }
  }, [
    usuarioCadastrado,
  ]);

  function emailValido(
    texto: string
  ) {
    const emailNormalizado = texto.trim();
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailNormalizado) &&
      !/\.comm+$/i.test(emailNormalizado);
  }

  async function cadastrar() {
    if (cadastrandoRef.current) return;
    if (
      !nome.trim() ||
      !sobrenome.trim() ||
      !email.trim() ||
      !senha ||
      !repetirSenha
    ) {
      Alert.alert(
        'Atenção',
        'Preencha todos os campos.'
      );

      return;
    }

    if (
      !emailValido(
        email
      )
    ) {
      setEmail('');

      Alert.alert(
        'E-mail inválido',
        'Informe um e-mail válido.',
        [
          {
            text: 'OK',

            onPress: () => {
              setTimeout(
                () => {
                  emailRef.current?.focus();
                },
                150
              );
            },
          },
        ]
      );

      return;
    }

    if (
      senha !==
      repetirSenha
    ) {
      setSenha('');

      setRepetirSenha('');

      setMostrarSenha(
        false
      );

      setMostrarRepetirSenha(
        false
      );

      Alert.alert(
        'Senhas diferentes',
        'As senhas não coincidem. Digite novamente.',
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

    cadastroConcluidoRef.current =
      true;

    let cadastrado = false;
    cadastrandoRef.current = true;
    setCadastrando(true);
    Keyboard.dismiss();

    try {
      cadastrado =
        await cadastrarUsuario({
          nome,
          sobrenome,
          email,
          senha,
        });
    } catch (erro) {
      cadastroConcluidoRef.current =
        false;

      Alert.alert(
        'Não foi possível cadastrar',
        erro instanceof Error
          ? erro.message
          : 'Verifique a conexão e tente novamente.'
      );

      return;
    } finally {
      cadastrandoRef.current = false;
      setCadastrando(false);
    }

    if (!cadastrado) {
      cadastroConcluidoRef.current =
        false;

      Alert.alert(
        'Cadastro bloqueado',
        'Já existe uma conta de administrador cadastrada.',
        [
          {
            text: 'OK',

            onPress: () => {
              router.replace(
                '/'
              );
            },
          },
        ]
      );

      return;
    }

    Keyboard.dismiss();

    setMostrarSenha(
      false
    );

    setMostrarRepetirSenha(
      false
    );

    Alert.alert(
      'Conta criada',
      'Cadastro realizado com sucesso. Agora faça o login.',
      [
        {
          text: 'OK',

          onPress: () => {
            setNome('');

            setSobrenome('');

            setEmail('');

            setSenha('');

            setRepetirSenha('');

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

  function alternarRepetirSenha() {
    setMostrarRepetirSenha(
      (valorAtual) =>
        !valorAtual
    );

    requestAnimationFrame(
      () => {
        repetirSenhaRef.current?.focus();
      }
    );
  }

  if (erroFonteSenha) throw erroFonteSenha;

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
      <View style={styles.container}>
        <KeyboardAwareScrollView bottomOffset={28} extraKeyboardSpace={24}
          style={
            styles.scroll
          }
          contentContainerStyle={
            styles.content
          }
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
            disabled={cadastrando}
            onPress={() => {
              Keyboard.dismiss();

              router.replace(
                '/'
              );
            }}
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

          <Image
            source={require(
              '@/assets/images/logo-autocar.png'
            )}
            style={
              styles.logo
            }
            resizeMode="contain"
          />

          <Text
            style={
              styles.titulo
            }
          >
            Criar conta
          </Text>

          <View
            style={
              styles.espacoTitulo
            }
          />

          <TextInput
            caretHidden={false}
              editable={!cadastrando}
            ref={nomeRef}
            style={
              styles.input
            }
            placeholder="Nome"
            placeholderTextColor="#777777"
            value={nome}
            onChangeText={
              setNome
            }
            autoCapitalize="words"
            returnKeyType="next"
            submitBehavior="submit"
            onSubmitEditing={() => {
              sobrenomeRef.current?.focus();
            }}
          />

          <TextInput
            caretHidden={false}
              editable={!cadastrando}
            ref={
              sobrenomeRef
            }
            style={
              styles.input
            }
            placeholder="Sobrenome"
            placeholderTextColor="#777777"
            value={
              sobrenome
            }
            onChangeText={
              setSobrenome
            }
            autoCapitalize="words"
            returnKeyType="next"
            submitBehavior="submit"
            onSubmitEditing={() => {
              emailRef.current?.focus();
            }}
          />

          <TextInput
            caretHidden={false}
              editable={!cadastrando}
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
              caretHidden={false}
              editable={!cadastrando && fonteSenhaCarregada}
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
              returnKeyType="next"
              submitBehavior="submit"
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
              onSubmitEditing={() => {
                repetirSenhaRef.current?.focus();
              }}
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

          <View
            style={[
              styles.senhaContainer,

              repetirSenhaFocada &&
                styles.campoFocado,
            ]}
          >
            <TextInput
              caretHidden={false}
              editable={!cadastrando && fonteSenhaCarregada}
              ref={
                repetirSenhaRef
              }
              style={[
                styles.senhaInputReal,
                { fontFamily: fonteSenhaCarregada && !mostrarRepetirSenha ? 'AutocarSenhaOculta' : fonteSenhaVisivel },
              ]}
              value={
                repetirSenha
              }
              onChangeText={
                setRepetirSenha
              }
              secureTextEntry={!mostrarRepetirSenha}
              placeholder="Repetir senha"
              placeholderTextColor={mostrarRepetirSenha ? '#777777' : 'transparent'}
              accessibilityLabel="Repetir senha"
              autoCapitalize="none"
              autoCorrect={
                false
              }
              returnKeyType="done"
              onFocus={() => {
                setRepetirSenhaFocada(
                  true
                );
              }}
              onBlur={() => {
                setRepetirSenhaFocada(
                  false
                );
              }}
              onSubmitEditing={() => Keyboard.dismiss()}
            />
            {!mostrarRepetirSenha && !repetirSenha && (
              <View pointerEvents="none" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.senhaPlaceholderArea}>
                <Text style={styles.senhaPlaceholderTexto}>Repetir senha</Text>
              </View>
            )}


            <TouchableOpacity
              style={
                styles.olhoButton
              }
              onPress={
                alternarRepetirSenha
              }
              activeOpacity={0.7}
            >
              <Ionicons
                name={
                  mostrarRepetirSenha
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
              styles.cadastrarButton
            }
            disabled={cadastrando}
            accessibilityState={{ busy: cadastrando, disabled: cadastrando }}
            onPress={
              cadastrar
            }
            activeOpacity={0.8}
          >
            {cadastrando && <ActivityIndicator color="#FFFFFF" style={{ marginBottom: 4 }} />}
            <Text
              style={
                styles.cadastrarButtonText
              }
            >
              {cadastrando ? 'CADASTRANDO...' : 'CADASTRAR'}
            </Text>
          </TouchableOpacity>
          <AvisoDeEspera ativo={cadastrando} />
        </KeyboardAwareScrollView>
      </View>
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

    voltarButton: {
      flexDirection:
        'row',
      alignItems:
        'center',
      gap: 8,
      alignSelf:
        'flex-start',
      paddingVertical: 8,
      marginBottom: 2,
    },

    voltarText: {
      color:
        '#FFFFFF',
      fontSize: 15,
      fontWeight:
        '700',
    },

    logo: {
      width: 180,
      height: 125,
      alignSelf:
        'center',
      marginTop: 4,
    },

    titulo: {
      color:
        '#FFFFFF',
      fontSize: 28,
      fontWeight:
        '900',
      textAlign:
        'center',
      marginTop: 4,
    },

    espacoTitulo: {
      height: 24,
    },

    input: {
      height: 52,
      backgroundColor:
        '#FFFFFF',
      borderRadius: 10,
      paddingHorizontal: 16,
      marginBottom: 12,
      color:
        '#111111',
      fontSize: 16,
      borderWidth: 2,
      borderColor:
        '#FFFFFF',
    },

    senhaContainer: {
      height: 52,
      backgroundColor:
        '#FFFFFF',
      borderRadius: 10,
      flexDirection:
        'row',
      alignItems:
        'center',
      marginBottom: 12,
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
      height: 50,
      marginLeft:
        'auto',
      alignItems:
        'center',
      justifyContent:
        'center',
      zIndex: 3,
    },

    cadastrarButton: {
      height: 54,
      backgroundColor:
        '#E53935',
      borderRadius: 10,
      alignItems:
        'center',
      justifyContent:
        'center',
      marginTop: 6,
      marginBottom: 20,
    },

    cadastrarButtonText: {
      color:
        '#FFFFFF',
      fontSize: 16,
      fontWeight:
        '900',
      letterSpacing: 0.6,
    },
  });
