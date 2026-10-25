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
- recuperação de senha por código enviado ao e-mail cadastrado, válido por 10 minutos.

## Instalação

Pré-requisitos: Node.js 18 ou superior e PostgreSQL em execução.

## Recuperação de senha

A recuperação envia um código de uso único para o e-mail cadastrado. Em desenvolvimento local, o backend aceita SMTP:

```dotenv
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=seu-email@gmail.com
SMTP_PASSWORD=senha-de-aplicativo-do-provedor
SMTP_FROM=AUTOCAR <seu-email@gmail.com>
```

Para usar o Brevo por API HTTPS (recomendado na Render gratuita, que bloqueia conexões SMTP de saída nas portas 25, 465 e 587), configure no ambiente do backend:

```dotenv
EMAIL_PROVIDER=brevo
BREVO_API_KEY=CHAVE_DA_API_DO_BREVO
BREVO_FROM_EMAIL=REMETENTE_VERIFICADO_NO_BREVO
BREVO_FROM_NAME=AUTOCAR
```

No Brevo, habilite o envio transacional e cadastre/verifique o remetente. Se enviar usando um endereço Gmail sem autenticar um domínio próprio, o Brevo pode substituir o endereço exibido do remetente. Guarde a chave de API apenas nas variáveis de ambiente; não a publique no Git ou no aplicativo. Sem as configurações do provedor escolhido, a API informa que o envio não está configurado. A tabela `codigos_recuperacao_senha` é criada pelo Sequelize junto das demais tabelas.

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

## Preparar conexão com Supabase

O backend usa Sequelize com conexão PostgreSQL direta; não coloque credenciais do
banco no aplicativo. No painel do Supabase, abra **Connect** e copie os dados do
**Session pooler** se o host onde o Node será executado tiver somente IPv4. Para
um backend persistente com IPv6, a conexão direta é a opção indicada. O pooler de
sessão usa a porta e o usuário mostrados na própria URI do painel; não presuma
esses valores.

O banco padrão do projeto Supabase se chama `postgres`, não `autocar`, a menos
que outro banco tenha sido criado explicitamente. Configure em `backend/.env`:

```env
DB_HOST=HOST_COPIADO_DO_PAINEL
DB_PORT=PORTA_COPIADA_DO_PAINEL
DB_NAME=postgres
DB_USER=USUARIO_COPIADO_DO_PAINEL
DB_PASSWORD=SENHA_DO_BANCO
DB_SSL=true
DB_SSL_CA=certs/supabase-ca.crt
DB_SYNC_ALTER=false
```

Baixe o certificado CA em **Project Settings → Database → SSL Configuration**
e salve como `backend/certs/supabase-ca.crt`. A pasta `certs` não precisa ser
versionada; o `.gitignore` exclui o certificado. A aplicação valida o certificado
TLS e interrompe a inicialização se o caminho não estiver configurado ou se o
arquivo estiver ausente.

`DB_SYNC_ALTER=false` evita que o servidor altere tabelas existentes ao iniciar.
O Sequelize ainda cria tabelas ausentes; para migrar dados existentes, confira o
schema e faça backup antes de iniciar o backend conectado ao projeto Supabase.
Depois de preencher o `.env` e salvar o certificado, execute `npm run test:models`
para verificar a conexão antes de iniciar a API.

### Imagens no Supabase Storage

O backend aceita `STORAGE_PROVIDER=local` para desenvolvimento local (padrão) e
`STORAGE_PROVIDER=supabase` para guardar novas imagens no Storage. No painel do
Supabase, crie um bucket chamado `product-images` como **público**, pois o app
precisa exibir as imagens por URL. Restrinja o bucket a imagens JPEG, PNG e WebP
com limite de 5 MB. O backend envia e remove objetos pelo Storage API. Use uma
Secret key (`sb_secret_...`) somente no backend; nunca a coloque no aplicativo,
no Git ou em mensagens. Chaves antigas `service_role` também são aceitas para
compatibilidade.

Configure no ambiente do backend:

```env
STORAGE_PROVIDER=supabase
SUPABASE_URL=https://SEU-PROJETO.supabase.co
SUPABASE_SECRET_KEY=CHAVE_SECRETA_DO_BACKEND
SUPABASE_STORAGE_BUCKET=product-images
```

### Hospedar a API na Render

No [painel da Render](https://dashboard.render.com/), crie **New → Web Service**
e conecte o repositório Git. Para este repositório, configure:

| Campo | Valor |
|---|---|
| Root Directory | `backend` |
| Runtime | `Node` |
| Build Command | `npm ci` |
| Start Command | `npm start` |
| Health Check Path | `/api/health` |

Cadastre as variáveis abaixo em **Environment** na Render. Copie os valores do
projeto Supabase e nunca publique os valores secretos. O certificado CA pode ser
colado como conteúdo PEM em `DB_SSL_CA_CONTENT`; deixe `DB_SSL_CA` sem valor na
Render, pois o arquivo local em `certs/` não é enviado ao Git.

```env
NODE_ENV=production
DB_HOST=HOST_DO_SESSION_POOLER
DB_PORT=PORTA_DO_SESSION_POOLER
DB_NAME=postgres
DB_USER=USUARIO_DO_SESSION_POOLER
DB_PASSWORD=SENHA_DO_POSTGRES_SUPABASE
DB_SSL=true
DB_SSL_CA_CONTENT=CONTEUDO_PEM_DO_CERTIFICADO_CA
DB_SYNC_ALTER=false
DB_LOGGING=false
JWT_SECRET=SEGREDO_ALEATORIO_LONGO_E_EXCLUSIVO
APP_TIMEZONE=America/Belem
APP_UTC_OFFSET=-03:00
CORS_ORIGIN=*
STORAGE_PROVIDER=supabase
SUPABASE_URL=https://SEU-PROJETO.supabase.co
SUPABASE_SECRET_KEY=CHAVE_SECRETA_DO_BACKEND
SUPABASE_STORAGE_BUCKET=product-images
```

A Render define `PORT` automaticamente. Após o deploy, valide
`https://NOME-DO-SERVICO.onrender.com/api/health`. O aplicativo móvel deverá
usar a URL HTTPS da API publicada em sua configuração de endereço; este passo
fica no projeto frontend. A primeira implantação não transfere imagens que já
estejam na pasta local `uploads/`.

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
