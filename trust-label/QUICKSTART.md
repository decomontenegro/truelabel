# 🚀 TRUST LABEL - Guia de Início Rápido

## Iniciar em 1 Comando

```bash
./quickstart.sh
```

## O que o script faz:

1. ✅ Verifica dependências (Node.js, npm)
2. ✅ Cria arquivo .env com configurações
3. ✅ Instala todas as dependências
4. ✅ Configura banco de dados (se disponível)
5. ✅ Compila o TypeScript
6. ✅ Oferece 3 opções de execução

## Opções de Execução:

### 1️⃣ Frontend Standalone (Mais Rápido)
- Abre `trust-label-complete.html` no navegador
- Funciona 100% sem backend
- Ideal para demonstrações rápidas
- Dados mockados incluídos

### 2️⃣ Backend Completo
- Inicia servidor Express + TypeScript
- API REST completa em http://localhost:3001
- Documentação em http://localhost:3001/api-docs
- Requer PostgreSQL para funcionalidade completa

### 3️⃣ Sistema Completo
- Backend + Frontend integrados
- Experiência completa da plataforma
- Todas as funcionalidades disponíveis

## Credenciais de Teste:

| Tipo | Email | Senha |
|------|-------|-------|
| Admin | admin@trustlabel.com | admin123 |
| Marca | brand@example.com | senha123 |
| Laboratório | lab@example.com | senha123 |

## Solução de Problemas:

### "npm install" falha
```bash
npm cache clean --force
npm install --legacy-peer-deps
```

### PostgreSQL não conecta
- O sistema funcionará com dados mockados
- Para funcionalidade completa, instale PostgreSQL

### Porta 3001 em uso
```bash
# Edite .env e mude PORT=3002
PORT=3002 npm start
```

## Arquivos Importantes:

- `trust-label-complete.html` - Demo completa standalone
- `trust-label-dashboard.html` - Dashboard simplificado  
- `server-simple.js` - Servidor mínimo para testes
- `src/server.ts` - Servidor TypeScript completo

## Próximos Passos:

1. **Configurar PostgreSQL** (opcional)
   ```bash
   createdb trustlabel
   npx prisma migrate deploy
   ```

2. **Adicionar API Keys** (opcional)
   - Edite `.env` com suas chaves
   - OpenAI para validação com IA
   - SendGrid para emails

3. **Deploy**
   ```bash
   ./deploy-vercel.sh
   ```

---

💡 **Dica**: Para desenvolvimento, use `npm run dev` ao invés de `npm start`