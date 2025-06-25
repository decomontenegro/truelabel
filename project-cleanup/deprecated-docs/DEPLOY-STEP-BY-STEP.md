# 🚀 Deploy True Label - Guia Passo a Passo Detalhado

## 📋 Visão Geral
Este guia vai te ajudar a configurar todos os serviços necessários para colocar o True Label em produção. Tempo total estimado: 30 minutos.

---

## 1️⃣ Supabase (PostgreSQL) - 10 minutos

### O que é?
Supabase é um banco de dados PostgreSQL gerenciado, similar ao Firebase mas open source. O plano gratuito oferece:
- ✅ 500MB de armazenamento
- ✅ Backups automáticos
- ✅ SSL incluído
- ✅ Interface visual para gerenciar dados

### Passo a Passo:

#### 1. Criar Conta
1. Acesse [supabase.com](https://supabase.com)
2. Clique no botão verde **"Start your project"**
3. Escolha **"Sign in with GitHub"** (mais rápido)
4. Autorize o Supabase a acessar seu GitHub

#### 2. Criar Novo Projeto
1. Clique em **"New Project"**
2. Preencha os campos:
   - **Organization**: Selecione sua organização ou crie uma nova
   - **Project name**: `true-label-production`
   - **Database Password**: Clique no ícone 🎲 para gerar uma senha forte
   - **⚠️ IMPORTANTE**: Copie e salve esta senha em um lugar seguro!
   - **Region**: `South America (São Paulo)` para melhor latência no Brasil
   - **Pricing Plan**: Free tier

3. Clique em **"Create new project"**
4. Aguarde 2-3 minutos enquanto o projeto é criado

#### 3. Obter Connection String
1. Quando o projeto estiver pronto, vá para o menu lateral
2. Clique em **"Settings"** (ícone de engrenagem)
3. Clique em **"Database"**
4. Role até **"Connection string"**
5. Selecione **"URI"** no dropdown
6. Você verá algo como:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxxxxxxxxxx.supabase.co:5432/postgres
   ```
7. Clique no botão **"Copy"** para copiar

#### 4. Preparar para o Vercel
Substitua `[YOUR-PASSWORD]` pela senha que você salvou e adicione no final:
```
postgresql://postgres:SUA-SENHA-AQUI@db.xxxxxxxxxxxx.supabase.co:5432/postgres?sslmode=require
```

💡 **Dica**: O `?sslmode=require` é importante para segurança em produção!

#### 5. Configurar Pooling (Opcional mas Recomendado)
1. Na mesma página de Database
2. Procure por **"Connection pooling"**
3. Ative o toggle **"Enable connection pooling"**
4. Use a porta `6543` (pooler) ao invés de `5432` na sua connection string

---

## 2️⃣ Upstash (Redis Cache) - 5 minutos

### O que é?
Upstash é um Redis serverless, perfeito para cache. O plano gratuito oferece:
- ✅ 10.000 comandos/dia
- ✅ 256MB de armazenamento
- ✅ Latência global baixa
- ✅ Backup automático

### Passo a Passo:

#### 1. Criar Conta
1. Acesse [upstash.com](https://upstash.com)
2. Clique em **"Start Free"**
3. Escolha **"Continue with GitHub"** ou **"Continue with Google"**
4. Autorize o acesso

#### 2. Criar Database Redis
1. No dashboard, clique em **"Create Database"**
2. Configure:
   - **Name**: `true-label-cache`
   - **Type**: `Regional` (não Global)
   - **Region**: `us-east-1` (mais próximo do Brasil)
   - **Enable Eviction**: ✅ Marque esta opção
   - **TLS/SSL**: ✅ Deixe ativado

3. Clique em **"Create"**

#### 3. Obter Credenciais
1. Após criar, você verá o dashboard do database
2. Procure por **"REST API"** no topo
3. Você verá duas informações importantes:
   ```
   UPSTASH_REDIS_REST_URL=https://xxxxx.upstash.io
   UPSTASH_REDIS_REST_TOKEN=xxxxxxxxxxxxxxxxxx
   ```
4. Clique no botão **"Copy"** em cada uma para copiar

#### 4. Testar Conexão (Opcional)
1. No dashboard, clique na aba **"Data Browser"**
2. Tente adicionar uma chave de teste
3. Se funcionar, está tudo certo!

---

## 3️⃣ SendGrid (Email) - 10 minutos

### O que é?
SendGrid é o serviço de email mais popular. O plano gratuito oferece:
- ✅ 100 emails/dia
- ✅ Templates de email
- ✅ Analytics de entrega
- ✅ API robusta

### Passo a Passo:

#### 1. Criar Conta
1. Acesse [sendgrid.com](https://sendgrid.com)
2. Clique em **"Start for Free"**
3. Preencha o formulário:
   - **Email Address**: Use um email profissional (não gmail/hotmail)
   - **Password**: Crie uma senha forte
   - **First/Last Name**: Seu nome completo
   - **Company**: Nome da sua empresa
   - **Company Website**: Site da empresa (pode ser o futuro domínio)

4. Clique em **"Create Account"**

#### 2. Verificar Email
1. Verifique seu email
2. Clique no link de confirmação
3. Você será redirecionado para o dashboard

#### 3. Complete o Setup
1. Responda às perguntas:
   - **How do you want to send email?**: `Using code`
   - **What are you building?**: `Web Application`
   - **How many emails?**: `1-100 per day`
   - **Do you have a developer?**: `Yes`

2. Clique em **"Get Started"**

#### 4. Configurar Sender Identity
1. Vá para **Settings** → **Sender Authentication**
2. Clique em **"Verify a Single Sender"**
3. Preencha:
   - **From Name**: `True Label`
   - **From Email Address**: `noreply@seudominio.com`
   - **Reply To**: `suporte@seudominio.com`
   - **Company Address**: Endereço da empresa
   - **City**: Cidade
   - **Country**: Brazil
   - **Nickname**: `True Label Production`

4. Clique em **"Create"**
5. Verifique o email enviado para confirmar

#### 5. Criar API Key
1. Vá para **Settings** → **API Keys**
2. Clique em **"Create API Key"**
3. Configure:
   - **API Key Name**: `true-label-production`
   - **API Key Permissions**: `Full Access`

4. Clique em **"Create & View"**
5. **⚠️ IMPORTANTE**: Copie a API key agora! Ela só aparece uma vez:
   ```
   SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

---

## 4️⃣ Vercel (Deploy) - 5 minutos

### O que é?
Vercel é a plataforma de deploy mais simples. Oferece:
- ✅ Deploy automático do GitHub
- ✅ HTTPS grátis
- ✅ Preview deployments
- ✅ Analytics básico grátis

### Passo a Passo:

#### 1. Criar Conta
1. Acesse [vercel.com](https://vercel.com)
2. Clique em **"Sign Up"**
3. Escolha **"Continue with GitHub"**
4. Autorize o Vercel

#### 2. Importar Projeto
1. No dashboard, clique em **"Add New..."** → **"Project"**
2. Na lista de repositórios, encontre **"truelabel"**
3. Clique em **"Import"**

#### 3. Configurar Build Settings
1. **Framework Preset**: `Other`
2. **Root Directory**: `./` (deixe vazio)
3. **Build Command**: `cd client && npm ci && npm run build`
4. **Output Directory**: `client/dist`
5. **Install Command**: `npm install`

#### 4. Configurar Environment Variables
Clique em **"Environment Variables"** e adicione TODAS estas:

##### Database
```
DATABASE_URL = postgresql://postgres:SUA-SENHA@db.xxx.supabase.co:5432/postgres?sslmode=require
```

##### Autenticação
```
JWT_SECRET = gere-uma-senha-super-segura-com-32-caracteres-minimo
JWT_EXPIRES_IN = 7d
```

##### Email
```
EMAIL_ENABLED = true
EMAIL_PROVIDER = sendgrid
SENDGRID_API_KEY = SG.xxxxxxxxxxxxxxxxxx
SENDGRID_FROM_EMAIL = noreply@seudominio.com
SENDGRID_FROM_NAME = True Label
```

##### Redis
```
REDIS_ENABLED = true
REDIS_PROVIDER = upstash
UPSTASH_REDIS_REST_URL = https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN = xxxxxxxxxx
```

##### URLs da Aplicação
```
NODE_ENV = production
CLIENT_URL = https://truelabel.vercel.app
API_URL = https://truelabel.vercel.app/api
CORS_ORIGIN = https://truelabel.vercel.app
```

##### Frontend (com prefixo VITE_)
```
VITE_API_BASE_URL = https://truelabel.vercel.app/api/v1
VITE_QR_BASE_URL = https://truelabel.vercel.app
VITE_ENVIRONMENT = production
```

#### 5. Deploy!
1. Após adicionar todas as variáveis, clique em **"Deploy"**
2. Aguarde 3-5 minutos
3. Quando terminar, clique em **"Visit"** para ver seu site!

---

## ✅ Checklist Final

### Antes do Deploy
- [ ] Conta Supabase criada e DATABASE_URL copiada
- [ ] Conta Upstash criada e credenciais Redis copiadas
- [ ] Conta SendGrid criada e API key copiada
- [ ] Sender identity verificado no SendGrid

### Durante o Deploy
- [ ] Todas as variáveis de ambiente adicionadas
- [ ] Build command configurado corretamente
- [ ] Output directory apontando para client/dist

### Após o Deploy
- [ ] Site acessível na URL do Vercel
- [ ] Testar login/registro
- [ ] Testar criação de produto
- [ ] Verificar se emails estão sendo enviados

---

## 🆘 Troubleshooting

### Build Failing no Vercel
1. Verifique os logs de build
2. Comum: falta de variável de ambiente
3. Comum: erro de TypeScript - fazer commit das correções

### Database Connection Error
1. Verifique se adicionou `?sslmode=require`
2. Confirme que a senha está correta
3. No Supabase, vá em Settings → Database → Connection info

### Emails não chegando
1. Verifique se o sender foi verificado
2. Olhe o Activity Feed no SendGrid
3. Emails podem ir para spam inicialmente

### Redis Connection Error
1. Confirme que copiou URL e TOKEN corretos
2. No Upstash, teste no Data Browser
3. Verifique se REDIS_ENABLED=true

---

## 🎉 Próximos Passos

1. **Domínio Customizado**: Configure seu domínio em Vercel → Settings → Domains
2. **Analytics**: Ative Vercel Analytics (grátis para 2.500 views/mês)
3. **Monitoramento**: Configure alertas no Supabase e SendGrid
4. **Backups**: Ative backups automáticos no Supabase

---

## 📞 Precisa de Ajuda?

Se tiver qualquer problema durante o deploy:
1. Verifique os logs de erro
2. Consulte a documentação específica de cada serviço
3. A comunidade do Vercel é muito ativa e prestativa

Boa sorte com o deploy! 🚀