import type { Produto } from '@/contexts/app-data-context';


export function atualizarProdutoSalvo(
  produtos: Produto[],
  salvo: Produto
): Produto[] {
  const anterior = produtos.find((produto) => produto.id === salvo.id);
  const compras = new Map(
    (anterior?.compras ?? []).map((compra) => [compra.id, compra])
  );

  for (const compra of salvo.compras) {
    compras.set(compra.id, compra);
  }

  const atualizado = {
    ...salvo,
    compras: [...compras.values()].sort((a, b) => b.id - a.id),
  };

  return [...produtos.filter((produto) => produto.id !== salvo.id), atualizado]
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
}
