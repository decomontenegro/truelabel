# 🔄 Mudança de Portas - True Label

## 📊 Resumo da Mudança

As portas do projeto True Label foram atualizadas para o range 9000-9999 para evitar conflitos com outras aplicações.

### Portas Anteriores:
- **Backend**: 3000
- **Frontend**: 3001

### Portas Novas:
- **Backend**: 9100 (9000 estava ocupada)
- **Frontend**: 9101
- **Redis**: 6379 (mantido - porta padrão)

## ✅ Arquivos Atualizados

### Configuração (.env)
- `/server/.env`
- `/server/.env.development`
- `/.env.example`

### Código TypeScript
- `/server/src/config/env.config.ts`
- `/server/src/middlewares/security.middleware.ts`
- `/trust-label-security/config/env.config.ts`
- `/trust-label-security/middlewares/security.middleware.ts`

### Documentação
- `/README_QUICK_START.md`
- `/CLAUDE.md`
- `/PROJETO_TRUE_LABEL_DOCUMENTACAO_COMPLETA.md`

## 🚀 Como Usar

### Backend
```bash
cd "/Users/andremontenegro/true label/server"
npm run dev  # Vai rodar na porta 9100
```

### Frontend
```bash
cd "/Users/andremontenegro/true label/client"
npm run dev  # Vai rodar na porta 9101
```

### URLs de Acesso
- **Frontend**: http://localhost:9101
- **Backend API**: http://localhost:9100/api/v1
- **Health Check**: http://localhost:9100/health

## 🔧 Variáveis de Ambiente

### Backend (.env)
```env
PORT=9100
CORS_ORIGINS=http://localhost:9101,http://localhost:9100,http://localhost:5173
```

### Frontend (.env)
```env
VITE_API_BASE_URL=http://localhost:9100/api/v1
VITE_QR_BASE_URL=http://localhost:9101
```

## ⚠️ Notas Importantes

1. **Porta 9000 estava ocupada** por um processo Python, por isso usamos 9100
2. **CORS atualizado** para permitir as novas portas
3. **Todas as referências** foram atualizadas na documentação
4. **Sistema testado** e funcionando nas novas portas

## 🐛 Solução de Problemas

### Verificar Portas em Uso
```bash
lsof -i :9100  # Backend
lsof -i :9101  # Frontend
```

### Liberar Portas
```bash
kill -9 PID_NUMBER
```

### Testar Conexão
```bash
curl http://localhost:9100/health
```

---

**Data da Mudança**: 15/06/2025
**Status**: ✅ Completo e Funcional