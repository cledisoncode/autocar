import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';

import {
  cadastrarAtendimentoApi,
  cadastrarProdutoApi,
  cadastrarUsuarioApi,
  entrarUsuarioApi,
  excluirCompraApi,
  excluirProdutoApi,
  listarAtendimentosApi,
  listarProdutosApi,
  registrarSaidaApi,
  removerToken,
} from '@/services/api';

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

  adicionarAtendimento: (
    atendimento: Atendimento
  ) => Promise<void>;

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

  const [
    usuarioLogado,
    setUsuarioLogado,
  ] = useState<Usuario | null>(
    null
  );

  async function carregarAtendimentos() {
    const resposta =
      await listarAtendimentosApi();

    setAtendimentos(
      resposta as Atendimento[]
    );
  }

  async function adicionarAtendimento(
    atendimento: Atendimento
  ) {
    await cadastrarAtendimentoApi({
      nome:
        atendimento.nome.trim(),

      carro:
        atendimento.carro.trim(),

      placa:
        atendimento.placa
          .trim()
          .toUpperCase(),

      servico:
        atendimento.servico.trim(),

      data:
        atendimento.data,

      horario:
        atendimento.horario,

      valor:
        atendimento.valor,
    });

    await carregarAtendimentos();
  }

  async function carregarProdutos() {
    const resposta =
      await listarProdutosApi();

    setProdutos(
      resposta as Produto[]
    );
  }

  useEffect(() => {
    if (!usuarioLogado) {
      return;
    }

    carregarProdutos().catch(
      (erro) => {
        console.error(
          'Erro ao carregar produtos:',
          erro
        );
      }
    );

    carregarAtendimentos().catch(
      (erro) => {
        console.error(
          'Erro ao carregar atendimentos:',
          erro
        );
      }
    );
  }, [usuarioLogado]);

  async function cadastrarProduto(
    dados: NovoProduto
  ) {
    await cadastrarProdutoApi({
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

    await carregarProdutos();
  }

  async function adicionarCompraProduto(
    produtoId: number,
    dados: NovaCompraProduto
  ) {
    const produto = produtos.find(
      (item) =>
        item.id === produtoId &&
        !item.removido
    );

    if (!produto) {
      throw new Error(
        'Produto não encontrado no estoque.'
      );
    }

    await cadastrarProdutoApi({
      nome: produto.nome,
      categoria: produto.categoria,
      foto: null,
      quantidade: dados.quantidade,
      valor: dados.valor,
      dataCompra: dados.dataCompra,
      dataVencimento:
        dados.dataVencimento,
    });

    await carregarProdutos();
  }

  async function retirarUnidadesProduto(
    produtoId: number,
    compraId: number,
    quantidade: number
  ) {
    await registrarSaidaApi(
      produtoId,
      compraId,
      quantidade
    );

    await carregarProdutos();
  }

  async function excluirProdutoDoEstoque(
    produtoId: number
  ) {
    await excluirProdutoApi(
      produtoId
    );

    await carregarProdutos();
  }

  async function excluirCompraDoEstoque(
    produtoId: number,
    compraId: number
  ) {
    await excluirCompraApi(
      produtoId,
      compraId
    );

    await carregarProdutos();
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
    const resposta =
      await entrarUsuarioApi(
        email
          .trim()
          .toLowerCase(),
        senha
      );

    setUsuarioCadastrado(
      resposta.usuario
    );

    setUsuarioLogado(
      resposta.usuario
    );

    return true;
  }

  function sairUsuario() {
    removerToken();

    setUsuarioLogado(null);
    setProdutos([]);
    setAtendimentos([]);
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