Erros encontrados / status

1) Auditoria com organization_id ✅ corrigido
- Local: logs em movimentos/produtos não passavam organization_id; listagem não filtrava por org.
- Ação feita: chamadas de `audit_service.log_action` passaram organization_id; `list_audit_logs` agora filtra por org. Endpoint `/audit/logs` usa org do usuário.

2) Relatórios /reports ✅ corrigido
- Problema: endpoint `/reports/movements` com variáveis não definidas; services sem organization_id e risco multi-tenant.
- Ação feita: endpoints passam organization_id; `report_service` recebe org em todas as funções; movimentos filtram por org.

3) Produto não persistia custo/lead_time ✅ corrigido
- Local: `product_repository.create_product` ignorava `cost_price` e `lead_time`.
- Ação feita: campos incluídos no insert.

4) Busca de produtos com filtros incompletos ✅ corrigido
- Local: `product_controller.search_products` e `product_service.search_products`.
- Ação feita: busca agora usa `build_product_filters` com stock_status (out/low/ok) e price_min/price_max, filtrando por organização.

5) Papéis/permissões simplificados ✅ corrigido
- Agora só `admin` e `user` (aliases: owner->admin, collaborator->user). Signup cria admin. Frontend `usePermissions` espelha.

6) Frontend quebrado (páginas incompletas) ✅ corrigido
- Local: `frontend/src/pages/ProductsPage.tsx` e `frontend/src/pages/ReportsPage.tsx`.
- Ação feita: páginas reescritas com estados/efeitos completos, CRUD de produtos, filtros, e relatórios com tabelas básicas e exportação.
