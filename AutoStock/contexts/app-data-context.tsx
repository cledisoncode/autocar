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
  valor: number;
  dataCompra: string;
  dataVencimento: string | null;

  /*
    A compra continua guardada
    para o histórico financeiro.

    true significa apenas que ela
    não deve mais aparecer no estoque.
  */
  removida: boolean;
};

export type Produto = {
  id: number;
  nome: string;
  categoria: CategoriaProduto;
  foto: string | null;
  compras: CompraProduto[];

  /*
    O produto continua guardado
    para preservar seu histórico.

    true significa que ele não deve
    mais aparecer no estoque.
  */
  removido: boolean;
};

export type Usuario = {
  id: number;
  nome: string;
  sobrenome: string;
  email: string;
};

type NovaCompraProduto = {
  nome: string;
  categoria: CategoriaProduto;
  foto: string | null;
  quantidade: number;
  valor: number;
  dataCompra: string;
  dataVencimento: string | null;
};

type NovoUsuario = {
  nome: string;
  sobrenome: string;
  email: string;
  senha: string;
};

type AppDataContextType = {
  atendimentos: Atendimento[];

  /*
    Aqui permanecem todos os produtos,
    inclusive os removidos.

    Isso preserva as compras antigas
    para Financeiro e Relatórios.
  */
  produtos: Produto[];

  adicionarAtendimento: (
    atendimento: Atendimento
  ) => Promise<void>;

  adicionarCompraProduto: (
    dados: NovaCompraProduto
  ) => Promise<void>;

  excluirProdutoDoEstoque: (
    produtoId: number
  ) => Promise<void>;

  excluirCompraDoEstoque: (
    produtoId: number,
    compraId: number
  ) => Promise<void>;

  usuarioCadastrado:
    Usuario | null;

  usuarioLogado:
    Usuario | null;

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
  ] =
    useState<Atendimento[]>([]);

  const [
    produtos,
    setProdutos,
  ] =
    useState<Produto[]>([]);

  const [
    usuarioCadastrado,
    setUsuarioCadastrado,
  ] =
    useState<Usuario | null>(
      null
    );

  const [
    usuarioLogado,
    setUsuarioLogado,
  ] =
    useState<Usuario | null>(
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

  async function adicionarCompraProduto(
    dados: NovaCompraProduto
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

  /*
    EXCLUIR PRODUTO INTEIRO

    O produto não é apagado de verdade.

    Ele deixa de aparecer no estoque,
    porém todas as compras continuam
    guardadas para Financeiro e
    Relatórios.
  */
  async function excluirProdutoDoEstoque(
    produtoId: number
  ) {
    await excluirProdutoApi(
      produtoId
    );

    await carregarProdutos();
  }

  /*
    EXCLUIR UMA COMPRA ESPECÍFICA

    A compra deixa de aparecer no
    estoque, mas continua guardada
    para o histórico financeiro.

    Se nenhuma compra continuar
    disponível para visualização,
    o produto também deixa de
    aparecer no estoque.
  */
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

    /*
      Depois do cadastro, o aplicativo
      volta ao login. Por isso o token
      recebido no cadastro é removido.
    */
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

        adicionarCompraProduto,

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
