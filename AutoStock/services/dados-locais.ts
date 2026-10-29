import * as SQLite from 'expo-sqlite';
import type { Atendimento, Produto } from '@/contexts/app-data-context';
import type { DadosAtendimento } from '@/services/api';

export type EstadoPendencia = 'pendente' | 'enviando' | 'incerto' | 'erro';
export type Pendencia = {
  id: number;
  estado: EstadoPendencia;
  dados: DadosAtendimento;
  mensagem: string | null;
};
type LinhaPendencia = { id: number; estado: EstadoPendencia; dados: string; mensagem: string | null };
let conexao: Promise<SQLite.SQLiteDatabase> | null = null;
// Todas as operações passam pela mesma fila. Evita transações sobrepostas e
// impede que uma consulta leia metade de uma atualização do cache.
let fila: Promise<unknown> = Promise.resolve();
function serializar<T>(acao: () => Promise<T>): Promise<T> {
  const resultado = fila.then(acao);
  fila = resultado.catch(() => undefined);
  return resultado;
}
async function banco() {
  if (!conexao) {
    conexao = SQLite.openDatabaseAsync('autocar-sprint3.db').then(async db => {
      const versao = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
      if (versao && versao.user_version > 1) throw new Error('O armazenamento local foi criado por uma versão mais recente. Atualize o aplicativo.');
      await db.execAsync(`
        PRAGMA journal_mode = WAL;
        PRAGMA foreign_keys = ON;
        CREATE TABLE IF NOT EXISTS cache_contas (
          usuario_id INTEGER PRIMARY KEY, atualizado_em TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS produtos_locais (
          usuario_id INTEGER NOT NULL, id INTEGER NOT NULL, dados TEXT NOT NULL,
          PRIMARY KEY(usuario_id, id)
        );
        CREATE TABLE IF NOT EXISTS compras_locais (
          usuario_id INTEGER NOT NULL, produto_id INTEGER NOT NULL, id INTEGER NOT NULL,
          dados TEXT NOT NULL, PRIMARY KEY(usuario_id, produto_id, id),
          FOREIGN KEY(usuario_id, produto_id) REFERENCES produtos_locais(usuario_id, id) ON DELETE CASCADE
        );
        CREATE TABLE IF NOT EXISTS atendimentos_locais (
          usuario_id INTEGER NOT NULL, id INTEGER NOT NULL, dados TEXT NOT NULL,
          PRIMARY KEY(usuario_id, id)
        );
        CREATE TABLE IF NOT EXISTS pendencias_atendimento (
          id INTEGER PRIMARY KEY AUTOINCREMENT, usuario_id INTEGER NOT NULL,
          estado TEXT NOT NULL CHECK(estado IN ('pendente','enviando','incerto','erro')),
          dados TEXT NOT NULL, mensagem TEXT
        );
        PRAGMA user_version = 1;
      `);
      // Se o processo morreu durante um POST, não é possível saber se o servidor
      // gravou. Não devolve esses itens à fila de envio automático.
      await db.runAsync("UPDATE pendencias_atendimento SET estado = 'incerto', mensagem = ? WHERE estado = 'enviando'", 'O aplicativo foi fechado durante o envio. Confira o registro no servidor antes de cadastrar novamente.');
      return db;
    }).catch(erro => { conexao = null; throw erro; });
  }
  return conexao;
}
export function salvarCache(usuario: number, produtos: Produto[], atendimentos: Atendimento[]) {
  return serializar(async () => {
    const db = await banco();
    await db.withExclusiveTransactionAsync(async tx => {
      await tx.runAsync('DELETE FROM compras_locais WHERE usuario_id = ?', usuario);
      await tx.runAsync('DELETE FROM produtos_locais WHERE usuario_id = ?', usuario);
      await tx.runAsync('DELETE FROM atendimentos_locais WHERE usuario_id = ?', usuario);
      for (const produto of produtos) {
        const { compras, ...dados } = produto;
        await tx.runAsync('INSERT INTO produtos_locais (usuario_id,id,dados) VALUES (?,?,?)', usuario, produto.id, JSON.stringify(dados));
        for (const compra of compras) await tx.runAsync('INSERT INTO compras_locais (usuario_id,produto_id,id,dados) VALUES (?,?,?,?)', usuario, produto.id, compra.id, JSON.stringify(compra));
      }
      for (const item of atendimentos) await tx.runAsync('INSERT INTO atendimentos_locais (usuario_id,id,dados) VALUES (?,?,?)', usuario, item.id, JSON.stringify(item));
      await tx.runAsync('INSERT OR REPLACE INTO cache_contas (usuario_id,atualizado_em) VALUES (?,?)', usuario, new Date().toISOString());
    });
  });
}
export function lerCache(usuario: number) {
  return serializar(async () => {
    const db = await banco();
    const conta = await db.getFirstAsync<{ atualizado_em: string }>('SELECT atualizado_em FROM cache_contas WHERE usuario_id = ?', usuario);
    if (!conta) return null;
    const produtos = await db.getAllAsync<{ id: number; dados: string }>('SELECT id,dados FROM produtos_locais WHERE usuario_id = ? ORDER BY id', usuario);
    const compras = await db.getAllAsync<{ produto_id: number; dados: string }>('SELECT produto_id,dados FROM compras_locais WHERE usuario_id = ? ORDER BY id', usuario);
    const atendimentos = await db.getAllAsync<{ dados: string }>('SELECT dados FROM atendimentos_locais WHERE usuario_id = ? ORDER BY id DESC', usuario);
    return {
      atualizadoEm: conta.atualizado_em,
      produtos: produtos.map(p => ({ ...JSON.parse(p.dados), compras: compras.filter(c => c.produto_id === p.id).map(c => JSON.parse(c.dados)) })) as Produto[],
      atendimentos: atendimentos.map(a => JSON.parse(a.dados)) as Atendimento[],
    };
  });
}
export function listarPendencias(usuario: number) {
  return serializar(async () => {
    const db = await banco();
    const linhas = await db.getAllAsync<LinhaPendencia>('SELECT id,estado,dados,mensagem FROM pendencias_atendimento WHERE usuario_id = ? ORDER BY id', usuario);
    return linhas.map(p => ({ ...p, dados: JSON.parse(p.dados) as DadosAtendimento }));
  });
}
export function guardarPendencia(usuario: number, dados: DadosAtendimento) {
  return serializar(async () => {
    const db = await banco();
    const resultado = await db.runAsync("INSERT INTO pendencias_atendimento (usuario_id,estado,dados) VALUES (?,'pendente',?)", usuario, JSON.stringify(dados));
    return resultado.lastInsertRowId;
  });
}
export function marcarPendencia(usuario: number, id: number, estado: EstadoPendencia, mensagem: string | null = null) {
  return serializar(async () => {
    const db = await banco();
    await db.runAsync('UPDATE pendencias_atendimento SET estado = ?, mensagem = ? WHERE usuario_id = ? AND id = ?', estado, mensagem, usuario, id);
  });
}
export function reservarPendencia(usuario: number, id: number) {
  return serializar(async () => {
    const db = await banco();
    // A escolha e o descarte podem acontecer entre duas tarefas assíncronas.
    // Só envia se a pendência ainda existir e continuar aguardando envio.
    const resultado = await db.runAsync("UPDATE pendencias_atendimento SET estado = 'enviando', mensagem = NULL WHERE usuario_id = ? AND id = ? AND estado = 'pendente'", usuario, id);
    return resultado.changes === 1;
  });
}
export function confirmarPendencia(usuario: number, id: number, salvo: Atendimento) {
  return serializar(async () => {
    const db = await banco();
    await db.withExclusiveTransactionAsync(async tx => {
      await tx.runAsync('INSERT OR REPLACE INTO atendimentos_locais (usuario_id,id,dados) VALUES (?,?,?)', usuario, salvo.id, JSON.stringify(salvo));
      await tx.runAsync('DELETE FROM pendencias_atendimento WHERE usuario_id = ? AND id = ?', usuario, id);
    });
  });
}
export function descartarPendencia(usuario: number, id: number) {
  return serializar(async () => {
    const db = await banco();
    const resultado = await db.runAsync("DELETE FROM pendencias_atendimento WHERE usuario_id = ? AND id = ? AND estado != 'enviando'", usuario, id);
    return resultado.changes === 1;
  });
}
