import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useRef, useState } from 'react';

// Cada conta e preferência têm sua própria chave. Não guarda credenciais.
export function usePreferencia<T extends string>(chave: string, inicial: T, opcoes: readonly T[]) {
  const [valor, setValor] = useState<T>(inicial);
  const referencia = useRef({ chave, revisao: 0 });
  const fila = useRef<Promise<unknown>>(Promise.resolve());
  useEffect(() => {
    let ativo = true;
    const controle = { chave, revisao: 0 };
    referencia.current = controle;
    setValor(inicial);
    void AsyncStorage.getItem(chave).then(salvo => {
      if (ativo && controle.revisao === 0 && salvo !== null && opcoes.includes(salvo as T)) setValor(salvo as T);
    }).catch(() => { /* A preferência não impede usar o app. */ });
    return () => { ativo = false; };
    // As opções são constantes do domínio, não dependências de renderização.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chave, inicial]);
  function alterar(proximo: T) {
    referencia.current.revisao += 1;
    setValor(proximo);
    fila.current = fila.current.catch(() => undefined).then(() => AsyncStorage.setItem(chave, proximo)).catch(() => undefined);
  }
  return [valor, alterar] as const;
}
