import { useState } from 'react';

import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { AppHeader } from '@/components/app-header';

import {
  type CompraProduto,
  useAppData,
} from '@/contexts/app-data-context';

export default function RelatoriosScreen() {
  const agora =
    new Date();

  const [
    mesReferencia,
    setMesReferencia,
  ] = useState(
    new Date(
      agora.getFullYear(),
      agora.getMonth(),
      1
    )
  );

  const {
    atendimentos,
    produtos,
  } = useAppData();

  function converterData(
    dataTexto: string
  ): Date | null {
    const partes =
      dataTexto.split('/');

    if (
      partes.length !== 3
    ) {
      return null;
    }

    const dia =
      Number(partes[0]);

    const mes =
      Number(partes[1]);

    const ano =
      Number(partes[2]);

    const data =
      new Date(
        ano,
        mes - 1,
        dia
      );

    if (
      data.getFullYear() !== ano ||
      data.getMonth() !==
        mes - 1 ||
      data.getDate() !== dia
    ) {
      return null;
    }

    data.setHours(
      0,
      0,
      0,
      0
    );

    return data;
  }

  function mesmoMes(
    data: Date
  ) {
    return (
      data.getMonth() ===
        mesReferencia.getMonth() &&
      data.getFullYear() ===
        mesReferencia.getFullYear()
    );
  }

  function valorAtendimento(
    atendimento: {
      valor?: number;
      valorFinal?: number;
    }
  ) {
    const valor =
      Number(
        atendimento.valor
      );

    if (
      Number.isFinite(valor)
    ) {
      return valor;
    }

    return Number(
      atendimento.valorFinal
    ) || 0;
  }

  function valorCompra(
    compra: CompraProduto
  ) {
    return (
      Number(compra.valor) ||
      0
    );
  }

  const entradas =
    atendimentos
      .filter(
        (atendimento) => {
          const data =
            converterData(
              atendimento.data
            );

          return (
            data !== null &&
            mesmoMes(data)
          );
        }
      )
      .reduce(
        (
          total,
          atendimento
        ) =>
          total +
          valorAtendimento(
            atendimento
          ),
        0
      );

  const compras =
    produtos.flatMap(
      (produto) =>
        produto.compras
    );

  const despesas =
    compras
      .filter(
        (compra) => {
          const data =
            converterData(
              compra.dataCompra
            );

          return (
            data !== null &&
            mesmoMes(data)
          );
        }
      )
      .reduce(
        (
          total,
          compra
        ) =>
          total +
          valorCompra(compra),
        0
      );

  const saldo =
    entradas - despesas;

  function formatarValor(
    valor: number
  ) {
    return valor
      .toFixed(2)
      .replace('.', ',');
  }

  const nomesMeses = [
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro',
  ];

  function mesAnterior() {
    setMesReferencia(
      new Date(
        mesReferencia.getFullYear(),
        mesReferencia.getMonth() -
          1,
        1
      )
    );
  }

  function proximoMes() {
    setMesReferencia(
      new Date(
        mesReferencia.getFullYear(),
        mesReferencia.getMonth() +
          1,
        1
      )
    );
  }

  return (
    <ScrollView
      style={
        styles.container
      }
      contentContainerStyle={
        styles.content
      }
    >
      <AppHeader />

      <Text
        style={
          styles.titulo
        }
      >
        Histórico financeiro
      </Text>

      <View
        style={
          styles.navegacaoMes
        }
      >
        <TouchableOpacity
          style={
            styles.setaButton
          }
          onPress={
            mesAnterior
          }
        >
          <Text
            style={styles.seta}
          >
            ‹
          </Text>
        </TouchableOpacity>

        <Text
          style={
            styles.mesTexto
          }
        >
          {
            nomesMeses[
              mesReferencia.getMonth()
            ]
          }{' '}
          {mesReferencia.getFullYear()}
        </Text>

        <TouchableOpacity
          style={
            styles.setaButton
          }
          onPress={
            proximoMes
          }
        >
          <Text
            style={styles.seta}
          >
            ›
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text
          style={
            styles.cardLabel
          }
        >
          Entradas
        </Text>

        <Text
          style={
            styles.cardValor
          }
        >
          R${' '}
          {formatarValor(
            entradas
          )}
        </Text>
      </View>

      <View style={styles.card}>
        <Text
          style={
            styles.cardLabel
          }
        >
          Despesas
        </Text>

        <Text
          style={
            styles.cardValor
          }
        >
          R${' '}
          {formatarValor(
            despesas
          )}
        </Text>
      </View>

      <View
        style={
          styles.saldoCard
        }
      >
        <Text
          style={
            styles.cardLabel
          }
        >
          Saldo
        </Text>

        <Text
          style={[
            styles.saldoValor,

            saldo < 0 &&
              styles.saldoNegativo,
          ]}
        >
          R${' '}
          {formatarValor(
            saldo
          )}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor:
        '#000000',
    },

    content: {
      paddingHorizontal: 20,
      paddingTop: 50,
      paddingBottom: 50,
    },

    titulo: {
      color: '#FFFFFF',
      fontSize: 20,
      fontWeight: '800',
      marginBottom: 18,
    },

    navegacaoMes: {
      height: 58,
      backgroundColor:
        '#1E1E1E',
      borderWidth: 1,
      borderColor:
        '#333333',
      borderRadius: 10,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'space-between',
      marginBottom: 18,
    },

    setaButton: {
      width: 60,
      height: '100%',
      alignItems: 'center',
      justifyContent:
        'center',
    },

    seta: {
      color: '#E53935',
      fontSize: 35,
    },

    mesTexto: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '700',
    },

    card: {
      backgroundColor:
        '#1E1E1E',
      borderWidth: 1,
      borderColor:
        '#333333',
      borderRadius: 12,
      padding: 18,
      marginBottom: 14,
    },

    saldoCard: {
      backgroundColor:
        '#1E1E1E',
      borderWidth: 1,
      borderColor:
        '#E53935',
      borderRadius: 12,
      padding: 18,
    },

    cardLabel: {
      color: '#BBBBBB',
      fontSize: 16,
      fontWeight: '600',
    },

    cardValor: {
      color: '#FFFFFF',
      fontSize: 28,
      fontWeight: '800',
      marginTop: 7,
    },

    saldoValor: {
      color: '#FFFFFF',
      fontSize: 30,
      fontWeight: '800',
      marginTop: 7,
    },

    saldoNegativo: {
      color: '#E53935',
    },
  });