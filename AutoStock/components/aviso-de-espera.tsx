import { useEffect, useState } from 'react';
import { StyleSheet, Text } from 'react-native';

export function AvisoDeEspera({ ativo }: { ativo: boolean }) {
  const [demorando, setDemorando] = useState(false);
  useEffect(() => {
    setDemorando(false);
    if (!ativo) return;
    const tempo = setTimeout(() => setDemorando(true), 8000);
    return () => clearTimeout(tempo);
  }, [ativo]);
  if (!ativo || !demorando) return null;
  return <Text style={styles.texto} accessibilityLiveRegion="polite">Ainda aguardamos a confirmação da operação.</Text>;
}

const styles = StyleSheet.create({
  texto: { color: '#BBBBBB', textAlign: 'center', fontSize: 14, lineHeight: 20, marginVertical: 12 },
});
