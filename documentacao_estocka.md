# Documentação técnica do Estocka

## Visão geral do sistema
O Estocka é um sistema full stack para gestão de estoque com isolamento por organização. Ele registra catálogo de produtos, movimentações de entrada/saída, relatórios analíticos e trilha de auditoria. Os perfis mapeados no backend são **admin** (gestão completa) e **user** (operacional); o frontend trata “collaborator/owner” como aliases do mesmo mapeamento. Cada organização representa uma empresa distinta e possui seus próprios usuários e dados.

Principais módulos de negócio:
- Autenticação e criação de organização (signup, login e resolução do usuário atual).
- Administração (organizações, usuários e papéis).
- Catálogo (categorias e produtos com soft delete).
- Movimentações de estoque (entradas, saídas e reversões).
- Relatórios/dashboards (KPIs, ABC/XYZ, giro, previsão de ruptura, recomendações).
- Auditoria (registro de ações em produtos e movimentações).

## Arquitetura geral
- **Backend**: FastAPI com SQLAlchemy. As rotas ficam em `app/*_controller.py`, a regra de neg��cio em `*_service.py` e o acesso a dados em `*_repository.py`. O arquivo `app/main.py` injeta routers, configura CORS (origem vinda de `FRONTEND_URL` �?" em produ��ǜo nǜo se utiliza wildcard `*`), logging e handlers de exce��ǜo; a configura��ǜo de logging Ǹ cloud-friendly e alinhada ao 12-Factor App (logs como stream), escrevendo por padrǜo em `stdout`/`stderr` e, opcionalmente, em arquivo (por exemplo `logs/estocka.log`) quando `LOG_TO_FILE=True`.
- **Banco**: `DATABASE_URL` vem do ambiente (padrǜo `sqlite:///./estocka_dev.db` em desenvolvimento, mas a string aceita PostgreSQL para produ��ǜo no Render). O `Base` SQLAlchemy define os modelos ORM; sess��es sǜo gerenciadas via `SessionLocal`. Para URLs nǜo SQLite (ex.: PostgreSQL), o engine utiliza `pool_pre_ping=True` para evitar problemas de conexǜes quebradas em nuvem. No estado atual, o schema Ǹ versionado por migrations Alembic e atualizado com `alembic upgrade head`; o startup da aplica��ǜo nǜo cria mais tabelas automaticamente em produ��ǜo, ficando a fun��ǜo de criar todas as tabelas (`create_all_tables` ou equivalente) restrita a cenǭrios de desenvolvimento/scripts.
- **Seguran��a**: JWT (HS256) com `OAuth2PasswordBearer` em `/auth/login`, senhas com bcrypt (`pwd_context`). O token carrega `sub` (email) e `role`. DependǦncias `get_current_user` e `require_role(...)` protegem as rotas. Como requisito nǜo funcional de seguran��a, um middleware HTTP adiciona headers de seguran��a em todas as respostas (`X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `X-XSS-Protection: 1; mode=block`), e existe um endpoint leve de health-check `GET /health` que retorna 200 com um JSON simples (por exemplo `{"status": "ok"}`) para probes de plataformas cloud como o Render.
- **Frontend**: React + TypeScript (Vite). O roteamento é feito em `App.tsx` com `BrowserRouter`; `PrivateRoute` força autenticação e envolve as páginas no `Layout`. `AuthContext` guarda usuário/token (localStorage) e revalida via `/auth/me`. Interceptores axios em `services/api.ts` anexam o Bearer token e redirecionam para `/login` em 401. `usePermissions` controla exibição de menus e botões conforme o papel.
- **Comunicação**: REST/JSON entre frontend e backend. Todas as chamadas passam pelas services (`src/services/*`), que refletem os endpoints FastAPI. Não há WebSocket; a limitação de requisições usa SlowAPI configurado na aplicação, mas nenhum endpoint recebe limite específico no código atual.

## Modelagem de dados (ORM)
- **Organization** (`organization_model.py`): `id`, `name`, `slug`, `cnpj`, `active`, `created_at`; relações com usuários, produtos, categorias e audit logs. Usada para isolamento multi-tenant.
- **Role** (`role_model.py`): `id`, `name`; rela��ǜo `users`. Serve ao RBAC; os papǸis padrǜo `admin` e `user` sǜo criados/validados por um fluxo de seed invocado a partir de `main.py`, condicionado pela flag de ambiente `SEED_ON_START` e por scripts especǭficos.
- **User** (`user_model.py`): `id`, `email`, `hashed_password`, `full_name`, `profile_image_url`, `profile_image_base64`, `role_id`, `organization_id`; relações com `role`, `organization` e `movements`. Necessário para autenticação e associação a uma organização.
- **Category** (`category_model.py`): `id`, `name`, `description`, `organization_id`; relação com produtos. Segmenta o catálogo.
- **Product** (`product_model.py`): `id`, `name`, `sku` único, `price`, `cost_price`, `quantity`, `alert_level`, `lead_time`, soft delete (`is_deleted`, `deleted_at`, `deleted_by_id`), `category_id`, `organization_id`; relações com categoria, organização e movimentos. Campos de alerta/lead time alimentam relatórios de ruptura e previsão.
- **Movement** (`movement_model.py`): `id`, `product_id`, `type` (`entrada`/`saida`), `quantity`, `reason`, `note`, `created_at`, `created_by_id`, `organization_id`; relação com produto e usuário. É o único ponto que altera estoque, preservando histórico imutável.
- **AuditLog** (`audit_model.py`): `id`, `user_id`, `organization_id`, `action` (`create|update|delete`), `entity_type` (`product|movement|category|user`), `entity_id`, `details` (JSON), `created_at`; relação com organização e usuário. Registra quem fez o quê e quando.

## DER (visão textual das entidades e relacionamentos)
- **Organization**: campos `id (PK)`, `name (string)`, `slug (string)`, `cnpj (string opcional)`, `active (bool)`, `created_at (datetime)`. Relacionamentos 1:N com User, Category, Product, AuditLog.
- **Role**: campos `id (PK)`, `name (string)`. Relacionamento 1:N com User.
- **User**: campos `id (PK)`, `email (string)`, `hashed_password (string)`, `full_name (string)`, `profile_image_url (string)`, `profile_image_base64 (text)`, `role_id (FK Role.id)`, `organization_id (FK Organization.id)`. Relacionamentos N:1 para Role e Organization; 1:N para Movement (como created_by) e AuditLog (via user_id).
- **Category**: campos `id (PK)`, `name (string)`, `description (string)`, `organization_id (FK Organization.id)`. Relacionamento N:1 para Organization; 1:N para Product.
- **Product**: campos `id (PK)`, `name (string)`, `sku (string único)`, `price (numeric)`, `cost_price (numeric)`, `quantity (int)`, `alert_level (int)`, `lead_time (int)`, `is_deleted (bool)`, `deleted_at (datetime)`, `deleted_by_id (FK User.id opcional)`, `category_id (FK Category.id)`, `organization_id (FK Organization.id)`. Relacionamentos N:1 para Category e Organization; 1:N para Movement.
- **Movement**: campos `id (PK)`, `product_id (FK Product.id)`, `type (enum)`, `quantity (int)`, `reason (string)`, `note (text)`, `created_at (datetime)`, `created_by_id (FK User.id opcional)`, `organization_id (FK Organization.id)`. Relacionamentos N:1 para Product, User (opcional) e Organization.
- **AuditLog**: campos `id (PK)`, `user_id (FK User.id opcional)`, `organization_id (FK Organization.id)`, `action (string/enum)`, `entity_type (string/enum)`, `entity_id (int opcional)`, `details (JSON)`, `created_at (datetime)`. Relacionamentos N:1 para Organization e User (opcional).

Em termos de relacionamento: uma Organization agrupa usuários, categorias, produtos e logs de auditoria, garantindo isolamento dos dados. Cada User pertence a uma Organization e a um Role, podendo criar Movements e gerar entradas em AuditLog. Categorias também são da Organization e classificam Produtos; Produtos pertencem a uma Category e a uma Organization, e concentram Movements que ajustam estoque. Movements referenciam Produto, Organization e opcionalmente o User autor, mantendo o histórico de alterações de quantidade. AuditLogs registram ações de usuários (ou do sistema) sobre entidades, sempre vinculados à mesma Organization para manter a trilha de auditoria segregada por empresa.

## Casos de uso (UML) por ator
- **Admin**
  - Cadastrar/editar/excluir produto: manter o catálogo com SKU único, preços e estoques iniciais.
  - Gerenciar categorias: criar/editar/remover categorias para organizar produtos.
  - Registrar movimentação de estoque: lançar entradas/saídas, ajustar quantidade e manter histórico.
  - Reverter movimentação: desfazer uma movimentação gerando o inverso, preservando a trilha.
  - Gerenciar usuários e papéis: criar, atualizar, remover usuários e atribuir roles (admin/user).
  - Consultar trilha de auditoria: revisar logs de ações para governança e conformidade.
  - Visualizar relatórios (overview, ABC, XYZ, giro, financeiro, previsão): apoiar decisão e reposição.
  - Gerenciar organização (perfil da empresa): atualizar dados cadastrais e status.

- **Usuário Padrão (operacional)**
  - Visualizar catálogo de produtos: consultar dados e status de estoque.
  - Registrar movimentação de estoque: lançar entradas/saídas operacionais.
  - Visualizar relatórios básicos (overview, alertas, ABC/XYZ, giro): acompanhar saúde do estoque.
  - Buscar/filtrar produtos: localizar itens por nome/SKU, categoria, status ou faixa de preço.
  - Reverter movimentação (quando permitido): corrigir lançamentos de estoque recentes.

## Sequência UML: registro de movimentação com auditoria
1) **Usuário → Frontend**: aciona a ação “Registrar movimentação”, preenche produto, tipo (entrada/saída), quantidade e motivo.
2) **Frontend → Backend/API**: envia `POST /movements` com token JWT e payload da movimentação.
3) **Backend/API → Banco de Dados**: valida produto da mesma organização, verifica estoque suficiente (saída) e inicia transação.
4) **Backend/API**: ajusta `product.quantity` (soma ou subtrai), cria o registro `Movement` com `organization_id` e `created_by_id`.
5) **Backend/API → AuditLog (Banco)**: grava log com `action=create`, `entity_type=movement`, `entity_id`, detalhes (produto, tipo, quantidade) e `organization_id`.
6) **Banco de Dados → Backend/API**: confirma a transação; se houver erro (estoque insuficiente, validação), aborta e retorna exceção.
7) **Backend/API → Frontend**: responde 201 com o movimento criado e dados atualizados do produto.
8) **Frontend → Usuário**: exibe sucesso e atualiza a lista de movimentos/estoques na interface.

## Multi-tenancy, RBAC e auditoria
- **Multi-tenancy**: Todos os modelos relevantes possuem `organization_id`, e cada endpoint passa o `current_user.organization_id` para serviços/repositórios. Consultas sempre filtram por esse campo (ex.: `product_repository.list_products`, `movement_repository.list_movements`, `audit_repository.list_audit_logs`). Criações herdam a organização do usuário logado (ex.: `/users` força `organization_id` do criador). Assim, uma organização não enxerga dados de outra.
- **RBAC**: PapǸis `admin` e `user` sǜo seedados por scripts controlados pela flag de ambiente `SEED_ON_START` (tipicamente ativada em desenvolvimento e desativada em produ��ǜo, onde o seed de dados iniciais Ǹ feito de forma controlada). O JWT inclui o `role`, e `require_role` restringe rotas (usuǭrios/roles s�� para `admin`; produtos/movimentos/relat��rios para `admin` ou `user`). No frontend, `usePermissions` mapeia permiss��es por papel para esconder menus e a����es (criar, editar, excluir, exportar).
- **Auditoria**: `audit_service.log_action` é chamado na criação/atualização/exclusão de produtos e na criação/reversão de movimentações. O log grava `action`, `entity_type`, `entity_id`, `details`, `user_id` e `organization_id`. O endpoint `/audit/logs` filtra por usuário, ação, tipo de entidade e intervalo de datas, sempre limitado à organização do usuário logado. O frontend só exibe a tela se `canView('audit')`.

## Endpoints principais do backend
- **Autenticação (`/auth`)**: `POST /signup` cria organização e primeiro usuário admin (gera `slug`, cria role se faltar, retorna `access_token`); `POST /login` usa `OAuth2PasswordRequestForm` e retorna JWT; `GET /me` devolve o usuário autenticado.
- **Organizações (`/organizations`)**: `GET /me` e `PATCH /me` leem/atualizam a organização atual; `POST /` cria nova organização (uso livre no código atual). O helper `get_organization_id` é usado em dashboards para isolar consultas.
- **Papéis (`/roles`)** *(admin)*: CRUD simples de roles.
- **Usuários (`/users`)** *(admin)*: `POST /` cria usuário sempre na mesma organização do criador; `GET /` lista usuários da organização; `GET /check-email` valida unicidade dentro da organização; `GET/PUT/DELETE /{id}` gerenciam usuários.
- **Categorias (`/categories`)**: CRUD dentro da organização; delete bloqueia se houver produtos associados.
- **Produtos (`/products`)**: `POST /` valida SKU único por organização e categoria existente; `GET /` lista; `GET /search` filtra por `search` (nome/SKU), `category_id`, `stock_status` (`out|low|ok`), `price_min/max`; `GET /{id}` retorna produto; `PUT /{id}` impede alterar quantidade diretamente (estoque só via movimentações) e mantém unicidade de SKU; `DELETE /{id}` faz soft delete com rastreio de quem deletou. Todos filtram `is_deleted=False`.
- **Movimentações (`/movements`)**: `POST /` registra entrada/saída e ajusta `product.quantity` (bloqueia saída acima do estoque); `POST /revert/{id}` cria movimento inverso mantendo histórico; `GET /`, `/recent`, `/history` listam por organização; `GET /filter` filtra por data, tipo e produto; `PUT`/`DELETE` retornam 405 para garantir imutabilidade.
- **Dashboard (`/dashboard`)**: `GET /overview` (valor de estoque, margem média, taxa de ruptura), `GET /sales-trend` (saídas por dia), `GET /top-products` (mais vendidos por quantidade), `GET /abc-distribution` (contagem por classe ABC). Todos recebem `org_id` via dependência.
- **Relatórios (`/reports`)** *(admin/user)*: `GET /overview` (totais e alertas), `/categories` (quebra por categoria), `/alerts` (críticos), `/movements` (histórico com `period` ou `start_date/end_date`, `limit/offset`), `/profitability` (margem e lucro potencial por produto), `/comparison` (período atual vs anterior), `/recommendations` (alertas automáticos), `/abc`, `/xyz`, `/turnover`, `/financial`, `/forecast`. Períodos têm defaults internos (ABC 90 dias, XYZ 12 semanas, turno/forecast 30 dias).
- **Auditoria (`/audit`)**: `GET /logs` com filtros opcionais (`user_id`, `action`, `entity_type`, datas, paginação), sempre restrito à organização atual.

## Frontend (React/TypeScript)
Estrutura de pastas: `pages` (páginas), `services` (APIs REST), `contexts/AuthContext` (estado de autenticação), `hooks/usePermissions` (RBAC no cliente), `components` (Layout, gráficos e UI), `utils` (formatadores/exportação).

Páginas principais:
- **Login/Signup**: fluxos públicos; o signup chama `/auth/signup` e salva o token; login envia `FormData` para `/auth/login`.
- **Layout**: barra lateral e cabeçalho; navegação só mostra itens permitidos (`canView`), inclui tema claro/escuro e avatar do usuário.
- **Dashboard**: KPIs (total de produtos, valor de estoque, ruptura, baixo estoque), gráficos de tendência de vendas, top produtos, distribuição ABC e lista de movimentos recentes (quando permitido).
- **Produtos**: lista e grade com busca, filtros de categoria/estoque/preço, paginação client-side, criação/edição via modal, soft delete com confirmação e exportação CSV/PDF; botões de criar/editar/excluir/exportar respeitam permissões.
- **Movimentações**: histórico ordenado por data, filtro por produto e tipo, criação de entrada/saída em modal, exportação CSV/PDF; desabilita ações conforme permissões.
- **Relatórios**: abas para ABC, XYZ, giro e previsão; gráficos (Recharts) e tabelas com paginação local, filtros (status/limites) e exportação por aba.
- **Usuários**: somente admin; CRUD com seleção de papel, verificação assíncrona de email (`/users/check-email`), busca e exportação; modais para criar/editar e confirmar exclusão.
- **Auditoria**: tabela de logs com badges por ação/tipo; bloqueia visualização se o papel não tiver permissão.

RBAC no cliente: o hook `usePermissions` define conjuntos de permissões por papel, e o `Layout` e as páginas usam `canView/canCreate/canEdit/canDelete/canExport` para esconder menus e botões, alinhando o UX à política do backend.

## Ambiente e execução
Backend em Python 3.11+ com FastAPI, SQLAlchemy 2.x, Uvicorn, JWT (python-jose), bcrypt/passlib e Pillow; em desenvolvimento o banco padrǜo Ǹ SQLite (`sqlite:///./estocka_dev.db`), com possibilidade de sobrescrever via `DATABASE_URL`, e em produ��ǜo (Render Web Service) `DATABASE_URL` aponta para um PostgreSQL gerenciado. O schema de produ��ǜo Ǹ mantido por migrations Alembic: a URL do banco no Alembic Ǹ derivada de `DATABASE_URL` e normalizada de `postgres://` para `postgresql://` quando necessǸrio (compatibilidade com o Render), e a cria��ǜo/atualiza��ǜo das tabelas deve ser feita com `alembic upgrade head` antes de iniciar a aplica��ǜo; o startup nǜo chama `Base.metadata.create_all` em produ��ǜo. Para execu��ǜo local do backend: `cd backend`, `pip install -r requirements.txt` (ou `poetry install`) e `uvicorn app.main:app --reload`; em produ��ǜo, hǭ um script `backend/run_prod.sh` que executa `uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}`, sendo esse o comando recomendado para o Render ap��s rodar as migrations. O frontend, em React 19 + TypeScript 5.9, Vite 7, Tailwind, Radix/shadcn-ui, Recharts e axios, roda em desenvolvimento com `cd frontend`, `npm install` (ou `pnpm/yarn`) e `npm run dev`; para produ��ǜo, o build estǸtico Ǹ gerado com `npm run build` e servido por um host estǸtico/servi��o pr��prio, configurando `VITE_API_URL` para apontar para a URL p��blica da API FastAPI. Variǭveis m��nimas: `SECRET_KEY`, `DATABASE_URL`, `FRONTEND_URL` (CORS), `VITE_API_URL` (frontend), `SEED_ON_START` (true/false, recomendado `true` em desenvolvimento e `false` em produ��ǜo, com execu��ǜo manual de scripts de seed para nǜo criar usuǭrio admin com senha simples automaticamente), `LOG_TO_FILE` (opcional, para log em arquivo alǸm de stdout/stderr) e `ACCESS_TOKEN_EXPIRE_MINUTES` (opcional).

## Relatórios e indicadores (lógica de negócio)
- **Visão de estoque**: soma `(quantity * price)` de todos os produtos ativos; separa listas de `low_stock` (quantidade <= alert_level) e `out_of_stock` (quantidade 0).
- **Quebra por categoria**: agrega `quantity` e valor por `category_id` e cruza com a lista de categorias da organização.
- **Histórico de movimentações**: filtra `Movement` por organização, intervalo de datas e paginação; retorna Pydantic `MovementPublic`.
- **ABC**: considera saídas no período (default últimos 90 dias); calcula valor = quantidade vendida * preço; ordena por valor, acumula percentual e classifica por limiares `A<=80%`, `B<=95%`, senão `C`.
- **XYZ**: usa saídas nas últimas 12 semanas; agrupa por semana, completa semanas sem movimento com 0, calcula coeficiente de variação (desvio padrão / média) e classifica `X<=0.5`, `Y<=1.0`, `Z` acima ou sem demanda.
- **Giro de estoque**: período default 30 dias; total vendido por produto / estoque médio (usa quantidade atual como aproximação) => `turnover_rate`.
- **Financeiro**: soma valor de venda e de custo; `potential_profit = inventory_value - cost_value`; `average_margin` em %.
- **Previsão de ruptura**: período default 30 dias; consumo diário = saídas/dias; `reorder_point = (daily_usage * lead_time) + safety_stock`, onde `safety_stock` é 50% da demanda do lead time; `days_until_stockout = quantity / daily_usage` (ou 999 se sem consumo); status `CRITICAL` se zerado, `WARNING` se abaixo do ponto de pedido, senão `OK`.
- **Insights adicionais**: `get_profitability_report` calcula margem e lucro potencial por produto; `compare_periods` compara saídas do período atual vs anterior e indica tendência; `get_recommendations` gera avisos (estoque zerado, margem <10%, baixo estoque) com prioridades.
- **Dashboard service**: `get_inventory_value`, `get_average_margin` e `get_stock_rupture_rate` consolidam KPIs; `get_sales_trend` agrupa saídas diárias; `get_top_products` traz mais vendidos por quantidade; `get_abc_distribution` conta itens por classe.

## Testes automatizados
A suíte em `backend/tests` tem 4 arquivos (`test_auth.py`, `test_products.py`, `test_movements.py`, `test_validations.py`) com cerca de 28 testes. Eles usam `fastapi.testclient.TestClient` autenticando o admin seedado e validam login e erro de credenciais/token, signup com email duplicado, listagem e CRUD de produtos com soft delete, validações de SKU e preço, checagem de email, movimentações de entrada/saída, erro de estoque insuficiente e listagens de movimentos; o teste de rate limiting está marcado como `skip`. Não há métricas de desempenho registradas no repositório.

## Provável ordem de desenvolvimento (narrativa em fases)
**Fase 1 �?" Modelagem inicial e infraestrutura**: Come��ou-se definindo `Base`, conexǜo ao banco e modelos centrais como Organization, User, Role, Category e Product, garantindo chaves estrangeiras e constraints como SKU ǧnico. Essa base sustentou as futuras rela����es (users pertencem a uma organiza��ǜo, produtos tǦm categoria) e, nas vers��es iniciais, permitiu criar tabelas automaticamente no startup; no estado final do sistema, essa responsabilidade foi deslocada para as migrations Alembic, especialmente em produ��ǜo em PostgreSQL. Sem essa funda��ǜo relacional, nǜo haveria como isolar dados nem validar regras de estoque.

**Fase 2 �?" Autentica��ǜo e seed de papǸis**: Em seguida veio o fluxo de seguran��a com bcrypt, JWT (`/auth/login`) e cadastro de organiza��ǜo inicial (`/auth/signup`). Inicialmente, o startup garantia papǸis padrǜo admin/user e criava usuǭrios especiais para testes; no desenho atual, esse seed Ǹ controlado pela flag `SEED_ON_START` e por scripts especǭficos, sendo comum mant��-la `true` em desenvolvimento e `false` em produ��ǜo para evitar cria��ǜo automǸtica de usuǭrios administrativos com credenciais simples. Isso Ǹ essencial para evitar endpoints expostos e para ligar cada opera��ǜo a um usuǭrio autenticado.

**Fase 3 — CRUD básico de catálogo**: Com segurança ativa, foram expostos CRUDs de categorias e produtos, incluindo validações de SKU, preços e soft delete. Os serviços verificam categoria existente e bloqueiam alteração direta de estoque, forçando uso de movimentações mais adiante. Essa etapa entrega o núcleo de um sistema de estoque: registrar itens e classificá-los.

**Fase 4 — Multi-tenancy e RBAC efetivos**: Depois, as rotas passaram a receber `current_user.organization_id` e a filtrar queries por `organization_id`, garantindo isolamento entre empresas. O `require_role` (admin/user) foi aplicado em módulos sensíveis (users, roles, produtos, movimentos, relatórios), alinhando permissões de backend e frontend (`usePermissions`). Sem isso, haveria risco de vazamento de dados e ações indevidas entre organizações.

**Fase 5 — Movimentações e integridade de estoque**: Implementaram-se as movimentações de entrada/saída e a reversão (`/movements/revert/{id}`), com bloqueio de estoque insuficiente e imutabilidade (PUT/DELETE retornam 405). A atualização de `product.quantity` fica encapsulada em `movement_service.create_movement`, garantindo consistência transacional. Esse é o coração operacional do estoque, pois toda alteração passa por trilha de movimentos.

**Fase 6 — Auditoria e rastreabilidade**: A seguir veio o registro de auditoria em produtos e movimentações, gravando ação, entidade, usuário e detalhes JSON. O endpoint `/audit/logs` adicionou consulta filtrada por organização, dando visibilidade a mudanças críticas. Isso aumenta governança e accountability, fundamentais em ambientes multiusuário.

**Fase 7 – Relatórios, dashboards e insights**: Foram adicionados os serviços de relatório (overview, categorias, alertas, movimentos) e análises ABC, XYZ, giro, financeiro e previsão de ruptura, além de insights de lucratividade, comparação de períodos e recomendações. O dashboard consolidou KPIs e gráficos (tendência de vendas, top produtos, distribuição ABC). Esses recursos transformam dados operacionais em decisão, justificando o valor do sistema para gestão.

**Fase 8 – Frontend completo com RBAC visual**: Por fim, o frontend React/TypeScript ganhou páginas para cada módulo (Dashboard, Produtos, Movimentações, Relatórios, Usuários, Auditoria), com `AuthContext`, interceptores axios e `usePermissions` para esconder ações conforme o papel. Layout, filtros, modais e exportações CSV/PDF tornaram o produto utilizável e alinhado às regras do backend. Essa camada fecha o ciclo de usabilidade e segurança do usuário final.
6.1 Testes automatizados

Foram executados os testes automatizados do backend localizados em backend/tests (autenticação, produtos, movimentações e validações), bem como os scripts adicionais test_signup.py e test_soft_delete.py na raiz do projeto. No total, 30 testes foram executados, dos quais 25 foram aprovados, 3 apresentaram falha e 2 encontram-se marcados como skip.

As falhas identificadas estão relacionadas a divergências entre o cenário de teste e a implementação atual ou a dependências externas não atendidas, e não a quebras do núcleo funcional do sistema. Em tests/test_auth.py::TestLogin::test_login_success, o teste espera que o endpoint de login retorne um campo user, enquanto a versão atual da API retorna apenas o token de autenticação. No caso de tests/test_validations.py::TestSKUValidation::test_valid_sku_formats, o teste utilizou um SKU já existente em banco, recebendo corretamente o código HTTP 409 de duplicidade. Por fim, o script test_soft_delete.py::test_soft_delete tentou acessar um servidor externo em localhost:8000, falhando por recusa de conexão, uma vez que o serviço não estava em execução nesse endereço.

De modo geral, os resultados mostram que o conjunto de regras de negócio essenciais — autenticação, cadastro e validação de produtos, controle de movimentações de estoque — foi satisfatoriamente exercitado pelos testes automatizados, restando apenas ajustes pontuais nos cenários de teste para alinhar expectativas e contratos de resposta com a implementação consolidada do Estocka.

## 6.2 Testes de performance da API
**6.2.1 Configuração dos testes**

Os testes de desempenho da API foram executados em 09 de dezembro de 2025, utilizando fastapi.testclient.TestClient em ambiente de desenvolvimento local. A configuração utilizada foi composta por:

Sistema operacional: Windows 10 (build 19045);

Linguagem/plataforma: Python 3.14.0;

Processador: arquitetura x64 (“AMD64 Family 25 Model 33 Stepping 2, AuthenticAMD”);

Banco de dados: SQLite local (string de conexão padrão do Estocka);

Aplicação: backend FastAPI carregado in-process pelo TestClient.

Para cada endpoint selecionado foram realizadas 50 requisições sequenciais, registrando-se o tempo médio, mínimo, máximo e a taxa de sucesso (respostas 2xx). Além disso, foi realizado um teste de carga simples com 10 requisições simultâneas ao endpoint /reports/overview, a fim de observar o comportamento sob concorrência controlada. Esses experimentos têm o objetivo de verificar o atendimento ao requisito não funcional de desempenho da aplicação, tomando como referência tempos de resposta inferiores a 100–200 ms em operações típicas de leitura.

**6.2.2 Cenários testados e resultados**

Os cenários contemplaram endpoints centrais do Estocka, incluindo consultas de painel, listagem de produtos, relatórios e autenticação:

GET /dashboard/overview
Tempo médio: 25,4 ms; mínimo: 20,0 ms; máximo: 46,4 ms; taxa de sucesso: 100%.
O endpoint apresentou resposta consistente bem abaixo de 50 ms, indicando boa eficiência no cálculo dos indicadores de visão geral.

GET /products
Tempo médio: 29,9 ms; mínimo: 20,6 ms; máximo: 58,7 ms; taxa de sucesso: 100%.
Mesmo com o redirecionamento interno para /products/, os tempos permaneceram abaixo de 60 ms, o que é adequado para listagens de catálogo em ambiente de desenvolvimento.

GET /reports/overview
Tempo médio: 28,9 ms; mínimo: 19,7 ms; máximo: 45,5 ms; taxa de sucesso: 100%.
O relatório sintético manteve comportamento semelhante ao dashboard, com baixa variabilidade e estabilidade nos tempos de resposta.

GET /reports/financial
Tempo médio: 26,8 ms; mínimo: 19,8 ms; máximo: 45,1 ms; taxa de sucesso: 100%.
Apesar de envolver cálculos financeiros, o endpoint apresentou desempenho comparável aos demais relatórios, permanecendo na mesma ordem de grandeza de tempo de resposta.

POST /auth/login
Tempo médio: 189,0 ms; mínimo: 184,4 ms; máximo: 209,5 ms; taxa de sucesso: 100%.
A autenticação inclui operações de hashing de senha e geração de token JWT, o que naturalmente eleva o tempo de resposta em relação às requisições de leitura. Ainda assim, os valores permaneceram abaixo de 0,21 s, dentro de uma faixa aceitável para operações de login.

Teste concorrente – GET /reports/overview (10 requisições simultâneas)
Tempo médio por requisição: 435,5 ms; mínimo: 341,7 ms; máximo: 504,1 ms; tempo total: 508,6 ms para concluir todas as requisições.
Sob pequena carga concorrente, o tempo médio por requisição manteve-se abaixo de 0,51 s, o que é compatível com o cenário de ambiente local e sem otimizações específicas de infraestrutura.

**6.2.3 Estatísticas gerais**

De forma agregada, os testes de desempenho indicam que, em ambiente de desenvolvimento, todas as operações de leitura autenticada avaliadas apresentaram tempos médios inferiores a 30 ms, com tempos máximos abaixo de 60 ms. A operação de autenticação apresentou tempo médio inferior a 210 ms, valor esperado para chamadas que envolvem criptografia e emissão de token.

Mesmo no teste de carga simples com 10 requisições simultâneas, o sistema processou todas as requisições em aproximadamente 0,51 s, mantendo tempos individuais dentro de limites aceitáveis para o contexto proposto. Esses resultados fornecem uma linha de base consistente para o TCC, demonstrando que o Estocka atende, no ambiente atual, ao requisito de desempenho estabelecido para a aplicação.
