# 🗄️ Configuração PostgreSQL para True Label

## Opção 1: Supabase (Recomendado - Grátis)

### 1. Criar Conta no Supabase
1. Acesse [supabase.com](https://supabase.com)
2. Clique em "Start your project"
3. Faça login com GitHub

### 2. Criar Novo Projeto
1. Clique em "New Project"
2. Preencha:
   - **Name**: `true-label-production`
   - **Database Password**: Gere uma senha forte (salve ela!)
   - **Region**: Escolha a mais próxima (São Paulo para Brasil)
   - **Pricing Plan**: Free (até 500MB)

### 3. Obter Connection String
1. Vá em Settings → Database
2. Em "Connection string", copie a URI
3. Será algo como:
```
postgresql://postgres:[YOUR-PASSWORD]@db.xxxxxxxxxxxx.supabase.co:5432/postgres
```

### 4. Configurar Prisma
1. Atualize o arquivo `.env` do servidor:
```env
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.xxxxxxxxxxxx.supabase.co:5432/postgres?schema=public"
```

2. Configure o pooling para Supabase:
```env
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.xxxxxxxxxxxx.supabase.co:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:[YOUR-PASSWORD]@db.xxxxxxxxxxxx.supabase.co:5432/postgres"
```

### 5. Atualizar schema.prisma
```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

## Opção 2: Neon (Alternativa - Grátis até 3GB)

### 1. Criar Conta no Neon
1. Acesse [neon.tech](https://neon.tech)
2. Sign up com GitHub/Google

### 2. Criar Database
1. Clique em "Create Database"
2. Escolha:
   - **Project name**: `true-label`
   - **Database name**: `truelabel`
   - **Region**: Escolha a mais próxima

### 3. Obter Connection String
1. No dashboard, copie a connection string
2. Será algo como:
```
postgresql://username:password@ep-xxxx.region.aws.neon.tech/truelabel
```

## 🚀 Migrar Banco de Dados

### 1. Instalar dependências
```bash
cd server
npm install
```

### 2. Gerar cliente Prisma
```bash
npx prisma generate
```

### 3. Executar migrações
```bash
# Criar migrações a partir do schema
npx prisma migrate dev --name init

# OU se já tem migrações
npx prisma migrate deploy
```

### 4. Seed inicial (opcional)
```bash
npm run seed
```

## ✅ Verificar Conexão

### Teste rápido:
```bash
npx prisma db pull
```

### Visualizar dados:
```bash
npx prisma studio
```

## 🔧 Troubleshooting

### Erro: "Can't reach database"
- Verifique se copiou a URL corretamente
- No Supabase, certifique-se que não tem restrições de IP
- Tente usar a porta 6543 (pooler) ao invés de 5432

### Erro: "SSL required"
Adicione `?sslmode=require` no final da URL:
```
DATABASE_URL="postgresql://...@host:5432/database?sslmode=require"
```

### Erro: "Too many connections"
Use connection pooling:
- Supabase: Use porta 6543
- Adicione `?pgbouncer=true&connection_limit=1`

## 📝 Checklist

- [ ] Conta criada no Supabase/Neon
- [ ] Database criado
- [ ] Connection string copiada
- [ ] .env atualizado com DATABASE_URL
- [ ] schema.prisma atualizado
- [ ] Migrações executadas
- [ ] Conexão testada com sucesso

## 🎯 Próximo Passo

Após configurar o PostgreSQL, configure o email provider seguindo `SETUP-EMAIL.md`