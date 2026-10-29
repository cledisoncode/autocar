import NetInfo from '@react-native-community/netinfo';
import { AppState } from 'react-native';
import { salvarCache, lerCache, guardarPendencia, listarPendencias, descartarPendencia, type Pendencia } from '@/services/dados-locais';
import { salvarSessaoLocal, lerSessaoLocal, apagarSessaoLocal } from '@/services/sessao-local';
import { sincronizarFila } from '@/services/sincronizacao';
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  cadastrarProdutoApi,
  cadastrarUsuarioApi,
  entrarUsuarioApi,
  buscarProdutoApi,
  excluirCompraApi,
  excluirProdutoApi,
  listarAtendimentosApi,
  listarProdutosApi,
  registrarSaidaApi,
  removerToken,
  guardarToken,
  ErroApi,
} from '@/services/api';

import { atualizarProdutoSalvo } from '@/utils/atualizar-produto';

export type Atendimento = {
  id: number;
  nome: string;
  carro: string;
  placa: string;
  servico: string;
  data: string;
  horario: string;
  valor: number;
};

export type CategoriaProduto =
  | 'Lavagem Interna'
  | 'Lavagem Externa'
  | 'Vidros'
  | 'Acabamento';

export type CompraProduto = {
  id: number;
  quantidade: number;
  quantidadeDisponivel?: number;
  quantidadeComprada?: number;
  valor: number;
  dataCompra: string;
  dataVencimento: string | null;
  removida: boolean;
};

export type Produto = {
  id: number;
  nome: string;
  categoria: CategoriaProduto;
  foto: string | null;
  compras: CompraProduto[];
  removido: boolean;
};

export type Usuario = {
  id: number;
  nome: string;
  sobrenome: string;
  email: string;
};

type NovoProduto = {
  nome: string;
  categoria: CategoriaProduto;
  foto: string | null;
  quantidade: number;
  valor: number;
  dataCompra: string;
  dataVencimento: string | null;
};

type NovaCompraProduto = Omit<
  NovoProduto,
  'nome' | 'categoria' | 'foto'
>;

type NovoUsuario = {
  nome: string;
  sobrenome: string;
  email: string;
  senha: string;
};

type AppDataContextType = {
  atendimentos: Atendimento[];

  produtos: Produto[];

  estadoDados: 'inativo' | 'carregando' | 'pronto' | 'erro';
  erroCarregamento: string | null;
  recarregarDados: () => Promise<void>;
  restaurandoSessao: boolean;
  modoLocal: boolean;
  sincronizando: boolean;
  avisoLocal: string | null;
  pendencias: Pendencia[];
  sincronizar: () => Promise<void>;
  descartarPendente: (id: number) => Promise<void>;


  adicionarAtendimento: (
    atendimento: Atendimento
  ) => Promise<'salvo' | 'pendente'>;

  cadastrarProduto: (
    dados: NovoProduto
  ) => Promise<void>;

  adicionarCompraProduto: (
    produtoId: number,
    dados: NovaCompraProduto
  ) => Promise<void>;

  retirarUnidadesProduto: (
    produtoId: number,
    compraId: number,
    quantidade: number
  ) => Promise<void>;

  excluirProdutoDoEstoque: (
    produtoId: number
  ) => Promise<void>;

  excluirCompraDoEstoque: (
    produtoId: number,
    compraId: number
  ) => Promise<void>;

  usuarioCadastrado: Usuario | null;

  usuarioLogado: Usuario | null;

  cadastrarUsuario: (
    dados: NovoUsuario
  ) => Promise<boolean>;

  entrarUsuario: (
    email: string,
    senha: string
  ) => Promise<boolean>;

  sairUsuario: () => void;

  emailPertenceAoUsuario: (
    email: string
  ) => boolean;
};

const AppDataContext =
  createContext<
    AppDataContextType | undefined
  >(undefined);

export function AppDataProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [
    atendimentos,
    setAtendimentos,
  ] = useState<Atendimento[]>([]);

  const [
    produtos,
    setProdutos,
  ] = useState<Produto[]>([]);

  const [
    usuarioCadastrado,
    setUsuarioCadastrado,
  ] = useState<Usuario | null>(
    null
  );

  const [usuarioLogado, setUsuarioLogado] = useState<Usuario | null>(null);
  const [estadoDados, setEstadoDados] = useState<AppDataContextType['estadoDados']>('inativo');
  const [erroCarregamento, setErroCarregamento] = useState<string | null>(null);
  const usuarioRef = useRef<Usuario | null>(null);
  const produtosRef = useRef<Produto[]>([]);
  const cargaRef = useRef<Promise<void> | null>(null);
  const revisaoDadosRef = useRef(0);
  const sincronizacaoRef = useRef<Promise<void> | null>(null);
  const dadosProntosRef = useRef(false);
  const sessaoDadosRef = useRef(0);

  const [restaurandoSessao, setRestaurandoSessao] = useState(true);
  const [modoLocal, setModoLocal] = useState(false);
  const [sincronizando, setSincronizando] = useState(false);
  const [avisoLocal, setAvisoLocal] = useState<string | null>(null);
  const [pendencias, setPendencias] = useState<Pendencia[]>([]);
  const atendimentosRef = useRef<Atendimento[]>([]);
  const localRef = useRef(false);
  const acoesRef = useRef({ atualizar: async () => {} });

  function publicarAtendimentos(lista: Atendimento[]) {
    revisaoDadosRef.current += 1;
    atendimentosRef.current = lista;
    setAtendimentos(lista);
  }
  function definirModoLocal(local: boolean) {
    localRef.current = local;
    setModoLocal(local);
  }
  function avisarFalhaLocal(erro: unknown) {
    setAvisoLocal(erro instanceof Error ? erro.message : 'Não foi possível acessar o armazenamento local.');
  }
  async function persistirAtual() {
    const usuario = usuarioRef.current;
    if (!usuario) return;
    try { await salvarCache(usuario.id, produtosRef.current, atendimentosRef.current); }
    catch (erro) { if (usuarioRef.current?.id === usuario.id) avisarFalhaLocal(erro); }
  }
  async function atualizarPendencias() {
    const sessao = sessaoDadosRef.current;
    const usuario = usuarioRef.current;
    if (!usuario) return;
    const lista = await listarPendencias(usuario.id);
    if (sessao === sessaoDadosRef.current) setPendencias(lista);
  }
  async function usarCache(sessao: number) {
    const usuario = usuarioRef.current;
    if (!usuario) return false;
    const cache = await lerCache(usuario.id);
    conferirSessao(sessao);
    if (!cache) return false;
    atualizarProdutos(() => cache.produtos);
    publicarAtendimentos(cache.atendimentos);
    definirModoLocal(true);
    dadosProntosRef.current = true;
    setEstadoDados('pronto');
    await atualizarPendencias();
    return true;
  }
  function sincronizar(atualizar = true): Promise<void> {
    if (sincronizacaoRef.current) return sincronizacaoRef.current;
    const usuario = usuarioRef.current;
    if (!usuario) return Promise.resolve();
    const sessao = sessaoDadosRef.current;
    const trabalho = (async () => {
      const rede = await NetInfo.fetch();
      conferirSessao(sessao);
      if (rede.isConnected === false) {
        definirModoLocal(true);
        return;
      }
      setSincronizando(true);
      try {
        // Confere primeiro a sessão na API e atualiza o cache antes de enviar.
        // A consulta não é repetida depois de cada POST: usa sua resposta com ID.
        if (atualizar || localRef.current || !dadosProntosRef.current) await recarregarDados();
        conferirSessao(sessao);
        if (localRef.current) return;
        await sincronizarFila(usuario.id,
          () => sessao === sessaoDadosRef.current && usuarioRef.current?.id === usuario.id,
          salvo => {
            publicarAtendimentos([salvo, ...atendimentosRef.current.filter(item => item.id !== salvo.id)]);
          });
        conferirSessao(sessao);
      } catch (erro) {
        if (sessao === sessaoDadosRef.current) {
          setAvisoLocal(erro instanceof Error ? erro.message : 'Não foi possível sincronizar.');
          if (!(erro instanceof ErroApi)) definirModoLocal(true);
        }
        throw erro;
      } finally {
        if (sessao === sessaoDadosRef.current) {
          setSincronizando(false);
          await atualizarPendencias().catch(avisarFalhaLocal);
        }
      }
    })();
    sincronizacaoRef.current = trabalho;
    void trabalho.finally(() => { if (sincronizacaoRef.current === trabalho) sincronizacaoRef.current = null; }).catch(() => undefined);
    return trabalho;
  }
  async function descartarPendente(id: number) {
    const usuario = usuarioRef.current;
    if (!usuario) return;
    const descartada = await descartarPendencia(usuario.id, id);
    await atualizarPendencias();
    if (!descartada) throw new Error('Esta pendência já começou a ser enviada ou já foi processada. Confira o histórico atualizado.');
  }

  // Restaura apenas uma sessão salva após autenticação real. Nenhuma senha é
  // persistida; o logout remove essa sessão e não apaga pendências da conta.
  useEffect(() => {
    let ativo = true;
    const tentativa = sessaoDadosRef.current;
    void (async () => {
      try {
        const sessao = await lerSessaoLocal();
        if (!ativo || tentativa !== sessaoDadosRef.current || !sessao) return;
        guardarToken(sessao.token);
        usuarioRef.current = sessao.usuario;
        setUsuarioLogado(sessao.usuario);
        setUsuarioCadastrado(sessao.usuario);
        await usarCache(tentativa);
        if (ativo) setRestaurandoSessao(false);
        if (ativo && tentativa === sessaoDadosRef.current) {
          await recarregarDados();
          await sincronizar(false);
        }
      } catch (erro) {
        if (ativo && tentativa === sessaoDadosRef.current) avisarFalhaLocal(erro);
      } finally { if (ativo) setRestaurandoSessao(false); }
    })();
    return () => { ativo = false; };
    // Inicialização única; os identificadores de sessão invalidam respostas tardias.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  acoesRef.current.atualizar = sincronizar;
  useEffect(() => {
    let conectado: boolean | null = null;
    const remover = NetInfo.addEventListener(rede => {
      const online = rede.isConnected === true && rede.isInternetReachable !== false;
      const voltou = conectado === false && online;
      conectado = online;
      if (rede.isConnected === false && usuarioRef.current) definirModoLocal(true);
      if (voltou && usuarioRef.current) void acoesRef.current.atualizar().catch(() => {});
    });
    const app = AppState.addEventListener('change', estado => {
      if (estado === 'active' && usuarioRef.current) void acoesRef.current.atualizar().catch(() => {});
    });
    return () => { remover(); app.remove(); };
  }, []);

  function atualizarProdutos(atualizar: (atuais: Produto[]) => Produto[]) {
    revisaoDadosRef.current += 1;
    const atualizados = atualizar(produtosRef.current);
    produtosRef.current = atualizados;
    setProdutos(atualizados);
  }

  function conferirSessao(sessao: number) {
    if (sessao !== sessaoDadosRef.current || !usuarioRef.current) {
      throw new Error('A sessão foi encerrada. Entre novamente para continuar.');
    }
  }

  async function recarregarDados() {
    if (!usuarioRef.current) return;
    if (cargaRef.current) return cargaRef.current;
    const sessao = sessaoDadosRef.current;
    if (!dadosProntosRef.current) setEstadoDados('carregando');
    setErroCarregamento(null);
    const revisao = revisaoDadosRef.current;
    const carga = (async () => {
      try {
        const rede = await NetInfo.fetch();
        conferirSessao(sessao);
        if (rede.isConnected === false) {
          if (await usarCache(sessao)) return;
          throw new Error('Sem dados locais disponíveis. Entre com internet uma vez para baixar seus registros.');
        }
        const [listaProdutos, listaAtendimentos] = await Promise.all([listarProdutosApi(), listarAtendimentosApi()]);
        conferirSessao(sessao);
        if (revisao !== revisaoDadosRef.current) return;
        atualizarProdutos(() => listaProdutos);
        publicarAtendimentos(listaAtendimentos);
        dadosProntosRef.current = true;
        definirModoLocal(false);
        setEstadoDados('pronto');
        setAvisoLocal(null);
        await persistirAtual();
        await atualizarPendencias();
      } catch (erro) {
        if (sessao !== sessaoDadosRef.current) throw erro;
        const mensagem = erro instanceof Error ? erro.message : 'Verifique a conexão com o servidor.';
        setErroCarregamento(mensagem);
        if (erro instanceof ErroApi && erro.status === 401) {
          // Não permite operações remotas com token rejeitado. Os dados locais
          // continuam legíveis; o aviso orienta a fazer login novamente.
          setAvisoLocal('Sua sessão precisa de um novo login para sincronizar.');
        }
        if (dadosProntosRef.current || await usarCache(sessao)) {
          definirModoLocal(true);
          setEstadoDados('pronto');
          if (!(erro instanceof ErroApi && erro.status === 401)) setAvisoLocal(mensagem);
          return;
        }
        setEstadoDados('erro');
        throw erro;
      }
    })();
    cargaRef.current = carga;
    try { await carga; }
    finally { if (cargaRef.current === carga) cargaRef.current = null; }
  }

  async function prepararAlteracao() {
    const sessao = sessaoDadosRef.current;
    conferirSessao(sessao);
    if (!dadosProntosRef.current) await recarregarDados();
    conferirSessao(sessao);
    const rede = await NetInfo.fetch();
    conferirSessao(sessao);
    if (localRef.current || rede.isConnected === false) {
      throw new Error('Esta operação precisa de conexão e dados atualizados. Consulte os dados locais ou salve um atendimento pendente.');
    }
    return sessao;
  }

  async function adicionarAtendimento(atendimento: Atendimento): Promise<'salvo' | 'pendente'> {
    const usuario = usuarioRef.current;
    const sessao = sessaoDadosRef.current;
    conferirSessao(sessao);
    if (!usuario) throw new Error('Faça o login para continuar.');
    // O formulário continua validando os campos. O SQLite confirma primeiro
    // a gravação local, antes de qualquer tentativa de envio.
    const id = await guardarPendencia(usuario.id, {
      nome: atendimento.nome.trim(), carro: atendimento.carro.trim(),
      placa: atendimento.placa.trim().toUpperCase(), servico: atendimento.servico.trim(),
      data: atendimento.data, horario: atendimento.horario, valor: atendimento.valor,
    });
    conferirSessao(sessao);
    try {
      await atualizarPendencias();
      const rede = await NetInfo.fetch();
      conferirSessao(sessao);
      if (rede.isConnected === false || localRef.current) {
        definirModoLocal(true);
        return 'pendente';
      }
      try { await sincronizar(false); }
      catch { /* O estado e a mensagem do envio permanecem na pendência. */ }
      conferirSessao(sessao);
      const restantes = await listarPendencias(usuario.id);
      conferirSessao(sessao);
      setPendencias(restantes);
      return restantes.some(item => item.id === id) ? 'pendente' : 'salvo';
    } catch (erro) {
      conferirSessao(sessao);
      // A gravação local já foi confirmada. Uma falha posterior não deve
      // deixar o formulário pronto para criar a mesma pendência novamente.
      avisarFalhaLocal(erro);
      return 'pendente';
    }
  }


  async function cadastrarProduto(
    dados: NovoProduto
  ) {
    const sessao = await prepararAlteracao();
    const resposta = await cadastrarProdutoApi({
      nome:
        dados.nome.trim(),

      categoria:
        dados.categoria,

      foto:
        dados.foto,

      quantidade:
        dados.quantidade,

      valor:
        dados.valor,

      dataCompra:
        dados.dataCompra,

      dataVencimento:
        dados.dataVencimento,
    });

    conferirSessao(sessao);
    atualizarProdutos((atuais) => atualizarProdutoSalvo(atuais, resposta.produto));
    await persistirAtual();
  }

  async function adicionarCompraProduto(
    produtoId: number,
    dados: NovaCompraProduto
  ) {
    const sessao = await prepararAlteracao();
    const produto = produtosRef.current.find(
      (item) =>
        item.id === produtoId &&
        !item.removido
    );

    if (!produto) {
      throw new Error(
        'Produto não encontrado no estoque.'
      );
    }

    const resposta = await cadastrarProdutoApi({
      nome: produto.nome,
      categoria: produto.categoria,
      foto: null,
      quantidade: dados.quantidade,
      valor: dados.valor,
      dataCompra: dados.dataCompra,
      dataVencimento:
        dados.dataVencimento,
    });

    conferirSessao(sessao);
    atualizarProdutos((atuais) => atualizarProdutoSalvo(atuais, resposta.produto));
    await persistirAtual();
  }

  async function retirarUnidadesProduto(
    produtoId: number,
    compraId: number,
    quantidade: number
  ) {
    const sessao = await prepararAlteracao();
    await registrarSaidaApi(produtoId, compraId, quantidade);
    conferirSessao(sessao);
    // A saída já foi confirmada. Uma falha na consulta seguinte não deve
    // induzir o usuário a enviar a mesma retirada outra vez.
    try {
      const atualizado = await buscarProdutoApi(produtoId);
      conferirSessao(sessao);
      atualizarProdutos((atuais) => atuais.map((item) => item.id === produtoId ? atualizado : item));
      await persistirAtual();
    } catch (erro) {
      if (sessao !== sessaoDadosRef.current) throw erro;
      dadosProntosRef.current = false;
      setErroCarregamento(erro instanceof Error ? erro.message : 'Verifique a conexão com o servidor.');
      setEstadoDados('erro');
    }
  }

  async function excluirProdutoDoEstoque(produtoId: number) {
    const sessao = await prepararAlteracao();
    const resposta = await excluirProdutoApi(produtoId);
    conferirSessao(sessao);
    if (!resposta.removido) throw new Error('O servidor não confirmou a exclusão.');
    atualizarProdutos((atuais) => atuais.map((item) => item.id === produtoId ? { ...item, removido: true } : item));
    await persistirAtual();
  }

  async function excluirCompraDoEstoque(produtoId: number, compraId: number) {
    const sessao = await prepararAlteracao();
    const resposta = await excluirCompraApi(produtoId, compraId);
    conferirSessao(sessao);
    if (!resposta.compra_removida) throw new Error('O servidor não confirmou a exclusão.');
    atualizarProdutos((atuais) => atuais.map((item) => item.id !== produtoId ? item : {
      ...item,
      removido: resposta.produto_removido,
      compras: item.compras.map((compra) => compra.id === compraId ? { ...compra, removida: true } : compra),
    }));
    await persistirAtual();
  }

  async function cadastrarUsuario(
    dados: NovoUsuario
  ) {
    const resposta =
      await cadastrarUsuarioApi({
        nome:
          dados.nome.trim(),

        sobrenome:
          dados.sobrenome.trim(),

        email:
          dados.email
            .trim()
            .toLowerCase(),

        senha:
          dados.senha,
      });

    setUsuarioCadastrado(
      resposta.usuario
    );

    removerToken();

    return true;
  }

  async function entrarUsuario(
    email: string,
    senha: string
  ) {
    const tentativa = sessaoDadosRef.current;
    const resposta =
      await entrarUsuarioApi(
        email
          .trim()
          .toLowerCase(),
        senha
      );

    if (tentativa !== sessaoDadosRef.current) {
      removerToken();
      return false;
    }
    sessaoDadosRef.current += 1;
    usuarioRef.current = resposta.usuario;
    cargaRef.current = null;
    sincronizacaoRef.current = null;
    dadosProntosRef.current = false;
    atualizarProdutos(() => []);
    publicarAtendimentos([]);
    setEstadoDados('carregando');
    setErroCarregamento(null);
    setUsuarioCadastrado(resposta.usuario);

    setUsuarioLogado(
      resposta.usuario
    );
    const sessao = sessaoDadosRef.current;
    await salvarSessaoLocal(resposta).catch(avisarFalhaLocal);
    conferirSessao(sessao);
    await usarCache(sessao).catch(avisarFalhaLocal);
    // Mantém o botão ENTRANDO até as duas listas estarem prontas. Se a consulta
    // falhar, a tela de dados oferece nova tentativa sem rejeitar o login válido.
    await recarregarDados().catch(() => { /* A tela oferece nova consulta. */ });
    if (sessao === sessaoDadosRef.current && !localRef.current) await sincronizar(false).catch(() => {});

    return sessao === sessaoDadosRef.current && usuarioRef.current !== null;
  }

  function sairUsuario() {
    void apagarSessaoLocal().catch(() => {});
    setPendencias([]);
    setAvisoLocal(null);
    definirModoLocal(false);
    setSincronizando(false);
    sessaoDadosRef.current += 1;
    usuarioRef.current = null;
    cargaRef.current = null;
    sincronizacaoRef.current = null;
    dadosProntosRef.current = false;
    removerToken();
    setUsuarioLogado(null);
    atualizarProdutos(() => []);
    publicarAtendimentos([]);
    setEstadoDados('inativo');
    setErroCarregamento(null);
  }

  function emailPertenceAoUsuario(
    email: string
  ) {
    if (!usuarioCadastrado) {
      return false;
    }

    return (
      usuarioCadastrado.email ===
      email
        .trim()
        .toLowerCase()
    );
  }

  return (
    <AppDataContext.Provider
      value={{
        atendimentos,
        produtos,
        estadoDados,
        erroCarregamento,
        recarregarDados,
        restaurandoSessao, modoLocal, sincronizando, avisoLocal, pendencias, sincronizar, descartarPendente,
        adicionarAtendimento,
        cadastrarProduto,
        adicionarCompraProduto,
        retirarUnidadesProduto,
        excluirProdutoDoEstoque,
        excluirCompraDoEstoque,
        usuarioCadastrado,
        usuarioLogado,
        cadastrarUsuario,
        entrarUsuario,
        sairUsuario,
        emailPertenceAoUsuario,
      }}
    >
      {children}
    </AppDataContext.Provider>
  );
}

export function useAppData() {
  const context =
    useContext(
      AppDataContext
    );

  if (!context) {
    throw new Error(
      'useAppData deve ser usado dentro de AppDataProvider'
    );
  }

  return context;
}
