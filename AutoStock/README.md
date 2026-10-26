# AutoStock — execução local

## Configurar o endereço da API

O app usa `EXPO_PUBLIC_API_URL` quando a variável está definida. Sem ela, usa
`http://10.0.2.2:3000/api` no emulador Android padrão e
`http://localhost:3000/api` nas demais plataformas.

Para usar um aparelho físico, crie `AutoStock/.env` a partir de
`.env.example` e substitua o endereço pelo IP local do computador, por exemplo:

```dotenv
EXPO_PUBLIC_API_URL=http://192.168.1.10:3000/api
```

O IP acima é apenas ilustrativo. O celular e o computador precisam estar na
mesma rede, e o firewall do computador precisa permitir a porta 3000. Reinicie
o Expo depois de alterar o arquivo `.env`.

## Iniciar

Em um terminal, inicie o PostgreSQL e a API seguindo as instruções de
`../backend/README.md`. Em outro terminal:

```powershell
npm install
npm start
```

No navegador do computador, a URL da API pode ser conferida em
`http://localhost:3000/api/health`. No emulador Android, o app alcança o host
pela URL `http://10.0.2.2:3000/api`.
