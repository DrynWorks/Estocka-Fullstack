# Sistema de Seeding - Estocka

## 📋 Visão Geral

O Estocka agora possui um sistema consolidado de seeding com 3 níveis configuráveis para popular o banco de dados com dados realistas.

## 🚀 Uso Rápido

```bash
# Navegar para o backend
cd backend

# Popular com nível medium (recomendado)
python seed_database.py --clean --level medium

# Ver todas as opções
python seed_database.py --help
```

## 📊 Níveis de Seed

### MINIMAL (Desenvolvimento Rápido)
- **Produtos**: 12
- **Categorias**: 5  
- **Histórico**: 7 dias
- **Uso**: Testes rápidos, desenvolvimento de features

```bash
python seed_database.py --level minimal
```

### MEDIUM (Padrão) ⭐
- **Produtos**: 35
- **Categorias**: 10
- **Histórico**: 30 dias
- **Movimentações**: ~400-500
- **Uso**: Desenvolvimento normal, demonstrações básicas

```bash
python seed_database.py --level medium
```

### FULL (Demo/Apresentação)
- **Produtos**: 70
- **Categorias**: 12
- **Histórico**: 90 dias
- **Movimentações**: ~1000+
- **Uso**: Demos, apresentações, testes de performance

```bash
python seed_database.py --level full
```

## 🎯 Opções

### `--clean`
Limpa o banco de dados antes de popular (remove produtos, categorias e movimentações):

```bash
python seed_database.py --clean --level medium
```

⚠️ **Atenção**: Não remove usuários e roles (mantém admin@estoque.com)

### `--level`
Define o nível de seed (minimal, medium, full):

```bash
python seed_database.py --level full
```

## 📦 O que é Criado?

### Categ orias Realistas
- Eletrônicos
- Roupas
- Casa e Jardim
- Esportes
- Livros
- Alimentos
- Beleza
- Brinquedos
- Automotivo
- Pet Shop
- Ferramentas (full)
- Papelaria (full)

### Produtos Variados
- Nomes realistas por categoria
- Preços: R$9,90 a R$1.999,00
- Margens: 20% a 60%
- Estoques: 0 a 200 unidades
- Alguns produtos com estoque baixo (para alertas)

### Movimentações Inteligentes
- **Entradas**: Estoque inicial + reposições periódicas
- **Saídas**: Vendas com padrões realistas
  - Produtos baratos vendem mais
  - Fins de semana têm mais vendas (+30%)
  - Distribuição ao longo do período

## 🔄 Workflow Recomendado

### Desenvolvimento
1. Backend com `SEED_ON_START=false` no `.env`
2. Rodar seed manualmente quando precisar:
   ```bash
   python seed_database.py --clean --level medium
   ```

### Primeira Vez / Database Vazio
```bash
# Criar banco e popular
python seed_database.py --clean --level medium

# Iniciar backend
uvicorn app.main:app --reload
```

### Resetar Dados
```bash
# Limpar e repopular
python seed_database.py --clean --level medium
```

## 📝 Credenciais Padrão

Após seed, use estas credenciais para login:

- **Admin**: admin@estoque.com / 1234
- **User**: user@estoque.com / 1234

## 🎨 Dados para Relatórios

O seed é otimizado para mostrar bem os relatórios:

- **Curva ABC**: Distribuição clara (produtos A, B, C)
- **Análise XYZ**: Variabilidade visível nos produtos
- **Giro de Estoque**: Produtos com alto/médio/baixo giro
- **Alertas**: Alguns produtos próximos de ruptura
- **Gráficos**: Movimentações distribuídas ao longo do tempo

## ⚠️ Notas Importantes

1. **Não usar em produção**: Este script é apenas para desenvolvimento/demos
2. **Backup**: Sempre faça backup antes de usar `--clean`
3. **Usuários preservados**: Seed nunca remove usuários/roles
4. **Startup simplificado**: `app/main.py` não faz mais seed de produtos

## 🐛 Troubleshooting

### "SEED_ON_START still enabled"
Certifique-se que `.env` tem:
```env
SEED_ON_START=false
```

### "ModuleNotFoundError"
Instale as dependências:
```bash
pip install -r requirements.txt
```

### "Database locked"
Pare o backend (uvicorn) antes de rodar seed com `--clean`

## 📚 Exemplos

```bash
# Seed completo do zero
python seed_database.py --clean --level full

# Adicionar mais dados sem limpar
python seed_database.py --level medium

# Desenvolvimento rápido
python seed_database.py --clean --level minimal
```
