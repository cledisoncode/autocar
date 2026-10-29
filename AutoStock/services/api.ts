import { Platform } from 'react-native';
import type { CompraProduto, Produto } from '@/contexts/app-data-context';

const apiUrlConfigurada =
  process.env.EXPO_PUBLIC_API_URL?.trim();

const API_URL = (
  apiUrlConfigurada ||
  (Platform.OS === 'android'
    ? 'http://10.0.2.2:3000/api'
    : 'http://localhost:3000/api')
).replace(/\/+$/, '');

let tokenAtual: string | null = null;
let preparacaoConexao: Promise<void> | null = null;

export class ErroApi extends Error {
  constructor(mensagem: string, public readonly status: number) {
    super(mensagem);
    this.name = 'ErroApi';
  }
}

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

export type RespostaCadastroProduto = {
  produto: Produto;
  compra: CompraProduto;
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

export function guardarToken(token: string) {
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

  // Consultas e login não deixam a interface esperando indefinidamente.
  // Operações que gravam dados nunca são reenviadas automaticamente.
  const consulta = !opcoes.method || opcoes.method === 'GET' || rota === '/auth/login';
  const controle = consulta ? new AbortController() : null;
  const limite = controle ? setTimeout(() => controle.abort(), 90000) : null;
  let resposta: Response;
  let texto: string;
  try {
    resposta = await fetch(`${API_URL}${rota}`, {
      ...opcoes,
      ...(controle ? { signal: controle.signal } : {}),
      headers: { ...headers, ...(opcoes.headers as Record<string, string>) },
    });
    texto = await resposta.text();
  } finally {
    if (limite !== null) clearTimeout(limite);
  }

  let dados: any = null;

  if (texto) {
    try {
      dados = JSON.parse(texto);
    } catch {
      dados = texto;
    }
  }

  if (!resposta.ok) {
    throw new ErroApi(
      dados?.erro || `Erro ${resposta.status} ao acessar a API.`,
      resposta.status
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

// Uma única consulta pública enquanto a pessoa preenche o login. Não bloqueia
// a autenticação, não mantém o servidor acordado e não reenvia operações.
export function prepararConexaoApi(): Promise<void> {
  if (!preparacaoConexao) {
    preparacaoConexao = testarConexaoApi().then(() => undefined, () => undefined);
  }
  return preparacaoConexao;
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

export async function listarAtendimentosApi() {
  const resposta = await requisicao<AtendimentoApi[]>('/atendimentos');
  if (!Array.isArray(resposta)) throw new Error('O servidor não devolveu a lista de atendimentos. Tente atualizar os dados.');
  return resposta;
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

export function buscarProdutoApi(id: number) {
  return requisicao<Produto>(`/produtos/${id}`);
}

export async function listarProdutosApi() {
  const resposta = await requisicao<Produto[]>('/produtos');
  if (!Array.isArray(resposta)) throw new Error('O servidor não devolveu a lista de produtos. Tente atualizar os dados.');
  return resposta;
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

  return requisicao<RespostaCadastroProduto>('/produtos', {
    method: 'POST',
    body: formulario,
  });
}

export function registrarSaidaApi(
  idProduto: number,
  idCompra: number,
  quantidade: number
) {
  return requisicao('/movimentacoes', {
    method: 'POST',
    body: JSON.stringify({
      id_produto: idProduto,
      id_compra_produto: idCompra,
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
  return requisicao<{ removido: boolean }>(
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
  return requisicao<{ compra_removida: boolean; produto_removido: boolean }>(
    `/produtos/${idProduto}/compras/${idCompra}`,
    {
      method: 'DELETE',
    }
  );
}

export function solicitarRecuperacaoSenhaApi(email: string) {
  return requisicao<{ mensagem: string }>(
    '/auth/solicitar-recuperacao',
    {
      method: 'POST',
      body: JSON.stringify({ email }),
    },
    false
  );
}

export function redefinirSenhaApi(
  email: string,
  codigo: string,
  novaSenha: string
) {
  return requisicao<{ mensagem: string }>(
    '/auth/redefinir-senha',
    {
      method: 'POST',
      body: JSON.stringify({ email, codigo, novaSenha }),
    },
    false
  );
}

