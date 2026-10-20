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
  redefinirSenhaApi,
  solicitarRecuperacaoSenhaApi,
} from '@/services/api';

export default function RecuperarSenhaScreen() {
  const [
    email,
    setEmail,
  ] = useState('');

  const [codigo, setCodigo] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [etapaCodigo, setEtapaCodigo] = useState(false);
  const [processando, setProcessando] = useState(false);

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

  async function recuperar() {
    const emailDigitado =
      normalizarEmail(
        email
      );

    if (!emailDigitado) {
      Keyboard.dismiss();

      Alert.alert(
        'Atenção',
        'Informe o e-mail cadastrado.'
      );

      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailDigitado)) {
      Keyboard.dismiss();
      Alert.alert(
        'E-mail inválido',
        'Informe o mesmo e-mail usado no cadastro.'
      );
      return;
    }

    Keyboard.dismiss();
    setProcessando(true);

    try {
      await solicitarRecuperacaoSenhaApi(emailDigitado);
      setEmail(emailDigitado);
      setEtapaCodigo(true);
      Alert.alert(
        'Confira seu e-mail',
        'Se o endereço estiver cadastrado, você receberá um código de 8 dígitos válido por 10 minutos.'
      );
    } catch (erro) {
      Alert.alert(
        'Não foi possível enviar o código',
        erro instanceof Error ? erro.message : 'Tente novamente em alguns instantes.'
      );
    } finally {
      setProcessando(false);
    }
  }

  async function confirmarCodigo() {
    if (!/^\d{8}$/.test(codigo.trim())) {
      Alert.alert('Código inválido', 'Digite os 8 números recebidos por e-mail.');
      return;
    }

    if (novaSenha.length < 6) {
      Alert.alert('Senha muito curta', 'A nova senha deve ter pelo menos 6 caracteres.');
      return;
    }

    Keyboard.dismiss();
    setProcessando(true);

    try {
      await redefinirSenhaApi(email, codigo.trim(), novaSenha);
      setCodigo('');
      setNovaSenha('');
      Alert.alert('Senha alterada', 'Agora entre usando sua nova senha.', [
        { text: 'OK', onPress: () => router.replace('/') },
      ]);
    } catch (erro) {
      Alert.alert(
        'Não foi possível alterar a senha',
        erro instanceof Error ? erro.message : 'Confira o código e tente novamente.'
      );
    } finally {
      setProcessando(false);
    }
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

            {!etapaCodigo ? (
              <>
                <TextInput
                  ref={emailRef}
                  style={styles.input}
                  placeholder="E-mail"
                  placeholderTextColor="#777777"
                  value={email}
                  onChangeText={(texto) => setEmail(texto.replace(/\s/g, ''))}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                  textContentType="emailAddress"
                  returnKeyType="done"
                  onFocus={() => {
                    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
                  }}
                  onSubmitEditing={recuperar}
                />
                <TouchableOpacity
                  style={[styles.recuperarButton, processando && styles.botaoDesabilitado]}
                  onPress={recuperar}
                  disabled={processando}
                  activeOpacity={0.8}
                >
                  <Text style={styles.recuperarButtonText}>
                    {processando ? 'ENVIANDO...' : 'ENVIAR CÓDIGO'}
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.emailSelecionado}>{email}</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Código de 8 dígitos"
                  placeholderTextColor="#777777"
                  value={codigo}
                  onChangeText={(texto) => setCodigo(texto.replace(/\D/g, '').slice(0, 8))}
                  keyboardType="number-pad"
                  returnKeyType="next"
                />
                <TextInput
                  style={styles.input}
                  placeholder="Nova senha (mínimo 6 caracteres)"
                  placeholderTextColor="#777777"
                  value={novaSenha}
                  onChangeText={setNovaSenha}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="done"
                  onSubmitEditing={confirmarCodigo}
                />
                <TouchableOpacity
                  style={[styles.recuperarButton, processando && styles.botaoDesabilitado]}
                  onPress={confirmarCodigo}
                  disabled={processando}
                  activeOpacity={0.8}
                >
                  <Text style={styles.recuperarButtonText}>
                    {processando ? 'SALVANDO...' : 'ALTERAR SENHA'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.voltarEtapaButton}
                  onPress={() => {
                    setEtapaCodigo(false);
                    setCodigo('');
                    setNovaSenha('');
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.voltarEtapaText}>Usar outro e-mail</Text>
                </TouchableOpacity>
              </>
            )}

            {tecladoAberto && (
              <Text
                style={
                  styles.dicaTeclado
                }
              >
                {etapaCodigo
                  ? 'Digite o código recebido e escolha a nova senha.'
                  : 'Confira o e-mail e toque em Enviar código.'}
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

      marginBottom: 12,
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

    botaoDesabilitado: {
      opacity: 0.65,
    },

    emailSelecionado: {
      color: '#BBBBBB',
      fontSize: 14,
      textAlign: 'center',
      marginBottom: 14,
    },

    voltarEtapaButton: {
      alignSelf: 'center',
      padding: 12,
    },

    voltarEtapaText: {
      color: '#BBBBBB',
      fontSize: 14,
      fontWeight: '600',
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
