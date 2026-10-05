import { quantidadeComprada } from '@/utils/estoque';

import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';

import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { AppHeader } from '@/components/app-header';
import { useAppData } from '@/contexts/app-data-context';

type Periodo = 'hoje' | 'mes';
type FiltroMovimentacao = 'todos' | 'receitas' | 'despesas';
type TipoMovimentacao = 'receita' | 'despesa';

type MovimentacaoFinanceira = {
  id: string;
  tipo: TipoMovimentacao;
  titulo: string;
  detalhe: string;
  data: string;
  horario: string | null;
  valor: number;
  dataOrdenacao: number;
};

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

function converterData(dataTexto: string): Date | null {
  if (!dataTexto) {
    return null;
  }

  const partes = dataTexto.split('/');

  if (partes.length !== 3) {
    return null;
  }

  const dia = Number(partes[0]);
  const mes = Number(partes[1]);
  const ano = Number(partes[2]);
  const data = new Date(ano, mes - 1, dia);

  if (
    !Number.isFinite(dia) ||
    !Number.isFinite(mes) ||
    !Number.isFinite(ano) ||
    data.getFullYear() !== ano ||
    data.getMonth() !== mes - 1 ||
    data.getDate() !== dia
  ) {
    return null;
  }

  data.setHours(0, 0, 0, 0);

  return data;
}

function obterDataOrdenacao(dataTexto: string, horario: string | null) {
  const data = converterData(dataTexto);

  if (!data) {
    return 0;
  }

  if (horario) {
    const [hora, minuto] = horario.split(':').map(Number);

    if (Number.isFinite(hora) && Number.isFinite(minuto)) {
      data.setHours(hora, minuto, 0, 0);
    }
  }

  return data.getTime();
}

function mesmoDia(data1: Date, data2: Date) {
  return (
    data1.getDate() === data2.getDate() &&
    data1.getMonth() === data2.getMonth() &&
    data1.getFullYear() === data2.getFullYear()
  );
}

function mesmoMes(data1: Date, data2: Date) {
  return (
    data1.getMonth() === data2.getMonth() &&
    data1.getFullYear() === data2.getFullYear()
  );
}

function numeroValido(valor: unknown) {
  const numero = Number(valor);

  return Number.isFinite(numero) ? numero : 0;
}

function valorAtendimento(atendimento: {
  valor?: number;
  valorFinal?: number;
}) {
  const valor = Number(atendimento.valor);

  return Number.isFinite(valor)
    ? valor
    : numeroValido(atendimento.valorFinal);
}

function formatarValor(valor: number) {
  if (!Number.isFinite(valor)) {
    return '0,00';
  }

  return valor.toFixed(2).replace('.', ',');
}

export default function FinanceiroScreen() {
  const [periodo, setPeriodo] = useState<Periodo>('hoje');
  const [filtroMovimentacao, setFiltroMovimentacao] =
    useState<FiltroMovimentacao>('todos');

  const agora = new Date();
  const [mesReferencia, setMesReferencia] = useState(
    new Date(agora.getFullYear(), agora.getMonth(), 1)
  );

  const { atendimentos, produtos } = useAppData();

  function dataNoPeriodo(dataTexto: string) {
    const data = converterData(dataTexto);

    if (!data) {
      return false;
    }

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    return periodo === 'hoje'
      ? mesmoDia(data, hoje)
      : mesmoMes(data, mesReferencia);
  }

  const movimentacoesAtendimento: MovimentacaoFinanceira[] =
    atendimentos.map((atendimento) => {
      const detalhes = [
        atendimento.nome,
        atendimento.carro,
        atendimento.placa,
      ].filter(Boolean);

      return {
        id: `atendimento-${atendimento.id}`,
        tipo: 'receita',
        titulo: atendimento.servico || 'Atendimento',
        detalhe: detalhes.join(' • '),
        data: atendimento.data,
        horario: atendimento.horario || null,
        valor: valorAtendimento(atendimento),
        dataOrdenacao: obterDataOrdenacao(
          atendimento.data,
          atendimento.horario || null
        ),
      };
    });

  const movimentacoesCompra: MovimentacaoFinanceira[] = produtos.flatMap(
    (produto) =>
      produto.compras.map((compra) => ({
        id: `compra-${produto.id}-${compra.id}`,
        tipo: 'despesa' as const,
        titulo: `Compra: ${produto.nome}`,
        detalhe: `${quantidadeComprada(compra)} ${
          quantidadeComprada(compra) === 1 ? 'unidade' : 'unidades'
        } • ${produto.categoria}`,
        data: compra.dataCompra,
        horario: null,
        valor: numeroValido(compra.valor),
        dataOrdenacao: obterDataOrdenacao(compra.dataCompra, null),
      }))
  );

  const movimentacoesDoPeriodo = [
    ...movimentacoesAtendimento,
    ...movimentacoesCompra,
  ]
    .filter((movimentacao) => dataNoPeriodo(movimentacao.data))
    .sort((a, b) => b.dataOrdenacao - a.dataOrdenacao);

  const entradas = movimentacoesDoPeriodo
    .filter((movimentacao) => movimentacao.tipo === 'receita')
    .reduce((total, movimentacao) => total + movimentacao.valor, 0);

  const despesas = movimentacoesDoPeriodo
    .filter((movimentacao) => movimentacao.tipo === 'despesa')
    .reduce((total, movimentacao) => total + movimentacao.valor, 0);

  const movimentacoesFiltradas = movimentacoesDoPeriodo.filter(
    (movimentacao) => {
      if (filtroMovimentacao === 'receitas') {
        return movimentacao.tipo === 'receita';
      }

      if (filtroMovimentacao === 'despesas') {
        return movimentacao.tipo === 'despesa';
      }

      return true;
    }
  );

  const lucro = entradas - despesas;
  const maiorValor = Math.max(entradas, despesas, Math.max(lucro, 0), 1);

  function alturaBarra(valor: number) {
    if (valor <= 0) {
      return 4;
    }

    return Math.max((valor / maiorValor) * 120, 4);
  }

  function mesAnterior() {
    setMesReferencia(
      new Date(
        mesReferencia.getFullYear(),
        mesReferencia.getMonth() - 1,
        1
      )
    );
  }

  function proximoMes() {
    setMesReferencia(
      new Date(
        mesReferencia.getFullYear(),
        mesReferencia.getMonth() + 1,
        1
      )
    );
  }

  function renderizarMovimentacao({ item }: { item: MovimentacaoFinanceira }) {
    const receita = item.tipo === 'receita';

    return (
      <View style={styles.movimentacaoCard}>
        <View
          style={[
            styles.movimentacaoIcone,
            receita
              ? styles.movimentacaoIconeReceita
              : styles.movimentacaoIconeDespesa,
          ]}
        >
          <Ionicons
            name={receita ? 'arrow-up' : 'cart-outline'}
            size={20}
            color={receita ? '#31C76A' : '#E53935'}
          />
        </View>

        <View style={styles.movimentacaoInfo}>
          <Text style={styles.movimentacaoTitulo} numberOfLines={2}>
            {item.titulo}
          </Text>

          {item.detalhe.length > 0 && (
            <Text style={styles.movimentacaoDetalhe} numberOfLines={2}>
              {item.detalhe}
            </Text>
          )}

          <Text style={styles.movimentacaoData}>
            {item.data}
            {item.horario ? ` às ${item.horario}` : ''}
          </Text>
        </View>

        <Text
          style={[
            styles.movimentacaoValor,
            receita
              ? styles.movimentacaoValorReceita
              : styles.movimentacaoValorDespesa,
          ]}
        >
          {receita ? '+' : '-'} R$ {formatarValor(item.valor)}
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.content}
      data={movimentacoesFiltradas}
      keyExtractor={(movimentacao) => movimentacao.id}
      renderItem={renderizarMovimentacao}
      initialNumToRender={10}
      maxToRenderPerBatch={10}
      windowSize={7}
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={
        <>
          <AppHeader />

          <View style={styles.filtros}>
            <TouchableOpacity
              style={[
                styles.filtroButton,
                periodo === 'hoje' && styles.filtroAtivo,
              ]}
              onPress={() => setPeriodo('hoje')}
            >
              <Text
                style={[
                  styles.filtroText,
                  periodo === 'hoje' && styles.filtroTextAtivo,
                ]}
              >
                Hoje
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.filtroButton,
                periodo === 'mes' && styles.filtroAtivo,
              ]}
              onPress={() => setPeriodo('mes')}
            >
              <Text
                style={[
                  styles.filtroText,
                  periodo === 'mes' && styles.filtroTextAtivo,
                ]}
              >
                Mês
              </Text>
            </TouchableOpacity>
          </View>

          {periodo === 'mes' && (
            <View style={styles.navegacaoMes}>
              <TouchableOpacity style={styles.setaButton} onPress={mesAnterior}>
                <Text style={styles.seta}>‹</Text>
              </TouchableOpacity>

              <Text style={styles.mesTexto}>
                {nomesMeses[mesReferencia.getMonth()]}{' '}
                {mesReferencia.getFullYear()}
              </Text>

              <TouchableOpacity style={styles.setaButton} onPress={proximoMes}>
                <Text style={styles.seta}>›</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.resumoLinha}>
            <View style={styles.card}>
              <Text style={styles.cardLabel}>Receitas</Text>
              <Text style={styles.valor}>R$ {formatarValor(entradas)}</Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardLabel}>Despesas</Text>
              <Text style={styles.valor}>R$ {formatarValor(despesas)}</Text>
            </View>
          </View>

          <View style={styles.lucroCard}>
            <Text style={styles.lucroLabel}>Lucro</Text>
            <Text
              style={[
                styles.lucroValor,
                lucro < 0 && styles.lucroNegativo,
              ]}
            >
              R$ {formatarValor(lucro)}
            </Text>
          </View>

          <View style={styles.graficoCard}>
            <View style={styles.grafico}>
              <View style={styles.coluna}>
                <Text style={styles.valorGrafico}>
                  R$ {formatarValor(entradas)}
                </Text>
                <View style={styles.areaBarra}>
                  <View
                    style={[
                      styles.barraReceita,
                      { height: alturaBarra(entradas) },
                    ]}
                  />
                </View>
                <Text style={styles.nomeBarra}>Receita</Text>
              </View>

              <View style={styles.coluna}>
                <Text style={styles.valorGrafico}>
                  R$ {formatarValor(despesas)}
                </Text>
                <View style={styles.areaBarra}>
                  <View
                    style={[
                      styles.barraDespesa,
                      { height: alturaBarra(despesas) },
                    ]}
                  />
                </View>
                <Text style={styles.nomeBarra}>Despesa</Text>
              </View>

              <View style={styles.coluna}>
                <Text style={styles.valorGrafico}>
                  R$ {formatarValor(lucro)}
                </Text>
                <View style={styles.areaBarra}>
                  <View
                    style={[
                      styles.barraLucro,
                      { height: alturaBarra(Math.max(lucro, 0)) },
                    ]}
                  />
                </View>
                <Text style={styles.nomeBarra}>Lucro</Text>
              </View>
            </View>
          </View>

          <View style={styles.movimentacoesCabecalho}>
            <Text style={styles.secaoTitulo}>Movimentações</Text>
            <Text style={styles.secaoSubtitulo}>
            </Text>
          </View>

          <View style={styles.filtrosMovimentacao}>
            {(
              [
                ['todos', 'Todos'],
                ['receitas', 'Receitas'],
                ['despesas', 'Despesas'],
              ] as [FiltroMovimentacao, string][]
            ).map(([valorFiltro, texto]) => (
              <TouchableOpacity
                key={valorFiltro}
                style={[
                  styles.filtroMovimentacaoButton,
                  filtroMovimentacao === valorFiltro &&
                    styles.filtroMovimentacaoAtivo,
                ]}
                onPress={() => setFiltroMovimentacao(valorFiltro)}
              >
                <Text
                  style={[
                    styles.filtroMovimentacaoTexto,
                    filtroMovimentacao === valorFiltro &&
                      styles.filtroMovimentacaoTextoAtivo,
                  ]}
                >
                  {texto}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      }
      ListEmptyComponent={
        <View style={styles.vazio}>
          <Ionicons name="receipt-outline" size={30} color="#777777" />
          <Text style={styles.vazioTitulo}>Nenhuma movimentação</Text>
          <Text style={styles.vazioTexto}>
            Não há registros para este período e filtro.
          </Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 90,
  },
  filtros: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 15,
  },
  filtroButton: {
    flex: 1,
    height: 44,
    backgroundColor: '#1E1E1E',
    borderWidth: 1,
    borderColor: '#444444',
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filtroAtivo: {
    backgroundColor: '#E53935',
    borderColor: '#E53935',
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
    backgroundColor: '#1E1E1E',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#333333',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  setaButton: {
    width: 55,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
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
  resumoLinha: {
    flexDirection: 'row',
    gap: 10,
  },
  card: {
    flex: 1,
    minWidth: 0,
    backgroundColor: '#1E1E1E',
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
  },
  cardLabel: {
    color: '#BBBBBB',
    fontSize: 14,
    fontWeight: '600',
  },
  valor: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    marginTop: 7,
  },
  lucroCard: {
    backgroundColor: '#1E1E1E',
    borderWidth: 1,
    borderColor: '#E53935',
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
    backgroundColor: '#1E1E1E',
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 12,
    padding: 18,
  },
  grafico: {
    height: 190,
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: 10,
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
    justifyContent: 'flex-end',
  },
  barraReceita: {
    width: '100%',
    backgroundColor: '#31C76A',
    borderRadius: 6,
  },
  barraDespesa: {
    width: '100%',
    backgroundColor: '#E53935',
    borderRadius: 6,
  },
  barraLucro: {
    width: '100%',
    backgroundColor: '#888888',
    borderRadius: 6,
  },
  nomeBarra: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
  },
  secaoTitulo: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  },
  secaoSubtitulo: {
    color: '#888888',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },
  movimentacoesCabecalho: {
    marginTop: 25,
    marginBottom: 13,
  },
  filtrosMovimentacao: {
    flexDirection: 'row',
    gap: 7,
    marginBottom: 12,
  },
  filtroMovimentacaoButton: {
    flex: 1,
    minHeight: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#444444',
    backgroundColor: '#1E1E1E',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 7,
  },
  filtroMovimentacaoAtivo: {
    borderColor: '#E53935',
    backgroundColor: '#2A1515',
  },
  filtroMovimentacaoTexto: {
    color: '#999999',
    fontSize: 12,
    fontWeight: '800',
  },
  filtroMovimentacaoTextoAtivo: {
    color: '#FFFFFF',
  },
  movimentacaoCard: {
    backgroundColor: '#1E1E1E',
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 12,
    padding: 13,
    marginBottom: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  movimentacaoIcone: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  movimentacaoIconeReceita: {
    backgroundColor: '#102719',
  },
  movimentacaoIconeDespesa: {
    backgroundColor: '#2A1515',
  },
  movimentacaoInfo: {
    flex: 1,
    minWidth: 0,
  },
  movimentacaoTitulo: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  movimentacaoDetalhe: {
    color: '#A5A5A5',
    fontSize: 11,
    lineHeight: 16,
    marginTop: 3,
  },
  movimentacaoData: {
    color: '#777777',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 4,
  },
  movimentacaoValor: {
    fontSize: 13,
    fontWeight: '900',
    textAlign: 'right',
  },
  movimentacaoValorReceita: {
    color: '#31C76A',
  },
  movimentacaoValorDespesa: {
    color: '#EF5350',
  },
  vazio: {
    minHeight: 155,
    backgroundColor: '#1E1E1E',
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 22,
  },
  vazioTitulo: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    marginTop: 9,
  },
  vazioTexto: {
    color: '#888888',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 5,
  },
});