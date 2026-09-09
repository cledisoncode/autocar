const API_URL =
  process.env.EXPO_PUBLIC_API_URL;

let tokenAtual: string | null = null;

export type UsuarioApi = {
  id: number;
  nome: string;
  sobrenome: string;
  email: string;
};

export type RespostaLogin = {
  token: string;
  usuario: UsuarioApi;
};

export type DadosUsuario = {
  nome: string;
  sobrenome: string;
  email: string;
  senha: string;
};

export type DadosProduto = {
  nome: string;
  categoria: string;
  foto: string | null;
  quantidade: number;
  valor: number;
  dataCompra: string;
  dataVencimento: string | null;
};

export type AtendimentoApi = {
  id: number;
  nome: string;
  carro: string;
  placa: string;
  servico: string;
  data: string;
  horario: string;
  valor: number;
};

export type DadosAtendimento = {
  nome: string;
  carro: string;
  placa: string;
  servico: string;
  data: string;
  horario: string;
  valor: number;
};

function guardarToken(token: string) {
  tokenAtual = token;
}

export function removerToken() {
  tokenAtual = null;
}

async function requisicao<T>(
  rota: string,
  opcoes: RequestInit = {},
  precisaLogin = true
): Promise<T> {
  if (!API_URL) {
    throw new Error(
      'O endereço da API não foi configurado.'
    );
  }

  const headers: Record<string, string> = {};

  if (!(opcoes.body instanceof FormData)) {
    headers['Content-Type'] =
      'application/json';
  }

  if (precisaLogin) {
    if (!tokenAtual) {
      throw new Error(
        'Faça o login para continuar.'
      );
    }

    headers.Authorization =
      `Bearer ${tokenAtual}`;
  }

  const resposta = await fetch(
    `${API_URL}${rota}`,
    {
      ...opcoes,
      headers: {
        ...headers,
        ...(opcoes.headers as Record<
          string,
          string
        >),
      },
    }
  );

  const texto = await resposta.text();

  let dados: any = null;

  if (texto) {
    try {
      dados = JSON.parse(texto);
    } catch {
      dados = texto;
    }
  }

  if (!resposta.ok) {
    throw new Error(
      dados?.erro ||
        `Erro ${resposta.status} ao acessar a API.`
    );
  }

  return dados as T;
}

export function testarConexaoApi() {
  return requisicao<{
    status: string;
    servico: string;
  }>('/health', {}, false);
}

export async function cadastrarUsuarioApi(
  dados: DadosUsuario
) {
  const resposta =
    await requisicao<RespostaLogin>(
      '/auth/cadastro',
      {
        method: 'POST',
        body: JSON.stringify(dados),
      },
      false
    );

  guardarToken(resposta.token);

  return resposta;
}

export async function entrarUsuarioApi(
  email: string,
  senha: string
) {
  const resposta =
    await requisicao<RespostaLogin>(
      '/auth/login',
      {
        method: 'POST',
        body: JSON.stringify({
          email,
          senha,
        }),
      },
      false
    );

  guardarToken(resposta.token);

  return resposta;
}

export function listarAtendimentosApi() {
  return requisicao<AtendimentoApi[]>(
    '/atendimentos'
  );
}

export function cadastrarAtendimentoApi(
  dados: DadosAtendimento
) {
  return requisicao<AtendimentoApi>(
    '/atendimentos',
    {
      method: 'POST',
      body: JSON.stringify(dados),
    }
  );
}

export function listarCategoriasApi() {
  return requisicao('/categorias');
}

export function listarProdutosApi() {
  return requisicao('/produtos');
}

export function listarEstoqueApi() {
  return requisicao('/estoque');
}

export function listarMovimentacoesApi() {
  return requisicao('/movimentacoes');
}

export function cadastrarProdutoApi(
  dados: DadosProduto
) {
  const formulario = new FormData();

  formulario.append('nome', dados.nome);
  formulario.append(
    'categoria',
    dados.categoria
  );
  formulario.append(
    'quantidade',
    String(dados.quantidade)
  );
  formulario.append(
    'valor',
    String(dados.valor)
  );
  formulario.append(
    'dataCompra',
    dados.dataCompra
  );

  if (dados.dataVencimento) {
    formulario.append(
      'dataVencimento',
      dados.dataVencimento
    );
  }

  if (dados.foto) {
    formulario.append(
      'foto',
      {
        uri: dados.foto,
        name: 'produto.jpg',
        type: 'image/jpeg',
      } as any
    );
  }

  return requisicao('/produtos', {
    method: 'POST',
    body: formulario,
  });
}

export function registrarSaidaApi(
  idProduto: number,
  quantidade: number
) {
  return requisicao('/movimentacoes', {
    method: 'POST',
    body: JSON.stringify({
      id_produto: idProduto,
      tipo: 'SAIDA',
      quantidade,
      observacao:
        'Saída registrada pelo aplicativo AUTOCAR.',
    }),
  });
}

export function excluirProdutoApi(
  idProduto: number
) {
  return requisicao(
    `/produtos/${idProduto}`,
    {
      method: 'DELETE',
    }
  );
}

export function excluirCompraApi(
  idProduto: number,
  idCompra: number
) {
  return requisicao(
    `/produtos/${idProduto}/compras/${idCompra}`,
    {
      method: 'DELETE',
    }
  );
}
