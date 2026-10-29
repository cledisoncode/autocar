import { Ionicons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';
import { redefinirSenhaApi, solicitarRecuperacaoSenhaApi } from '@/services/api';

type AcaoRecuperacao = { tipo: 'enviar' | 'redefinir' };

export default function RecuperarSenhaScreen() {
  const [email, setEmail] = useState('');
  const [codigo, setCodigo] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [etapaCodigo, setEtapaCodigo] = useState(false);
  const [processando, setProcessando] = useState(false);
  const [concluido, setConcluido] = useState(false);
  const [tecladoAberto, setTecladoAberto] = useState(false);
  const [fonteSenhaCarregada, erroFonteSenha] = useFonts({
    AutocarSenhaOculta: require('@/assets/fonts/autocar-senha-oculta.ttf'),
  });
  const fonteSenhaVisivel = Platform.OS === 'ios' ? 'System' : 'sans-serif';
  const novaSenhaRef = useRef<TextInput>(null);
  const acaoRef = useRef<AcaoRecuperacao | null>(null);
  const montadoRef = useRef(true);
  const concluidoRef = useRef(false);
  const etapaCodigoRef = useRef(false);
  const ocupado = processando || concluido;

  useEffect(() => {
    montadoRef.current = true;
    const mostrar = Keyboard.addListener('keyboardDidShow', () => setTecladoAberto(true));
    const esconder = Keyboard.addListener('keyboardDidHide', () => setTecladoAberto(false));
    return () => {
      montadoRef.current = false;
      acaoRef.current = null;
      mostrar.remove();
      esconder.remove();
    };
  }, []);

  function bloqueado() {
    return !montadoRef.current || acaoRef.current !== null || concluidoRef.current;
  }

  function iniciar(acao: AcaoRecuperacao) {
    if (bloqueado()) return false;
    acaoRef.current = acao;
    setProcessando(true);
    Keyboard.dismiss();
    return true;
  }

  function acaoAtual(acao: AcaoRecuperacao) {
    return montadoRef.current && acaoRef.current === acao;
  }

  function concluir(acao: AcaoRecuperacao) {
    if (acaoRef.current !== acao) return;
    acaoRef.current = null;
    if (montadoRef.current) setProcessando(false);
  }

  async function recuperar() {
    if (bloqueado() || etapaCodigoRef.current) return;
    const emailDigitado = email.trim().toLowerCase().normalize('NFKC');
    if (!emailDigitado) {
      Keyboard.dismiss();
      Alert.alert('Atenção', 'Informe o e-mail cadastrado.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailDigitado)) {
      Keyboard.dismiss();
      Alert.alert('E-mail inválido', 'Informe o mesmo e-mail usado no cadastro.');
      return;
    }
    const acao: AcaoRecuperacao = { tipo: 'enviar' };
    if (!iniciar(acao)) return;
    try {
      await solicitarRecuperacaoSenhaApi(emailDigitado);
      if (!acaoAtual(acao)) return;
      setEmail(emailDigitado);
      etapaCodigoRef.current = true;
      setEtapaCodigo(true);
      Alert.alert(
        'Confira seu e-mail',
        'Se o endereço estiver cadastrado, você receberá um código de 8 dígitos válido por 10 minutos.'
      );
    } catch (erro) {
      if (!acaoAtual(acao)) return;
      Alert.alert('Não foi possível enviar o código', erro instanceof Error ? erro.message : 'Tente novamente em alguns instantes.');
    } finally {
      concluir(acao);
    }
  }

  async function confirmarCodigo() {
    if (bloqueado() || !etapaCodigoRef.current || !fonteSenhaCarregada || erroFonteSenha) return;
    const codigoInformado = codigo.trim();
    if (!/^\d{8}$/.test(codigoInformado)) {
      Keyboard.dismiss();
      Alert.alert('Código inválido', 'Digite os 8 números recebidos por e-mail.');
      return;
    }
    if (novaSenha.length < 6) {
      Keyboard.dismiss();
      Alert.alert('Senha muito curta', 'A nova senha deve ter pelo menos 6 caracteres.');
      return;
    }
    const acao: AcaoRecuperacao = { tipo: 'redefinir' };
    if (!iniciar(acao)) return;
    try {
      await redefinirSenhaApi(email, codigoInformado, novaSenha);
      if (!acaoAtual(acao)) return;
      concluidoRef.current = true;
      setConcluido(true);
      setCodigo('');
      setNovaSenha('');
      setMostrarSenha(false);
      Alert.alert('Senha alterada', 'Agora entre usando sua nova senha.', [
        { text: 'OK', onPress: () => { if (montadoRef.current) router.replace('/'); } },
      ], { cancelable: false });
    } catch (erro) {
      if (!acaoAtual(acao)) return;
      Alert.alert('Não foi possível alterar a senha', erro instanceof Error ? erro.message : 'Confira o código e tente novamente.');
    } finally {
      concluir(acao);
    }
  }

  function voltar() {
    if (bloqueado()) return;
    Keyboard.dismiss();
    router.replace('/');
  }

  function usarOutroEmail() {
    if (bloqueado()) return;
    Keyboard.dismiss();
    etapaCodigoRef.current = false;
    setEtapaCodigo(false);
    setCodigo('');
    setNovaSenha('');
    setMostrarSenha(false);
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        <KeyboardAwareScrollView
          bottomOffset={28}
          extraKeyboardSpace={24}
          style={styles.scroll}
          contentContainerStyle={[styles.content, tecladoAberto && styles.contentTeclado]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity
            style={[styles.voltarButton, ocupado && styles.botaoDesabilitado]}
            onPress={voltar}
            disabled={ocupado}
            accessibilityRole="button"
            accessibilityState={{ disabled: ocupado }}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            <Text style={styles.voltarText}>Voltar</Text>
          </TouchableOpacity>

          <View style={[styles.card, tecladoAberto && styles.cardTeclado]}>
            {!tecladoAberto && (
              <View style={styles.iconeArea}>
                <Ionicons name="mail-outline" size={34} color="#E53935" />
              </View>
            )}
            <Text style={[styles.titulo, tecladoAberto && styles.tituloTeclado]}>Redefinir Senha</Text>
            {!tecladoAberto && (
              <Text style={styles.descricao}>Informe o e-mail cadastrado na conta do administrador.</Text>
            )}

            {!etapaCodigo ? (
              <>
                <TextInput
                  caretHidden={false}
                  style={styles.input}
                  placeholder="E-mail"
                  placeholderTextColor="#777777"
                  accessibilityLabel="E-mail cadastrado"
                  value={email}
                  editable={!ocupado}
                  onChangeText={texto => { if (!bloqueado() && !etapaCodigoRef.current) setEmail(texto.replace(/\s/g, '')); }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                  textContentType="emailAddress"
                  returnKeyType="done"
                  onSubmitEditing={() => Keyboard.dismiss()}
                />
                <TouchableOpacity
                  style={[styles.recuperarButton, styles.botaoComIndicador, ocupado && styles.botaoDesabilitado]}
                  onPress={recuperar}
                  disabled={ocupado}
                  accessibilityRole="button"
                  accessibilityLabel={processando ? 'Enviando código' : 'Enviar código'}
                  accessibilityState={{ disabled: ocupado, busy: processando }}
                  activeOpacity={0.8}
                >
                  {processando && <ActivityIndicator size="small" color="#FFFFFF" />}
                  <Text style={styles.recuperarButtonText}>{processando ? 'ENVIANDO...' : 'ENVIAR CÓDIGO'}</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.emailSelecionado}>{email}</Text>
                <View style={styles.camposCodigo}>
                  <TextInput
                    caretHidden={false}
                    style={styles.input}
                    placeholder="Código de 8 dígitos"
                    placeholderTextColor="#777777"
                    accessibilityLabel="Código de 8 dígitos recebido por e-mail"
                    value={codigo}
                    editable={!ocupado}
                    onChangeText={texto => { if (!bloqueado() && etapaCodigoRef.current) setCodigo(texto.replace(/\D/g, '').slice(0, 8)); }}
                    keyboardType="number-pad"
                    autoComplete="one-time-code"
                    textContentType="oneTimeCode"
                    returnKeyType="next"
                    onSubmitEditing={() => { if (!bloqueado()) novaSenhaRef.current?.focus(); }}
                  />
                  <View style={styles.senhaContainer}>
                    <TextInput
                      ref={novaSenhaRef}
                      caretHidden={false}
                      style={[styles.senhaInput, { fontFamily: fonteSenhaCarregada && !mostrarSenha ? 'AutocarSenhaOculta' : fonteSenhaVisivel }]}
                      placeholder="Nova senha"
                      placeholderTextColor={mostrarSenha ? '#777777' : 'transparent'}
                      accessibilityLabel="Nova senha, mínimo 6 caracteres"
                      value={novaSenha}
                      editable={!ocupado && fonteSenhaCarregada}
                      onChangeText={texto => { if (!bloqueado() && etapaCodigoRef.current && fonteSenhaCarregada) setNovaSenha(texto); }}
                      secureTextEntry={!mostrarSenha}
                      autoCapitalize="none"
                      autoCorrect={false}
                      autoComplete="new-password"
                      textContentType="newPassword"
                      returnKeyType="done"
                      onSubmitEditing={() => Keyboard.dismiss()}
                    />
                    {!mostrarSenha && !novaSenha && (
                      <View pointerEvents="none" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.senhaPlaceholderArea}>
                        <Text style={styles.senhaPlaceholderTexto}>Nova senha</Text>
                      </View>
                    )}
                    <TouchableOpacity
                      style={styles.olhoButton}
                      onPress={() => { if (!bloqueado()) setMostrarSenha(atual => !atual); }}
                      disabled={ocupado}
                      accessibilityRole="button"
                      accessibilityLabel={mostrarSenha ? 'Ocultar nova senha' : 'Mostrar nova senha'}
                      accessibilityState={{ disabled: ocupado }}
                      activeOpacity={0.7}
                    >
                      <Ionicons name={mostrarSenha ? 'eye-off-outline' : 'eye-outline'} size={23} color="#555555" />
                    </TouchableOpacity>
                  </View>
                </View>
                {erroFonteSenha && <Text style={styles.dicaTeclado}>Não foi possível carregar o campo de senha. Reabra o aplicativo.</Text>}
                <TouchableOpacity
                  style={[styles.recuperarButton, styles.botaoComIndicador, (ocupado || !fonteSenhaCarregada || !!erroFonteSenha) && styles.botaoDesabilitado]}
                  onPress={confirmarCodigo}
                  disabled={ocupado || !fonteSenhaCarregada || !!erroFonteSenha}
                  accessibilityRole="button"
                  accessibilityLabel={processando ? 'Salvando nova senha' : 'Alterar senha'}
                  accessibilityState={{ disabled: ocupado || !fonteSenhaCarregada || !!erroFonteSenha, busy: processando }}
                  activeOpacity={0.8}
                >
                  {processando && <ActivityIndicator size="small" color="#FFFFFF" />}
                  <Text style={styles.recuperarButtonText}>{processando ? 'SALVANDO...' : 'ALTERAR SENHA'}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.voltarEtapaButton, ocupado && styles.botaoDesabilitado]}
                  onPress={usarOutroEmail}
                  disabled={ocupado}
                  accessibilityRole="button"
                  accessibilityState={{ disabled: ocupado }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.voltarEtapaText}>Usar outro e-mail</Text>
                </TouchableOpacity>
              </>
            )}

            {tecladoAberto && (
              <Text style={styles.dicaTeclado}>
                {etapaCodigo ? 'Digite o código e toque em Alterar senha.' : 'Confira o e-mail e toque em Enviar código.'}
              </Text>
            )}
          </View>
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

    botaoDesabilitado: { opacity: 0.65 },
    botaoComIndicador: { flexDirection: 'row', gap: 8 },
    camposCodigo: { gap: 12 },
    emailSelecionado: { color: '#BBBBBB', fontSize: 14, textAlign: 'center', marginBottom: 14 },
    senhaContainer: { height: 52, backgroundColor: '#FFFFFF', borderRadius: 10, flexDirection: 'row', alignItems: 'center' },
    senhaInput: { flex: 1, height: '100%', paddingHorizontal: 16, color: '#111111', fontSize: 16 },
    senhaPlaceholderArea: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', paddingLeft: 16, paddingRight: 48 },
    senhaPlaceholderTexto: { color: '#777777', fontSize: 16 },
    olhoButton: { width: 48, height: '100%', alignItems: 'center', justifyContent: 'center' },
    voltarEtapaButton: { alignSelf: 'center', padding: 12 },
    voltarEtapaText: { color: '#BBBBBB', fontSize: 14, fontWeight: '600' },
  });
