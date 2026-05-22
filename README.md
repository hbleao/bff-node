# bff-node

Template de **Backend for Frontend (BFF)** construído com Node.js, Express e TypeScript. Segue os princípios SOLID e inclui configurações de segurança, logging estruturado e validação de variáveis de ambiente.

---

## Tecnologias

| Pacote | Função |
|--------|--------|
| [Express](https://expressjs.com/) | Servidor HTTP |
| [TypeScript](https://www.typescriptlang.org/) | Tipagem estática |
| [Zod](https://zod.dev/) | Validação de schema (env vars e request body) |
| [Winston](https://github.com/winstonjs/winston) | Logging estruturado |
| [Helmet](https://helmetjs.github.io/) | Security headers HTTP |
| [CORS](https://github.com/expressjs/cors) | Restrição de origem ao MuleSoft |
| [compression](https://github.com/expressjs/compression) | Compressão gzip das respostas |

---

## Requisitos

- Node.js >= 20
- pnpm >= 8

---

## Instalação

```bash
# Clone o repositório
git clone <url-do-repositorio>
cd bff-node

# Instale as dependências
pnpm i

# Configure as variáveis de ambiente
cp .env.example .env
```

Edite o `.env` com os valores do seu ambiente antes de iniciar.

---

## Scripts

```bash
pnpm dev        # inicia em modo desenvolvimento com hot-reload
pnpm build      # compila TypeScript para a pasta dist/
pnpm start      # executa o build compilado
pnpm lint       # verifica erros de lint
pnpm lint:fix   # corrige erros de lint automaticamente
```

---

## Variáveis de ambiente

| Variável | Padrão | Descrição |
|----------|--------|-----------|
| `NODE_ENV` | `development` | Ambiente de execução (`development`, `production`, `test`) |
| `PORT` | `3000` | Porta do servidor |
| `LOG_LEVEL` | `info` | Nível de log (`error`, `warn`, `info`, `debug`) |
| `LOG_DIR` | `logs` | Diretório dos arquivos de log (produção) |
| `MULESOFT_ORIGIN` | `http://mulesoft-gateway:8080` | Host do MuleSoft — única origem aceita pelo CORS |
| `EXTERNAL_API_URL` | — | URL base de uma API downstream |
| `EXTERNAL_API_KEY` | — | Chave de autenticação da API downstream |

A aplicação valida todas as variáveis na inicialização e encerra com mensagem de erro se alguma obrigatória estiver ausente ou inválida.

---

## Estrutura de pastas

```
src/
├── config/
│   ├── env.ts                  # parse e validação das env vars
│   └── logger.ts               # instância global do Winston
├── controllers/
│   └── user.controller.ts      # recebe HTTP, valida input, delega ao service
├── errors/
│   └── app-error.ts            # classe de erro com statusCode customizável
├── middlewares/
│   ├── error.middleware.ts          # tratamento centralizado de erros
│   └── request-logger.middleware.ts
├── repositories/
│   ├── interfaces/
│   │   └── user.repository.interface.ts
│   └── user.repository.ts      # implementação in-memory (substituir pelo DB)
├── routes/
│   ├── index.ts                # agrega todas as rotas
│   └── user.routes.ts
├── services/
│   ├── interfaces/
│   │   └── user.service.interface.ts
│   └── user.service.ts         # regras de negócio
└── app.ts                      # bootstrap da aplicação
```

---

## Endpoints

### Health check

```
GET /health
```

Retorna o status da aplicação. Não exige autenticação.

```json
{ "status": "ok", "env": "development" }
```

### Users

Base path: `/api/v1/users`

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/` | Lista todos os usuários |
| `GET` | `/:id` | Retorna um usuário por ID |
| `POST` | `/` | Cria um usuário |
| `PATCH` | `/:id` | Atualiza parcialmente um usuário |
| `DELETE` | `/:id` | Remove um usuário |

**POST /api/v1/users**

```json
{
  "name": "Henrique",
  "email": "henrique@email.com"
}
```

**PATCH /api/v1/users/:id**

```json
{
  "name": "Henrique Leão"
}
```

---

## Adicionando um novo domínio

Siga o padrão em 5 passos:

1. Crie a interface do repository em `repositories/interfaces/`
2. Implemente o repository em `repositories/`
3. Crie a interface do service em `services/interfaces/`
4. Implemente o service em `services/`
5. Crie o controller em `controllers/` e registre as rotas em `routes/`

---

## Tratamento de erros

| Tipo de erro | Status | Detalhe exposto ao cliente |
|--------------|--------|----------------------------|
| `AppError` | definido no lançamento | mensagem e code opcionais |
| `ZodError` | `422` | campos inválidos por nome |
| Erro genérico | `500` | mensagem genérica; stack logado no servidor |

Para lançar um erro operacional em qualquer camada:

```ts
import { AppError } from '../errors/app-error'

throw new AppError('Recurso não encontrado', 404)
```

---

## Decisões de arquitetura

Consulte o [ARCHITECTURE.md](./ARCHITECTURE.md) para o detalhamento de cada decisão técnica tomada no projeto.
