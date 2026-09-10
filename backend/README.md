# AUTOCAR — API de estoque e finanças

Backend em Node.js, Express, Sequelize e PostgreSQL para o aplicativo móvel da
AUTOCAR Estética Automotiva. Esta versão preserva a estrutura original do projeto
e alinha as respostas ao formato usado pelo app Expo/React Native.

## O que esta versão cobre

- uma única conta administrativa;
- login com JWT e rotas privadas;
- cadastro de produtos e de novas compras;
- imagem opcional em JPEG, PNG ou WebP, com até 5 MB;
- estoque real, incluindo entradas, saídas, validade e estoque baixo;
- remoção lógica de produto e compra, sem apagar o histórico financeiro;
- atendimentos no formato exato do app;
- financeiro de hoje, mês escolhido ou todo o período;
- criação/atualização das tabelas pelo Sequelize;
- criação automática das quatro categorias usadas pelo aplicativo.

## Instalação

Pré-requisitos: Node.js 18 ou superior e PostgreSQL em execução.

1. Crie no PostgreSQL um banco vazio chamado `autocar`.
2. Copie `.env.example` para `.env`.
3. No `.env`, informe a sua própria senha do PostgreSQL e troque `JWT_SECRET`.
4. Instale e inicie a API:

```bash
npm install
npm run dev
```

Ao iniciar, o servidor testa a conexão, atualiza as tabelas e cria as categorias:
`Lavagem Interna`, `Lavagem Externa`, `Vidros` e `Acabamento`.

Durante o desenvolvimento, `DB_SYNC_ALTER=true` faz o Sequelize adaptar uma base
criada pela versão anterior. Depois que a estrutura estiver atualizada, ele pode
ser alterado para `false`.

## Endereço usado pelo aplicativo

- celular físico com Expo Go: `http://IP_DO_COMPUTADOR:3000/api`;
- emulador Android padrão: `http://10.0.2.2:3000/api`;
- Postman no mesmo computador: `http://localhost:3000/api`.

O celular e o computador devem estar na mesma rede. Se o celular não conectar,
libere a porta 3000 no firewall. Não use `localhost` no celular, porque nesse caso
`localhost` aponta para o próprio telefone.

## Autenticação

As rotas de cadastro e login são públicas. As demais exigem:

```text
Authorization: Bearer SEU_TOKEN
```

O servidor identifica o usuário pelo token. O app não deve enviar `idUsuario` nem
`id_usuario` nos formulários.

### Cadastro da conta administrativa

`POST /api/auth/cadastro`, JSON:

```json
{
  "nome": "Maria",
  "sobrenome": "Silva",
  "email": "maria@exemplo.com",
  "senha": "123456"
}
```

A senha precisa ter pelo menos seis caracteres. A resposta já contém `token` e
`usuario`. Depois da primeira conta, outro cadastro retorna HTTP 409.

### Login

`POST /api/auth/login`, JSON:

```json
{
  "email": "maria@exemplo.com",
  "senha": "123456"
}
```

Também estão disponíveis `GET /api/auth/me` e
`POST /api/auth/verificar-email`.

## Contrato principal do aplicativo

| Ação | Método e rota | Corpo |
|---|---|---|
| Verificar API | `GET /api/health` | nenhum |
| Listar categorias | `GET /api/categorias` | nenhum |
| Listar produtos e compras | `GET /api/produtos` | nenhum |
| Registrar compra/produto | `POST /api/produtos` | `multipart/form-data` |
| Remover produto | `DELETE /api/produtos/:id` | nenhum |
| Remover compra | `DELETE /api/produtos/:id/compras/:idCompra` | nenhum |
| Listar estoque | `GET /api/estoque` | nenhum |
| Listar alertas | `GET /api/estoque/alertas` | nenhum |
| Registrar movimentação | `POST /api/movimentacoes` | JSON |
| Listar movimentações | `GET /api/movimentacoes` | nenhum |
| Registrar atendimento | `POST /api/atendimentos` | JSON |
| Listar atendimentos | `GET /api/atendimentos` | nenhum |
| Resumo financeiro | `GET /api/relatorios/financeiro` | parâmetros na URL |

As rotas antigas de catálogo foram preservadas sob `/api/produtos/catalogo`.
O alias `/api/produtos/compras` também continua funcionando.

### Produto e compra

O aplicativo controla o estoque pela quantidade. Não são utilizados campos de
unidade ou tipo de volume.

Envie `POST /api/produtos` como `multipart/form-data`:

| Campo | Obrigatório | Exemplo |
|---|---:|---|
| `nome` | sim | `Shampoo automotivo` |
| `categoria` | sim | `Lavagem Externa` |
| `quantidade` | sim | `10` ou `2,5` |
| `valor` | sim | `120,00` — valor total pago |
| `dataCompra` | sim | `29/08/2026` |
| `dataVencimento` | não | `29/08/2027` |
| `foto` | não | arquivo de imagem |

Produto ativo com o mesmo nome e categoria recebe uma nova compra. Produto já
removido não é reativado: um novo cadastro cria outro registro, preservando o
histórico anterior.

### Movimentação de estoque

Saída, em JSON:

```json
{
  "id_produto": 1,
  "tipo": "SAIDA",
  "quantidade": 2,
  "observacao": "Uso em atendimento"
}
```

Entrada manual pode incluir `valor`, `dataCompra` e `dataVencimento`. A saída
desconta de verdade das compras válidas e a próxima consulta de estoque mostra o
novo saldo. Quantidades decimais são aceitas.

### Atendimento

`POST /api/atendimentos`, JSON:

```json
{
  "nome": "João",
  "carro": "Onix",
  "placa": "ABC1D23",
  "servico": "Lavagem completa",
  "data": "29/08/2026",
  "horario": "14:30",
  "valor": 80
}
```

A resposta usa exatamente: `id`, `nome`, `carro`, `placa`, `servico`, `data`,
`horario` e `valor`. Datas e horários são tratados no fuso `America/Belem`.

### Financeiro

```text
GET /api/relatorios/financeiro?periodo=hoje
GET /api/relatorios/financeiro?periodo=mes&mes=2026-08
GET /api/relatorios/financeiro?periodo=todos
```

`lucro = entradas dos atendimentos - despesas das compras`. Uma compra removida
da tela continua contando no histórico financeiro, conforme a regra do app.

## Verificações do projeto

```bash
npm run check
npm test
npm run test:models
```

`check` valida a sintaxe, `test` verifica datas e cálculos de saída e
`test:models` testa a conexão e consultas básicas no PostgreSQL configurado.

O roteiro completo de consumo está em [TESTE_CONSUMO_API.md](TESTE_CONSUMO_API.md).
