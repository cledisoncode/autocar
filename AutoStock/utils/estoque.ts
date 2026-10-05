import type { CompraProduto, Produto } from '@/contexts/app-data-context';

export type SituacaoVencimento = 'valido' | 'proximo' | 'vencido';

export function converterData(texto: string): Date | null {
  if (!texto) return null;

  const brasileira = texto.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  const iso = texto.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!brasileira && !iso) return null;

  const [ano, mes, dia] = brasileira
    ? [Number(brasileira[3]), Number(brasileira[2]), Number(brasileira[1])]
    : [Number(iso![1]), Number(iso![2]), Number(iso![3])];
  const data = new Date(ano, mes - 1, dia);

  if (
    data.getFullYear() !== ano ||
    data.getMonth() !== mes - 1 ||
    data.getDate() !== dia
  ) return null;

  return data;
}

export function situacaoVencimento(
  texto: string | null,
  referencia = new Date()
): SituacaoVencimento | null {
  if (!texto) return null;
  const vencimento = converterData(texto);
  if (!vencimento) return null;

  const hoje = new Date(referencia);
  hoje.setHours(0, 0, 0, 0);
  const dias = Math.ceil((vencimento.getTime() - hoje.getTime()) / 86400000);

  if (dias < 0) return 'vencido';
  return dias <= 30 ? 'proximo' : 'valido';
}

export function quantidadeDaCompraDisponivel(compra: CompraProduto) {
  const saldo = Number(compra.quantidadeDisponivel ?? compra.quantidade);
  return Number.isFinite(saldo) ? Math.max(0, saldo) : 0;
}

export function quantidadeComprada(compra: CompraProduto) {
  const original = Number(compra.quantidadeComprada ?? compra.quantidade);
  return Number.isFinite(original) ? Math.max(0, original) : 0;
}

export function comprasVisiveis(produto: Produto) {
  if (produto.removido) return [];
  return produto.compras.filter((compra) => !compra.removida);
}

export function quantidadeDisponivel(produto: Produto, referencia = new Date()) {
  const total = comprasVisiveis(produto)
    .filter((compra) => situacaoVencimento(compra.dataVencimento, referencia) !== 'vencido')
    .reduce((saldo, compra) => saldo + quantidadeDaCompraDisponivel(compra), 0);

  return Math.round((total + Number.EPSILON) * 1000) / 1000;
}

export function produtoTemProximo(produto: Produto, referencia = new Date()) {
  return comprasVisiveis(produto).some((compra) =>
    quantidadeDaCompraDisponivel(compra) > 0 &&
    situacaoVencimento(compra.dataVencimento, referencia) === 'proximo'
  );
}

export function produtoTemVencido(produto: Produto, referencia = new Date()) {
  return comprasVisiveis(produto).some((compra) =>
    quantidadeDaCompraDisponivel(compra) > 0 &&
    situacaoVencimento(compra.dataVencimento, referencia) === 'vencido'
  );
}

export function produtoEstoqueBaixo(produto: Produto, referencia = new Date()) {
  const possuiCompraValida = comprasVisiveis(produto).some((compra) =>
    situacaoVencimento(compra.dataVencimento, referencia) !== 'vencido'
  );

  const saldo = quantidadeDisponivel(produto, referencia);
  const totalmenteVencido = produtoTemVencido(produto, referencia) && saldo === 0;
  return possuiCompraValida && !totalmenteVencido && saldo <= 2;
}
