# 📧 Configuração de Email para True Label

## Opção 1: SendGrid (Recomendado - 100 emails/dia grátis)

### 1. Criar Conta no SendGrid
1. Acesse [sendgrid.com](https://sendgrid.com)
2. Clique em "Start For Free"
3. Preencha o formulário:
   - **Email**: Use um email profissional
   - **Password**: Senha forte
   - **Company**: Nome da sua empresa

### 2. Verificar Conta
1. Confirme seu email
2. Complete o onboarding:
   - **How will you send?**: API
   - **What are you building?**: Web Application
   - **How many emails?**: 1-100/day

### 3. Criar API Key
1. Vá em Settings → API Keys
2. Clique em "Create API Key"
3. Configure:
   - **Name**: `true-label-production`
   - **Permissions**: Full Access
4. **IMPORTANTE**: Copie a API Key (só aparece uma vez!)

### 4. Configurar Sender Identity
1. Vá em Settings → Sender Authentication
2. Escolha "Single Sender Verification" (mais rápido)
3. Adicione:
   - **From Email**: noreply@suaempresa.com
   - **From Name**: True Label
   - **Reply To**: suporte@suaempresa.com
4. Verifique o email enviado

### 5. Atualizar .env
```env
# Email Configuration
EMAIL_ENABLED=true
EMAIL_PROVIDER=sendgrid

# SendGrid
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxx
SENDGRID_FROM_EMAIL=noreply@suaempresa.com
SENDGRID_FROM_NAME=True Label

# Templates (opcional)
SENDGRID_WELCOME_TEMPLATE_ID=
SENDGRID_VALIDATION_TEMPLATE_ID=
SENDGRID_NOTIFICATION_TEMPLATE_ID=
```

## Opção 2: SMTP (Gmail/Outlook)

### Gmail (Menos seguro, não recomendado para produção)
1. Ative "Senhas de app" na conta Google
2. Gere uma senha específica
3. Configure:
```env
EMAIL_ENABLED=true
EMAIL_PROVIDER=smtp

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=seuemail@gmail.com
SMTP_PASS=senha-de-app-gerada
SMTP_FROM_EMAIL=seuemail@gmail.com
SMTP_FROM_NAME=True Label
```

### Outlook/Office365
```env
EMAIL_ENABLED=true
EMAIL_PROVIDER=smtp

SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=seuemail@outlook.com
SMTP_PASS=sua-senha
SMTP_FROM_EMAIL=seuemail@outlook.com
SMTP_FROM_NAME=True Label
```

## Opção 3: Desenvolvimento (Console)

Para testes locais, use o modo console:
```env
EMAIL_ENABLED=true
EMAIL_PROVIDER=console
```

Emails serão logados no console ao invés de enviados.

## 📝 Templates de Email

### 1. Criar Templates no SendGrid (Recomendado)
1. Vá em Email API → Dynamic Templates
2. Clique em "Create a Dynamic Template"
3. Crie templates para:
   - **Welcome**: Boas-vindas ao usuário
   - **Product Validation**: Notificação de validação
   - **Scan Notification**: Alerta de scan

### 2. Estrutura dos Templates

#### Welcome Email
```html
<!DOCTYPE html>
<html>
<head>
    <style>
        .container { max-width: 600px; margin: 0 auto; }
        .header { background: #4F46E5; color: white; padding: 20px; }
        .content { padding: 20px; }
        .button { 
            background: #4F46E5; 
            color: white; 
            padding: 12px 24px; 
            text-decoration: none; 
            border-radius: 6px; 
            display: inline-block;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Bem-vindo ao True Label!</h1>
        </div>
        <div class="content">
            <p>Olá {{name}},</p>
            <p>Sua conta foi criada com sucesso!</p>
            <a href="{{loginUrl}}" class="button">Acessar Plataforma</a>
        </div>
    </div>
</body>
</html>
```

## 🧪 Testar Envio

### 1. Script de Teste
Crie `server/scripts/test-email.ts`:
```typescript
import { emailService } from '../src/services/emailService';

async function testEmail() {
  try {
    await emailService.sendEmail({
      to: 'seu-email@exemplo.com',
      subject: 'Teste True Label',
      html: '<h1>Email de teste</h1><p>Se você recebeu este email, a configuração está funcionando!</p>'
    });
    console.log('✅ Email enviado com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao enviar email:', error);
  }
}

testEmail();
```

### 2. Executar Teste
```bash
cd server
npx ts-node scripts/test-email.ts
```

## ⚠️ Limites e Quotas

### SendGrid Free
- 100 emails/dia
- Sem suporte
- Sem IP dedicado

### Gmail SMTP
- 500 emails/dia
- Pode ser bloqueado como spam

### Para Alto Volume
- SendGrid Pro: 40k emails/mês por $19.95
- AWS SES: $0.10 por 1000 emails
- Mailgun: 5k emails/mês grátis

## 🔧 Troubleshooting

### Erro: "Unauthorized"
- Verifique a API Key
- Confirme que copiou corretamente
- Verifique permissões da key

### Erro: "Sender not verified"
- Complete a verificação do sender
- Use o email verificado no FROM

### Emails indo para Spam
- Configure SPF/DKIM
- Use domínio próprio
- Evite palavras spam no assunto

### Rate Limiting
O sistema já tem proteção contra rate limit:
```typescript
// Max 10 emails por minuto por usuário
// Max 100 emails por hora total
```

## 📊 Monitoramento

### SendGrid Dashboard
- **Activity Feed**: Veja emails enviados em tempo real
- **Stats**: Métricas de entrega, abertura, cliques
- **Suppressions**: Gerenciar bounces e unsubscribes

### Logs Locais
O sistema registra todos os envios em:
- Console (desenvolvimento)
- Arquivo de log (produção)
- Webhook para falhas (opcional)

## 📝 Checklist

- [ ] Conta criada no SendGrid
- [ ] API Key gerada e salva
- [ ] Sender identity verificado
- [ ] .env atualizado com credenciais
- [ ] Teste de envio bem-sucedido
- [ ] Templates criados (opcional)
- [ ] Monitoramento configurado

## 🎯 Próximo Passo

Após configurar emails, configure o Redis seguindo `SETUP-REDIS.md`