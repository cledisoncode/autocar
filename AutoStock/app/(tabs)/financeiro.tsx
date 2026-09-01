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

type Periodo =
  | 'hoje'
  | 'mes';

export default function FinanceiroScreen() {
  const [periodo, setPeriodo] =
    useState<Periodo>('hoje');

  const agora = new Date();

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
    if (!dataTexto) {
      return null;
    }

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

    if (
      !Number.isFinite(dia) ||
      !Number.isFinite(mes) ||
      !Number.isFinite(ano)
    ) {
      return null;
    }

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

  function mesmoDia(
    data1: Date,
    data2: Date
  ) {
    return (
      data1.getDate() ===
        data2.getDate() &&
      data1.getMonth() ===
        data2.getMonth() &&
      data1.getFullYear() ===
        data2.getFullYear()
    );
  }

  function mesmoMes(
    data1: Date,
    data2: Date
  ) {
    return (
      data1.getMonth() ===
        data2.getMonth() &&
      data1.getFullYear() ===
        data2.getFullYear()
    );
  }

  function dataNoPeriodo(
    dataTexto: string
  ) {
    const data =
      converterData(
        dataTexto
      );

    if (!data) {
      return false;
    }

    const hoje =
      new Date();

    hoje.setHours(
      0,
      0,
      0,
      0
    );

    if (
      periodo === 'hoje'
    ) {
      return mesmoDia(
        data,
        hoje
      );
    }

    return mesmoMes(
      data,
      mesReferencia
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

    return (
      Number(
        atendimento.valorFinal
      ) || 0
    );
  }

  function valorCompra(
    compra: CompraProduto
  ) {
    const valor =
      Number(compra.valor);

    return Number.isFinite(
      valor
    )
      ? valor
      : 0;
  }

  const compras =
    produtos.flatMap(
      (produto) =>
        produto.compras
    );

  const entradas =
    atendimentos
      .filter(
        (atendimento) =>
          dataNoPeriodo(
            atendimento.data
          )
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

  const despesas =
    compras
      .filter(
        (compra) =>
          dataNoPeriodo(
            compra.dataCompra
          )
      )
      .reduce(
        (
          total,
          compra
        ) =>
          total +
          valorCompra(
            compra
          ),
        0
      );

  const lucro =
    entradas - despesas;

  const maiorValor =
    Math.max(
      entradas,
      despesas,
      Math.max(
        lucro,
        0
      ),
      1
    );

  function alturaBarra(
    valor: number
  ) {
    if (valor <= 0) {
      return 4;
    }

    return Math.max(
      (
        valor /
        maiorValor
      ) * 120,
      4
    );
  }

  function formatarValor(
    valor: number
  ) {
    if (
      !Number.isFinite(valor)
    ) {
      return '0,00';
    }

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

      <View
        style={
          styles.filtros
        }
      >
        <TouchableOpacity
          style={[
            styles.filtroButton,
            periodo ===
              'hoje' &&
              styles.filtroAtivo,
          ]}
          onPress={() =>
            setPeriodo(
              'hoje'
            )
          }
        >
          <Text
            style={[
              styles.filtroText,
              periodo ===
                'hoje' &&
                styles.filtroTextAtivo,
            ]}
          >
            Hoje
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filtroButton,
            periodo ===
              'mes' &&
              styles.filtroAtivo,
          ]}
          onPress={() =>
            setPeriodo(
              'mes'
            )
          }
        >
          <Text
            style={[
              styles.filtroText,
              periodo ===
                'mes' &&
                styles.filtroTextAtivo,
            ]}
          >
            Mês
          </Text>
        </TouchableOpacity>
      </View>

      {periodo === 'mes' && (
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
              style={
                styles.seta
              }
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
              style={
                styles.seta
              }
            >
              ›
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.card}>
        <Text
          style={
            styles.cardLabel
          }
        >
          Entradas
        </Text>

        <Text
          style={styles.valor}
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
          style={styles.valor}
        >
          R${' '}
          {formatarValor(
            despesas
          )}
        </Text>
      </View>

      <View
        style={
          styles.lucroCard
        }
      >
        <Text
          style={
            styles.lucroLabel
          }
        >
          Lucro
        </Text>

        <Text
          style={[
            styles.lucroValor,
            lucro < 0 &&
              styles.lucroNegativo,
          ]}
        >
          R${' '}
          {formatarValor(
            lucro
          )}
        </Text>
      </View>

      <View
        style={
          styles.graficoCard
        }
      >
        <View
          style={
            styles.grafico
          }
        >
          <View
            style={styles.coluna}
          >
            <Text
              style={
                styles.valorGrafico
              }
            >
              R${' '}
              {formatarValor(
                entradas
              )}
            </Text>

            <View
              style={
                styles.areaBarra
              }
            >
              <View
                style={[
                  styles.barraReceita,
                  {
                    height:
                      alturaBarra(
                        entradas
                      ),
                  },
                ]}
              />
            </View>

            <Text
              style={
                styles.nomeBarra
              }
            >
              Receita
            </Text>
          </View>

          <View
            style={styles.coluna}
          >
            <Text
              style={
                styles.valorGrafico
              }
            >
              R${' '}
              {formatarValor(
                despesas
              )}
            </Text>

            <View
              style={
                styles.areaBarra
              }
            >
              <View
                style={[
                  styles.barraDespesa,
                  {
                    height:
                      alturaBarra(
                        despesas
                      ),
                  },
                ]}
              />
            </View>

            <Text
              style={
                styles.nomeBarra
              }
            >
              Despesa
            </Text>
          </View>

          <View
            style={styles.coluna}
          >
            <Text
              style={
                styles.valorGrafico
              }
            >
              R${' '}
              {formatarValor(
                lucro
              )}
            </Text>

            <View
              style={
                styles.areaBarra
              }
            >
              <View
                style={[
                  styles.barraLucro,
                  {
                    height:
                      alturaBarra(
                        Math.max(
                          lucro,
                          0
                        )
                      ),
                  },
                ]}
              />
            </View>

            <Text
              style={
                styles.nomeBarra
              }
            >
              Lucro
            </Text>
          </View>
        </View>
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

    filtros: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 15,
    },

    filtroButton: {
      flex: 1,
      height: 44,
      backgroundColor:
        '#1E1E1E',
      borderWidth: 1,
      borderColor:
        '#444444',
      borderRadius: 9,
      alignItems: 'center',
      justifyContent:
        'center',
    },

    filtroAtivo: {
      backgroundColor:
        '#E53935',
      borderColor:
        '#E53935',
    },

    filtroText: {
      color: '#AAAAAA',
      fontWeight: '700',
    },

    filtroTextAtivo: {
      color: '#FFFFFF',
    },

    navegacaoMes: {
      height: 55,
      backgroundColor:
        '#1E1E1E',
      borderRadius: 10,
      borderWidth: 1,
      borderColor:
        '#333333',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'space-between',
      marginBottom: 15,
    },

    setaButton: {
      width: 55,
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
      marginBottom: 15,
    },

    cardLabel: {
      color: '#BBBBBB',
      fontSize: 16,
      fontWeight: '600',
    },

    valor: {
      color: '#FFFFFF',
      fontSize: 28,
      fontWeight: '800',
      marginTop: 7,
    },

    lucroCard: {
      backgroundColor:
        '#1E1E1E',
      borderWidth: 1,
      borderColor:
        '#E53935',
      borderRadius: 12,
      padding: 18,
      marginBottom: 15,
    },

    lucroLabel: {
      color: '#FFFFFF',
      fontWeight: '700',
    },

    lucroValor: {
      color: '#FFFFFF',
      fontSize: 30,
      fontWeight: '800',
      marginTop: 7,
    },

    lucroNegativo: {
      color: '#E53935',
    },

    graficoCard: {
      backgroundColor:
        '#1E1E1E',
      borderWidth: 1,
      borderColor:
        '#333333',
      borderRadius: 12,
      padding: 18,
    },

    grafico: {
      height: 190,
      flexDirection: 'row',
      alignItems: 'flex-end',
      marginTop: 0,
    },

    coluna: {
      flex: 1,
      alignItems: 'center',
    },

    valorGrafico: {
      color: '#BBBBBB',
      fontSize: 11,
      marginBottom: 5,
    },

    areaBarra: {
      height: 125,
      width: 45,
      justifyContent:
        'flex-end',
    },

    barraReceita: {
      width: '100%',
      backgroundColor:
        '#FFFFFF',
      borderRadius: 6,
    },

    barraDespesa: {
      width: '100%',
      backgroundColor:
        '#E53935',
      borderRadius: 6,
    },

    barraLucro: {
      width: '100%',
      backgroundColor:
        '#888888',
      borderRadius: 6,
    },

    nomeBarra: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '600',
      marginTop: 8,
    },
  });