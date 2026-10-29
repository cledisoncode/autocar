import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { RespostaLogin } from '@/services/api';
const chave = 'autocar.sessao.v1';
const autorizacao = 'autocar.sessao.autorizada.v1';
// Serializa gravação e remoção: um logout não pode ser desfeito pela gravação
// tardia de uma sessão anterior. A senha nunca é armazenada.
let fila: Promise<unknown> = Promise.resolve();
function executar<T>(acao: () => Promise<T>): Promise<T> {
  const p = fila.then(acao); fila = p.catch(() => undefined); return p;
}
export function salvarSessaoLocal(sessao: RespostaLogin) {
  return executar(async () => {
    await SecureStore.setItemAsync(chave, JSON.stringify({ token: sessao.token, usuario: sessao.usuario }));
    await AsyncStorage.setItem(autorizacao, 'ativa');
  });
}
export function apagarSessaoLocal() {
  return executar(async () => {
    // Mesmo se a exclusão segura falhar, o marcador bloqueia a restauração.
    try { await AsyncStorage.setItem(autorizacao, 'encerrada'); }
    finally { await SecureStore.deleteItemAsync(chave); }
  });
}
export function lerSessaoLocal() {
  return executar(async (): Promise<RespostaLogin | null> => {
    if (await AsyncStorage.getItem(autorizacao) !== 'ativa') return null;
    const texto = await SecureStore.getItemAsync(chave);
    if (!texto) return null;
    const s = JSON.parse(texto) as RespostaLogin;
    if (!s?.token || !Number.isInteger(s.usuario?.id) || s.usuario.id <= 0 || !s.usuario.email) return null;
    return s;
  });
}
