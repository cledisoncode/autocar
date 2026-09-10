# Roteiro do teste de consumo da API

Este teste produz o feedback pedido: confirma conexão, autenticação, envio de
dados pelo cliente, gravação no PostgreSQL e leitura do resultado atualizado.

## Preparação

1. Inicie PostgreSQL e a API com `npm run dev`.
2. No Postman, crie a variável `baseUrl` com `http://localhost:3000/api`.
3. No celular, troque `localhost` pelo IP do computador.

## Sequência de teste

### 1. Saúde da API

`GET {{baseUrl}}/health`

Esperado: HTTP 200 e `{"status":"ok","servico":"AUTOCAR API"}`.

### 2. Criar ou entrar na conta

Se a base estiver vazia, use `POST {{baseUrl}}/auth/cadastro` com JSON:

```json
{
  "nome": "Teste",
  "sobrenome": "AUTOCAR",
  "email": "teste@autocar.com",
  "senha": "123456"
}
```

Se a conta já existir, use `POST {{baseUrl}}/auth/login`. Copie o `token` da
resposta. Nas próximas requisições, adicione o cabeçalho:

```text
Authorization: Bearer TOKEN_COPIADO
```

### 3. Conferir categorias

`GET {{baseUrl}}/categorias`

Esperado: HTTP 200 e as quatro categorias do aplicativo.

### 4. Cadastrar uma compra

`POST {{baseUrl}}/produtos`; escolha `Body > form-data`:

| Key | Value | Tipo |
|---|---|---|
| `nome` | `Shampoo teste` | Text |
| `categoria` | `Lavagem Externa` | Text |
| `quantidade` | `10` | Text |
| `valor` | `100` | Text |
| `dataCompra` | `29/08/2026` | Text |
| `dataVencimento` | `29/08/2027` | Text |
| `foto` | imagem opcional | File |

Esperado: HTTP 201. Guarde `produto.id`; ele será o `id_produto`.

### 5. Verificar a gravação e o saldo

- `GET {{baseUrl}}/produtos` deve mostrar o produto e sua compra.
- `GET {{baseUrl}}/estoque` deve mostrar `estoque_atual: 10`.
- No PostgreSQL, as tabelas `produtos`, `compras_produto` e
  `movimentacoes_estoque` devem possuir registros correspondentes.

### 6. Testar uma saída real

`POST {{baseUrl}}/movimentacoes`, JSON:

```json
{
  "id_produto": 1,
  "tipo": "SAIDA",
  "quantidade": 2,
  "observacao": "Teste de consumo da API"
}
```

Substitua `1` pelo id guardado. Esperado: `estoque_anterior: 10` e
`estoque_atual: 8`.

Repita `GET {{baseUrl}}/estoque`. O resultado precisa continuar em `8`. Essa
segunda consulta é o que prova que a movimentação foi persistida, e não apenas
calculada na resposta.

### 7. Cadastrar atendimento

`POST {{baseUrl}}/atendimentos`, JSON:

```json
{
  "nome": "Cliente teste",
  "carro": "Onix",
  "placa": "ABC1D23",
  "servico": "Lavagem completa",
  "data": "29/08/2026",
  "horario": "14:30",
  "valor": 80
}
```

Depois, `GET {{baseUrl}}/atendimentos` deve devolver o mesmo atendimento com a
data `29/08/2026` e o horário `14:30`.

### 8. Verificar financeiro

Use `GET {{baseUrl}}/relatorios/financeiro?periodo=todos`.

Com apenas os dados deste roteiro, o esperado é:

- entradas: 80;
- despesas: 100;
- lucro: -20.

## Feedback que pode ser enviado

> Testei o consumo da API localmente. Cadastro/login, produtos, estoque,
> movimentação, atendimentos e financeiro responderam e gravaram no PostgreSQL.
> Cadastrei 10 unidades, retirei 2 e a nova consulta manteve saldo 8, confirmando
> a persistência. O app deverá guardar o JWT e enviá-lo como Bearer nas rotas.

Se alguma etapa falhar, envie junto o método, a URL, o corpo, o status HTTP, a
resposta JSON e o log exibido no terminal da API.
