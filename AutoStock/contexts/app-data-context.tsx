import {
  createContext,
  ReactNode,
  useContext,
  useState,
} from 'react';

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

type UsuarioInterno =
  Usuario & {
    senha: string;
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
  ) => void;

  adicionarCompraProduto: (
    dados: NovaCompraProduto
  ) => void;

  excluirProdutoDoEstoque: (
    produtoId: number
  ) => void;

  excluirCompraDoEstoque: (
    produtoId: number,
    compraId: number
  ) => void;

  usuarioCadastrado:
    Usuario | null;

  usuarioLogado:
    Usuario | null;

  cadastrarUsuario: (
    dados: NovoUsuario
  ) => boolean;

  entrarUsuario: (
    email: string,
    senha: string
  ) => boolean;

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

  /*
    Por enquanto, a conta fica
    apenas na memória.

    Quando implementarmos SQLite,
    esses dados passarão para
    o banco de dados.
  */
  const [
    usuarioInterno,
    setUsuarioInterno,
  ] =
    useState<UsuarioInterno | null>(
      null
    );

  const [
    usuarioLogado,
    setUsuarioLogado,
  ] =
    useState<Usuario | null>(
      null
    );

  const usuarioCadastrado:
    Usuario | null =
    usuarioInterno
      ? {
          id:
            usuarioInterno.id,

          nome:
            usuarioInterno.nome,

          sobrenome:
            usuarioInterno.sobrenome,

          email:
            usuarioInterno.email,
        }
      : null;

  function adicionarAtendimento(
    atendimento: Atendimento
  ) {
    setAtendimentos(
      (listaAtual) => [
        atendimento,
        ...listaAtual,
      ]
    );
  }

  function adicionarCompraProduto(
    dados: NovaCompraProduto
  ) {
    const nomeNormalizado =
      dados.nome
        .trim()
        .toLowerCase();

    const novaCompra:
      CompraProduto = {
      id: Date.now(),

      quantidade:
        dados.quantidade,

      valor:
        dados.valor,

      dataCompra:
        dados.dataCompra,

      dataVencimento:
        dados.dataVencimento,

      removida: false,
    };

    setProdutos(
      (listaAtual) => {
        /*
          Procuramos somente um produto
          que ainda esteja no estoque.

          Produto removido nunca será
          reativado automaticamente.
        */
        const produtoExistente =
          listaAtual.find(
            (produto) =>
              produto.removido !==
                true &&
              produto.nome
                .trim()
                .toLowerCase() ===
                nomeNormalizado &&
              produto.categoria ===
                dados.categoria
          );

        /*
          Não existe produto atual
          com esse nome + categoria.

          Criamos um NOVO produto.
        */
        if (!produtoExistente) {
          const novoProduto:
            Produto = {
            id:
              Date.now() +
              Math.floor(
                Math.random() *
                  1000
              ),

            nome:
              dados.nome.trim(),

            categoria:
              dados.categoria,

            foto:
              dados.foto,

            compras: [
              novaCompra,
            ],

            removido: false,
          };

          return [
            novoProduto,
            ...listaAtual,
          ];
        }

        /*
          Já existe um produto atual
          com mesmo nome + categoria.

          Registramos uma nova compra
          dentro dele.
        */
        return listaAtual.map(
          (produto) => {
            if (
              produto.id !==
              produtoExistente.id
            ) {
              return produto;
            }

            return {
              ...produto,

              foto:
                produto.foto ||
                dados.foto,

              compras: [
                novaCompra,
                ...produto.compras,
              ],
            };
          }
        );
      }
    );
  }

  /*
    EXCLUIR PRODUTO INTEIRO

    O produto não é apagado de verdade.

    Ele deixa de aparecer no estoque,
    porém todas as compras continuam
    guardadas para Financeiro e
    Relatórios.
  */
  function excluirProdutoDoEstoque(
    produtoId: number
  ) {
    setProdutos(
      (listaAtual) =>
        listaAtual.map(
          (produto) => {
            if (
              produto.id !==
              produtoId
            ) {
              return produto;
            }

            return {
              ...produto,

              removido: true,
            };
          }
        )
    );
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
  function excluirCompraDoEstoque(
    produtoId: number,
    compraId: number
  ) {
    setProdutos(
      (listaAtual) =>
        listaAtual.map(
          (produto) => {
            if (
              produto.id !==
              produtoId
            ) {
              return produto;
            }

            const comprasAtualizadas =
              produto.compras.map(
                (compra) => {
                  if (
                    compra.id !==
                    compraId
                  ) {
                    return compra;
                  }

                  return {
                    ...compra,

                    removida:
                      true,
                  };
                }
              );

            const possuiCompraVisivel =
              comprasAtualizadas.some(
                (compra) =>
                  compra.removida !==
                  true
              );

            return {
              ...produto,

              compras:
                comprasAtualizadas,

              removido:
                !possuiCompraVisivel,
            };
          }
        )
    );
  }

  function cadastrarUsuario(
    dados: NovoUsuario
  ) {
    /*
      AUTOCAR terá apenas
      uma conta administrativa.
    */
    if (usuarioInterno) {
      return false;
    }

    const novoUsuario:
      UsuarioInterno = {
      id: Date.now(),

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
    };

    setUsuarioInterno(
      novoUsuario
    );

    return true;
  }

  function entrarUsuario(
    email: string,
    senha: string
  ) {
    if (!usuarioInterno) {
      return false;
    }

    const emailNormalizado =
      email
        .trim()
        .toLowerCase();

    const dadosCorretos =
      usuarioInterno.email ===
        emailNormalizado &&
      usuarioInterno.senha ===
        senha;

    if (!dadosCorretos) {
      return false;
    }

    setUsuarioLogado({
      id:
        usuarioInterno.id,

      nome:
        usuarioInterno.nome,

      sobrenome:
        usuarioInterno.sobrenome,

      email:
        usuarioInterno.email,
    });

    return true;
  }

  function sairUsuario() {
    /*
      Faz logout, mas não
      exclui a conta.
    */
    setUsuarioLogado(null);
  }

  function emailPertenceAoUsuario(
    email: string
  ) {
    if (!usuarioInterno) {
      return false;
    }

    return (
      usuarioInterno.email ===
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