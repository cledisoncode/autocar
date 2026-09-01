import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import {
  useRef,
  useState,
} from 'react';

import {
  Alert,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import {
  AppHeader,
} from '@/components/app-header';

import {
  type CategoriaProduto,
  type CompraProduto,
  type Produto,
  useAppData,
} from '@/contexts/app-data-context';

type Aba =
  | 'novo'
  | 'produtos';

type FiltroCategoria =
  | 'Todos'
  | CategoriaProduto;

type FiltroSituacao =
  | 'todos'
  | 'baixo'
  | 'proximo'
  | 'vencidos';

type SituacaoVencimento =
  | 'valido'
  | 'proximo'
  | 'vencido';

type ModoExclusao =
  | 'produto'
  | 'compra'
  | null;

const categorias: CategoriaProduto[] = [
  'Lavagem Interna',
  'Lavagem Externa',
  'Vidros',
  'Acabamento',
];

export default function EstoqueScreen() {
  const [
    aba,
    setAba,
  ] = useState<Aba>(
    'novo'
  );

  const [
    categoriaCadastroAberta,
    setCategoriaCadastroAberta,
  ] = useState(false);

  const [
    categoriaFiltroAberta,
    setCategoriaFiltroAberta,
  ] = useState(false);

  const [
    situacaoFiltroAberta,
    setSituacaoFiltroAberta,
  ] = useState(false);

  const [
    buscaAberta,
    setBuscaAberta,
  ] = useState(false);

  const [
    filtroCategoria,
    setFiltroCategoria,
  ] =
    useState<FiltroCategoria>(
      'Todos'
    );

  const [
    filtroSituacao,
    setFiltroSituacao,
  ] =
    useState<FiltroSituacao>(
      'todos'
    );

  const [
    buscaProduto,
    setBuscaProduto,
  ] = useState('');

  const [
    nome,
    setNome,
  ] = useState('');

  const [
    categoria,
    setCategoria,
  ] =
    useState<
      CategoriaProduto | null
    >(null);

  const [
    valor,
    setValor,
  ] = useState('');

  const [
    quantidade,
    setQuantidade,
  ] = useState('');

  const [
    dataCompra,
    setDataCompra,
  ] = useState('');

  const [
    dataVencimento,
    setDataVencimento,
  ] = useState('');

  const [
    semVencimento,
    setSemVencimento,
  ] = useState(false);

  const [
    foto,
    setFoto,
  ] =
    useState<string | null>(
      null
    );

  const [
    modalExcluirAberto,
    setModalExcluirAberto,
  ] = useState(false);

  const [
    produtoParaExcluir,
    setProdutoParaExcluir,
  ] =
    useState<Produto | null>(
      null
    );

  const [
    modoExclusao,
    setModoExclusao,
  ] =
    useState<ModoExclusao>(
      null
    );

  const [
    compraSelecionadaId,
    setCompraSelecionadaId,
  ] =
    useState<number | null>(
      null
    );

  const nomeRef =
    useRef<TextInput>(
      null
    );

  const valorRef =
    useRef<TextInput>(
      null
    );

  const quantidadeRef =
    useRef<TextInput>(
      null
    );

  const dataCompraRef =
    useRef<TextInput>(
      null
    );

  const dataVencimentoRef =
    useRef<TextInput>(
      null
    );

  const scrollRef =
    useRef<ScrollView>(
      null
    );

  const {
    produtos,
    adicionarCompraProduto,
    excluirProdutoDoEstoque,
    excluirCompraDoEstoque,
  } = useAppData();

  async function selecionarFoto() {
    Keyboard.dismiss();

    const permissao =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissao.granted) {
      Alert.alert(
        'Permissão necessária',
        'O AUTOCAR precisa de acesso às fotos.'
      );

      return;
    }

    const resultado =
      await ImagePicker.launchImageLibraryAsync({
        mediaTypes: [
          'images',
        ],

        allowsEditing: true,

        aspect: [
          1,
          1,
        ],

        quality: 0.9,
      });

    if (!resultado.canceled) {
      setFoto(
        resultado.assets[0].uri
      );
    }
  }

  function formatarData(
    texto: string
  ) {
    const numeros =
      texto
        .replace(
          /\D/g,
          ''
        )
        .slice(
          0,
          8
        );

    if (
      numeros.length <= 2
    ) {
      return numeros;
    }

    if (
      numeros.length <= 4
    ) {
      return `${numeros.slice(
        0,
        2
      )}/${numeros.slice(
        2
      )}`;
    }

    return `${numeros.slice(
      0,
      2
    )}/${numeros.slice(
      2,
      4
    )}/${numeros.slice(
      4
    )}`;
  }

  function formatarMoeda(
    texto: string
  ) {
    let valorLimpo =
      texto
        .replace(
          'R$',
          ''
        )
        .trim();

    valorLimpo =
      valorLimpo.replace(
        /[^\d,]/g,
        ''
      );

    const partes =
      valorLimpo.split(
        ','
      );

    let inteiro =
      partes[0] || '';

    if (
      inteiro.length > 1
    ) {
      inteiro =
        inteiro.replace(
          /^0+/,
          ''
        ) || '0';
    }

    if (
      partes.length > 1
    ) {
      const centavos =
        partes[1].slice(
          0,
          2
        );

      return `R$ ${inteiro},${centavos}`;
    }

    return `R$ ${inteiro}`;
  }

  function converterMoeda(
    texto: string
  ) {
    const numero =
      texto
        .replace(
          'R$',
          ''
        )
        .replace(
          /\./g,
          ''
        )
        .replace(
          ',',
          '.'
        )
        .trim();

    return (
      Number(
        numero
      ) || 0
    );
  }

  function converterData(
    dataTexto: string
  ): Date | null {
    if (
      !dataTexto
    ) {
      return null;
    }

    const partes =
      dataTexto.split(
        '/'
      );

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

  function dataValida(
    dataTexto: string
  ) {
    return (
      converterData(
        dataTexto
      ) !== null
    );
  }

  function situacaoVencimento(
    dataTexto: string | null
  ): SituacaoVencimento | null {
    if (
      !dataTexto
    ) {
      return null;
    }

    const vencimento =
      converterData(
        dataTexto
      );

    if (
      !vencimento
    ) {
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

  function comprasVisiveis(
    produto: Produto
  ) {
    return produto.compras.filter(
      (compra) =>
        compra.removida !== true
    );
  }

  function quantidadeDisponivel(
    produto: Produto
  ) {
    return comprasVisiveis(
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
          const numero =
            Number(
              compra.quantidade
            );

          return (
            total +
            (
              Number.isFinite(
                numero
              )
                ? numero
                : 0
            )
          );
        },
        0
      );
  }

  function produtoTemProximo(
    produto: Produto
  ) {
    return comprasVisiveis(
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
    return comprasVisiveis(
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

  function limparFormulario() {
    setNome('');

    setCategoria(
      null
    );

    setValor('');

    setQuantidade('');

    setDataCompra('');

    setDataVencimento('');

    setSemVencimento(
      false
    );

    setFoto(
      null
    );

    setCategoriaCadastroAberta(
      false
    );
  }

  function salvarProduto() {
    Keyboard.dismiss();

    const valorNumero =
      converterMoeda(
        valor
      );

    const quantidadeNumero =
      Number(
        quantidade.replace(
          ',',
          '.'
        )
      ) || 0;

    if (
      !nome.trim() ||
      !categoria ||
      !valor ||
      !quantidade ||
      !dataCompra
    ) {
      Alert.alert(
        'Atenção',
        'Preencha todos os campos obrigatórios.'
      );

      return;
    }

    if (
      !semVencimento &&
      !dataVencimento
    ) {
      Alert.alert(
        'Atenção',
        'Informe a data de vencimento ou marque Produto sem vencimento.'
      );

      return;
    }

    if (
      valorNumero <= 0
    ) {
      Alert.alert(
        'Valor inválido',
        'Informe o valor da compra.'
      );

      return;
    }

    if (
      quantidadeNumero <= 0
    ) {
      Alert.alert(
        'Quantidade inválida',
        'Informe uma quantidade maior que zero.'
      );

      return;
    }

    if (
      !dataValida(
        dataCompra
      )
    ) {
      Alert.alert(
        'Data inválida',
        'Informe uma data de compra válida.'
      );

      return;
    }

    if (
      !semVencimento &&
      !dataValida(
        dataVencimento
      )
    ) {
      Alert.alert(
        'Data inválida',
        'Informe uma data de vencimento válida.'
      );

      return;
    }

    if (
      !semVencimento
    ) {
      const compra =
        converterData(
          dataCompra
        );

      const vencimento =
        converterData(
          dataVencimento
        );

      if (
        compra &&
        vencimento &&
        vencimento.getTime() <
          compra.getTime()
      ) {
        Alert.alert(
          'Data de vencimento inválida',
          'A data de vencimento não pode ser anterior à data da compra.'
        );

        return;
      }
    }

    adicionarCompraProduto({
      nome,
      categoria,
      foto,
      quantidade:
        quantidadeNumero,
      valor:
        valorNumero,
      dataCompra,
      dataVencimento:
        semVencimento
          ? null
          : dataVencimento,
    });

    limparFormulario();

    setFiltroCategoria(
      'Todos'
    );

    setFiltroSituacao(
      'todos'
    );

    setBuscaProduto('');

    setBuscaAberta(
      false
    );

    setAba(
      'produtos'
    );

    Alert.alert(
      'AUTOCAR',
      'Compra adicionada ao estoque.'
    );
  }

  function rolarParaBaixo() {
    setTimeout(
      () => {
        scrollRef
          .current
          ?.scrollToEnd({
            animated:
              true,
          });
      },
      180
    );
  }

  function selecionarCategoriaCadastro(
    item: CategoriaProduto
  ) {
    setCategoria(
      item
    );

    setCategoriaCadastroAberta(
      false
    );

    setTimeout(
      () => {
        valorRef
          .current
          ?.focus();
      },
      120
    );
  }

  function selecionarCategoriaFiltro(
    item: FiltroCategoria
  ) {
    Keyboard.dismiss();

    setFiltroCategoria(
      item
    );

    setCategoriaFiltroAberta(
      false
    );

    setSituacaoFiltroAberta(
      false
    );
  }

  function selecionarSituacaoFiltro(
    item: FiltroSituacao
  ) {
    Keyboard.dismiss();

    setFiltroSituacao(
      item
    );

    setSituacaoFiltroAberta(
      false
    );

    setCategoriaFiltroAberta(
      false
    );
  }

  function textoSituacao() {
    if (
      filtroSituacao ===
      'baixo'
    ) {
      return 'Estoque baixo';
    }

    if (
      filtroSituacao ===
      'proximo'
    ) {
      return 'Próx. vencimento';
    }

    if (
      filtroSituacao ===
      'vencidos'
    ) {
      return 'Vencidos';
    }

    return 'Todos';
  }

  const produtosVisiveis =
    produtos.filter(
      (produto) =>
        produto.removido !== true
    );

  const produtosFiltrados =
    produtosVisiveis.filter(
      (produto) => {
        const categoriaOk =
          filtroCategoria ===
            'Todos' ||
          produto.categoria ===
            filtroCategoria;

        const buscaOk =
          !buscaProduto.trim() ||
          produto.nome
            .toLowerCase()
            .includes(
              buscaProduto
                .trim()
                .toLowerCase()
            );

        let situacaoOk =
          true;

        if (
          filtroSituacao ===
          'baixo'
        ) {
          situacaoOk =
            produtoEstoqueBaixo(
              produto
            );
        }

        if (
          filtroSituacao ===
          'proximo'
        ) {
          situacaoOk =
            produtoTemProximo(
              produto
            );
        }

        if (
          filtroSituacao ===
          'vencidos'
        ) {
          situacaoOk =
            produtoTemVencido(
              produto
            );
        }

        return (
          categoriaOk &&
          buscaOk &&
          situacaoOk
        );
      }
    );

  const categoriasVisiveis =
    categorias.filter(
      (categoriaAtual) =>
        produtosFiltrados.some(
          (produto) =>
            produto.categoria ===
            categoriaAtual
        )
    );

  function formatarValor(
    valorNumero: number
  ) {
    const numero =
      Number(
        valorNumero
      );

    if (
      !Number.isFinite(
        numero
      )
    ) {
      return '0,00';
    }

    return numero
      .toFixed(2)
      .replace(
        '.',
        ','
      );
  }

  function trocarAba(
    novaAba: Aba
  ) {
    Keyboard.dismiss();

    setAba(
      novaAba
    );

    setCategoriaCadastroAberta(
      false
    );

    setCategoriaFiltroAberta(
      false
    );

    setSituacaoFiltroAberta(
      false
    );
  }

  function abrirModalExcluir(
    produto: Produto
  ) {
    Keyboard.dismiss();

    setProdutoParaExcluir(
      produto
    );

    setModoExclusao(
      null
    );

    setCompraSelecionadaId(
      null
    );

    setModalExcluirAberto(
      true
    );
  }

  function fecharModalExcluir() {
    setModalExcluirAberto(
      false
    );

    setProdutoParaExcluir(
      null
    );

    setModoExclusao(
      null
    );

    setCompraSelecionadaId(
      null
    );
  }

  function confirmarExclusao() {
    if (
      !produtoParaExcluir
    ) {
      return;
    }

    if (
      modoExclusao ===
      'produto'
    ) {
      excluirProdutoDoEstoque(
        produtoParaExcluir.id
      );

      fecharModalExcluir();

      Alert.alert(
        'AUTOCAR',
        'Produto excluído do estoque.'
      );

      return;
    }

    if (
      modoExclusao ===
        'compra' &&
      compraSelecionadaId !==
        null
    ) {
      excluirCompraDoEstoque(
        produtoParaExcluir.id,
        compraSelecionadaId
      );

      fecharModalExcluir();

      Alert.alert(
        'AUTOCAR',
        'Compra excluída do estoque.'
      );
    }
  }

  const podeConfirmarExclusao =
    modoExclusao ===
      'produto' ||
    (
      modoExclusao ===
        'compra' &&
      compraSelecionadaId !==
        null
    );

  function textoStatusCompra(
    compra: CompraProduto
  ) {
    const situacao =
      situacaoVencimento(
        compra.dataVencimento
      );

    if (
      situacao ===
      'vencido'
    ) {
      return 'VENCIDO';
    }

    if (
      situacao ===
      'proximo'
    ) {
      return 'PRÓX. VENC.';
    }

    return 'VÁLIDO';
  }

  function estiloStatusCompra(
    compra: CompraProduto
  ) {
    const situacao =
      situacaoVencimento(
        compra.dataVencimento
      );

    if (
      situacao ===
      'vencido'
    ) {
      return styles.statusCompraVencido;
    }

    if (
      situacao ===
      'proximo'
    ) {
      return styles.statusCompraProximo;
    }

    return styles.statusCompraValido;
  }

  function estiloVencimentoTexto(
    compra: CompraProduto
  ) {
    const situacao =
      situacaoVencimento(
        compra.dataVencimento
      );

    if (
      situacao ===
      'vencido'
    ) {
      return styles.vencimentoVencido;
    }

    if (
      situacao ===
      'proximo'
    ) {
      return styles.vencimentoProximo;
    }

    if (
      situacao ===
      'valido'
    ) {
      return styles.vencimentoValido;
    }

    return styles.vencimentoSemData;
  }

  function renderizarProduto(
    produto: Produto
  ) {
    const disponivel =
      quantidadeDisponivel(
        produto
      );

    const compras =
      comprasVisiveis(
        produto
      );

    if (
      compras.length === 0
    ) {
      return null;
    }

    return (
      <View
        key={
          produto.id
        }
        style={
          styles.produtoCard
        }
      >
        <View
          style={
            styles.produtoCabecalho
          }
        >
          {produto.foto ? (
            <Image
              source={{
                uri:
                  produto.foto,
              }}
              style={
                styles.produtoFoto
              }
            />
          ) : (
            <View
              style={
                styles.produtoSemFoto
              }
            >
              <Ionicons
                name="image-outline"
                size={27}
                color="#666666"
              />
            </View>
          )}

          <View
            style={
              styles.produtoInfo
            }
          >
            <Text
              style={
                styles.produtoNome
              }
              numberOfLines={
                2
              }
            >
              {
                produto.nome
              }
            </Text>

            <Text
              style={
                styles.produtoCategoria
              }
            >
              {
                produto.categoria
              }
            </Text>

            <Text
              style={
                styles.quantidadeDisponivel
              }
            >
              {disponivel}{' '}
              {disponivel === 1
                ? 'unidade'
                : 'unidades'}
            </Text>
          </View>
        </View>

        {produtoEstoqueBaixo(
          produto
        ) && (
          <View
            style={
              styles.estoqueBaixoArea
            }
          >
            <Ionicons
              name="warning-outline"
              size={15}
              color="#E53935"
            />

            <Text
              style={
                styles.estoqueBaixoTexto
              }
            >
              ESTOQUE BAIXO
            </Text>
          </View>
        )}

        <Text
          style={
            styles.comprasTitulo
          }
        >
          Compras registradas
        </Text>

        {compras.map(
          (compra) => (
            <View
              key={
                compra.id
              }
              style={
                styles.compraCard
              }
            >
              <View
                style={
                  styles.compraConteudo
                }
              >
                <View
                  style={
                    styles.compraInformacoes
                  }
                >
                  <Text
                    style={
                      styles.compraData
                    }
                  >
                    {
                      compra.dataCompra
                    }
                  </Text>

                  <Text
                    style={
                      styles.compraQuantidade
                    }
                  >
                    {
                      compra.quantidade
                    }{' '}
                    {Number(
                      compra.quantidade
                    ) === 1
                      ? 'unidade'
                      : 'unidades'}
                  </Text>

                  <Text
                    style={[
                      styles.compraVencimento,
                      estiloVencimentoTexto(
                        compra
                      ),
                    ]}
                  >
                    Vence:{' '}
                    {compra.dataVencimento ??
                      'Sem vencimento'}
                  </Text>

                  <Text
                    style={
                      styles.compraValor
                    }
                  >
                    Valor: R${' '}
                    {formatarValor(
                      compra.valor
                    )}
                  </Text>
                </View>

                <View
                  style={[
                    styles.statusCompra,
                    estiloStatusCompra(
                      compra
                    ),
                  ]}
                >
                  <Text
                    style={
                      styles.statusCompraTexto
                    }
                  >
                    {
                      textoStatusCompra(
                        compra
                      )
                    }
                  </Text>
                </View>
              </View>
            </View>
          )
        )}

        <TouchableOpacity
          style={
            styles.excluirButton
          }
          onPress={() =>
            abrirModalExcluir(
              produto
            )
          }
          activeOpacity={
            0.75
          }
        >
          <Ionicons
            name="trash-outline"
            size={18}
            color="#FFFFFF"
          />

          <Text
            style={
              styles.excluirButtonTexto
            }
          >
            EXCLUIR
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={
        styles.keyboardContainer
      }
      behavior={
        Platform.OS ===
        'ios'
          ? 'padding'
          : 'height'
      }
    >
      <ScrollView
        ref={
          scrollRef
        }
        style={
          styles.container
        }
        contentContainerStyle={
          styles.content
        }
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={
          false
        }
      >
        <AppHeader />

        <View
          style={
            styles.abas
          }
        >
          <TouchableOpacity
            style={[
              styles.abaButton,

              aba ===
                'novo' &&
                styles.abaAtiva,
            ]}
            onPress={() =>
              trocarAba(
                'novo'
              )
            }
          >
            <Text
              style={[
                styles.abaText,

                aba ===
                  'novo' &&
                  styles.abaTextAtiva,
              ]}
            >
              Nova compra
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.abaButton,

              aba ===
                'produtos' &&
                styles.abaAtiva,
            ]}
            onPress={() =>
              trocarAba(
                'produtos'
              )
            }
          >
            <Text
              style={[
                styles.abaText,

                aba ===
                  'produtos' &&
                  styles.abaTextAtiva,
              ]}
            >
              Produtos
            </Text>
          </TouchableOpacity>
        </View>

        {aba ===
          'novo' && (
          <>
            <TouchableOpacity
              style={
                styles.fotoButton
              }
              onPress={
                selecionarFoto
              }
            >
              <Ionicons
                name="image-outline"
                size={21}
                color="#FFFFFF"
              />

              <Text
                style={
                  styles.fotoButtonText
                }
              >
                SELECIONAR FOTO
              </Text>
            </TouchableOpacity>

            {foto && (
              <View
                style={
                  styles.fotoSelecionadaArea
                }
              >
                <Image
                  source={{
                    uri:
                      foto,
                  }}
                  style={
                    styles.fotoSelecionada
                  }
                />

                <View
                  style={
                    styles.fotoSelecionadaInfo
                  }
                >
                  <Text
                    style={
                      styles.fotoSelecionadaTexto
                    }
                  >
                    Foto selecionada
                  </Text>

                  <TouchableOpacity
                    onPress={() =>
                      setFoto(
                        null
                      )
                    }
                  >
                    <Text
                      style={
                        styles.removerFotoText
                      }
                    >
                      Remover
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <Text
              style={
                styles.label
              }
            >
              Nome do produto
            </Text>

            <TextInput
              ref={
                nomeRef
              }
              style={
                styles.input
              }
              value={
                nome
              }
              onChangeText={
                setNome
              }
              placeholder="Nome do produto"
              placeholderTextColor="#777777"
              returnKeyType="next"
              onSubmitEditing={() => {
                Keyboard.dismiss();
              }}
            />

            <Text
              style={
                styles.label
              }
            >
              Categoria
            </Text>

            <TouchableOpacity
              style={
                styles.dropdownButton
              }
              onPress={() => {
                Keyboard.dismiss();

                setCategoriaCadastroAberta(
                  !categoriaCadastroAberta
                );
              }}
            >
              <Text
                style={[
                  styles.dropdownTexto,

                  !categoria &&
                    styles.dropdownPlaceholder,
                ]}
              >
                {categoria ||
                  'Selecione uma categoria'}
              </Text>

              <Ionicons
                name={
                  categoriaCadastroAberta
                    ? 'chevron-up'
                    : 'chevron-down'
                }
                size={20}
                color="#AAAAAA"
              />
            </TouchableOpacity>

            {categoriaCadastroAberta && (
              <View
                style={
                  styles.dropdownMenu
                }
              >
                {categorias.map(
                  (item) => (
                    <TouchableOpacity
                      key={
                        item
                      }
                      style={
                        styles.dropdownOpcao
                      }
                      onPress={() =>
                        selecionarCategoriaCadastro(
                          item
                        )
                      }
                    >
                      <Text
                        style={
                          styles.dropdownOpcaoTexto
                        }
                      >
                        {
                          item
                        }
                      </Text>
                    </TouchableOpacity>
                  )
                )}
              </View>
            )}

            <Text
              style={
                styles.label
              }
            >
              Valor
            </Text>

            <TextInput
              ref={
                valorRef
              }
              style={
                styles.input
              }
              value={
                valor
              }
              onFocus={() => {
                if (
                  !valor
                ) {
                  setValor(
                    'R$ '
                  );
                }
              }}
              onChangeText={(
                texto
              ) =>
                setValor(
                  formatarMoeda(
                    texto
                  )
                )
              }
              placeholder="R$ 0,00"
              placeholderTextColor="#777777"
              keyboardType="decimal-pad"
              returnKeyType="next"
              submitBehavior="submit"
              onSubmitEditing={() =>
                quantidadeRef
                  .current
                  ?.focus()
              }
            />

            <Text
              style={
                styles.label
              }
            >
              Quantidade
            </Text>

            <TextInput
              ref={
                quantidadeRef
              }
              style={
                styles.input
              }
              value={
                quantidade
              }
              onChangeText={
                setQuantidade
              }
              placeholder="Quantidade"
              placeholderTextColor="#777777"
              keyboardType="numeric"
              returnKeyType="next"
              submitBehavior="submit"
              onSubmitEditing={() =>
                dataCompraRef
                  .current
                  ?.focus()
              }
            />

            <Text
              style={
                styles.label
              }
            >
              Data da compra
            </Text>

            <TextInput
              ref={
                dataCompraRef
              }
              style={
                styles.input
              }
              value={
                dataCompra
              }
              onChangeText={(
                texto
              ) =>
                setDataCompra(
                  formatarData(
                    texto
                  )
                )
              }
              placeholder="DD/MM/AAAA"
              placeholderTextColor="#777777"
              keyboardType="numeric"
              maxLength={10}
              returnKeyType={
                semVencimento
                  ? 'done'
                  : 'next'
              }
              submitBehavior="submit"
              onFocus={
                rolarParaBaixo
              }
              onSubmitEditing={() => {
                if (
                  semVencimento
                ) {
                  Keyboard.dismiss();

                  return;
                }

                dataVencimentoRef
                  .current
                  ?.focus();
              }}
            />

            <TouchableOpacity
              style={
                styles.semVencimentoArea
              }
              onPress={() => {
                Keyboard.dismiss();

                const novoValor =
                  !semVencimento;

                setSemVencimento(
                  novoValor
                );

                if (
                  novoValor
                ) {
                  setDataVencimento(
                    ''
                  );
                }
              }}
            >
              <View
                style={[
                  styles.checkbox,

                  semVencimento &&
                    styles.checkboxAtivo,
                ]}
              >
                {semVencimento && (
                  <Text
                    style={
                      styles.checkboxTexto
                    }
                  >
                    ✓
                  </Text>
                )}
              </View>

              <Text
                style={
                  styles.semVencimentoTexto
                }
              >
                Produto sem vencimento
              </Text>
            </TouchableOpacity>

            {!semVencimento && (
              <>
                <Text
                  style={
                    styles.label
                  }
                >
                  Data de vencimento
                </Text>

                <TextInput
                  ref={
                    dataVencimentoRef
                  }
                  style={
                    styles.input
                  }
                  value={
                    dataVencimento
                  }
                  onChangeText={(
                    texto
                  ) =>
                    setDataVencimento(
                      formatarData(
                        texto
                      )
                    )
                  }
                  placeholder="DD/MM/AAAA"
                  placeholderTextColor="#777777"
                  keyboardType="numeric"
                  maxLength={10}
                  returnKeyType="done"
                  onFocus={
                    rolarParaBaixo
                  }
                  onSubmitEditing={() =>
                    Keyboard.dismiss()
                  }
                />
              </>
            )}

            <TouchableOpacity
              style={
                styles.button
              }
              onPress={
                salvarProduto
              }
            >
              <Text
                style={
                  styles.buttonText
                }
              >
                ADICIONAR AO ESTOQUE
              </Text>
            </TouchableOpacity>
          </>
        )}

        {aba ===
          'produtos' && (
          <>
            <View
              style={
                styles.filtrosLinha
              }
            >
              <TouchableOpacity
                style={
                  styles.filtroDropdown
                }
                onPress={() => {
                  Keyboard.dismiss();

                  setCategoriaFiltroAberta(
                    !categoriaFiltroAberta
                  );

                  setSituacaoFiltroAberta(
                    false
                  );
                }}
              >
                <View
                  style={
                    styles.filtroDropdownTextos
                  }
                >
                  <Text
                    style={
                      styles.filtroNome
                    }
                  >
                    Categoria
                  </Text>

                  <Text
                    style={
                      styles.filtroValor
                    }
                    numberOfLines={
                      1
                    }
                  >
                    {
                      filtroCategoria
                    }
                  </Text>
                </View>

                <Ionicons
                  name={
                    categoriaFiltroAberta
                      ? 'chevron-up'
                      : 'chevron-down'
                  }
                  size={18}
                  color="#AAAAAA"
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={
                  styles.filtroDropdown
                }
                onPress={() => {
                  Keyboard.dismiss();

                  setSituacaoFiltroAberta(
                    !situacaoFiltroAberta
                  );

                  setCategoriaFiltroAberta(
                    false
                  );
                }}
              >
                <View
                  style={
                    styles.filtroDropdownTextos
                  }
                >
                  <Text
                    style={
                      styles.filtroNome
                    }
                  >
                    Situação
                  </Text>

                  <Text
                    style={
                      styles.filtroValor
                    }
                    numberOfLines={
                      1
                    }
                  >
                    {
                      textoSituacao()
                    }
                  </Text>
                </View>

                <Ionicons
                  name={
                    situacaoFiltroAberta
                      ? 'chevron-up'
                      : 'chevron-down'
                  }
                  size={18}
                  color="#AAAAAA"
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.buscarButton,

                  buscaAberta &&
                    styles.buscarButtonAtivo,
                ]}
                onPress={() => {
                  Keyboard.dismiss();

                  setBuscaAberta(
                    !buscaAberta
                  );

                  setCategoriaFiltroAberta(
                    false
                  );

                  setSituacaoFiltroAberta(
                    false
                  );

                  if (
                    buscaAberta
                  ) {
                    setBuscaProduto(
                      ''
                    );
                  }
                }}
              >
                <Ionicons
                  name="search"
                  size={21}
                  color={
                    buscaAberta
                      ? '#FFFFFF'
                      : '#AAAAAA'
                  }
                />
              </TouchableOpacity>
            </View>

            {categoriaFiltroAberta && (
              <View
                style={
                  styles.dropdownMenuFiltro
                }
              >
                {[
                  'Todos',
                  ...categorias,
                ].map(
                  (item) => (
                    <TouchableOpacity
                      key={
                        item
                      }
                      style={
                        styles.dropdownOpcao
                      }
                      onPress={() =>
                        selecionarCategoriaFiltro(
                          item as FiltroCategoria
                        )
                      }
                    >
                      <Text
                        style={[
                          styles.dropdownOpcaoTexto,

                          filtroCategoria ===
                            item &&
                            styles.opcaoSelecionada,
                        ]}
                      >
                        {
                          item
                        }
                      </Text>
                    </TouchableOpacity>
                  )
                )}
              </View>
            )}

            {situacaoFiltroAberta && (
              <View
                style={
                  styles.dropdownMenuFiltro
                }
              >
                {[
                  [
                    'todos',
                    'Todos',
                  ],
                  [
                    'baixo',
                    'Estoque baixo',
                  ],
                  [
                    'proximo',
                    'Próx. vencimento',
                  ],
                  [
                    'vencidos',
                    'Vencidos',
                  ],
                ].map(
                  ([
                    valorFiltro,
                    texto,
                  ]) => (
                    <TouchableOpacity
                      key={
                        valorFiltro
                      }
                      style={
                        styles.dropdownOpcao
                      }
                      onPress={() =>
                        selecionarSituacaoFiltro(
                          valorFiltro as FiltroSituacao
                        )
                      }
                    >
                      <Text
                        style={[
                          styles.dropdownOpcaoTexto,

                          filtroSituacao ===
                            valorFiltro &&
                            styles.opcaoSelecionada,
                        ]}
                      >
                        {
                          texto
                        }
                      </Text>
                    </TouchableOpacity>
                  )
                )}
              </View>
            )}

            {buscaAberta && (
              <View
                style={
                  styles.buscaArea
                }
              >
                <Ionicons
                  name="search"
                  size={19}
                  color="#777777"
                />

                <TextInput
                  style={
                    styles.buscaInput
                  }
                  value={
                    buscaProduto
                  }
                  onChangeText={
                    setBuscaProduto
                  }
                  placeholder="Buscar produto"
                  placeholderTextColor="#777777"
                  autoFocus
                  returnKeyType="done"
                  onSubmitEditing={() =>
                    Keyboard.dismiss()
                  }
                />

                {buscaProduto.length >
                  0 && (
                  <TouchableOpacity
                    onPress={() =>
                      setBuscaProduto(
                        ''
                      )
                    }
                  >
                    <Ionicons
                      name="close-circle"
                      size={21}
                      color="#777777"
                    />
                  </TouchableOpacity>
                )}
              </View>
            )}

            {produtosFiltrados.length ===
            0 ? (
              <View
                style={
                  styles.vazio
                }
              >
                <Text
                  style={
                    styles.vazioTitulo
                  }
                >
                  Nenhum produto
                </Text>
              </View>
            ) : (
              categoriasVisiveis.map(
                (
                  categoriaAtual
                ) => {
                  const produtosCategoria =
                    produtosFiltrados.filter(
                      (produto) =>
                        produto.categoria ===
                        categoriaAtual
                    );

                  return (
                    <View
                      key={
                        categoriaAtual
                      }
                      style={
                        styles.categoriaGrupo
                      }
                    >
                      <View
                        style={
                          styles.categoriaTituloArea
                        }
                      >
                        <View
                          style={
                            styles.categoriaMarcador
                          }
                        />

                        <Text
                          style={
                            styles.categoriaTitulo
                          }
                        >
                          {
                            categoriaAtual
                          }
                        </Text>
                      </View>

                      {produtosCategoria.map(
                        (
                          produto
                        ) =>
                          renderizarProduto(
                            produto
                          )
                      )}
                    </View>
                  );
                }
              )
            )}
          </>
        )}
      </ScrollView>

      <Modal
        visible={
          modalExcluirAberto
        }
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={
          fecharModalExcluir
        }
      >
        <View
          style={
            styles.modalTela
          }
        >
          <Pressable
            style={
              styles.modalFundo
            }
            onPress={
              fecharModalExcluir
            }
          />

          <View
            style={
              styles.modalCard
            }
          >
            <View
              style={
                styles.modalCabecalho
              }
            >
              <Text
                style={
                  styles.modalTitulo
                }
              >
                Excluir do estoque
              </Text>

              <TouchableOpacity
                style={
                  styles.modalFechar
                }
                onPress={
                  fecharModalExcluir
                }
              >
                <Ionicons
                  name="close"
                  size={24}
                  color="#AAAAAA"
                />
              </TouchableOpacity>
            </View>

            <View
              style={
                styles.produtoDestaqueModal
              }
            >
              <Text
                style={
                  styles.modalProdutoNome
                }
                numberOfLines={
                  2
                }
              >
                {
                  produtoParaExcluir
                    ?.nome
                }
              </Text>
            </View>

            <Text
              style={
                styles.modalPergunta
              }
            >
              O que você deseja excluir?
            </Text>

            <TouchableOpacity
              style={[
                styles.opcaoExclusao,

                modoExclusao ===
                  'produto' &&
                  styles.opcaoExclusaoAtiva,
              ]}
              onPress={() => {
                setModoExclusao(
                  'produto'
                );

                setCompraSelecionadaId(
                  null
                );
              }}
              activeOpacity={
                0.8
              }
            >
              <View
                style={[
                  styles.radio,

                  modoExclusao ===
                    'produto' &&
                    styles.radioAtivo,
                ]}
              >
                {modoExclusao ===
                  'produto' && (
                  <View
                    style={
                      styles.radioCentro
                    }
                  />
                )}
              </View>

              <Text
                style={
                  styles.opcaoExclusaoTitulo
                }
              >
                Produto inteiro
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.opcaoExclusao,

                modoExclusao ===
                  'compra' &&
                  styles.opcaoExclusaoAtiva,
              ]}
              onPress={() => {
                setModoExclusao(
                  'compra'
                );

                setCompraSelecionadaId(
                  null
                );
              }}
              activeOpacity={
                0.8
              }
            >
              <View
                style={[
                  styles.radio,

                  modoExclusao ===
                    'compra' &&
                    styles.radioAtivo,
                ]}
              >
                {modoExclusao ===
                  'compra' && (
                  <View
                    style={
                      styles.radioCentro
                    }
                  />
                )}
              </View>

              <Text
                style={
                  styles.opcaoExclusaoTitulo
                }
              >
                Compra específica
              </Text>
            </TouchableOpacity>

            {modoExclusao ===
              'compra' &&
              produtoParaExcluir && (
              <View
                style={
                  styles.comprasSelecaoArea
                }
              >
                <Text
                  style={
                    styles.comprasSelecaoTitulo
                  }
                >
                  Escolha a compra
                </Text>

                <ScrollView
                  style={
                    styles.comprasSelecaoLista
                  }
                  showsVerticalScrollIndicator={
                    false
                  }
                  nestedScrollEnabled
                >
                  {comprasVisiveis(
                    produtoParaExcluir
                  ).map(
                    (compra) => (
                      <TouchableOpacity
                        key={
                          compra.id
                        }
                        style={[
                          styles.compraSelecao,

                          compraSelecionadaId ===
                            compra.id &&
                            styles.compraSelecaoAtiva,
                        ]}
                        onPress={() =>
                          setCompraSelecionadaId(
                            compra.id
                          )
                        }
                        activeOpacity={
                          0.8
                        }
                      >
                        <View
                          style={[
                            styles.radio,

                            compraSelecionadaId ===
                              compra.id &&
                              styles.radioAtivo,
                          ]}
                        >
                          {compraSelecionadaId ===
                            compra.id && (
                            <View
                              style={
                                styles.radioCentro
                              }
                            />
                          )}
                        </View>

                        <View
                          style={
                            styles.compraSelecaoInfo
                          }
                        >
                          <Text
                            style={
                              styles.compraSelecaoData
                            }
                          >
                            {
                              compra.dataCompra
                            }
                          </Text>

                          <Text
                            style={
                              styles.compraSelecaoDetalhe
                            }
                          >
                            {
                              compra.quantidade
                            }{' '}
                            {Number(
                              compra.quantidade
                            ) === 1
                              ? 'unidade'
                              : 'unidades'}
                          </Text>

                          <Text
                            style={[
                              styles.compraSelecaoVencimento,
                              estiloVencimentoTexto(
                                compra
                              ),
                            ]}
                          >
                            Vence:{' '}
                            {compra.dataVencimento ??
                              'Sem vencimento'}
                          </Text>
                        </View>

                        <View
                          style={[
                            styles.statusCompraModal,
                            estiloStatusCompra(
                              compra
                            ),
                          ]}
                        >
                          <Text
                            style={
                              styles.statusCompraModalTexto
                            }
                          >
                            {
                              textoStatusCompra(
                                compra
                              )
                            }
                          </Text>
                        </View>
                      </TouchableOpacity>
                    )
                  )}
                </ScrollView>
              </View>
            )}

            <View
              style={
                styles.modalBotoes
              }
            >
              <TouchableOpacity
                style={
                  styles.cancelarButton
                }
                onPress={
                  fecharModalExcluir
                }
              >
                <Text
                  style={
                    styles.cancelarButtonTexto
                  }
                >
                  CANCELAR
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.confirmarExcluirButton,

                  !podeConfirmarExclusao &&
                    styles.confirmarExcluirButtonDesabilitado,
                ]}
                onPress={
                  confirmarExclusao
                }
                disabled={
                  !podeConfirmarExclusao
                }
              >
                <Ionicons
                  name="trash-outline"
                  size={17}
                  color="#FFFFFF"
                />

                <Text
                  style={
                    styles.confirmarExcluirButtonTexto
                  }
                >
                  EXCLUIR
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles =
  StyleSheet.create({
    keyboardContainer: {
      flex: 1,
      backgroundColor:
        '#000000',
    },

    container: {
      flex: 1,
      backgroundColor:
        '#000000',
    },

    content: {
      paddingHorizontal:
        20,
      paddingTop:
        50,
      paddingBottom:
        100,
    },

    abas: {
      flexDirection:
        'row',
      backgroundColor:
        '#1E1E1E',
      borderRadius:
        10,
      padding:
        4,
      marginBottom:
        20,
    },

    abaButton: {
      flex: 1,
      height:
        44,
      alignItems:
        'center',
      justifyContent:
        'center',
      borderRadius:
        8,
    },

    abaAtiva: {
      backgroundColor:
        '#E53935',
    },

    abaText: {
      color:
        '#AAAAAA',
      fontWeight:
        '600',
    },

    abaTextAtiva: {
      color:
        '#FFFFFF',
    },

    fotoButton: {
      height:
        50,
      flexDirection:
        'row',
      gap:
        9,
      borderWidth:
        1,
      borderColor:
        '#E53935',
      borderRadius:
        10,
      alignItems:
        'center',
      justifyContent:
        'center',
      marginBottom:
        10,
    },

    fotoButtonText: {
      color:
        '#FFFFFF',
      fontWeight:
        '700',
    },

    fotoSelecionadaArea: {
      backgroundColor:
        '#1E1E1E',
      borderWidth:
        1,
      borderColor:
        '#333333',
      borderRadius:
        10,
      padding:
        10,
      flexDirection:
        'row',
      alignItems:
        'center',
      gap:
        12,
      marginTop:
        4,
    },

    fotoSelecionada: {
      width:
        62,
      height:
        62,
      borderRadius:
        9,
      backgroundColor:
        '#292929',
    },

    fotoSelecionadaInfo: {
      flex:
        1,
    },

    fotoSelecionadaTexto: {
      color:
        '#FFFFFF',
      fontSize:
        14,
      fontWeight:
        '600',
      marginBottom:
        7,
    },

    removerFotoText: {
      color:
        '#E53935',
      fontSize:
        13,
      fontWeight:
        '700',
    },

    label: {
      color:
        '#FFFFFF',
      fontSize:
        15,
      marginTop:
        15,
      marginBottom:
        7,
    },

    input: {
      height:
        50,
      backgroundColor:
        '#FFFFFF',
      color:
        '#111111',
      borderRadius:
        10,
      paddingHorizontal:
        15,
      fontSize:
        16,
    },

    dropdownButton: {
      height:
        50,
      backgroundColor:
        '#1E1E1E',
      borderWidth:
        1,
      borderColor:
        '#444444',
      borderRadius:
        10,
      paddingHorizontal:
        15,
      flexDirection:
        'row',
      alignItems:
        'center',
      justifyContent:
        'space-between',
    },

    dropdownTexto: {
      color:
        '#FFFFFF',
      fontSize:
        15,
      fontWeight:
        '600',
    },

    dropdownPlaceholder: {
      color:
        '#888888',
      fontWeight:
        '400',
    },

    dropdownMenu: {
      backgroundColor:
        '#1E1E1E',
      borderWidth:
        1,
      borderColor:
        '#444444',
      borderRadius:
        10,
      marginTop:
        5,
      overflow:
        'hidden',
    },

    dropdownMenuFiltro: {
      backgroundColor:
        '#1E1E1E',
      borderWidth:
        1,
      borderColor:
        '#444444',
      borderRadius:
        10,
      marginTop:
        -7,
      marginBottom:
        14,
      overflow:
        'hidden',
    },

    dropdownOpcao: {
      minHeight:
        48,
      justifyContent:
        'center',
      paddingHorizontal:
        15,
      borderBottomWidth:
        1,
      borderBottomColor:
        '#2D2D2D',
    },

    dropdownOpcaoTexto: {
      color:
        '#DDDDDD',
      fontSize:
        14,
      fontWeight:
        '600',
    },

    opcaoSelecionada: {
      color:
        '#E53935',
      fontWeight:
        '800',
    },

    semVencimentoArea: {
      flexDirection:
        'row',
      alignItems:
        'center',
      borderWidth:
        1,
      borderColor:
        '#444444',
      borderRadius:
        10,
      padding:
        14,
      marginTop:
        22,
    },

    checkbox: {
      width:
        25,
      height:
        25,
      borderWidth:
        2,
      borderColor:
        '#777777',
      borderRadius:
        5,
      alignItems:
        'center',
      justifyContent:
        'center',
      marginRight:
        12,
    },

    checkboxAtivo: {
      backgroundColor:
        '#E53935',
      borderColor:
        '#E53935',
    },

    checkboxTexto: {
      color:
        '#FFFFFF',
      fontWeight:
        '900',
    },

    semVencimentoTexto: {
      color:
        '#FFFFFF',
      fontWeight:
        '700',
    },

    button: {
      height:
        52,
      backgroundColor:
        '#E53935',
      borderRadius:
        10,
      alignItems:
        'center',
      justifyContent:
        'center',
      marginTop:
        25,
    },

    buttonText: {
      color:
        '#FFFFFF',
      fontWeight:
        '800',
    },

    filtrosLinha: {
      flexDirection:
        'row',
      gap:
        8,
      marginBottom:
        14,
    },

    filtroDropdown: {
      flex:
        1,
      minWidth:
        0,
      height:
        56,
      backgroundColor:
        '#1E1E1E',
      borderWidth:
        1,
      borderColor:
        '#444444',
      borderRadius:
        10,
      paddingHorizontal:
        11,
      flexDirection:
        'row',
      alignItems:
        'center',
      gap:
        5,
    },

    filtroDropdownTextos: {
      flex:
        1,
      minWidth:
        0,
    },

    filtroNome: {
      color:
        '#777777',
      fontSize:
        10,
      fontWeight:
        '700',
      marginBottom:
        2,
    },

    filtroValor: {
      color:
        '#FFFFFF',
      fontSize:
        12,
      fontWeight:
        '700',
    },

    buscarButton: {
      width:
        52,
      height:
        56,
      backgroundColor:
        '#1E1E1E',
      borderWidth:
        1,
      borderColor:
        '#444444',
      borderRadius:
        10,
      alignItems:
        'center',
      justifyContent:
        'center',
    },

    buscarButtonAtivo: {
      backgroundColor:
        '#E53935',
      borderColor:
        '#E53935',
    },

    buscaArea: {
      height:
        48,
      backgroundColor:
        '#FFFFFF',
      borderRadius:
        10,
      flexDirection:
        'row',
      alignItems:
        'center',
      paddingHorizontal:
        13,
      gap:
        8,
      marginBottom:
        14,
    },

    buscaInput: {
      flex: 1,
      color:
        '#111111',
      fontSize:
        15,
    },

    vazio: {
      backgroundColor:
        '#1E1E1E',
      padding:
        25,
      borderRadius:
        12,
      alignItems:
        'center',
    },

    vazioTitulo: {
      color:
        '#FFFFFF',
      fontWeight:
        '700',
    },

    categoriaGrupo: {
      marginBottom:
        8,
    },

    categoriaTituloArea: {
      flexDirection:
        'row',
      alignItems:
        'center',
      gap:
        10,
      marginTop:
        10,
      marginBottom:
        12,
      paddingHorizontal:
        2,
    },

    categoriaMarcador: {
      width:
        4,
      height:
        22,
      borderRadius:
        3,
      backgroundColor:
        '#E53935',
    },

    categoriaTitulo: {
      color:
        '#FFFFFF',
      fontSize:
        17,
      fontWeight:
        '900',
      textTransform:
        'uppercase',
      letterSpacing:
        0.4,
    },

    produtoCard: {
      backgroundColor:
        '#1E1E1E',
      borderWidth:
        1,
      borderColor:
        '#333333',
      borderRadius:
        14,
      padding:
        15,
      marginBottom:
        16,
    },

    produtoCabecalho: {
      flexDirection:
        'row',
      alignItems:
        'center',
      gap:
        12,
      marginBottom:
        15,
    },

    produtoFoto: {
      width:
        68,
      height:
        68,
      borderRadius:
        11,
      backgroundColor:
        '#292929',
    },

    produtoSemFoto: {
      width:
        68,
      height:
        68,
      borderRadius:
        11,
      backgroundColor:
        '#292929',
      alignItems:
        'center',
      justifyContent:
        'center',
    },

    produtoInfo: {
      flex:
        1,
      minWidth:
        0,
    },

    produtoNome: {
      color:
        '#FFFFFF',
      fontSize:
        18,
      fontWeight:
        '900',
    },

    produtoCategoria: {
      color:
        '#888888',
      fontSize:
        12,
      fontWeight:
        '600',
      marginTop:
        3,
    },

    quantidadeDisponivel: {
      color:
        '#FFFFFF',
      fontSize:
        14,
      fontWeight:
        '800',
      marginTop:
        7,
    },

    estoqueBaixoArea: {
      alignSelf:
        'flex-start',
      flexDirection:
        'row',
      alignItems:
        'center',
      gap:
        5,
      backgroundColor:
        '#2A1717',
      borderWidth:
        1,
      borderColor:
        '#5D2222',
      borderRadius:
        7,
      paddingHorizontal:
        9,
      paddingVertical:
        6,
      marginBottom:
        13,
    },

    estoqueBaixoTexto: {
      color:
        '#E53935',
      fontSize:
        10,
      fontWeight:
        '900',
    },

    comprasTitulo: {
      color:
        '#AAAAAA',
      fontSize:
        12,
      fontWeight:
        '800',
      marginBottom:
        9,
      textTransform:
        'uppercase',
    },

    compraCard: {
      backgroundColor:
        '#151515',
      borderWidth:
        1,
      borderColor:
        '#2E2E2E',
      borderRadius:
        10,
      padding:
        12,
      marginBottom:
        9,
    },

    compraConteudo: {
      flexDirection:
        'row',
      alignItems:
        'center',
      justifyContent:
        'space-between',
      gap:
        12,
    },

    compraInformacoes: {
      flex:
        1,
      minWidth:
        0,
    },

    compraData: {
      color:
        '#FFFFFF',
      fontSize:
        14,
      fontWeight:
        '900',
      marginBottom:
        5,
    },

    compraQuantidade: {
      color:
        '#DDDDDD',
      fontSize:
        13,
      fontWeight:
        '700',
      marginBottom:
        4,
    },

    compraVencimento: {
      fontSize:
        12,
      fontWeight:
        '800',
      marginBottom:
        4,
    },

    vencimentoValido: {
      color:
        '#4CAF50',
    },

    vencimentoProximo: {
      color:
        '#F4B400',
    },

    vencimentoVencido: {
      color:
        '#EF5350',
    },

    vencimentoSemData: {
      color:
        '#AAAAAA',
    },

    compraValor: {
      color:
        '#888888',
      fontSize:
        11,
      fontWeight:
        '600',
    },

    statusCompra: {
      minWidth:
        84,
      minHeight:
        31,
      paddingHorizontal:
        9,
      paddingVertical:
        7,
      borderRadius:
        7,
      alignItems:
        'center',
      justifyContent:
        'center',
    },

    statusCompraValido: {
      backgroundColor:
        '#2E7D32',
    },

    statusCompraProximo: {
      backgroundColor:
        '#C78A00',
    },

    statusCompraVencido: {
      backgroundColor:
        '#B71C1C',
    },

    statusCompraTexto: {
      color:
        '#FFFFFF',
      fontSize:
        9,
      fontWeight:
        '900',
      textAlign:
        'center',
    },

    excluirButton: {
      height:
        44,
      marginTop:
        8,
      borderRadius:
        9,
      borderWidth:
        1,
      borderColor:
        '#E53935',
      flexDirection:
        'row',
      alignItems:
        'center',
      justifyContent:
        'center',
      gap:
        8,
      backgroundColor:
        '#2A1111',
    },

    excluirButtonTexto: {
      color:
        '#FFFFFF',
      fontSize:
        13,
      fontWeight:
        '900',
      letterSpacing:
        0.3,
    },

    modalTela: {
      flex:
        1,
      alignItems:
        'center',
      justifyContent:
        'center',
      paddingHorizontal:
        20,
    },

    modalFundo: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor:
        'rgba(0,0,0,0.78)',
    },

    modalCard: {
      width:
        '100%',
      maxWidth:
        450,
      maxHeight:
        '86%',
      backgroundColor:
        '#1E1E1E',
      borderRadius:
        16,
      borderWidth:
        1,
      borderColor:
        '#3A3A3A',
      padding:
        18,
    },

    modalCabecalho: {
      flexDirection:
        'row',
      alignItems:
        'center',
      justifyContent:
        'space-between',
      gap:
        12,
      marginBottom:
        14,
    },

    modalTitulo: {
      color:
        '#FFFFFF',
      fontSize:
        20,
      fontWeight:
        '900',
    },

    modalFechar: {
      width:
        36,
      height:
        36,
      borderRadius:
        18,
      backgroundColor:
        '#292929',
      alignItems:
        'center',
      justifyContent:
        'center',
    },

    produtoDestaqueModal: {
      backgroundColor:
        '#161616',
      borderWidth:
        1,
      borderColor:
        '#353535',
      borderLeftWidth:
        4,
      borderLeftColor:
        '#E53935',
      borderRadius:
        11,
      paddingHorizontal:
        15,
      paddingVertical:
        14,
      marginBottom:
        20,
    },

    modalProdutoNome: {
      color:
        '#FFFFFF',
      fontSize:
        20,
      fontWeight:
        '900',
    },

    modalPergunta: {
      color:
        '#FFFFFF',
      fontSize:
        14,
      fontWeight:
        '800',
      marginBottom:
        10,
    },

    opcaoExclusao: {
      minHeight:
        58,
      borderWidth:
        1,
      borderColor:
        '#3D3D3D',
      borderRadius:
        11,
      paddingHorizontal:
        14,
      flexDirection:
        'row',
      alignItems:
        'center',
      gap:
        12,
      marginBottom:
        9,
      backgroundColor:
        '#171717',
    },

    opcaoExclusaoAtiva: {
      borderColor:
        '#E53935',
      backgroundColor:
        '#251515',
    },

    radio: {
      width:
        22,
      height:
        22,
      borderRadius:
        11,
      borderWidth:
        2,
      borderColor:
        '#777777',
      alignItems:
        'center',
      justifyContent:
        'center',
    },

    radioAtivo: {
      borderColor:
        '#E53935',
    },

    radioCentro: {
      width:
        10,
      height:
        10,
      borderRadius:
        5,
      backgroundColor:
        '#E53935',
    },

    opcaoExclusaoTitulo: {
      color:
        '#FFFFFF',
      fontSize:
        15,
      fontWeight:
        '800',
    },

    comprasSelecaoArea: {
      marginTop:
        9,
      marginBottom:
        14,
    },

    comprasSelecaoTitulo: {
      color:
        '#FFFFFF',
      fontSize:
        13,
      fontWeight:
        '800',
      marginBottom:
        8,
    },

    comprasSelecaoLista: {
      maxHeight:
        240,
    },

    compraSelecao: {
      borderWidth:
        1,
      borderColor:
        '#383838',
      borderRadius:
        10,
      padding:
        10,
      flexDirection:
        'row',
      alignItems:
        'center',
      gap:
        10,
      marginBottom:
        8,
      backgroundColor:
        '#151515',
    },

    compraSelecaoAtiva: {
      borderColor:
        '#E53935',
      backgroundColor:
        '#251515',
    },

    compraSelecaoInfo: {
      flex:
        1,
      minWidth:
        0,
    },

    compraSelecaoData: {
      color:
        '#FFFFFF',
      fontSize:
        13,
      fontWeight:
        '800',
    },

    compraSelecaoDetalhe: {
      color:
        '#BBBBBB',
      fontSize:
        11,
      fontWeight:
        '600',
      marginTop:
        3,
    },

    compraSelecaoVencimento: {
      fontSize:
        10,
      fontWeight:
        '700',
      marginTop:
        3,
    },

    statusCompraModal: {
      minWidth:
        70,
      borderRadius:
        6,
      paddingHorizontal:
        6,
      paddingVertical:
        6,
      alignItems:
        'center',
      justifyContent:
        'center',
    },

    statusCompraModalTexto: {
      color:
        '#FFFFFF',
      fontSize:
        8,
      fontWeight:
        '900',
      textAlign:
        'center',
    },

    modalBotoes: {
      flexDirection:
        'row',
      gap:
        10,
      marginTop:
        8,
    },

    cancelarButton: {
      flex:
        1,
      height:
        46,
      borderRadius:
        9,
      backgroundColor:
        '#292929',
      alignItems:
        'center',
      justifyContent:
        'center',
    },

    cancelarButtonTexto: {
      color:
        '#FFFFFF',
      fontSize:
        12,
      fontWeight:
        '800',
    },

    confirmarExcluirButton: {
      flex:
        1,
      height:
        46,
      borderRadius:
        9,
      backgroundColor:
        '#E53935',
      flexDirection:
        'row',
      gap:
        7,
      alignItems:
        'center',
      justifyContent:
        'center',
    },

    confirmarExcluirButtonDesabilitado: {
      opacity:
        0.35,
    },

    confirmarExcluirButtonTexto: {
      color:
        '#FFFFFF',
      fontSize:
        12,
      fontWeight:
        '900',
    },
  });