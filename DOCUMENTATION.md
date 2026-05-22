# BFF Node — Documentação Técnica

## Visão Geral

BFF (Backend for Frontend) construído com Node.js, Express e TypeScript. Atua como camada de agregação e orquestração entre o MuleSoft (origem das requisições) e serviços downstream como a API BCP e o Salesforce Personalization.

```
MuleSoft → BFF Node → BCP API
                    → Salesforce Personalization
```

---

## Stack Tecnológica

| Categoria | Tecnologia |
|---|---|
| Runtime | Node.js |
| Framework | Express 4 |
| Linguagem | TypeScript 5 |
| Validação | Zod 4 |
| Logging | Winston + winston-daily-rotate-file |
| Testes | Vitest + Supertest |
| Linting/Formatação | Biome |
| Git hooks | Lefthook |
| Documentação API | Swagger UI + zod-to-openapi |
| Observabilidade | express-actuator + prom-client |

---

## Estrutura de Diretórios

```
src/
├── app.ts                          # Configuração do Express (middlewares, rotas)
├── server.ts                       # Ponto de entrada — inicia o servidor HTTP
├── config/
│   ├── env.ts                      # Parsing e validação de variáveis de ambiente (Zod)
│   ├── index.ts                    # Re-exports de config
│   ├── logger.ts                   # Instância do Winston com formatos e transports
│   ├── metrics.ts                  # Registry Prometheus + Histogram HTTP
│   └── request-context.ts          # AsyncLocalStorage para correlation ID por requisição
├── controllers/
│   ├── user.controller.ts          # Handlers HTTP do domínio User
│   └── personalization.controller.ts # Handler HTTP do domínio Personalization
├── services/
│   ├── user.service.ts             # Lógica de negócio do domínio User
│   ├── personalization.service.ts  # Orquestração BCP → Salesforce
│   └── interfaces/
│       ├── user.service.interface.ts
│       └── personalization.service.interface.ts
├── repositories/
│   ├── user.repository.ts          # Implementação in-memory (substituível por banco)
│   ├── bcp.repository.ts           # Client HTTP para a API BCP
│   ├── salesforce-personalization.repository.ts # Client OAuth2 para Salesforce
│   └── interfaces/
│       ├── user.repository.interface.ts
│       ├── bcp.repository.interface.ts
│       └── salesforce-personalization.repository.interface.ts
├── routes/
│   ├── index.ts                    # Agrega todas as rotas sob /api/v1
│   ├── user.routes.ts              # CRUD de usuários
│   └── personalization.routes.ts   # Rota de eventos de personalização
├── middlewares/
│   ├── index.ts
│   ├── error.middleware.ts         # Tratamento centralizado de erros
│   ├── metrics.middleware.ts       # Registra duração HTTP no Prometheus
│   └── request-logger.middleware.ts # Logging de requisições + correlation ID
├── errors/
│   └── app-error.ts               # Classe base para erros da aplicação
└── docs/
    └── openapi.ts                  # Especificação OpenAPI 3.1 gerada via Zod
```

---

## Variáveis de Ambiente

Todas as variáveis são validadas na inicialização via Zod. O processo é encerrado com erro caso alguma variável obrigatória esteja inválida.

| Variável | Tipo | Padrão | Descrição |
|---|---|---|---|
| `NODE_ENV` | `development \| production \| test` | `development` | Ambiente de execução |
| `PORT` | number | `3000` | Porta do servidor HTTP |
| `LOG_LEVEL` | `error \| warn \| info \| debug` | `info` | Nível mínimo de log |
| `LOG_DIR` | string | `logs` | Diretório dos arquivos de log |
| `SLOW_REQUEST_THRESHOLD_MS` | number | `2000` | Limiar para alertas de requisição lenta (ms) |
| `MULESOFT_ORIGIN` | string | `http://localhost:3000` | Origem permitida pelo CORS |
| `EXTERNAL_API_URL` | URL (opcional) | — | URL genérica de API externa |
| `EXTERNAL_API_KEY` | string (opcional) | — | Chave de API genérica |
| `BCP_BASE_URL` | URL (opcional) | — | URL base da API BCP |
| `BCP_API_KEY` | string (opcional) | — | Chave Bearer da API BCP |
| `SF_PERSONALIZATION_BASE_URL` | URL (opcional) | — | URL base do Salesforce Personalization |
| `SF_PERSONALIZATION_DATASET_ID` | string (opcional) | — | Dataset ID do Salesforce |
| `SF_PERSONALIZATION_CLIENT_ID` | string (opcional) | — | Client ID OAuth2 do Salesforce |
| `SF_PERSONALIZATION_CLIENT_SECRET` | string (opcional) | — | Client Secret OAuth2 do Salesforce |
| `SF_PERSONALIZATION_TOKEN_URL` | URL | `https://login.salesforce.com/services/oauth2/token` | Endpoint de token OAuth2 |

> As variáveis do BCP e do Salesforce são opcionais no esquema mas são exigidas em runtime quando as respectivas rotas são acessadas — a instanciação dos repositórios é lazy (ocorre na primeira requisição).

---

## Middlewares (ordem de execução)

Os middlewares são registrados no `src/app.ts` e executados nesta ordem para toda requisição.

### 1. `helmet()` — Headers de segurança

```ts
app.use(helmet());
```

O Helmet é um conjunto de ~15 middlewares Express agrupados num só. Ele define headers HTTP que protegem contra ataques comuns no navegador:

- `Content-Security-Policy` — restringe de onde scripts, estilos e recursos podem ser carregados
- `X-Frame-Options: DENY` — impede que a página seja embarcada em `<iframe>` (proteção contra clickjacking)
- `X-Content-Type-Options: nosniff` — impede que o browser "adivinhe" o tipo do conteúdo
- `Referrer-Policy` — controla quanta informação do `Referer` é enviada
- `Strict-Transport-Security` — força HTTPS em requests futuros

Não tem lógica customizada aqui; é configuração de segurança padrão para qualquer API.

---

### 2. `cors()` — Controle de origem

```ts
app.use(cors({
  origin: env.MULESOFT_ORIGIN,
  methods: ["GET", "POST", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Request-ID"],
  exposedHeaders: ["X-Request-ID"],
}));
```

CORS (Cross-Origin Resource Sharing) decide quem pode chamar a API. Aqui está configurado para aceitar **apenas requisições vindas do MuleSoft** (definido em `MULESOFT_ORIGIN`).

O que cada opção faz:
- `origin` — qualquer request de origem diferente recebe status `403` automaticamente
- `methods` — limita os verbos HTTP aceitos; um `PUT`, por exemplo, seria rejeitado
- `allowedHeaders` — define quais headers o cliente pode enviar; headers extras são bloqueados
- `exposedHeaders` — permite que o browser do cliente leia o header `X-Request-ID` da resposta (por padrão, browsers só expõem headers básicos)

Para requisições `OPTIONS` (preflight), o CORS responde automaticamente sem chegar nas suas rotas.

---

### 3. `express.json()` + `express.urlencoded()` + `compression()` — Body e compressão

```ts
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(compression());
```

**`express.json`**: faz o parse do body JSON e popula `req.body`. O limite de `10kb` rejeita payloads maiores com status `413`, protegendo contra ataques de payload gigante.

**`express.urlencoded`**: mesmo conceito para bodies no formato `application/x-www-form-urlencoded` (formulários HTML).

**`compression`**: comprime as respostas com gzip/deflate automaticamente, desde que o cliente envie o header `Accept-Encoding: gzip`. Reduz tráfego de rede sem nenhuma mudança nos controllers.

---

### 4. `metricsMiddleware` — Coleta de métricas Prometheus

`src/middlewares/metrics.middleware.ts`

```ts
app.use(metricsMiddleware);
```

Registra a duração de cada requisição no Histogram `http_request_duration_seconds` com três labels:

- `method` — verbo HTTP (`GET`, `POST`, etc.)
- `route` — padrão da rota (`/api/v1/users/:id`), **não** o valor real do path. Isso evita alta cardinalidade no Prometheus — sem esse cuidado, cada UUID diferente geraria uma série de métricas nova.
- `status_code` — código HTTP da resposta

Além disso, o `prom-client` coleta automaticamente **métricas default do Node.js**:

| Métrica | Descrição |
|---|---|
| `nodejs_eventloop_lag_seconds` | Lag do event loop |
| `nodejs_gc_duration_seconds` | Duração do Garbage Collector |
| `process_cpu_seconds_total` | Uso de CPU |
| `process_resident_memory_bytes` | Memória residente (RSS) |
| `nodejs_heap_size_used_bytes` | Heap utilizado |

No Grafana, o dashboard **ID 11159** (Node.js Application Dashboard) consome exatamente essas métricas sem configuração adicional.

---

### 5. `requestLogger` — Correlation ID + logging de requisições

`src/middlewares/request-logger.middleware.ts`

Este é o middleware mais elaborado do projeto. Ele faz três coisas encadeadas:

#### 4a. Gera ou propaga o `X-Request-ID`

```ts
const requestId =
  (req.headers["x-request-id"] as string | undefined) ?? randomUUID();

res.setHeader("X-Request-ID", requestId);
```

Se o MuleSoft já enviou um `X-Request-ID` no request, ele é reutilizado — isso permite rastrear a mesma operação do início ao fim da cadeia (MuleSoft → BFF → Salesforce). Se não veio, gera um UUID novo.

O header é devolvido na resposta para que quem chamou possa correlacionar também.

#### 4b. Armazena o ID no `AsyncLocalStorage`

```ts
requestContext.run(requestId, () => {
  // tudo dentro daqui tem acesso ao requestId via requestContext.getRequestId()
  next();
});
```

O `AsyncLocalStorage` (Node.js nativo) funciona como um "contexto global por requisição" — similar a uma variável de thread em outras linguagens. Qualquer código que rode durante o lifecycle daquela requisição (controllers, services, repositories) pode chamar `requestContext.getRequestId()` e obter o ID correto, **sem precisar passar o `req` por toda a cadeia**.

O logger (`src/config/logger.ts`) tem um format customizado que chama `requestContext.getRequestId()` em **todo log emitido**, injetando o `requestId` automaticamente:

```ts
const requestIdFormat = winston.format((info) => {
  const requestId = requestContext.getRequestId();
  if (requestId) info.requestId = requestId;
  return info;
});
```

Resultado: todos os logs de uma mesma requisição têm o mesmo `requestId`, sem nenhum esforço nos controllers ou services.

#### 4c. Loga a requisição ao fim

```ts
res.on("finish", () => {
  const durationMs = Date.now() - start;
  const isSlow = durationMs >= env.SLOW_REQUEST_THRESHOLD_MS;

  if (isSlow) {
    logger.warn("Slow HTTP request", meta);
  } else {
    logger.info("HTTP request", meta);
  }
});
```

O evento `finish` dispara depois que a resposta foi enviada ao cliente. Isso garante que o log sempre tenha o `statusCode` final. Se a duração ultrapassar `SLOW_REQUEST_THRESHOLD_MS` (padrão: 2000ms), o log é emitido como `warn` em vez de `info`, facilitando alertas de performance.

---

### 6. `errorMiddleware` — Tratamento centralizado de erros

`src/middlewares/error.middleware.ts`

```ts
app.use(errorMiddleware); // registrado por último
```

O Express identifica um middleware de erro pelo fato de ter **4 parâmetros** `(err, req, res, next)`. Qualquer `throw` dentro de um controller assíncrono (capturado pelo `express-async-errors`) ou qualquer `next(err)` explícito chega aqui.

O middleware trata três casos distintos:

#### Caso 1: `AppError` (erros controlados da aplicação)

```ts
if (err instanceof AppError) {
  if (err.statusCode >= 500) {
    logger.error("Application error", { error, code, stack, cause });
  }
  res.status(err.statusCode).json({ error: err.message, code: err.code });
}
```

Erros de negócio (`404 User not found`) e de gateway (`502 BCP API error`) chegam aqui. Erros `>= 500` são logados com stack trace completo; erros `4xx` são silenciosos no log (são esperados).

#### Caso 2: `ZodError` (falha de validação de input)

```ts
if (err instanceof ZodError) {
  res.status(422).json({
    error: "Validation error",
    details: err.flatten().fieldErrors,
  });
}
```

Quando o `.parse()` do Zod falha no controller, o Zod lança um `ZodError` com detalhes por campo. O middleware converte para `422 Unprocessable Entity` com a estrutura:

```json
{
  "error": "Validation error",
  "details": {
    "email": ["Invalid email"],
    "name": ["String must contain at least 1 character(s)"]
  }
}
```

#### Caso 3: erro não tratado

```ts
logger.error("Unhandled error", { error, stack, cause });
res.status(500).json({ error: "Internal server error" });
```

Qualquer erro que não seja `AppError` nem `ZodError` cai aqui — bugs inesperados, erros de terceiros, etc. A mensagem real do erro **não é exposta ao cliente** (só `"Internal server error"`), mas é logada com stack trace completo para investigação.

---

### Resumo — tipos de erro e respostas

| Tipo de erro | Status HTTP | Resposta |
|---|---|---|
| `AppError` | `err.statusCode` | `{ error, code }` |
| `ZodError` (validação) | `422` | `{ error: "Validation error", details }` |
| Erro genérico | `500` | `{ error: "Internal server error" }` |

Erros com `statusCode >= 500` são logados em nível `error` com stack trace e causa encadeada.

---

### Fluxo completo de uma requisição

```
Request chega
  → helmet()              — adiciona headers de segurança
  → GET /metrics          — respondido aqui se for scraping do Prometheus (antes do CORS)
  → cors()                — valida a origem; rejeita se não for MuleSoft
  → express.json()        — parseia o body JSON
  → compression()         — prepara compressão da resposta
  → requestLogger         — gera X-Request-ID, abre contexto AsyncLocalStorage
  → metricsMiddleware     — inicia o timer do Histogram Prometheus
      → router /api/v1    — chega no controller
          → controller valida com Zod → service → repository
          → res.json() ou throw AppError/ZodError
      → res.on("finish")  — loga a requisição + registra duração no Prometheus
  → (se houve erro) errorMiddleware — formata e envia a resposta de erro
```

> O `express-async-errors` importado no topo do `app.ts` é peça-chave: sem ele, erros lançados dentro de funções `async` não chegariam ao `errorMiddleware` e a requisição ficaria travada sem resposta. Com ele, qualquer `throw` assíncrono é automaticamente encaminhado para o error handler.

---

## Endpoints da API

Prefixo base: `/api/v1`

### Utilitários e observabilidade

| Método | Path | Autenticação | Descrição |
|---|---|---|---|
| `GET` | `/actuator/health` | Nenhuma | Status da aplicação (UP/DOWN) |
| `GET` | `/actuator/info` | Nenhuma | Versão e descrição do `package.json` |
| `GET` | `/actuator/metrics` | Nenhuma | Memória e uptime em JSON simples |
| `GET` | `/metrics` | Nenhuma | Métricas no formato Prometheus (scraping) |
| `GET` | `/openapi.json` | Nenhuma (non-prod) | Especificação OpenAPI em JSON |
| `GET` | `/docs` | Nenhuma (non-prod) | Swagger UI interativo |

**`/actuator/health`**
```json
{ "status": "UP" }
```

**`/actuator/info`**
```json
{
  "build": {
    "name": "bff-node",
    "description": "BFF template with Node.js, Express and TypeScript",
    "version": "1.0.0"
  }
}
```

**`/actuator/metrics`**
```json
{
  "mem": { "rss": 85196800, "heapTotal": 34471936, "heapUsed": 15571096 },
  "uptime": 13.53
}
```

**`/metrics`** — formato Prometheus para scraping direto pelo servidor Prometheus. Registrado **antes do CORS** para que o Prometheus alcance o endpoint sem precisar da origem do MuleSoft.

---

### Users — `/api/v1/users`

| Método | Path | Body | Resposta | Descrição |
|---|---|---|---|---|
| `GET` | `/users` | — | `200 User[]` | Lista todos os usuários |
| `GET` | `/users/:id` | — | `200 User` / `404` | Busca usuário por ID |
| `POST` | `/users` | `{ name, email }` | `201 User` / `422` | Cria usuário |
| `PATCH` | `/users/:id` | `{ name?, email? }` | `200 User` / `404` / `422` | Atualiza usuário |
| `DELETE` | `/users/:id` | — | `204` / `404` | Remove usuário |

**Modelo `User`:**
```typescript
{
  id: string;       // UUID
  name: string;
  email: string;
  createdAt: Date;
}
```

**Validação de entrada (Zod):**
- `name`: string de 1 a 100 caracteres
- `email`: formato de e-mail válido

> A implementação atual usa um repositório **in-memory** com dados de seed. Para integrar com um banco de dados, basta criar uma nova implementação de `IUserRepository` e injetá-la em `user.routes.ts`.

---

### Personalization — `/api/v1/personalization`

| Método | Path | Body | Resposta | Descrição |
|---|---|---|---|---|
| `POST` | `/personalization/events` | `{ userId, action, itemId? }` | `204` / `404` / `422` / `502` | Registra evento comportamental |

**Fluxo interno:**

```
POST /personalization/events
  ↓
PersonalizationController → valida body com Zod
  ↓
PersonalizationService.trackEvent()
  ↓
  ├── BcpRepository.getUserProfile(userId)  → GET {BCP_BASE_URL}/users/{userId}
  └── BcpRepository.getItemData(itemId?)    → GET {BCP_BASE_URL}/items/{itemId}  (paralelo)
  ↓
SalesforcePersonalizationRepository.sendEvent()
  ├── getAccessToken() → POST {SF_TOKEN_URL} (client_credentials, com cache)
  └── POST {SF_BASE_URL}/api2/event/{datasetId}
```

**Body da requisição:**
```typescript
{
  userId: string;   // ID do usuário (min 1 char)
  action: string;   // Ação: "ViewItem", "AddToCart", "Purchase", etc.
  itemId?: string;  // ID do item (opcional)
}
```

---

## Integrações Externas

### BCP API (`src/repositories/bcp.repository.ts`)
- Autenticação: `Authorization: Bearer {BCP_API_KEY}`
- `GET /users/{userId}` → retorna perfil com `id`, `email`, `segment` e `attributes` livres
- `GET /items/{itemId}` → retorna dados do item com `id`, `name`, `category`, `price` e `attributes` livres
- Erros HTTP `404` → `AppError` com status 404; demais erros não-OK → `AppError` com status 502

### Salesforce Personalization (`src/repositories/salesforce-personalization.repository.ts`)
- Autenticação: OAuth2 `client_credentials` com **cache de token em memória**
  - O token é reutilizado enquanto não expirar; há um buffer de 60 segundos antes do vencimento real para evitar uso de tokens quase expirados.
- `POST /api2/event/{datasetId}` → envia o evento com dados de usuário e item
- Erros não-OK → `AppError` com status 502

---

## Logging

### Formato console (desenvolvimento)
```
2024-01-10 09:00:00 [a1b2c3d4] [info]: HTTP request {"method":"GET","path":"/api/v1/users","statusCode":200,"durationMs":12,"ip":"::1"}
```

### Formato arquivo (produção — JSON estruturado)
```json
{
  "level": "info",
  "message": "HTTP request",
  "requestId": "a1b2c3d4-...",
  "timestamp": "2024-01-10T09:00:00.000Z",
  "method": "GET",
  "path": "/api/v1/users",
  "statusCode": 200,
  "durationMs": 12
}
```

### Rotação de arquivos (produção)
| Arquivo | Nível | Tamanho máx. | Retenção |
|---|---|---|---|
| `logs/error-YYYY-MM-DD.log` | `error` | 20 MB | 14 dias |
| `logs/combined-YYYY-MM-DD.log` | todos | 50 MB | 14 dias |

Arquivos antigos são comprimidos com gzip.

---

## Tratamento de Erros

### `AppError` (`src/errors/app-error.ts`)
Classe customizada com `message`, `statusCode` e `code` opcional. Usada para todos os erros de negócio e de integração com APIs externas.

### Erros de validação
O Zod lança `ZodError` quando o body não satisfaz o schema. O error middleware captura e retorna status `422` com detalhes por campo.

### Erros de gateway
BCP e Salesforce retornam `AppError` com status `502` em caso de falha nos serviços externos.

---

## Scripts disponíveis

```bash
pnpm dev          # Servidor em modo watch com ts-node-dev
pnpm build        # Compila TypeScript para dist/
pnpm start        # Executa dist/server.js (produção)
pnpm test         # Roda todos os testes com Vitest
pnpm test:watch   # Testes em modo watch
pnpm test:coverage # Testes com relatório de cobertura
pnpm lint         # Lint com Biome
pnpm lint:fix     # Lint com correção automática
pnpm format       # Formatação com Biome
pnpm check        # Lint + format check
pnpm check:fix    # Lint + format com correção automática
```

---

## Testes

Os testes estão organizados por camada dentro de pastas `__tests__/` em cada módulo:

| Arquivo | O que testa |
|---|---|
| `src/__tests__/user.routes.test.ts` | Integração das rotas de usuário via HTTP (Supertest) |
| `src/controllers/__tests__/user.controller.test.ts` | Controller com service mockado |
| `src/services/__tests__/user.service.test.ts` | Service com repositório mockado |
| `src/repositories/__tests__/user.repository.test.ts` | Repositório in-memory |
| `src/middlewares/__tests__/error.middleware.test.ts` | Middleware de erro |

---

## Arquitetura — Injeção de Dependência

O projeto usa injeção de dependência manual via construtores, sem framework IoC. Cada rota instancia suas dependências e as injeta:

```
UserRepository (implementa IUserRepository)
    ↓
UserService (implementa IUserService)
    ↓
UserController
    ↓
Router Express
```

Para trocar a implementação (ex: in-memory → PostgreSQL via Prisma), basta criar uma classe que implemente a interface `IUserRepository` e substituir no arquivo de rotas correspondente. Nenhuma outra camada precisa ser alterada.
