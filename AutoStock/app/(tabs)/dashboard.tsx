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

export default function DashboardScreen() {
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

  /*
    Todas as compras.

    Essa função é usada pelo
    financeiro.

    Mesmo compras removidas do
    estoque continuam aqui.
  */
  function obterTodasComprasProduto(
    produto: Produto
  ): CompraProduto[] {
    if (
      Array.isArray(
        produto.compras
      )
    ) {
      return produto.compras;
    }

    return [];
  }

  /*
    Somente compras que ainda
    aparecem no estoque.
  */
  function obterComprasEstoque(
    produto: Produto
  ): CompraProduto[] {
    return obterTodasComprasProduto(
      produto
    ).filter(
      (compra) =>
        compra.removida !==
        true
    );
  }

  /*
    Produtos que continuam
    ativos no estoque.
  */
  const produtosEstoque =
    produtos.filter(
      (produto) =>
        produto.removido !==
        true
    );

  /*
    Quantidade utilizável.

    Compra removida não conta.

    Compra vencida também
    não entra na quantidade.
  */
  function quantidadeDisponivel(
    produto: Produto
  ) {
    return obterComprasEstoque(
      produto
    )
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

  function produtoTemProximo(
    produto: Produto
  ) {
    return obterComprasEstoque(
      produto
    ).some(
      (compra) =>
        situacaoVencimento(
          compra.dataVencimento
        ) === 'proximo'
    );
  }

  function produtoTemVencido(
    produto: Produto
  ) {
    return obterComprasEstoque(
      produto
    ).some(
      (compra) =>
        situacaoVencimento(
          compra.dataVencimento
        ) === 'vencido'
    );
  }

  function produtoTotalmenteVencido(
    produto: Produto
  ) {
    return (
      produtoTemVencido(
        produto
      ) &&
      quantidadeDisponivel(
        produto
      ) === 0
    );
  }

  function produtoEstoqueBaixo(
    produto: Produto
  ) {
    const compras =
      obterComprasEstoque(
        produto
      );

    if (
      compras.length === 0
    ) {
      return false;
    }

    if (
      produtoTotalmenteVencido(
        produto
      )
    ) {
      return false;
    }

    return (
      quantidadeDisponivel(
        produto
      ) <= 2
    );
  }

  /*
    FINANCEIRO

    Usa todas as compras,
    inclusive as que foram
    excluídas visualmente
    do estoque.
  */
  function todasAsCompras() {
    return produtos.flatMap(
      (produto) =>
        obterTodasComprasProduto(
          produto
        )
    );
  }

  function obterValorAtendimento(
    atendimento: {
      valor?: number;
      valorFinal?: number;
    }
  ) {
    const valorAtual =
      Number(
        atendimento.valor
      );

    if (
      Number.isFinite(
        valorAtual
      )
    ) {
      return valorAtual;
    }

    const valorAntigo =
      Number(
        atendimento.valorFinal
      );

    if (
      Number.isFinite(
        valorAntigo
      )
    ) {
      return valorAntigo;
    }

    return 0;
  }

  function obterValorCompra(
    compra: CompraProduto
  ) {
    const valor =
      Number(
        compra.valor
      );

    return Number.isFinite(
      valor
    )
      ? valor
      : 0;
  }

  /*
    QUANTIDADE TOTAL
  */
  const quantidadeNoEstoque =
    produtosEstoque.reduce(
      (
        total,
        produto
      ) =>
        total +
        quantidadeDisponivel(
          produto
        ),
      0
    );

  /*
    ESTOQUE BAIXO
  */
  const produtosEstoqueBaixo =
    produtosEstoque.filter(
      (produto) =>
        produtoEstoqueBaixo(
          produto
        )
    ).length;

  /*
    PRÓXIMOS DO VENCIMENTO

    Cada produto conta apenas
    uma vez.
  */
  const produtosProximosVencimento =
    produtosEstoque.filter(
      (produto) =>
        produtoTemProximo(
          produto
        )
    ).length;

  /*
    VENCIDOS

    Se o produto tiver pelo menos
    uma compra vencida visível,
    conta uma vez.
  */
  const produtosVencidos =
    produtosEstoque.filter(
      (produto) =>
        produtoTemVencido(
          produto
        )
    ).length;

  const hoje =
    new Date();

  hoje.setHours(
    0,
    0,
    0,
    0
  );

  /*
    ENTRADAS DE HOJE
  */
  const entradasHoje =
    atendimentos
      .filter(
        (atendimento) => {
          const data =
            converterData(
              atendimento.data
            );

          if (!data) {
            return false;
          }

          return mesmoDia(
            data,
            hoje
          );
        }
      )
      .reduce(
        (
          total,
          atendimento
        ) =>
          total +
          obterValorAtendimento(
            atendimento
          ),
        0
      );

  /*
    DESPESAS DE HOJE

    IMPORTANTE:

    Aqui entram TODAS as compras,
    mesmo que tenham sido
    removidas do estoque.
  */
  const despesasHoje =
    todasAsCompras()
      .filter(
        (compra) => {
          const data =
            converterData(
              compra.dataCompra
            );

          if (!data) {
            return false;
          }

          return mesmoDia(
            data,
            hoje
          );
        }
      )
      .reduce(
        (
          total,
          compra
        ) =>
          total +
          obterValorCompra(
            compra
          ),
        0
      );

  const saldoDia =
    entradasHoje -
    despesasHoje;

  function formatarValor(
    valor: number
  ) {
    if (
      !Number.isFinite(
        valor
      )
    ) {
      return '0,00';
    }

    return valor
      .toFixed(2)
      .replace(
        '.',
        ','
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
      showsVerticalScrollIndicator={
        false
      }
    >
      <AppHeader />

      <View
        style={
          styles.dashboardBody
        }
      >
        <View
          style={
            styles.card
          }
        >
          <Text
            style={
              styles.cardTitulo
            }
          >
            Quantidade no estoque
          </Text>

          <View
            style={
              styles.numeroArea
            }
          >
            <Text
              style={
                styles.numero
              }
            >
              {
                quantidadeNoEstoque
              }
            </Text>
          </View>
        </View>

        <View
          style={
            styles.card
          }
        >
          <Text
            style={
              styles.cardTitulo
            }
          >
            Estoque baixo
          </Text>

          <View
            style={
              styles.numeroArea
            }
          >
            <Text
              style={
                styles.numero
              }
            >
              {
                produtosEstoqueBaixo
              }
            </Text>
          </View>
        </View>

        <View
          style={
            styles.card
          }
        >
          <Text
            style={
              styles.cardTitulo
            }
          >
            Próximos do vencimento
          </Text>

          <View
            style={
              styles.numeroArea
            }
          >
            <Text
              style={
                styles.numero
              }
            >
              {
                produtosProximosVencimento
              }
            </Text>
          </View>
        </View>

        <View
          style={
            styles.card
          }
        >
          <Text
            style={
              styles.cardTitulo
            }
          >
            Vencidos
          </Text>

          <View
            style={
              styles.numeroArea
            }
          >
            <Text
              style={
                styles.numero
              }
            >
              {
                produtosVencidos
              }
            </Text>
          </View>
        </View>

        <Text
          style={
            styles.resumoTitulo
          }
        >
          Resumo financeiro
        </Text>

        <View
          style={
            styles.saldoCard
          }
        >
          <Text
            style={
              styles.saldoLabel
            }
          >
            Saldo do dia
          </Text>

          <Text
            style={[
              styles.saldoValor,

              saldoDia < 0 &&
                styles.saldoNegativo,
            ]}
          >
            R${' '}
            {formatarValor(
              saldoDia
            )}
          </Text>
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
      flexGrow: 1,

      paddingHorizontal: 20,

      paddingTop: 50,

      paddingBottom: 25,
    },

    dashboardBody: {
      flex: 1,

      justifyContent:
        'center',

      paddingTop: 18,

      paddingBottom: 18,
    },

    card: {
      backgroundColor:
        '#1E1E1E',

      borderRadius: 12,

      padding: 18,

      marginBottom: 14,

      borderWidth: 1,

      borderColor:
        '#333333',

      flexDirection: 'row',

      alignItems: 'center',

      justifyContent:
        'space-between',

      gap: 15,
    },

    cardTitulo: {
      flex: 1,

      color: '#FFFFFF',

      fontSize: 16,

      fontWeight: '700',
    },

    numeroArea: {
      minWidth: 48,

      height: 42,

      paddingHorizontal: 10,

      borderRadius: 10,

      backgroundColor:
        '#E53935',

      alignItems: 'center',

      justifyContent:
        'center',
    },

    numero: {
      color: '#FFFFFF',

      fontSize: 20,

      fontWeight: '800',
    },

    resumoTitulo: {
      color: '#FFFFFF',

      fontSize: 20,

      fontWeight: '800',

      marginTop: 12,

      marginBottom: 18,
    },

    saldoCard: {
      backgroundColor:
        '#1E1E1E',

      borderRadius: 12,

      padding: 18,

      borderWidth: 1,

      borderColor:
        '#333333',
    },

    saldoLabel: {
      color: '#BBBBBB',

      fontSize: 15,

      fontWeight: '600',
    },

    saldoValor: {
      color: '#FFFFFF',

      fontSize: 29,

      fontWeight: '800',

      marginTop: 7,
    },

    saldoNegativo: {
      color: '#E53935',
    },
  });