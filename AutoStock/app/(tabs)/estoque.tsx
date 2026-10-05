import {
  comprasVisiveis,
  converterData,
  produtoEstoqueBaixo,
  produtoTemProximo,
  produtoTemVencido,
  quantidadeDaCompraDisponivel,
  quantidadeDisponivel,
  situacaoVencimento,
} from '@/utils/estoque';

import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRef, useState } from 'react';
import { ActivityIndicator, Alert, Image, Keyboard, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { AppHeader } from '@/components/app-header';
import { type CategoriaProduto, type CompraProduto, type Produto, useAppData } from '@/contexts/app-data-context';

type Aba = 'novo' | 'produtos';

type ModoCadastro = 'produto' | 'compra';

type FiltroCategoria = 'Todos' | CategoriaProduto;

type FiltroSituacao = 'todos' | 'baixo' | 'proximo' | 'vencidos';

type ModoExclusao = 'produto' | 'compra' | null;

const categorias: CategoriaProduto[] = ['Lavagem Interna', 'Lavagem Externa', 'Vidros', 'Acabamento'];

export default function EstoqueScreen() {
  const [aba, setAba] = useState<Aba>('novo');
  const [categoriaCadastroAberta, setCategoriaCadastroAberta] = useState(false);
  const [categoriaFiltroAberta, setCategoriaFiltroAberta] = useState(false);
  const [situacaoFiltroAberta, setSituacaoFiltroAberta] = useState(false);
  const [buscaAberta, setBuscaAberta] = useState(false);
  const [filtroCategoria, setFiltroCategoria] = useState<FiltroCategoria>('Todos');
  const [filtroSituacao, setFiltroSituacao] = useState<FiltroSituacao>('todos');
  const [buscaProduto, setBuscaProduto] = useState('');
  const [nome, setNome] = useState('');
  const [categoria, setCategoria] = useState<CategoriaProduto | null>(null);
  const [valor, setValor] = useState('');
  const [quantidade, setQuantidade] = useState('');
  const [dataCompra, setDataCompra] = useState('');
  const [dataVencimento, setDataVencimento] = useState('');
  const [semVencimento, setSemVencimento] = useState(false);
  const [foto, setFoto] = useState<string | null>(null);
  const [fotoAmpliada, setFotoAmpliada] = useState<{
    uri: string;
    nome: string;
  } | null>(null);
  const [modoCadastro, setModoCadastro] = useState<ModoCadastro>('produto');
  const [produtoParaAdicionar, setProdutoParaAdicionar] = useState<Produto | null>(null);
  const [salvandoProduto, setSalvandoProduto] = useState(false);
  const [modalRetiradaAberto, setModalRetiradaAberto] = useState(false);
  const [produtoParaRetirar, setProdutoParaRetirar] = useState<Produto | null>(null);
  const [compraRetiradaSelecionadaId, setCompraRetiradaSelecionadaId] = useState<number | null>(null);
  const [quantidadeRetirada, setQuantidadeRetirada] = useState('');
  const [retirandoUnidades, setRetirandoUnidades] = useState(false);
  const [modalExcluirAberto, setModalExcluirAberto] = useState(false);
  const [produtoParaExcluir, setProdutoParaExcluir] = useState<Produto | null>(null);
  const [modoExclusao, setModoExclusao] = useState<ModoExclusao>(null);
  const [compraSelecionadaId, setCompraSelecionadaId] = useState<number | null>(null);
  const nomeRef = useRef<TextInput>(null);
  const valorRef = useRef<TextInput>(null);
  const quantidadeRef = useRef<TextInput>(null);
  const dataCompraRef = useRef<TextInput>(null);
  const dataVencimentoRef = useRef<TextInput>(null);
  const scrollRef = useRef<ScrollView>(null);

  const {
    produtos,
    cadastrarProduto,
    adicionarCompraProduto,
    retirarUnidadesProduto,
    excluirProdutoDoEstoque,
    excluirCompraDoEstoque
  } = useAppData();

  async function selecionarFoto() {
    Keyboard.dismiss();

    const permissao = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissao.granted) {
      Alert.alert('Permissão necessária', 'O AUTOCAR precisa de acesso às fotos.');
      return;
    }

    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      shape: 'rectangle',
      quality: 0.9
    });

    if (!resultado.canceled) {
      setFoto(resultado.assets[0].uri);
    }
  }

  function formatarData(texto: string) {
    const numeros = texto.replace(/\D/g, '').slice(0, 8);

    if (numeros.length <= 2) {
      return numeros;
    }

    if (numeros.length <= 4) {
      return `${numeros.slice(0, 2)}/${numeros.slice(2)}`;
    }

    return `${numeros.slice(0, 2)}/${numeros.slice(2, 4)}/${numeros.slice(4)}`;
  }

  function formatarMoeda(texto: string) {
    let valorLimpo = texto.replace('R$', '').trim();
    valorLimpo = valorLimpo.replace(/[^\d,]/g, '');

    const partes = valorLimpo.split(',');
    let inteiro = partes[0] || '';

    if (inteiro.length > 1) {
      inteiro = inteiro.replace(/^0+/, '') || '0';
    }

    if (partes.length > 1) {
      const centavos = partes[1].slice(0, 2);
      return `R$ ${inteiro},${centavos}`;
    }

    return `R$ ${inteiro}`;
  }

  function converterMoeda(texto: string) {
    const numero = texto.replace('R$', '').replace(/\./g, '').replace(',', '.').trim();
    return Number(numero) || 0;
  }

  function dataValida(dataTexto: string) {
    return converterData(dataTexto) !== null;
  }

  function comprasDisponiveisParaRetirada(produto: Produto) {
    return comprasVisiveis(produto).filter(compra => situacaoVencimento(compra.dataVencimento) !== 'vencido' && quantidadeDaCompraDisponivel(compra) > 0).sort((compraA, compraB) => {
      const vencimentoA = compraA.dataVencimento ? converterData(compraA.dataVencimento)?.getTime() ?? Number.MAX_SAFE_INTEGER : Number.MAX_SAFE_INTEGER;
      const vencimentoB = compraB.dataVencimento ? converterData(compraB.dataVencimento)?.getTime() ?? Number.MAX_SAFE_INTEGER : Number.MAX_SAFE_INTEGER;

      return vencimentoA - vencimentoB;
    });
  }

  function limparDadosCompra() {
    setValor('');
    setQuantidade('');
    setDataCompra('');
    setDataVencimento('');
    setSemVencimento(false);
    setCategoriaCadastroAberta(false);
  }

  function limparFormulario() {
    setNome('');
    setCategoria(null);
    setFoto(null);
    limparDadosCompra();
  }

  async function salvarProduto() {
    if (salvandoProduto) {
      return;
    }

    Keyboard.dismiss();

    const valorNumero = converterMoeda(valor);
    const quantidadeNumero = Number(quantidade.replace(',', '.')) || 0;

    if (modoCadastro === 'produto' && (!nome.trim() || !categoria) || modoCadastro === 'compra' && !produtoParaAdicionar || !valor || !quantidade || !dataCompra) {
      Alert.alert('Atenção', 'Preencha todos os campos obrigatórios.');
      return;
    }

    if (!semVencimento && !dataVencimento) {
      Alert.alert('Atenção', 'Informe a data de vencimento ou marque Produto sem vencimento.');
      return;
    }

    if (valorNumero <= 0) {
      Alert.alert('Valor inválido', 'Informe o valor da compra.');
      return;
    }

    if (quantidadeNumero <= 0) {
      Alert.alert('Quantidade inválida', 'Informe uma quantidade maior que zero.');
      return;
    }

    if (!dataValida(dataCompra)) {
      Alert.alert('Data inválida', 'Informe uma data de compra válida.');
      return;
    }

    if (!semVencimento && !dataValida(dataVencimento)) {
      Alert.alert('Data inválida', 'Informe uma data de vencimento válida.');
      return;
    }

    if (!semVencimento) {
      const compra = converterData(dataCompra);
      const vencimento = converterData(dataVencimento);

      if (compra && vencimento && vencimento.getTime() < compra.getTime()) {
        Alert.alert('Data de vencimento inválida', 'A data de vencimento não pode ser anterior à data da compra.');
        return;
      }
    }

    setSalvandoProduto(true);

    try {
      const dadosCompra = {
        quantidade: quantidadeNumero,
        valor: valorNumero,
        dataCompra,
        dataVencimento: semVencimento ? null : dataVencimento
      };

      if (modoCadastro === 'produto') {
        if (!categoria) {
          return;
        }

        await cadastrarProduto({
          nome,
          categoria,
          foto,
          ...dadosCompra
        });
      } else if (produtoParaAdicionar) {
        await adicionarCompraProduto(produtoParaAdicionar.id, dadosCompra);
      }
    } catch (erro) {
      Alert.alert('Não foi possível cadastrar', erro instanceof Error ? erro.message : 'Verifique a conexão com o servidor.');
      return;
    } finally {
      setSalvandoProduto(false);
    }

    limparFormulario();
    setModoCadastro('produto');
    setProdutoParaAdicionar(null);
    setFiltroCategoria('Todos');
    setFiltroSituacao('todos');
    setBuscaProduto('');
    setBuscaAberta(false);
    setAba('produtos');

    Alert.alert('AUTOCAR', modoCadastro === 'produto' ? 'Produto cadastrado no estoque.' : 'Unidades adicionadas ao estoque.');
  }

  function rolarParaBaixo() {
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({
        animated: true
      });
    }, 180);
  }

  function selecionarCategoriaCadastro(item: CategoriaProduto) {
    setCategoria(item);
    setCategoriaCadastroAberta(false);

    setTimeout(() => {
      valorRef.current?.focus();
    }, 120);
  }

  function selecionarCategoriaFiltro(item: FiltroCategoria) {
    Keyboard.dismiss();
    setFiltroCategoria(item);
    setCategoriaFiltroAberta(false);
    setSituacaoFiltroAberta(false);
  }

  function selecionarSituacaoFiltro(item: FiltroSituacao) {
    Keyboard.dismiss();
    setFiltroSituacao(item);
    setSituacaoFiltroAberta(false);
    setCategoriaFiltroAberta(false);
  }

  function textoSituacao() {
    if (filtroSituacao === 'baixo') {
      return 'Estoque baixo';
    }

    if (filtroSituacao === 'proximo') {
      return 'Próx. vencimento';
    }

    if (filtroSituacao === 'vencidos') {
      return 'Vencidos';
    }

    return 'Todos';
  }

  const produtosVisiveis = produtos.filter(produto => produto.removido !== true);

  const produtosFiltrados = produtosVisiveis.filter(produto => {
    const categoriaOk = filtroCategoria === 'Todos' || produto.categoria === filtroCategoria;
    const buscaOk = !buscaProduto.trim() || produto.nome.toLowerCase().includes(buscaProduto.trim().toLowerCase());

    let situacaoOk = true;

    if (filtroSituacao === 'baixo') {
      situacaoOk = produtoEstoqueBaixo(produto);
    }

    if (filtroSituacao === 'proximo') {
      situacaoOk = produtoTemProximo(produto);
    }

    if (filtroSituacao === 'vencidos') {
      situacaoOk = produtoTemVencido(produto);
    }

    return categoriaOk && buscaOk && situacaoOk;
  });

  const categoriasVisiveis = categorias.filter(categoriaAtual => produtosFiltrados.some(produto => produto.categoria === categoriaAtual));

  function formatarValor(valorNumero: number) {
    const numero = Number(valorNumero);

    if (!Number.isFinite(numero)) {
      return '0,00';
    }

    return numero.toFixed(2).replace('.', ',');
  }

  function trocarAba(novaAba: Aba) {
    Keyboard.dismiss();
    setAba(novaAba);
    setCategoriaCadastroAberta(false);
    setCategoriaFiltroAberta(false);
    setSituacaoFiltroAberta(false);
  }

  function iniciarCadastroProduto() {
    limparFormulario();
    setModoCadastro('produto');
    setProdutoParaAdicionar(null);
    trocarAba('novo');
  }

  function abrirAdicionarUnidades(produto: Produto) {
    limparFormulario();
    setModoCadastro('compra');
    setProdutoParaAdicionar(produto);
    trocarAba('novo');

    setTimeout(() => {
      scrollRef.current?.scrollTo({
        y: 0,
        animated: true
      });
    }, 80);
  }

  function cancelarAdicionarUnidades() {
    limparFormulario();
    setModoCadastro('produto');
    setProdutoParaAdicionar(null);
    trocarAba('produtos');
  }

  function abrirModalRetirada(produto: Produto) {
    Keyboard.dismiss();

    const comprasDisponiveis = comprasDisponiveisParaRetirada(produto);

    setProdutoParaRetirar(produto);
    setCompraRetiradaSelecionadaId(comprasDisponiveis.length === 1 ? comprasDisponiveis[0].id : null);
    setQuantidadeRetirada('');
    setModalRetiradaAberto(true);
  }

  function fecharModalRetirada() {
    if (retirandoUnidades) {
      return;
    }

    setModalRetiradaAberto(false);
    setProdutoParaRetirar(null);
    setCompraRetiradaSelecionadaId(null);
    setQuantidadeRetirada('');
  }

  async function confirmarRetirada() {
    if (!produtoParaRetirar || retirandoUnidades) {
      return;
    }

    if (compraRetiradaSelecionadaId === null) {
      Alert.alert('Escolha a compra', 'Selecione de qual compra deseja retirar as unidades.');
      return;
    }

    const compraEscolhida = comprasDisponiveisParaRetirada(produtoParaRetirar).find(compra => compra.id === compraRetiradaSelecionadaId);

    if (!compraEscolhida) {
      Alert.alert('Compra indisponível', 'Escolha uma compra que ainda possua unidades disponíveis.');
      return;
    }

    const quantidadeNumero = Number(quantidadeRetirada.replace(',', '.'));

    if (!Number.isFinite(quantidadeNumero) || quantidadeNumero <= 0) {
      Alert.alert('Quantidade inválida', 'Informe uma quantidade maior que zero.');
      return;
    }

    const saldoDaCompra = quantidadeDaCompraDisponivel(compraEscolhida);

    if (quantidadeNumero > saldoDaCompra) {
      Alert.alert('Quantidade indisponível', `A compra escolhida possui ${saldoDaCompra} ${saldoDaCompra === 1 ? 'unidade' : 'unidades'} disponíveis.`);
      return;
    }

    setRetirandoUnidades(true);

    try {
      await retirarUnidadesProduto(produtoParaRetirar.id, compraEscolhida.id, quantidadeNumero);
    } catch (erro) {
      Alert.alert('Não foi possível retirar', erro instanceof Error ? erro.message : 'Tente novamente.');
      return;
    } finally {
      setRetirandoUnidades(false);
    }

    setModalRetiradaAberto(false);
    setProdutoParaRetirar(null);
    setCompraRetiradaSelecionadaId(null);
    setQuantidadeRetirada('');

    Alert.alert('AUTOCAR', `${quantidadeNumero} ${quantidadeNumero === 1 ? 'unidade retirada' : 'unidades retiradas'} da compra com vencimento ${compraEscolhida.dataVencimento ?? 'não informado'}.`);
  }

  function abrirModalExcluir(produto: Produto) {
    Keyboard.dismiss();
    setProdutoParaExcluir(produto);
    setModoExclusao(null);
    setCompraSelecionadaId(null);
    setModalExcluirAberto(true);
  }

  function fecharModalExcluir() {
    setModalExcluirAberto(false);
    setProdutoParaExcluir(null);
    setModoExclusao(null);
    setCompraSelecionadaId(null);
  }

  async function confirmarExclusao() {
    if (!produtoParaExcluir) {
      return;
    }

    if (modoExclusao === 'produto') {
      try {
        await excluirProdutoDoEstoque(produtoParaExcluir.id);
      } catch (erro) {
        Alert.alert('Não foi possível excluir', erro instanceof Error ? erro.message : 'Verifique a conexão com o servidor.');
        return;
      }

      fecharModalExcluir();
      Alert.alert('AUTOCAR', 'Produto excluído do estoque.');
      return;
    }

    if (modoExclusao === 'compra' && compraSelecionadaId !== null) {
      try {
        await excluirCompraDoEstoque(produtoParaExcluir.id, compraSelecionadaId);
      } catch (erro) {
        Alert.alert('Não foi possível excluir', erro instanceof Error ? erro.message : 'Verifique a conexão com o servidor.');
        return;
      }

      fecharModalExcluir();
      Alert.alert('AUTOCAR', 'Compra excluída do estoque.');
    }
  }

  const podeConfirmarExclusao = modoExclusao === 'produto' || modoExclusao === 'compra' && compraSelecionadaId !== null;

  function textoStatusCompra(compra: CompraProduto) {
    if (quantidadeDaCompraDisponivel(compra) <= 0) {
      return 'ESGOTADO';
    }

    const situacao = situacaoVencimento(compra.dataVencimento);

    if (situacao === 'vencido') {
      return 'VENCIDO';
    }

    if (situacao === 'proximo') {
      return 'PRÓX. VENC.';
    }

    return 'VÁLIDO';
  }

  function estiloStatusCompra(compra: CompraProduto) {
    if (quantidadeDaCompraDisponivel(compra) <= 0) {
      return styles.statusCompraEsgotado;
    }

    const situacao = situacaoVencimento(compra.dataVencimento);

    if (situacao === 'vencido') {
      return styles.statusCompraVencido;
    }

    if (situacao === 'proximo') {
      return styles.statusCompraProximo;
    }

    return styles.statusCompraValido;
  }

  function estiloVencimentoTexto(compra: CompraProduto) {
    const situacao = situacaoVencimento(compra.dataVencimento);

    if (situacao === 'vencido') {
      return styles.vencimentoVencido;
    }

    if (situacao === 'proximo') {
      return styles.vencimentoProximo;
    }

    if (situacao === 'valido') {
      return styles.vencimentoValido;
    }

    return styles.vencimentoSemData;
  }

  function renderizarProduto(produto: Produto) {
    const disponivel = quantidadeDisponivel(produto);
    const compras = comprasVisiveis(produto);

    if (compras.length === 0) {
      return null;
    }

    return <View key={produto.id} style={styles.produtoCard}>
        <View style={styles.produtoCabecalho}>
          {produto.foto ? <TouchableOpacity style={styles.produtoFotoMoldura} onPress={() => setFotoAmpliada({
          uri: produto.foto as string,
          nome: produto.nome
        })} activeOpacity={0.82} accessibilityRole="button" accessibilityLabel={`Ampliar foto de ${produto.nome}`}>
              <Image source={{
            uri: produto.foto
          }} style={styles.produtoFoto} resizeMode="contain" />

              <View style={styles.produtoFotoAmpliarIcone} pointerEvents="none">
                <Ionicons name="expand-outline" size={13} color="#FFFFFF" />
              </View>
            </TouchableOpacity> : <View style={styles.produtoSemFoto}>
              <Ionicons name="image-outline" size={27} color="#666666" />
            </View>}

          <View style={styles.produtoInfo}>
            <Text style={styles.produtoNome} numberOfLines={2}>
              {produto.nome}
            </Text>

            <Text style={styles.produtoCategoria}>
              {produto.categoria}
            </Text>

            <Text style={styles.quantidadeDisponivel}>
              {disponivel}{' '}
              {disponivel === 1 ? 'unidade' : 'unidades'}
            </Text>
          </View>
        </View>

        {produtoEstoqueBaixo(produto) && <View style={styles.estoqueBaixoArea}>
            <Ionicons name="warning-outline" size={15} color="#E53935" />

            <Text style={styles.estoqueBaixoTexto}>
              ESTOQUE BAIXO
            </Text>
          </View>}

        <Text style={styles.comprasTitulo}>
          Compras registradas
        </Text>

        {compras.map(compra => <View key={compra.id} style={styles.compraCard}>
              <View style={styles.compraConteudo}>
                <View style={styles.compraInformacoes}>
                  <Text style={styles.compraData}>
                    {compra.dataCompra}
                  </Text>

                  <Text style={[styles.compraVencimento, estiloVencimentoTexto(compra)]}>
                    Vence:{' '}
                    {compra.dataVencimento ?? 'Sem vencimento'}
                  </Text>

                  <Text style={styles.compraValor}>
                    Valor: R${' '}
                    {formatarValor(compra.valor)}
                  </Text>

                  <Text style={styles.compraQuantidade}>
                    {quantidadeDaCompraDisponivel(compra)}{' '}
                    {quantidadeDaCompraDisponivel(compra) === 1 ? 'unidade' : 'unidades'}
                  </Text>
                </View>

                <View style={[styles.statusCompra, estiloStatusCompra(compra)]}>
                  <Text style={styles.statusCompraTexto}>
                    {textoStatusCompra(compra)}
                  </Text>
                </View>
              </View>
            </View>)}

        <View style={styles.movimentacaoBotoes}>
          <TouchableOpacity style={styles.adicionarUnidadesButton} onPress={() => abrirAdicionarUnidades(produto)} activeOpacity={0.75}>
            <Ionicons name="add-circle-outline" size={18} color="#31C76A" />

            <Text style={styles.adicionarUnidadesTexto}>
              ADICIONAR
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.retirarUnidadesButton, disponivel <= 0 && styles.movimentacaoButtonDesabilitado]} onPress={() => abrirModalRetirada(produto)} disabled={disponivel <= 0} activeOpacity={0.75}>
            <Ionicons name="remove-circle-outline" size={18} color="#FFB74D" />

            <Text style={styles.retirarUnidadesTexto}>
              RETIRAR
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.excluirButton} onPress={() => abrirModalExcluir(produto)} activeOpacity={0.75}>
          <Ionicons name="trash-outline" size={18} color="#FFFFFF" />

          <Text style={styles.excluirButtonTexto}>
            EXCLUIR REGISTRO
          </Text>
        </TouchableOpacity>
      </View>;
  }

  return <KeyboardAvoidingView style={styles.keyboardContainer} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView ref={scrollRef} style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" showsVerticalScrollIndicator={false}>
        <AppHeader />

        <View style={styles.abas}>
          <TouchableOpacity style={[styles.abaButton, aba === 'novo' && styles.abaAtiva]} onPress={iniciarCadastroProduto}>
            <Text style={[styles.abaText, aba === 'novo' && styles.abaTextAtiva]}>
              Cadastrar produto
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.abaButton, aba === 'produtos' && styles.abaAtiva]} onPress={() => trocarAba('produtos')}>
            <Text style={[styles.abaText, aba === 'produtos' && styles.abaTextAtiva]}>
              Produtos
            </Text>
          </TouchableOpacity>
        </View>

        {aba === 'novo' && <>
            {modoCadastro === 'produto' ? <>
            <TouchableOpacity style={styles.fotoButton} onPress={selecionarFoto}>
              <Ionicons name="image-outline" size={21} color="#FFFFFF" />

              <Text style={styles.fotoButtonText}>
                SELECIONAR FOTO
              </Text>
            </TouchableOpacity>

            {foto && <View style={styles.fotoSelecionadaArea}>
                <View style={styles.fotoSelecionadaMoldura}>
                  <Image source={{
                uri: foto
              }} style={styles.fotoSelecionada} resizeMode="contain" />
                </View>

                <View style={styles.fotoSelecionadaInfo}>
                  <Text style={styles.fotoSelecionadaTexto}>
                    Foto selecionada
                  </Text>

                  <TouchableOpacity onPress={() => setFoto(null)}>
                    <Text style={styles.removerFotoText}>
                      Remover
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>}

            <Text style={styles.label}>
              Nome do produto
            </Text>

            <TextInput ref={nomeRef} style={styles.input} value={nome} onChangeText={setNome} placeholder="Nome do produto" placeholderTextColor="#777777" returnKeyType="next" onSubmitEditing={() => {
            Keyboard.dismiss();
          }} />

            <Text style={styles.label}>
              Categoria
            </Text>

            <TouchableOpacity style={styles.dropdownButton} onPress={() => {
            Keyboard.dismiss();
            setCategoriaCadastroAberta(!categoriaCadastroAberta);
          }}>
              <Text style={[styles.dropdownTexto, !categoria && styles.dropdownPlaceholder]}>
                {categoria || 'Selecione uma categoria'}
              </Text>

              <Ionicons name={categoriaCadastroAberta ? 'chevron-up' : 'chevron-down'} size={20} color="#AAAAAA" />
            </TouchableOpacity>

            {categoriaCadastroAberta && <View style={styles.dropdownMenu}>
                {categorias.map(item => <TouchableOpacity key={item} style={styles.dropdownOpcao} onPress={() => selecionarCategoriaCadastro(item)}>
                      <Text style={styles.dropdownOpcaoTexto}>
                        {item}
                      </Text>
                    </TouchableOpacity>)}
              </View>}
              </> : <>
                <Text style={styles.label}>
                  Produto
                </Text>

                <View style={styles.produtoSelecionadoCard}>
                  <View style={styles.produtoSelecionadoInfo}>
                    <Text style={styles.produtoSelecionadoRotulo}>
                      PRODUTO ESCOLHIDO
                    </Text>

                    <Text style={styles.produtoSelecionadoNome}>
                      {produtoParaAdicionar?.nome}
                    </Text>

                    <Text style={styles.produtoSelecionadoCategoria}>
                      {produtoParaAdicionar?.categoria}
                    </Text>
                  </View>

                  <View style={styles.produtoSelecionadoAcoes}>
                    <TouchableOpacity style={styles.cancelarAdicaoButton} onPress={cancelarAdicionarUnidades}>
                      <Ionicons name="close" size={20} color="#AAAAAA" />
                    </TouchableOpacity>
                  </View>
                </View>
              </>}

            <Text style={styles.label}>
              Valor
            </Text>

            <TextInput ref={valorRef} style={styles.input} value={valor} onFocus={() => {
          if (!valor) {
            setValor('R$ ');
          }
        }} onChangeText={texto => setValor(formatarMoeda(texto))} placeholder="R$ 0,00" placeholderTextColor="#777777" keyboardType="decimal-pad" returnKeyType="next" submitBehavior="submit" onSubmitEditing={() => quantidadeRef.current?.focus()} />

            <Text style={styles.label}>
              Quantidade
            </Text>

            <TextInput ref={quantidadeRef} style={styles.input} value={quantidade} onChangeText={setQuantidade} placeholder="Quantidade" placeholderTextColor="#777777" keyboardType="numeric" returnKeyType="next" submitBehavior="submit" onSubmitEditing={() => dataCompraRef.current?.focus()} />

            <Text style={styles.label}>
              Data da compra
            </Text>

            <TextInput ref={dataCompraRef} style={styles.input} value={dataCompra} onChangeText={texto => setDataCompra(formatarData(texto))} placeholder="DD/MM/AAAA" placeholderTextColor="#777777" keyboardType="numeric" maxLength={10} returnKeyType={semVencimento ? 'done' : 'next'} submitBehavior="submit" onFocus={rolarParaBaixo} onSubmitEditing={() => {
          if (semVencimento) {
            Keyboard.dismiss();
            return;
          }
          dataVencimentoRef.current?.focus();
        }} />

            <TouchableOpacity style={styles.semVencimentoArea} onPress={() => {
          Keyboard.dismiss();
          const novoValor = !semVencimento;
          setSemVencimento(novoValor);
          if (novoValor) {
            setDataVencimento('');
          }
        }}>
              <View style={[styles.checkbox, semVencimento && styles.checkboxAtivo]}>
                {semVencimento && <Text style={styles.checkboxTexto}>
                    ✓
                  </Text>}
              </View>

              <Text style={styles.semVencimentoTexto}>
                Produto sem vencimento
              </Text>
            </TouchableOpacity>

            {!semVencimento && <>
                <Text style={styles.label}>
                  Data de vencimento
                </Text>

                <TextInput ref={dataVencimentoRef} style={styles.input} value={dataVencimento} onChangeText={texto => setDataVencimento(formatarData(texto))} placeholder="DD/MM/AAAA" placeholderTextColor="#777777" keyboardType="numeric" maxLength={10} returnKeyType="done" onFocus={rolarParaBaixo} onSubmitEditing={() => Keyboard.dismiss()} />
              </>}

            <TouchableOpacity style={[styles.button, salvandoProduto && styles.buttonDesabilitado]} onPress={salvarProduto} disabled={salvandoProduto}>
              {salvandoProduto ? <View style={styles.buttonConteudo}>
                  <ActivityIndicator size="small" color="#FFFFFF" />

                  <Text style={styles.buttonText}>
                    {modoCadastro === 'produto' ? 'CADASTRANDO...' : 'ADICIONANDO...'}
                  </Text>
                </View> : <Text style={styles.buttonText}>
                  {modoCadastro === 'produto' ? 'CADASTRAR PRODUTO' : 'ADICIONAR UNIDADES'}
                </Text>}
            </TouchableOpacity>
          </>}

        {aba === 'produtos' && <>
            <View style={styles.filtrosLinha}>
              <TouchableOpacity style={styles.filtroDropdown} onPress={() => {
            Keyboard.dismiss();
            setCategoriaFiltroAberta(!categoriaFiltroAberta);
            setSituacaoFiltroAberta(false);
          }}>
                <View style={styles.filtroDropdownTextos}>
                  <Text style={styles.filtroNome}>
                    Categoria
                  </Text>

                  <Text style={styles.filtroValor} numberOfLines={1}>
                    {filtroCategoria}
                  </Text>
                </View>

                <Ionicons name={categoriaFiltroAberta ? 'chevron-up' : 'chevron-down'} size={18} color="#AAAAAA" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.filtroDropdown} onPress={() => {
            Keyboard.dismiss();
            setSituacaoFiltroAberta(!situacaoFiltroAberta);
            setCategoriaFiltroAberta(false);
          }}>
                <View style={styles.filtroDropdownTextos}>
                  <Text style={styles.filtroNome}>
                    Situação
                  </Text>

                  <Text style={styles.filtroValor} numberOfLines={1}>
                    {textoSituacao()}
                  </Text>
                </View>

                <Ionicons name={situacaoFiltroAberta ? 'chevron-up' : 'chevron-down'} size={18} color="#AAAAAA" />
              </TouchableOpacity>

              <TouchableOpacity style={[styles.buscarButton, buscaAberta && styles.buscarButtonAtivo]} onPress={() => {
            Keyboard.dismiss();
            setBuscaAberta(!buscaAberta);
            setCategoriaFiltroAberta(false);
            setSituacaoFiltroAberta(false);
            if (buscaAberta) {
              setBuscaProduto('');
            }
          }}>
                <Ionicons name="search" size={21} color={buscaAberta ? '#FFFFFF' : '#AAAAAA'} />
              </TouchableOpacity>
            </View>

            {categoriaFiltroAberta && <View style={styles.dropdownMenuFiltro}>
                {['Todos', ...categorias].map(item => <TouchableOpacity key={item} style={styles.dropdownOpcao} onPress={() => selecionarCategoriaFiltro(item as FiltroCategoria)}>
                      <Text style={[styles.dropdownOpcaoTexto, filtroCategoria === item && styles.opcaoSelecionada]}>
                        {item}
                      </Text>
                    </TouchableOpacity>)}
              </View>}

            {situacaoFiltroAberta && <View style={styles.dropdownMenuFiltro}>
                {[['todos', 'Todos'], ['baixo', 'Estoque baixo'], ['proximo', 'Próx. vencimento'], ['vencidos', 'Vencidos']].map(([valorFiltro, texto]) => <TouchableOpacity key={valorFiltro} style={styles.dropdownOpcao} onPress={() => selecionarSituacaoFiltro(valorFiltro as FiltroSituacao)}>
                      <Text style={[styles.dropdownOpcaoTexto, filtroSituacao === valorFiltro && styles.opcaoSelecionada]}>
                        {texto}
                      </Text>
                    </TouchableOpacity>)}
              </View>}

            {buscaAberta && <View style={styles.buscaArea}>
                <Ionicons name="search" size={19} color="#777777" />

                <TextInput style={styles.buscaInput} value={buscaProduto} onChangeText={setBuscaProduto} placeholder="Buscar produto" placeholderTextColor="#777777" autoFocus returnKeyType="done" onSubmitEditing={() => Keyboard.dismiss()} />

                {buscaProduto.length > 0 && <TouchableOpacity onPress={() => setBuscaProduto('')}>
                    <Ionicons name="close-circle" size={21} color="#777777" />
                  </TouchableOpacity>}
              </View>}

            {produtosFiltrados.length === 0 ? <View style={styles.vazio}>
                <Text style={styles.vazioTitulo}>
                  Nenhum produto
                </Text>
              </View> : categoriasVisiveis.map(categoriaAtual => {
          const produtosCategoria = produtosFiltrados.filter(produto => produto.categoria === categoriaAtual);

          return <View key={categoriaAtual} style={styles.categoriaGrupo}>
                      <View style={styles.categoriaTituloArea}>
                        <View style={styles.categoriaMarcador} />

                        <Text style={styles.categoriaTitulo}>
                          {categoriaAtual}
                        </Text>
                      </View>

                      {produtosCategoria.map(produto => renderizarProduto(produto))}
                    </View>;
        })}
          </>}
      </ScrollView>

      <Modal visible={modalRetiradaAberto} transparent animationType="fade" statusBarTranslucent onRequestClose={fecharModalRetirada}>
        <View style={styles.modalTela}>
          <Pressable style={styles.modalFundo} onPress={fecharModalRetirada} />

          <View style={styles.modalCard}>
            <View style={styles.modalCabecalho}>
              <Text style={styles.modalTitulo}>
                Retirar unidades
              </Text>

              <TouchableOpacity style={styles.modalFechar} onPress={fecharModalRetirada} disabled={retirandoUnidades}>
                <Ionicons name="close" size={24} color="#AAAAAA" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalPergunta}>
              Produto
            </Text>

            <View style={[styles.produtoDestaqueModal, styles.produtoDestaqueRetirada]}>
              <View style={styles.modalProdutoSelecionadoConteudo}>
                <View style={styles.produtoSelecionadoInfo}>
                  <Text style={styles.modalProdutoNome} numberOfLines={2}>
                    {produtoParaRetirar?.nome}
                  </Text>

                  <Text style={styles.modalEstoqueDisponivel}>
                    {produtoParaRetirar ? quantidadeDisponivel(produtoParaRetirar) : 0}{' '}
                    {produtoParaRetirar && quantidadeDisponivel(produtoParaRetirar) === 1 ? 'unidade' : 'unidades'}
                  </Text>
                </View>
              </View>
            </View>

            {produtoParaRetirar && <View style={styles.comprasRetiradaArea}>
                <Text style={styles.comprasSelecaoTitulo}>
                  Escolher Compra
                </Text>

                <ScrollView style={styles.comprasRetiradaLista} showsVerticalScrollIndicator={false} nestedScrollEnabled>
                  {comprasDisponiveisParaRetirada(produtoParaRetirar).map(compra => {
                const compraSelecionada = compraRetiradaSelecionadaId === compra.id;
                const saldo = quantidadeDaCompraDisponivel(compra);

                return <TouchableOpacity key={compra.id} style={[styles.compraSelecao, compraSelecionada && styles.compraSelecaoAtivaRetirada]} onPress={() => {
                  setCompraRetiradaSelecionadaId(compra.id);
                  setQuantidadeRetirada('');
                }} disabled={retirandoUnidades} activeOpacity={0.8}>
                          <View style={[styles.radio, compraSelecionada && styles.radioAtivoRetirada]}>
                            {compraSelecionada && <View style={styles.radioCentroRetirada} />}
                          </View>

                          <View style={styles.compraSelecaoInfo}>
                            <Text style={styles.compraSelecaoData}>
                              Compra: {compra.dataCompra}
                            </Text>

                            <Text style={[styles.compraSelecaoVencimento, estiloVencimentoTexto(compra)]}>
                              Vence: {compra.dataVencimento ?? 'Sem vencimento'}
                            </Text>

                            <Text style={styles.compraSelecaoSaldo}>
                              {saldo} {saldo === 1 ? 'unidade' : 'unidades'}
                            </Text>
                          </View>

                          <View style={[styles.statusCompraModal, estiloStatusCompra(compra)]}>
                            <Text style={styles.statusCompraModalTexto}>
                              {textoStatusCompra(compra)}
                            </Text>
                          </View>
                        </TouchableOpacity>;
              })}
                </ScrollView>
              </View>}

            <Text style={styles.modalPergunta}>
              Quantas unidades deseja retirar?
            </Text>

            <TextInput style={styles.modalQuantidadeInput} value={quantidadeRetirada} onChangeText={texto => setQuantidadeRetirada(texto.replace(/\D/g, ''))} placeholder="Ex.: 2" placeholderTextColor="#777777" keyboardType="numeric" returnKeyType="done" onSubmitEditing={confirmarRetirada} />

            <View style={styles.modalBotoes}>
              <TouchableOpacity style={styles.cancelarButton} onPress={fecharModalRetirada} disabled={retirandoUnidades}>
                <Text style={styles.cancelarButtonTexto}>
                  CANCELAR
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.confirmarRetiradaButton, (retirandoUnidades || compraRetiradaSelecionadaId === null) && styles.buttonDesabilitado]} onPress={confirmarRetirada} disabled={retirandoUnidades || compraRetiradaSelecionadaId === null}>
                {retirandoUnidades ? <ActivityIndicator size="small" color="#111111" /> : <Ionicons name="remove-circle-outline" size={18} color="#111111" />}

                <Text style={styles.confirmarRetiradaButtonTexto}>
                  {retirandoUnidades ? 'RETIRANDO...' : 'RETIRAR'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={modalExcluirAberto} transparent animationType="fade" statusBarTranslucent onRequestClose={fecharModalExcluir}>
        <View style={styles.modalTela}>
          <Pressable style={styles.modalFundo} onPress={fecharModalExcluir} />

          <View style={styles.modalCard}>
            <View style={styles.modalCabecalho}>
              <Text style={styles.modalTitulo}>
                Excluir do estoque
              </Text>

              <TouchableOpacity style={styles.modalFechar} onPress={fecharModalExcluir}>
                <Ionicons name="close" size={24} color="#AAAAAA" />
              </TouchableOpacity>
            </View>

            <View style={styles.produtoDestaqueModal}>
              <Text style={styles.modalProdutoNome} numberOfLines={2}>
                {produtoParaExcluir?.nome}
              </Text>
            </View>

            <Text style={styles.modalPergunta}>
              O que você deseja excluir?
            </Text>

            <TouchableOpacity style={[styles.opcaoExclusao, modoExclusao === 'produto' && styles.opcaoExclusaoAtiva]} onPress={() => {
            setModoExclusao('produto');
            setCompraSelecionadaId(null);
          }} activeOpacity={0.8}>
              <View style={[styles.radio, modoExclusao === 'produto' && styles.radioAtivo]}>
                {modoExclusao === 'produto' && <View style={styles.radioCentro} />}
              </View>

              <Text style={styles.opcaoExclusaoTitulo}>
                Produto inteiro
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.opcaoExclusao, modoExclusao === 'compra' && styles.opcaoExclusaoAtiva]} onPress={() => {
            setModoExclusao('compra');
            setCompraSelecionadaId(null);
          }} activeOpacity={0.8}>
              <View style={[styles.radio, modoExclusao === 'compra' && styles.radioAtivo]}>
                {modoExclusao === 'compra' && <View style={styles.radioCentro} />}
              </View>

              <Text style={styles.opcaoExclusaoTitulo}>
                Compra específica
              </Text>
            </TouchableOpacity>

            {modoExclusao === 'compra' && produtoParaExcluir && <View style={styles.comprasSelecaoArea}>
                <Text style={styles.comprasSelecaoTitulo}>
                  Escolha a compra
                </Text>

                <ScrollView style={styles.comprasSelecaoLista} showsVerticalScrollIndicator={false} nestedScrollEnabled>
                  {comprasVisiveis(produtoParaExcluir).map(compra => <TouchableOpacity key={compra.id} style={[styles.compraSelecao, compraSelecionadaId === compra.id && styles.compraSelecaoAtiva]} onPress={() => setCompraSelecionadaId(compra.id)} activeOpacity={0.8}>
                        <View style={[styles.radio, compraSelecionadaId === compra.id && styles.radioAtivo]}>
                          {compraSelecionadaId === compra.id && <View style={styles.radioCentro} />}
                        </View>

                        <View style={styles.compraSelecaoInfo}>
                          <Text style={styles.compraSelecaoData}>
                            {compra.dataCompra}
                          </Text>

                          <Text style={[styles.compraSelecaoVencimento, estiloVencimentoTexto(compra)]}>
                            Vence:{' '}
                            {compra.dataVencimento ?? 'Sem vencimento'}
                          </Text>

                          <Text style={styles.compraSelecaoSaldo}>
                            {quantidadeDaCompraDisponivel(compra)}{' '}
                            {quantidadeDaCompraDisponivel(compra) === 1 ? 'unidade' : 'unidades'}
                          </Text>

                          <Text style={styles.compraSelecaoSaldo}>
                            Valor: R$ {formatarValor(compra.valor)}
                          </Text>
                        </View>

                        <View style={[styles.statusCompraModal, estiloStatusCompra(compra)]}>
                          <Text style={styles.statusCompraModalTexto}>
                            {textoStatusCompra(compra)}
                          </Text>
                        </View>
                      </TouchableOpacity>)}
                </ScrollView>
              </View>}

            <View style={styles.modalBotoes}>
              <TouchableOpacity style={styles.cancelarButton} onPress={fecharModalExcluir}>
                <Text style={styles.cancelarButtonTexto}>
                  CANCELAR
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.confirmarExcluirButton, !podeConfirmarExclusao && styles.confirmarExcluirButtonDesabilitado]} onPress={confirmarExclusao} disabled={!podeConfirmarExclusao}>
                <Ionicons name="trash-outline" size={17} color="#FFFFFF" />

                <Text style={styles.confirmarExcluirButtonTexto}>
                  EXCLUIR
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={fotoAmpliada !== null} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setFotoAmpliada(null)}>
        <View style={styles.fotoAmpliadaTela}>
          <Pressable style={styles.fotoAmpliadaFundo} onPress={() => setFotoAmpliada(null)} />

          {fotoAmpliada && <View style={styles.fotoAmpliadaCard}>
              <View style={styles.fotoAmpliadaCabecalho}>
                <Text style={styles.fotoAmpliadaTitulo} numberOfLines={2}>
                  {fotoAmpliada.nome}
                </Text>

                <TouchableOpacity style={styles.fotoAmpliadaFechar} onPress={() => setFotoAmpliada(null)} accessibilityRole="button" accessibilityLabel="Fechar imagem ampliada">
                  <Ionicons name="close" size={25} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              <Image source={{
            uri: fotoAmpliada.uri
          }} style={styles.fotoAmpliadaImagem} resizeMode="contain" />
            </View>}
        </View>
      </Modal>
    </KeyboardAvoidingView>;
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: '#000000'
  },
  container: {
    flex: 1,
    backgroundColor: '#000000'
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 100
  },
  abas: {
    flexDirection: 'row',
    backgroundColor: '#1E1E1E',
    borderRadius: 10,
    padding: 4,
    marginBottom: 20
  },
  abaButton: {
    flex: 1,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8
  },
  abaAtiva: {
    backgroundColor: '#E53935'
  },
  abaText: {
    color: '#AAAAAA',
    fontWeight: '600'
  },
  abaTextAtiva: {
    color: '#FFFFFF'
  },
  fotoButton: {
    height: 50,
    flexDirection: 'row',
    gap: 9,
    borderWidth: 1,
    borderColor: '#E53935',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10
  },
  fotoButtonText: {
    color: '#FFFFFF',
    fontWeight: '700'
  },
  fotoSelecionadaArea: {
    backgroundColor: '#1E1E1E',
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 10,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 4
  },
  fotoSelecionadaMoldura: {
    width: 62,
    height: 62,
    borderRadius: 9,
    backgroundColor: '#FFFFFF',
    padding: 4,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center'
  },
  fotoSelecionada: {
    width: '100%',
    height: '100%'
  },
  fotoSelecionadaInfo: {
    flex: 1
  },
  fotoSelecionadaTexto: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 7
  },
  removerFotoText: {
    color: '#E53935',
    fontSize: 13,
    fontWeight: '700'
  },
  produtoSelecionadoCard: {
    minHeight: 90,
    backgroundColor: '#1E1E1E',
    borderWidth: 1,
    borderColor: '#3F3F3F',
    borderLeftWidth: 4,
    borderLeftColor: '#31C76A',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 4
  },
  produtoSelecionadoInfo: {
    flex: 1,
    minWidth: 0
  },
  produtoSelecionadoRotulo: {
    color: '#31C76A',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginBottom: 5
  },
  produtoSelecionadoNome: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900'
  },
  produtoSelecionadoCategoria: {
    color: '#999999',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 3
  },
  produtoSelecionadoAcoes: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7
  },
  escolherProdutoButton: {
    minHeight: 38,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#31C76A',
    backgroundColor: '#102719',
    paddingHorizontal: 9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5
  },
  escolherProdutoTexto: {
    color: '#31C76A',
    fontSize: 10,
    fontWeight: '900'
  },
  cancelarAdicaoButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#2A2A2A',
    alignItems: 'center',
    justifyContent: 'center'
  },
  seletorProdutoLista: {
    maxHeight: 245,
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#444444',
    borderRadius: 10,
    marginTop: 7,
    marginBottom: 5,
    overflow: 'hidden'
  },
  seletorProdutoListaModal: {
    maxHeight: 190,
    backgroundColor: '#161616',
    borderWidth: 1,
    borderColor: '#444444',
    borderRadius: 10,
    marginTop: -12,
    marginBottom: 18,
    overflow: 'hidden'
  },
  seletorProdutoOpcao: {
    minHeight: 62,
    paddingHorizontal: 13,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#303030',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  seletorProdutoOpcaoAtiva: {
    backgroundColor: '#102719',
    borderLeftWidth: 3,
    borderLeftColor: '#31C76A'
  },
  seletorProdutoOpcaoAtivaRetirada: {
    backgroundColor: '#2B2113',
    borderLeftWidth: 3,
    borderLeftColor: '#FFB74D'
  },
  seletorProdutoInfo: {
    flex: 1,
    minWidth: 0
  },
  seletorProdutoNome: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800'
  },
  seletorProdutoCategoria: {
    color: '#929292',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4
  },
  label: {
    color: '#FFFFFF',
    fontSize: 15,
    marginTop: 15,
    marginBottom: 7
  },
  input: {
    height: 50,
    backgroundColor: '#FFFFFF',
    color: '#111111',
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 16
  },
  dropdownButton: {
    height: 50,
    backgroundColor: '#1E1E1E',
    borderWidth: 1,
    borderColor: '#444444',
    borderRadius: 10,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  dropdownTexto: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600'
  },
  dropdownPlaceholder: {
    color: '#888888',
    fontWeight: '400'
  },
  dropdownMenu: {
    backgroundColor: '#1E1E1E',
    borderWidth: 1,
    borderColor: '#444444',
    borderRadius: 10,
    marginTop: 5,
    overflow: 'hidden'
  },
  dropdownMenuFiltro: {
    backgroundColor: '#1E1E1E',
    borderWidth: 1,
    borderColor: '#444444',
    borderRadius: 10,
    marginTop: -7,
    marginBottom: 14,
    overflow: 'hidden'
  },
  dropdownOpcao: {
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#2D2D2D'
  },
  dropdownOpcaoTexto: {
    color: '#DDDDDD',
    fontSize: 14,
    fontWeight: '600'
  },
  opcaoSelecionada: {
    color: '#E53935',
    fontWeight: '800'
  },
  semVencimentoArea: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#444444',
    borderRadius: 10,
    padding: 14,
    marginTop: 22
  },
  checkbox: {
    width: 25,
    height: 25,
    borderWidth: 2,
    borderColor: '#777777',
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12
  },
  checkboxAtivo: {
    backgroundColor: '#E53935',
    borderColor: '#E53935'
  },
  checkboxTexto: {
    color: '#FFFFFF',
    fontWeight: '900'
  },
  semVencimentoTexto: {
    color: '#FFFFFF',
    fontWeight: '700'
  },
  button: {
    height: 52,
    backgroundColor: '#E53935',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 25
  },
  buttonConteudo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9
  },
  buttonDesabilitado: {
    opacity: 0.55
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '800'
  },
  filtrosLinha: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14
  },
  filtroDropdown: {
    flex: 1,
    minWidth: 0,
    height: 56,
    backgroundColor: '#1E1E1E',
    borderWidth: 1,
    borderColor: '#444444',
    borderRadius: 10,
    paddingHorizontal: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5
  },
  filtroDropdownTextos: {
    flex: 1,
    minWidth: 0
  },
  filtroNome: {
    color: '#777777',
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 2
  },
  filtroValor: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700'
  },
  buscarButton: {
    width: 52,
    height: 56,
    backgroundColor: '#1E1E1E',
    borderWidth: 1,
    borderColor: '#444444',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center'
  },
  buscarButtonAtivo: {
    backgroundColor: '#E53935',
    borderColor: '#E53935'
  },
  buscaArea: {
    height: 48,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
    gap: 8,
    marginBottom: 14
  },
  buscaInput: {
    flex: 1,
    color: '#111111',
    fontSize: 15
  },
  vazio: {
    backgroundColor: '#1E1E1E',
    padding: 25,
    borderRadius: 12,
    alignItems: 'center'
  },
  vazioTitulo: {
    color: '#FFFFFF',
    fontWeight: '700'
  },
  categoriaGrupo: {
    marginBottom: 8
  },
  categoriaTituloArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 10,
    marginBottom: 12,
    paddingHorizontal: 2
  },
  categoriaMarcador: {
    width: 4,
    height: 22,
    borderRadius: 3,
    backgroundColor: '#E53935'
  },
  categoriaTitulo: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.4
  },
  produtoCard: {
    backgroundColor: '#1E1E1E',
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 14,
    padding: 15,
    marginBottom: 16
  },
  produtoCabecalho: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 15
  },
  produtoFotoMoldura: {
    width: 68,
    height: 68,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
    padding: 5,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center'
  },
  produtoFoto: {
    width: '100%',
    height: '100%'
  },
  produtoFotoAmpliarIcone: {
    position: 'absolute',
    right: 3,
    bottom: 3,
    width: 21,
    height: 21,
    borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.72)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  produtoSemFoto: {
    width: 68,
    height: 68,
    borderRadius: 11,
    backgroundColor: '#292929',
    alignItems: 'center',
    justifyContent: 'center'
  },
  produtoInfo: {
    flex: 1,
    minWidth: 0
  },
  produtoNome: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900'
  },
  produtoCategoria: {
    color: '#888888',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 3
  },
  quantidadeDisponivel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    marginTop: 7
  },
  estoqueBaixoArea: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#2A1717',
    borderWidth: 1,
    borderColor: '#5D2222',
    borderRadius: 7,
    paddingHorizontal: 9,
    paddingVertical: 6,
    marginBottom: 13
  },
  estoqueBaixoTexto: {
    color: '#E53935',
    fontSize: 10,
    fontWeight: '900'
  },
  comprasTitulo: {
    color: '#AAAAAA',
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 9,
    textTransform: 'uppercase'
  },
  compraCard: {
    backgroundColor: '#151515',
    borderWidth: 1,
    borderColor: '#2E2E2E',
    borderRadius: 10,
    padding: 12,
    marginBottom: 9
  },
  compraConteudo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12
  },
  compraInformacoes: {
    flex: 1,
    minWidth: 0
  },
  compraData: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
    marginBottom: 5
  },
  compraVencimento: {
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 4
  },
  vencimentoValido: {
    color: '#4CAF50'
  },
  vencimentoProximo: {
    color: '#F4B400'
  },
  vencimentoVencido: {
    color: '#EF5350'
  },
  vencimentoSemData: {
    color: '#AAAAAA'
  },
  compraValor: {
    color: '#888888',
    fontSize: 11,
    fontWeight: '600'
  },
  compraQuantidade: {
    color: '#D0D0D0',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 5
  },
  statusCompra: {
    minWidth: 84,
    minHeight: 31,
    paddingHorizontal: 9,
    paddingVertical: 7,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center'
  },
  statusCompraValido: {
    backgroundColor: '#2E7D32'
  },
  statusCompraProximo: {
    backgroundColor: '#C78A00'
  },
  statusCompraVencido: {
    backgroundColor: '#B71C1C'
  },
  statusCompraEsgotado: {
    backgroundColor: '#555555'
  },
  statusCompraTexto: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
    textAlign: 'center'
  },
  movimentacaoBotoes: {
    flexDirection: 'row',
    gap: 9,
    marginTop: 9
  },
  adicionarUnidadesButton: {
    flex: 1,
    height: 44,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#31C76A',
    backgroundColor: '#102719',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7
  },
  adicionarUnidadesTexto: {
    color: '#31C76A',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.2
  },
  retirarUnidadesButton: {
    flex: 1,
    height: 44,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#FFB74D',
    backgroundColor: '#2B2113',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7
  },
  retirarUnidadesTexto: {
    color: '#FFB74D',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.2
  },
  movimentacaoButtonDesabilitado: {
    opacity: 0.35
  },
  excluirButton: {
    height: 44,
    marginTop: 8,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#E53935',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#2A1111'
  },
  excluirButtonTexto: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.3
  },
  fotoAmpliadaTela: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18
  },
  fotoAmpliadaFundo: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.88)'
  },
  fotoAmpliadaCard: {
    width: '100%',
    maxWidth: 560,
    height: '72%',
    maxHeight: 680,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    overflow: 'hidden'
  },
  fotoAmpliadaCabecalho: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10
  },
  fotoAmpliadaTitulo: {
    flex: 1,
    color: '#111111',
    fontSize: 18,
    fontWeight: '900'
  },
  fotoAmpliadaFechar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#E53935',
    alignItems: 'center',
    justifyContent: 'center'
  },
  fotoAmpliadaImagem: {
    flex: 1,
    width: '100%',
    backgroundColor: '#FFFFFF'
  },
  modalTela: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20
  },
  modalFundo: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.78)'
  },
  modalCard: {
    width: '100%',
    maxWidth: 450,
    maxHeight: '86%',
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#3A3A3A',
    padding: 18
  },
  modalCabecalho: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 14
  },
  modalTitulo: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900'
  },
  modalFechar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#292929',
    alignItems: 'center',
    justifyContent: 'center'
  },
  produtoDestaqueModal: {
    backgroundColor: '#161616',
    borderWidth: 1,
    borderColor: '#353535',
    borderLeftWidth: 4,
    borderLeftColor: '#E53935',
    borderRadius: 11,
    paddingHorizontal: 15,
    paddingVertical: 14,
    marginBottom: 20
  },
  produtoDestaqueRetirada: {
    borderLeftColor: '#FFB74D'
  },
  modalProdutoSelecionadoConteudo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  modalProdutoNome: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900'
  },
  modalEstoqueDisponivel: {
    color: '#31C76A',
    fontSize: 13,
    fontWeight: '800',
    marginTop: 7
  },
  modalPergunta: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 10
  },
  modalQuantidadeInput: {
    height: 52,
    backgroundColor: '#FFFFFF',
    color: '#111111',
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 18,
    fontWeight: '800'
  },
  modalRetiradaAjuda: {
    color: '#999999',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 10,
    marginBottom: 4
  },
  opcaoExclusao: {
    minHeight: 58,
    borderWidth: 1,
    borderColor: '#3D3D3D',
    borderRadius: 11,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 9,
    backgroundColor: '#171717'
  },
  opcaoExclusaoAtiva: {
    borderColor: '#E53935',
    backgroundColor: '#251515'
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#777777',
    alignItems: 'center',
    justifyContent: 'center'
  },
  radioAtivo: {
    borderColor: '#E53935'
  },
  radioCentro: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#E53935'
  },
  opcaoExclusaoTitulo: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800'
  },
  comprasRetiradaArea: {
    marginBottom: 14
  },
  comprasRetiradaLista: {
    maxHeight: 225
  },
  comprasSelecaoArea: {
    marginTop: 9,
    marginBottom: 14
  },
  comprasSelecaoTitulo: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 8
  },
  comprasSelecaoLista: {
    maxHeight: 240
  },
  compraSelecao: {
    borderWidth: 1,
    borderColor: '#383838',
    borderRadius: 10,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
    backgroundColor: '#151515'
  },
  compraSelecaoAtiva: {
    borderColor: '#E53935',
    backgroundColor: '#251515'
  },
  compraSelecaoAtivaRetirada: {
    borderColor: '#FFB74D',
    backgroundColor: '#2B2113'
  },
  compraSelecaoInfo: {
    flex: 1,
    minWidth: 0
  },
  compraSelecaoData: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800'
  },
  compraSelecaoVencimento: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 3
  },
  compraSelecaoSaldo: {
    color: '#999999',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 3
  },
  radioAtivoRetirada: {
    borderColor: '#FFB74D'
  },
  radioCentroRetirada: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFB74D'
  },
  statusCompraModal: {
    minWidth: 70,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center'
  },
  statusCompraModalTexto: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '900',
    textAlign: 'center'
  },
  modalBotoes: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8
  },
  cancelarButton: {
    flex: 1,
    height: 46,
    borderRadius: 9,
    backgroundColor: '#292929',
    alignItems: 'center',
    justifyContent: 'center'
  },
  cancelarButtonTexto: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800'
  },
  confirmarRetiradaButton: {
    flex: 1,
    height: 46,
    borderRadius: 9,
    backgroundColor: '#FFB74D',
    flexDirection: 'row',
    gap: 7,
    alignItems: 'center',
    justifyContent: 'center'
  },
  confirmarRetiradaButtonTexto: {
    color: '#111111',
    fontSize: 12,
    fontWeight: '900'
  },
  confirmarExcluirButton: {
    flex: 1,
    height: 46,
    borderRadius: 9,
    backgroundColor: '#E53935',
    flexDirection: 'row',
    gap: 7,
    alignItems: 'center',
    justifyContent: 'center'
  },
  confirmarExcluirButtonDesabilitado: {
    opacity: 0.35
  },
  confirmarExcluirButtonTexto: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900'
  }
});