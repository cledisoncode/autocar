import { cadastrarAtendimentoApi, ErroApi } from '@/services/api';
import { confirmarPendencia, listarPendencias, marcarPendencia, reservarPendencia } from '@/services/dados-locais';
import type { Atendimento } from '@/contexts/app-data-context';

const emCurso = new Map<number, Promise<void>>();
export function sincronizarFila(usuario: number, sessaoValida: () => boolean, onSalvo: (salvo: Atendimento) => void) {
  const existente = emCurso.get(usuario);
  if (existente) return existente;
  const trabalho = (async () => {
    while (sessaoValida()) {
      const item = (await listarPendencias(usuario)).find(p => p.estado === 'pendente');
      if (!item || !sessaoValida()) return;
      // O estado é persistido ANTES do POST. Se o app fechar, a próxima
      // abertura transforma 'enviando' em 'incerto', nunca em novo envio.
      const reservada = await reservarPendencia(usuario, item.id);
      if (!reservada) continue;
      if (!sessaoValida()) {
        await marcarPendencia(usuario, item.id, 'pendente');
        return;
      }
      let salvo: Atendimento;
      try {
        salvo = await cadastrarAtendimentoApi(item.dados);
        if (!Number.isInteger(salvo?.id) || salvo.id <= 0) throw new Error('O servidor não confirmou o identificador do atendimento.');
      } catch (erro) {
        const mensagem = erro instanceof Error ? erro.message : 'Não foi possível confirmar o envio.';
        // Uma rejeição 4xx explícita não representa um cadastro confirmado.
        // Falha de rede, 5xx ou resposta incompleta deixam o resultado incerto.
        const rejeitado = erro instanceof ErroApi && erro.status >= 400 && erro.status < 500;
        await marcarPendencia(usuario, item.id, rejeitado ? 'erro' : 'incerto', mensagem);
        throw erro;
      }
      try {
        await confirmarPendencia(usuario, item.id, salvo);
      } catch (erro) {
        await marcarPendencia(usuario, item.id, 'incerto', 'O servidor confirmou o cadastro, mas houve falha ao atualizar o armazenamento local. Confira os registros antes de cadastrar novamente.');
        throw erro;
      }
      if (sessaoValida()) onSalvo(salvo);
    }
  })();
  emCurso.set(usuario, trabalho);
  void trabalho.finally(() => { if (emCurso.get(usuario) === trabalho) emCurso.delete(usuario); }).catch(() => undefined);
  return trabalho;
}
