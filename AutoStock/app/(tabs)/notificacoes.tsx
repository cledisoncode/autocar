import {
  Ionicons,
} from '@expo/vector-icons';

import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  AppHeader,
} from '@/components/app-header';

import {
  type CompraProduto,
  type Produto,
  useAppData,
} from '@/contexts/app-data-context';

type SituacaoVencimento =
  | 'valido'
  | 'proximo'
  | 'vencido';

type AlertaProduto = {
  produto: Produto;
  quantidadeDisponivel: number;
  estoqueBaixo: boolean;
  comprasProximas: CompraProduto[];
  comprasVencidas: CompraProduto[];
  produtoVencido: boolean;
};

export default function NotificacoesScreen() {
  const {
    produtos,
  } = useAppData();

  function converterData(
    dataTexto: string
  ): Date | null {
    if (!dataTexto) {
      return null;
    }

    if (
      dataTexto.includes('/')
    ) {
      const partes =
        dataTexto.split('/');

      if (
        partes.length !== 3
      ) {
        return null;
      }

      const dia =
        Number(
          partes[0]
        );

      const mes =
        Number(
          partes[1]
        );

      const ano =
        Number(
          partes[2]
        );

      if (
        !Number.isFinite(
          dia
        ) ||
        !Number.isFinite(
          mes
        ) ||
        !Number.isFinite(
          ano
        )
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
        data.getFullYear() !==
          ano ||
        data.getMonth() !==
          mes - 1 ||
        data.getDate() !==
          dia
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

    if (
      dataTexto.includes('-')
    ) {
      const partes =
        dataTexto.split('-');

      if (
        partes.length !== 3
      ) {
        return null;
      }

      const ano =
        Number(
          partes[0]
        );

      const mes =
        Number(
          partes[1]
        );

      const dia =
        Number(
          partes[2]
        );

      if (
        !Number.isFinite(
          dia
        ) ||
        !Number.isFinite(
          mes
        ) ||
        !Number.isFinite(
          ano
        )
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
        data.getFullYear() !==
          ano ||
        data.getMonth() !==
          mes - 1 ||
        data.getDate() !==
          dia
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

    return null;
  }

  function situacaoVencimento(
    dataTexto: string | null
  ): SituacaoVencimento | null {
    if (!dataTexto) {
      return null;
    }

    const vencimento =
      converterData(
        dataTexto
      );

    if (!vencimento) {
      return null;
    }

    const hoje =
      new Date();

    hoje.setHours(
      0,
      0,
      0,
      0
    );

    const diferenca =
      vencimento.getTime() -
      hoje.getTime();

    const dias =
      Math.ceil(
        diferenca /
          (
            1000 *
            60 *
            60 *
            24
          )
      );

    /*
      No próprio dia do vencimento
      o produto ainda é válido.

      A partir do dia seguinte
      passa a ser vencido.
    */
    if (
      dias < 0
    ) {
      return 'vencido';
    }

    if (
      dias <= 30
    ) {
      return 'proximo';
    }

    return 'valido';
  }

  function quantidadeDisponivel(
    produto: Produto
  ) {
    return produto.compras
      .filter(
        (compra) =>
          situacaoVencimento(
            compra.dataVencimento
          ) !== 'vencido'
      )
      .reduce(
        (
          total,
          compra
        ) => {
          const quantidade =
            Number(
              compra.quantidade
            );

          if (
            !Number.isFinite(
              quantidade
            )
          ) {
            return total;
          }

          return (
            total +
            quantidade
          );
        },
        0
      );
  }

  function diasAteVencimento(
    dataTexto: string
  ) {
    const vencimento =
      converterData(
        dataTexto
      );

    if (!vencimento) {
      return null;
    }

    const hoje =
      new Date();

    hoje.setHours(
      0,
      0,
      0,
      0
    );

    const diferenca =
      vencimento.getTime() -
      hoje.getTime();

    return Math.ceil(
      diferenca /
        (
          1000 *
          60 *
          60 *
          24
        )
    );
  }

  function textoProximoVencimento(
    dataTexto: string
  ) {
    const dias =
      diasAteVencimento(
        dataTexto
      );

    if (
      dias === null
    ) {
      return 'Próximo do vencimento';
    }

    if (
      dias === 0
    ) {
      return 'Vence hoje';
    }

    if (
      dias === 1
    ) {
      return 'Vence amanhã';
    }

    return `Vence em ${dias} dias`;
  }

  const alertas:
    AlertaProduto[] =
    produtos
      .map(
        (produto) => {
          const disponivel =
            quantidadeDisponivel(
              produto
            );

          const comprasProximas =
            produto.compras.filter(
              (compra) =>
                situacaoVencimento(
                  compra.dataVencimento
                ) === 'proximo'
            );

          /*
            Agora mantemos novamente
            as compras vencidas
            separadamente.

            Assim uma compra antiga
            vencida continua aparecendo
            nas Notificações mesmo que
            existam outras unidades
            válidas do produto.
          */
          const comprasVencidas =
            produto.compras.filter(
              (compra) =>
                situacaoVencimento(
                  compra.dataVencimento
                ) === 'vencido'
            );

          /*
            O PRODUTO inteiro só está
            vencido quando:

            - existe compra vencida;
            - e não sobra nenhuma
              unidade válida.
          */
          const produtoVencido =
            comprasVencidas.length >
              0 &&
            disponivel === 0;

          return {
            produto,

            quantidadeDisponivel:
              disponivel,

            /*
              Produto totalmente vencido
              não entra também como
              estoque baixo.
            */
            estoqueBaixo:
              !produtoVencido &&
              disponivel <= 2,

            /*
              Se tudo venceu,
              VENCIDO terá prioridade
              visual e aparecerá sozinho.
            */
            comprasProximas:
              produtoVencido
                ? []
                : comprasProximas,

            comprasVencidas,

            produtoVencido,
          };
        }
      )
      .filter(
        (alerta) =>
          alerta.produtoVencido ||
          alerta.estoqueBaixo ||
          alerta.comprasProximas
            .length > 0 ||
          alerta.comprasVencidas
            .length > 0
      );

  /*
    Cada número representa
    quantidade de PRODUTOS
    com aquela situação.

    Uma Cera com duas compras
    vencidas conta como 1
    em "Vencidos".
  */
  const quantidadeEstoqueBaixo =
    alertas.filter(
      (alerta) =>
        alerta.estoqueBaixo
    ).length;

  const quantidadeProximos =
    alertas.filter(
      (alerta) =>
        alerta.comprasProximas
          .length > 0
    ).length;

  const quantidadeVencidos =
    alertas.filter(
      (alerta) =>
        alerta.comprasVencidas
          .length > 0
    ).length;

  const possuiAlertas =
    alertas.length > 0;

  return (
    <ScrollView
      style={
        styles.container
      }
      contentContainerStyle={
        styles.content
      }
      showsVerticalScrollIndicator={
        false
      }
    >
      <AppHeader />

      <View
        style={
          styles.tituloArea
        }
      >
        <View
          style={
            styles.tituloIcone
          }
        >
          <Ionicons
            name="notifications"
            size={24}
            color="#FFFFFF"
          />
        </View>

        <View
          style={
            styles.tituloTextos
          }
        >
          <Text
            style={
              styles.titulo
            }
          >
            Notificações
          </Text>

          <Text
            style={
              styles.subtitulo
            }
          >
            Alertas do estoque
          </Text>
        </View>
      </View>

      <View
        style={
          styles.resumoLinha
        }
      >
        <View
          style={
            styles.resumoCard
          }
        >
          <Text
            style={
              styles.resumoNumero
            }
          >
            {
              quantidadeEstoqueBaixo
            }
          </Text>

          <Text
            style={
              styles.resumoTexto
            }
          >
            Estoque baixo
          </Text>
        </View>

        <View
          style={
            styles.resumoCard
          }
        >
          <Text
            style={
              styles.resumoNumero
            }
          >
            {
              quantidadeProximos
            }
          </Text>

          <Text
            style={
              styles.resumoTexto
            }
          >
            Próx. venc.
          </Text>
        </View>

        <View
          style={
            styles.resumoCard
          }
        >
          <Text
            style={
              styles.resumoNumero
            }
          >
            {
              quantidadeVencidos
            }
          </Text>

          <Text
            style={
              styles.resumoTexto
            }
          >
            Vencidos
          </Text>
        </View>
      </View>

      {!possuiAlertas ? (
        <View
          style={
            styles.semAlertasCard
          }
        >
          <View
            style={
              styles.semAlertasIcone
            }
          >
            <Ionicons
              name="checkmark-circle-outline"
              size={38}
              color="#AAAAAA"
            />
          </View>

          <Text
            style={
              styles.semAlertasTitulo
            }
          >
            Nenhuma notificação
          </Text>

          <Text
            style={
              styles.semAlertasTexto
            }
          >
            Não há alertas de estoque ou vencimento no momento.
          </Text>
        </View>
      ) : (
        <>
          <Text
            style={
              styles.listaTitulo
            }
          >
            Alertas
          </Text>

          {alertas.map(
            (alerta) => (
              <View
                key={
                  alerta.produto.id
                }
                style={
                  styles.produtoCard
                }
              >
                <View
                  style={
                    styles.produtoTopo
                  }
                >
                  <View
                    style={
                      styles.produtoIcone
                    }
                  >
                    <Ionicons
                      name="cube-outline"
                      size={24}
                      color="#FFFFFF"
                    />
                  </View>

                  <View
                    style={
                      styles.produtoInfo
                    }
                  >
                    <Text
                      style={
                        styles.produtoNome
                      }
                    >
                      {
                        alerta.produto
                          .nome
                      }
                    </Text>

                    <Text
                      style={
                        styles.produtoCategoria
                      }
                    >
                      {
                        alerta.produto
                          .categoria
                      }
                    </Text>
                  </View>

                  <View
                    style={
                      styles.quantidadeArea
                    }
                  >
                    <Text
                      style={
                        styles.quantidadeLabel
                      }
                    >
                      Qtd.
                    </Text>

                    <Text
                      style={
                        styles.quantidadeNumero
                      }
                    >
                      {
                        alerta.quantidadeDisponivel
                      }
                    </Text>
                  </View>
                </View>

                <View
                  style={
                    styles.divisor
                  }
                />

                {/*
                  CASO 1:

                  Se o produto inteiro
                  estiver vencido,
                  mostramos somente
                  VENCIDO.
                */}
                {alerta.produtoVencido ? (
                  <View
                    style={
                      styles.alertaLinha
                    }
                  >
                    <View
                      style={[
                        styles.alertaIcone,
                        styles.alertaIconeVermelhoEscuro,
                      ]}
                    >
                      <Ionicons
                        name="close-circle"
                        size={20}
                        color="#FFFFFF"
                      />
                    </View>

                    <View
                      style={
                        styles.alertaInfo
                      }
                    >
                      <Text
                        style={
                          styles.alertaTitulo
                        }
                      >
                        Produto vencido
                      </Text>

                      <Text
                        style={
                          styles.alertaDescricao
                        }
                      >
                        Não há unidades válidas disponíveis.
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.badge,
                        styles.badgeVencido,
                      ]}
                    >
                      <Text
                        style={
                          styles.badgeTexto
                        }
                      >
                        VENCIDO
                      </Text>
                    </View>
                  </View>
                ) : (
                  <>
                    {/*
                      CASO 2:

                      Ainda existem
                      unidades válidas.

                      Nesse caso os
                      alertas podem
                      coexistir.
                    */}

                    {alerta.estoqueBaixo && (
                      <View
                        style={
                          styles.alertaLinha
                        }
                      >
                        <View
                          style={[
                            styles.alertaIcone,
                            styles.alertaIconeVermelho,
                          ]}
                        >
                          <Ionicons
                            name="alert-circle"
                            size={20}
                            color="#FFFFFF"
                          />
                        </View>

                        <View
                          style={
                            styles.alertaInfo
                          }
                        >
                          <Text
                            style={
                              styles.alertaTitulo
                            }
                          >
                            Estoque baixo
                          </Text>

                          <Text
                            style={
                              styles.alertaDescricao
                            }
                          >
                            Restam{' '}
                            {
                              alerta.quantidadeDisponivel
                            }{' '}
                            unidade(s) disponível(is).
                          </Text>
                        </View>

                        <View
                          style={[
                            styles.badge,
                            styles.badgeBaixo,
                          ]}
                        >
                          <Text
                            style={
                              styles.badgeTexto
                            }
                          >
                            BAIXO
                          </Text>
                        </View>
                      </View>
                    )}

                    {alerta.comprasProximas.map(
                      (compra) => (
                        <View
                          key={
                            `proximo-${compra.id}`
                          }
                          style={
                            styles.alertaLinha
                          }
                        >
                          <View
                            style={[
                              styles.alertaIcone,
                              styles.alertaIconeLaranja,
                            ]}
                          >
                            <Ionicons
                              name="time-outline"
                              size={20}
                              color="#FFFFFF"
                            />
                          </View>

                          <View
                            style={
                              styles.alertaInfo
                            }
                          >
                            <Text
                              style={
                                styles.alertaTitulo
                              }
                            >
                              {
                                textoProximoVencimento(
                                  compra.dataVencimento!
                                )
                              }
                            </Text>

                            <Text
                              style={
                                styles.alertaDescricao
                              }
                            >
                              Vencimento:{' '}
                              {
                                compra.dataVencimento
                              }
                              {'  •  '}
                              Qtd.{' '}
                              {
                                compra.quantidade
                              }
                            </Text>
                          </View>

                          <View
                            style={[
                              styles.badge,
                              styles.badgeProximo,
                            ]}
                          >
                            <Text
                              style={
                                styles.badgeTexto
                              }
                            >
                              PRÓX.
                            </Text>
                          </View>
                        </View>
                      )
                    )}

                    {/*
                      IMPORTANTE:

                      Uma compra vencida
                      continua aparecendo,
                      mesmo se outra compra
                      do mesmo produto
                      ainda estiver válida.
                    */}
                    {alerta.comprasVencidas.map(
                      (compra) => (
                        <View
                          key={
                            `vencido-${compra.id}`
                          }
                          style={
                            styles.alertaLinha
                          }
                        >
                          <View
                            style={[
                              styles.alertaIcone,
                              styles.alertaIconeVermelhoEscuro,
                            ]}
                          >
                            <Ionicons
                              name="close-circle"
                              size={20}
                              color="#FFFFFF"
                            />
                          </View>

                          <View
                            style={
                              styles.alertaInfo
                            }
                          >
                            <Text
                              style={
                                styles.alertaTitulo
                              }
                            >
                              Compra vencida
                            </Text>

                            <Text
                              style={
                                styles.alertaDescricao
                              }
                            >
                              Venceu em{' '}
                              {
                                compra.dataVencimento
                              }
                              {'  •  '}
                              Qtd.{' '}
                              {
                                compra.quantidade
                              }
                            </Text>
                          </View>

                          <View
                            style={[
                              styles.badge,
                              styles.badgeVencido,
                            ]}
                          >
                            <Text
                              style={
                                styles.badgeTexto
                              }
                            >
                              VENCIDO
                            </Text>
                          </View>
                        </View>
                      )
                    )}
                  </>
                )}
              </View>
            )
          )}
        </>
      )}
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

      paddingBottom: 80,
    },

    tituloArea: {
      flexDirection:
        'row',

      alignItems:
        'center',

      marginBottom: 18,
    },

    tituloIcone: {
      width: 48,

      height: 48,

      borderRadius: 12,

      backgroundColor:
        '#E53935',

      alignItems:
        'center',

      justifyContent:
        'center',

      marginRight: 12,
    },

    tituloTextos: {
      flex: 1,
    },

    titulo: {
      color:
        '#FFFFFF',

      fontSize: 24,

      fontWeight:
        '900',
    },

    subtitulo: {
      color:
        '#888888',

      fontSize: 13,

      fontWeight:
        '600',

      marginTop: 2,
    },

    resumoLinha: {
      flexDirection:
        'row',

      gap: 8,

      marginBottom: 22,
    },

    resumoCard: {
      flex: 1,

      minWidth: 0,

      backgroundColor:
        '#1E1E1E',

      borderWidth: 1,

      borderColor:
        '#333333',

      borderRadius: 11,

      paddingHorizontal: 8,

      paddingVertical: 13,

      alignItems:
        'center',
    },

    resumoNumero: {
      color:
        '#FFFFFF',

      fontSize: 21,

      fontWeight:
        '900',

      backgroundColor:
        '#E53935',

      minWidth: 38,

      height: 36,

      borderRadius: 8,

      textAlign:
        'center',

      textAlignVertical:
        'center',

      paddingHorizontal: 7,
    },

    resumoTexto: {
      color:
        '#BBBBBB',

      fontSize: 10,

      fontWeight:
        '700',

      textAlign:
        'center',

      marginTop: 7,
    },

    listaTitulo: {
      color:
        '#FFFFFF',

      fontSize: 19,

      fontWeight:
        '900',

      marginBottom: 12,
    },

    semAlertasCard: {
      backgroundColor:
        '#1E1E1E',

      borderWidth: 1,

      borderColor:
        '#333333',

      borderRadius: 13,

      padding: 28,

      alignItems:
        'center',
    },

    semAlertasIcone: {
      width: 64,

      height: 64,

      borderRadius: 32,

      backgroundColor:
        '#292929',

      alignItems:
        'center',

      justifyContent:
        'center',

      marginBottom: 13,
    },

    semAlertasTitulo: {
      color:
        '#FFFFFF',

      fontSize: 17,

      fontWeight:
        '800',
    },

    semAlertasTexto: {
      color:
        '#999999',

      fontSize: 13,

      lineHeight: 19,

      textAlign:
        'center',

      marginTop: 6,
    },

    produtoCard: {
      backgroundColor:
        '#1E1E1E',

      borderWidth: 1,

      borderColor:
        '#333333',

      borderRadius: 13,

      padding: 14,

      marginBottom: 14,
    },

    produtoTopo: {
      flexDirection:
        'row',

      alignItems:
        'center',
    },

    produtoIcone: {
      width: 44,

      height: 44,

      borderRadius: 10,

      backgroundColor:
        '#292929',

      alignItems:
        'center',

      justifyContent:
        'center',

      marginRight: 11,
    },

    produtoInfo: {
      flex: 1,

      minWidth: 0,
    },

    produtoNome: {
      color:
        '#FFFFFF',

      fontSize: 16,

      fontWeight:
        '800',
    },

    produtoCategoria: {
      color:
        '#E53935',

      fontSize: 11,

      fontWeight:
        '700',

      marginTop: 3,
    },

    quantidadeArea: {
      minWidth: 48,

      alignItems:
        'center',

      backgroundColor:
        '#151515',

      borderRadius: 8,

      paddingHorizontal: 8,

      paddingVertical: 6,
    },

    quantidadeLabel: {
      color:
        '#777777',

      fontSize: 9,

      fontWeight:
        '700',
    },

    quantidadeNumero: {
      color:
        '#FFFFFF',

      fontSize: 17,

      fontWeight:
        '900',

      marginTop: 1,
    },

    divisor: {
      height: 1,

      backgroundColor:
        '#333333',

      marginVertical: 13,
    },

    alertaLinha: {
      flexDirection:
        'row',

      alignItems:
        'center',

      minHeight: 58,

      marginBottom: 8,
    },

    alertaIcone: {
      width: 36,

      height: 36,

      borderRadius: 9,

      alignItems:
        'center',

      justifyContent:
        'center',

      marginRight: 10,
    },

    alertaIconeVermelho: {
      backgroundColor:
        '#E53935',
    },

    alertaIconeLaranja: {
      backgroundColor:
        '#C77800',
    },

    alertaIconeVermelhoEscuro: {
      backgroundColor:
        '#B71C1C',
    },

    alertaInfo: {
      flex: 1,

      minWidth: 0,

      marginRight: 7,
    },

    alertaTitulo: {
      color:
        '#FFFFFF',

      fontSize: 13,

      fontWeight:
        '800',
    },

    alertaDescricao: {
      color:
        '#999999',

      fontSize: 11,

      lineHeight: 16,

      marginTop: 2,
    },

    badge: {
      borderRadius: 6,

      paddingHorizontal: 7,

      paddingVertical: 5,
    },

    badgeBaixo: {
      backgroundColor:
        '#E53935',
    },

    badgeProximo: {
      backgroundColor:
        '#C77800',
    },

    badgeVencido: {
      backgroundColor:
        '#B71C1C',
    },

    badgeTexto: {
      color:
        '#FFFFFF',

      fontSize: 8,

      fontWeight:
        '900',
    },
  });