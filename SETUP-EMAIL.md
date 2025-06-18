# 📧 Configuração de Email para True Label

## Opção 1: SendGrid (Recomendado)

### 1. Criar Conta no SendGrid
1. Acesse [sendgrid.com](https://sendgrid.com)
2. Clique em "Start for Free"
3. Preencha o formulário:
   - Use email corporativo (não Gmail/Hotmail)
   - Seja honesto sobre o uso (transactional emails)

### 2. Verificar Conta
1. Confirme seu email
2. Complete o processo de verificação
3. Aguarde aprovação (pode levar algumas horas)

### 3. Configurar Sender
1. Vá em Settings → Sender Authentication
2. Escolha "Single Sender Verification" (mais rápido)
3. Adicione:
   - **From Email**: noreply@seudominio.com
   - **From Name**: True Label
   - **Reply To**: suporte@seudominio.com

### 4. Criar API Key
1. Vá em Settings → API Keys
2. Clique em "Create API Key"
3. Nome: `true-label-production`
4. Permissões: Full Access
5. **COPIE A KEY!** (só aparece uma vez)

### 5. Configurar no True Label
Adicione ao `.env`:
```env
EMAIL_ENABLED=true
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxx
EMAIL_FROM=noreply@seudominio.com
EMAIL_FROM_NAME=True Label
EMAIL_REPLY_TO=suporte@seudominio.com
```

## Opção 2: SMTP (Gmail)

### 1. Configurar Gmail
1. Ative 2FA na sua conta Google
2. Vá em [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
3. Gere uma senha de app para "Mail"

### 2. Configurar no True Label
```env
EMAIL_ENABLED=true
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=seuemail@gmail.com
SMTP_PASS=sua-senha-de-app
EMAIL_FROM=seuemail@gmail.com
EMAIL_FROM_NAME=True Label
```

## Opção 3: Desenvolvimento (Console)

Para testes locais, use o modo console:
```env
EMAIL_ENABLED=true
EMAIL_PROVIDER=console
```

Emails serão logados no console ao invés de enviados.

## 📝 Templates de Email

O True Label já tem templates para:
- ✅ Boas-vindas
- ✅ Reset de senha
- ✅ Validação aprovada
- ✅ Validação rejeitada
- ✅ Novo relatório
- ✅ QR Code gerado

## 🧪 Testar Envio

### 1. Teste manual via API:
```bash
curl -X POST http://localhost:9100/api/v1/auth/test-email \
  -H "Content-Type: application/json" \
  -d '{"email": "seu@email.com"}'
```

### 2. Teste no código:
```javascript
// server/src/test-email.js
import { emailService } from './services/emailService';

async function testEmail() {
  try {
    const result = await emailService.sendEmail(
      'teste@email.com',
      'Teste True Label',
      '<h1>Email funcionando!</h1>',
      { type: 'test' }
    );
    console.log('Email enviado:', result);
  } catch (error) {
    console.error('Erro:', error);
  }
}

testEmail();
```

## 🚨 Limites Gratuitos

### SendGrid Free
- 100 emails/dia
- Total: 3.000/mês

### Gmail SMTP
- 500 emails/dia
- Pode ser bloqueado se parecer spam

## ⚠️ Boas Práticas

1. **Sempre use templates** ao invés de HTML inline
2. **Monitore bounces** e remova emails inválidos
3. **Implemente unsubscribe** para marketing emails
4. **Use rate limiting** para evitar spam
5. **Teste em desenvolvimento** antes de produção

## 📊 Monitoramento

### SendGrid Dashboard
- Taxa de entrega
- Bounces e spam reports
- Engagement (opens/clicks)

### Logs do True Label
```bash
# Ver logs de email
grep "Email" server/logs/app.log

# Ver erros
grep "Email.*error" server/logs/error.log
```

## ✅ Checklist

- [ ] Conta criada no provedor
- [ ] Sender verificado
- [ ] API Key gerada
- [ ] Variáveis de ambiente configuradas
- [ ] Email de teste enviado com sucesso
- [ ] Templates funcionando

## 🎯 Próximo Passo

Após configurar emails, configure o Redis seguindo `SETUP-REDIS.md`