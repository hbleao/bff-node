# Decisões de Arquitetura — BFF Node.js

## O que é esse projeto

Um template de **BFF (Backend for Frontend)** — uma camada de servidor que fica entre o frontend e os serviços downstream. Ela agrega, transforma e protege chamadas de API para que o frontend não precise falar com múltiplos serviços diretamente.

---

## Estrutura de pastas

```
src/
├── config/        → variáveis de ambiente e logger
├── controllers/   → recebe a requisição HTTP, delega para o service
├── errors/        → classes de erro da aplicação
├── middlewares/   → interceptadores transversais (log, segurança, erros)
├── repositories/  → acesso a dados (banco, cache, API externa)
├── routes/        → mapeamento de URL → controller
└── services/      → regras de negócio
```

Cada pasta tem um papel fixo e não invade o papel da outra. Isso é o que permite trocar qualquer peça sem efeito colateral.

---

## Decisões técnicas

### TypeScript com `strict: true`

`strict: true` no `tsconfig.json` habilita todas as checagens mais rígidas do TypeScript (`noImplicitAny`, `strictNullChecks`, etc.). O custo é um pouco mais de verbosidade; o ganho é que erros de tipo que normalmente aparecem em produção são pegos em tempo de compilação.

### Express

Express foi escolhido por ser a opção com menor curva de aprendizado e maior ecossistema no Node.js. Alternativas como Fastify oferecem melhor performance bruta, mas Express é suficiente para um BFF — o gargalo real costuma ser a latência das APIs downstream, não o throughput do servidor HTTP.

### `express-async-errors`

Por padrão, se um `async` handler lança uma exceção, o Express não encaminha para o error middleware — a requisição fica pendurada ou o processo crasha. O pacote `express-async-errors` faz monkey-patch no Express para capturar automaticamente rejeições de Promises e encaminhá-las ao middleware de erro. Isso elimina a necessidade de envolver cada handler em `try/catch`.

---

## Validação de ambiente com Zod

`src/config/env.ts` define um schema Zod para todas as variáveis de ambiente e faz o parse na inicialização. Se alguma variável obrigatória estiver ausente ou com tipo errado, a aplicação encerra com uma mensagem de erro clara antes de aceitar qualquer requisição.

Isso é preferível a deixar a variável `undefined` explodir dentro de um handler em runtime — o problema é detectado no boot, não na primeira requisição que depende da variável.

---

## Logging com Winston

Dois formatos distintos por ambiente:

| Ambiente | Formato | Motivo |
|----------|---------|--------|
| `development` | texto colorido com `printf` | legível no terminal durante o desenvolvimento |
| `production` | JSON estruturado | facilita ingestão em ferramentas como Datadog, Grafana Loki, CloudWatch |

Em produção, dois arquivos são criados: `error.log` (só erros) e `combined.log` (tudo). Isso facilita triagem — para alertas, monitorar só o `error.log` é suficiente.

O logger é instanciado uma única vez em `config/logger.ts` e importado onde necessário. Isso evita criar múltiplas instâncias com configurações diferentes.

---

## Segurança

### Helmet

Adiciona automaticamente headers HTTP de segurança como `X-Content-Type-Options`, `X-Frame-Options`, `Content-Security-Policy`, entre outros. São proteções contra classes de ataque conhecidas (XSS, clickjacking, MIME sniffing) que custam zero esforço de implementação.

### CORS — restrito ao MuleSoft

O BFF opera atrás de um API Gateway MuleSoft. Toda requisição de cliente externo passa pelo MuleSoft antes de chegar aqui — o BFF nunca é exposto diretamente à internet.

CORS é um mecanismo de browser: ele não bloqueia chamadas server-to-server. Porém, manter o CORS configurado com a origem do MuleSoft (`MULESOFT_ORIGIN`) serve como whitelist explícita — qualquer chamada direta ao BFF que não venha do gateway é rejeitada. Isso adiciona uma camada de defesa para o caso de o BFF ser acessível na rede interna por outros serviços não autorizados.

Métodos e headers são listados explicitamente; nada é permitido por omissão.

### Rate limiting — delegado ao MuleSoft

Rate limiting foi **removido do BFF**. O MuleSoft possui políticas nativas de rate limiting que são configuradas centralmente e se aplicam a todas as APIs do gateway. Duplicar esse controle no BFF geraria:

- Configuração redundante em dois lugares
- Risco de inconsistência entre os limites do gateway e do BFF
- Overhead desnecessário em cada requisição

Se o BFF precisar de throttling específico para proteger um recurso interno (ex: chamadas a um banco lento), o padrão correto é aplicar o limite no service ou repository daquele recurso — não globalmente.

### Body limit de 10kb

`express.json({ limit: '10kb' })` rejeita payloads acima de 10kb antes de fazer o parse. Protege contra ataques de payload gigante que tentam explodir memória ou tempo de CPU no parsing.

### `x-powered-by` desabilitado

`app.disable('x-powered-by')` remove o header `X-Powered-By: Express` das respostas. Esse header não serve ao cliente — só facilita a vida de atacantes que fazem fingerprinting do stack.

---

## Padrão SOLID

### Single Responsibility (S)
Cada classe tem um único motivo para mudar. O `UserController` muda quando a interface HTTP muda. O `UserService` muda quando a regra de negócio muda. O `UserRepository` muda quando a forma de persistir muda. Eles nunca mudam pelo mesmo motivo.

### Open/Closed (O)
Para adicionar um novo comportamento ao `UserService` (ex: enviar email após criar usuário), cria-se um decorator ou um novo método — sem modificar o código existente.

### Liskov Substitution (L)
O `UserService` declara dependência de `IUserRepository`. Qualquer implementação que respeite essa interface — in-memory, PostgreSQL via Prisma, Redis — pode ser usada sem mudar nenhuma linha do service.

### Interface Segregation (I)
Cada domínio tem sua própria interface (`IUserRepository`, `IUserService`). Nenhuma classe é forçada a implementar métodos que não usa. Se amanhã existir um repositório de somente leitura, ele implementa apenas `findAll` e `findById` — não precisa implementar `create`, `update`, `delete`.

### Dependency Inversion (D)
Controllers dependem de `IUserService` (abstração), não de `UserService` (concreto). Services dependem de `IUserRepository`, não de `UserRepository`. Isso permite trocar implementações sem tocar em quem as consome, e facilita testes unitários com mocks.

---

## Fluxo de uma requisição

```
HTTP Request
    │
    ▼
Middlewares globais (helmet → cors → body-parser → request-logger)
    │
    ▼
Router (routes/index.ts → user.routes.ts)
    │
    ▼
Controller (valida input com Zod, delega para service)
    │
    ▼
Service (aplica regra de negócio, chama repository)
    │
    ▼
Repository (acessa dado — in-memory, banco, API externa)
    │
    ▼
Resposta sobe pela cadeia
    │
    ▼ (em caso de erro)
errorMiddleware (trata AppError, ZodError ou erro genérico 500)
```

---

## Tratamento de erros

Três categorias:

| Tipo | Origem | Resposta |
|------|--------|----------|
| `AppError` | lançado intencionalmente no service (ex: "not found") | status e mensagem definidos pelo lançador |
| `ZodError` | validação de input no controller falhou | 422 com detalhe dos campos inválidos |
| `Error` genérico | bug inesperado | 500 sem detalhe exposto, stack logado no servidor |

Detalhes internos nunca chegam ao cliente em erros 500 — só são logados no servidor. Isso evita vazar informações de stack trace para atacantes.

---

## O que trocar para ir para produção

| Componente | Atual | Substituir por |
|------------|-------|----------------|
| Persistência | array in-memory em `UserRepository` | Prisma + PostgreSQL, Drizzle, MongoDB, etc. |
| Autenticação | ausente | middleware de JWT (ex: `jsonwebtoken`) |
| Testes | ausente | Vitest ou Jest com repositório mock |
| Containerização | ausente | `Dockerfile` + `docker-compose.yml` |
| CI | ausente | GitHub Actions com lint + typecheck + testes |
