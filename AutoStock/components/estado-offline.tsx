import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppData } from '@/contexts/app-data-context';

// Conteúdo expansível do menu que já existe. Não cria rota nem outro Modal.
type AcaoPendencia =
  | { tipo: 'sincronizar' }
  | { tipo: 'confirmar-descarte'; id: number }
  | { tipo: 'descartar'; id: number };

export function EstadoOffline() {
  const { modoLocal, sincronizando, avisoLocal, pendencias, sincronizar, descartarPendente } = useAppData();
  const [expandido, setExpandido] = useState(false);
  const [acaoLocal, setAcaoLocal] = useState<AcaoPendencia | null>(null);
  const acaoRef = useRef<AcaoPendencia | null>(null);
  const contextoRef = useRef({ sincronizando, pendencias });
  contextoRef.current = { sincronizando, pendencias };
  const sincronizacaoEmAndamento = sincronizando || acaoLocal?.tipo === 'sincronizar';
  const ocupado = sincronizando || acaoLocal !== null;
  const descricao = sincronizacaoEmAndamento ? 'Sincronizando...' : pendencias.length > 0
    ? pendencias.some(p => p.estado === 'incerto' || p.estado === 'erro')
      ? 'Confira o estado dos envios.'
      : 'Salvos no celular. Aguardando envio.'
    : modoLocal ? 'Consultando dados deste celular' : 'Tudo atualizado';

  useEffect(() => () => { acaoRef.current = null; }, []);

  function iniciarAcao(acao: AcaoPendencia) {
    if (acaoRef.current || contextoRef.current.sincronizando) return false;
    acaoRef.current = acao;
    setAcaoLocal(acao);
    return true;
  }

  function concluirAcao(acao: AcaoPendencia) {
    if (acaoRef.current !== acao) return;
    acaoRef.current = null;
    setAcaoLocal(null);
  }

  // Permite desenhar o estado de espera antes da operação, sem temporizador.
  function mostrarEspera() {
    return new Promise<void>(resolver => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolver()));
    });
  }

  async function atualizar() {
    const acao: AcaoPendencia = { tipo: 'sincronizar' };
    if (!iniciarAcao(acao)) return;
    try {
      await mostrarEspera();
      if (acaoRef.current !== acao) return;
      await sincronizar();
    } catch {
      // O contexto mantém a mensagem existente no aviso de sincronização.
    } finally {
      concluirAcao(acao);
    }
  }

  async function executarDescarte(acao: { tipo: 'descartar'; id: number }) {
    try {
      await mostrarEspera();
      if (acaoRef.current !== acao) return;
      const pendencia = contextoRef.current.pendencias.find(p => p.id === acao.id);
      if (contextoRef.current.sincronizando || !pendencia || pendencia.estado === 'enviando') {
        throw new Error('Esta pendência já começou a ser enviada ou já foi processada. Confira o histórico atualizado.');
      }
      await descartarPendente(acao.id);
    } catch (erro) {
      if (acaoRef.current === acao) {
        Alert.alert('Não foi possível descartar', erro instanceof Error ? erro.message : 'Tente novamente.');
      }
    } finally {
      concluirAcao(acao);
    }
  }

  function descartar(id: number) {
    const pendencia = contextoRef.current.pendencias.find(p => p.id === id);
    if (!pendencia || pendencia.estado === 'enviando') return;
    const confirmacao: AcaoPendencia = { tipo: 'confirmar-descarte', id };
    if (!iniciarAcao(confirmacao)) return;
    try {
      Alert.alert('Descartar pendência?', 'Apenas esta pendência será removida do celular.', [
        { text: 'Cancelar', style: 'cancel', onPress: () => concluirAcao(confirmacao) },
        { text: 'Descartar', style: 'destructive', onPress: () => {
          if (acaoRef.current !== confirmacao) return;
          const acao: AcaoPendencia = { tipo: 'descartar', id };
          acaoRef.current = acao;
          setAcaoLocal(acao);
          void executarDescarte(acao);
        } },
      ], { onDismiss: () => concluirAcao(confirmacao) });
    } catch (erro) {
      concluirAcao(confirmacao);
      throw erro;
    }
  }

  return <View style={[styles.grupo, expandido && styles.grupoExpandido]}>
    <TouchableOpacity style={styles.itemMenu} onPress={() => setExpandido(atual => !atual)}
      accessibilityRole="button" accessibilityLabel={`Pendências. ${descricao}`}
      accessibilityState={{ expanded: expandido }}>
      <Ionicons name="cloud-upload-outline" size={22} color="#F5BE61" />
      <View style={styles.rotulo}>
        <Text style={styles.titulo}>Pendências</Text>
        <Text style={styles.subtitulo}>{descricao}</Text>
      </View>
      {pendencias.length > 0 && <View style={styles.contador}><Text style={styles.contadorTexto}>{pendencias.length > 99 ? '99+' : pendencias.length}</Text></View>}
      <Ionicons name={expandido ? 'chevron-up' : 'chevron-down'} size={16} color="#F5BE61" />
    </TouchableOpacity>
    {expandido && <View style={styles.conteudo}>
      {avisoLocal && <Text style={styles.aviso} accessibilityLiveRegion="polite">{avisoLocal}</Text>}
      {pendencias.map(p => <View style={styles.cartao} key={p.id}>
        <View style={styles.topoCartao}>
          <Text style={styles.nome}>{p.dados.nome}</Text>
          <Text style={styles.valor}>R$ {p.dados.valor.toFixed(2).replace('.', ',')}</Text>
        </View>
        <Text style={styles.mensagem}>{p.dados.servico}</Text>
        <Text style={styles.mensagem}>{p.dados.carro} · {p.dados.placa}</Text>
        <Text style={styles.mensagem}>{p.dados.data} às {p.dados.horario}</Text>
        <Text style={styles.estado}>{p.estado === 'pendente' ? 'Salvo no celular. Aguardando envio.' : p.estado === 'enviando' ? 'Enviando ao servidor...' : p.estado === 'incerto' ? 'Envio sem confirmação. Confira o histórico atualizado antes de cadastrar novamente. Não será reenviado automaticamente.' : 'Envio rejeitado. Confira a mensagem antes de corrigir o cadastro.'}</Text>
        {p.mensagem && <Text style={styles.mensagem}>{p.mensagem}</Text>}
        {p.estado !== 'enviando' && <Pressable
          style={({ pressed }) => [styles.acaoPendencia, styles.botaoDescartar, (ocupado || pressed) && styles.desabilitado]}
          onPress={() => descartar(p.id)} disabled={ocupado}
          accessibilityRole="button" accessibilityLabel={`Descartar pendência local de ${p.dados.nome}`}
          accessibilityState={{ disabled: ocupado, busy: acaoLocal?.tipo === 'descartar' && acaoLocal.id === p.id }}>
          {acaoLocal?.tipo === 'descartar' && acaoLocal.id === p.id && <ActivityIndicator size="small" color="#FFFFFF" />}
          <Text style={[styles.botaoTexto, styles.descartar]}>{acaoLocal?.tipo === 'descartar' && acaoLocal.id === p.id ? 'Descartando...' : 'Descartar pendência'}</Text>
        </Pressable>}
      </View>)}
      {pendencias.length === 0 && <Text style={styles.mensagem}>Nenhum atendimento pendente.</Text>}
      <TouchableOpacity style={[styles.acaoPendencia, styles.sincronizar, ocupado && styles.desabilitado]} onPress={atualizar} disabled={ocupado} activeOpacity={0.65}
        accessibilityRole="button" accessibilityState={{ disabled: ocupado, busy: sincronizacaoEmAndamento }} accessibilityLabel="Atualizar dados e sincronizar atendimentos pendentes">
        {sincronizacaoEmAndamento && <ActivityIndicator size="small" color="#171717" />}
        <Text style={styles.botaoTexto}>{sincronizacaoEmAndamento ? 'SINCRONIZANDO...' : 'SINCRONIZAR'}</Text>
      </TouchableOpacity>
    </View>}
  </View>;
}

const styles = StyleSheet.create({
  grupo: { borderRadius: 10, marginVertical: 4 },
  grupoExpandido: { backgroundColor: '#292218' },
  itemMenu: { minHeight: 54, paddingHorizontal: 8, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 8 },
  rotulo: { flex: 1, minWidth: 0, gap: 3 },
  titulo: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  subtitulo: { color: '#F5BE61', fontSize: 11, lineHeight: 15, fontWeight: '600' },
  contador: { backgroundColor: '#F5BE61', minWidth: 24, height: 24, paddingHorizontal: 5, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  contadorTexto: { color: '#171717', fontSize: 12, fontWeight: 'bold' },
  conteudo: { paddingHorizontal: 8, paddingBottom: 10, gap: 8 },
  mensagem: { color: '#CCCCCC', fontSize: 12, lineHeight: 16 },
  aviso: { color: '#F5BE61', fontSize: 12, lineHeight: 18 },
  cartao: { backgroundColor: '#202020', padding: 8, borderRadius: 9, gap: 3 },
  topoCartao: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  nome: { color: '#FFFFFF', fontSize: 14, fontWeight: 'bold', flex: 1, minWidth: 0 },
  valor: { color: '#FFFFFF', fontSize: 14, fontWeight: 'bold', textAlign: 'right' },
  estado: { color: '#F5BE61', fontSize: 12, lineHeight: 16 },
  acaoPendencia: { borderRadius: 8, minHeight: 44, paddingVertical: 8, paddingHorizontal: 8, flexDirection: 'row', gap: 7, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', alignContent: 'center' },
  botaoDescartar: { backgroundColor: '#E53935' },
  descartar: { color: '#FFFFFF' },
  sincronizar: { backgroundColor: '#F5BE61', marginHorizontal: 8 },
  botaoTexto: { color: '#171717', fontSize: 12, fontWeight: 'bold', textAlign: 'center' },
  desabilitado: { opacity: 0.6 },
});