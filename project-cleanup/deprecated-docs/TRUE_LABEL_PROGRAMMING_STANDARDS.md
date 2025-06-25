# 🏷️ True Label Programming Standards

## 📋 **PADRÃO OFICIAL DE DESENVOLVIMENTO**

Este documento estabelece os padrões obrigatórios de programação para o projeto True Label, garantindo consistência, escalabilidade e manutenibilidade.

---

## 🎯 **1. GERENCIAMENTO DE ROTAS API**

### **REGRA OBRIGATÓRIA: Route Management System**

**✅ SEMPRE USAR:**
- Sistema de gerenciamento de rotas (`api-route-manager.js`)
- Registry centralizado (`api-route-registry.json`)
- Validação automática antes de commits

**❌ NUNCA FAZER:**
- Criar rotas diretamente no código sem documentar no registry
- Modificar rotas sem atualizar o registry
- Fazer deploy sem validar rotas

### **Workflow Obrigatório:**

```bash
# 1. ANTES de adicionar nova funcionalidade
node api-route-manager.js status

# 2. PLANEJAR rotas no registry
# Editar api-route-registry.json

# 3. GERAR implementação
node api-route-manager.js generate

# 4. VALIDAR antes de commit
node api-route-manager.js validate

# 5. SINCRONIZAR periodicamente
node api-route-manager.js sync
```

### **Estrutura de Arquivos Obrigatória:**

```
true label/
├── api-route-registry.json          # ✅ OBRIGATÓRIO
├── api-route-manager.js             # ✅ OBRIGATÓRIO
├── server/src/
│   ├── index-managed.js             # ✅ USAR ESTE
│   └── index-ultra-simple.js        # ❌ DEPRECATED
└── client/src/services/
    └── api-generated.ts             # ✅ GERADO AUTOMATICAMENTE
```

---

## 🔧 **2. PADRÕES DE BACKEND**

### **Estrutura de Rota Obrigatória:**

```javascript
// ✅ PADRÃO CORRETO
app.get('/endpoint', authenticate, async (req, res) => {
  try {
    // 1. Validar parâmetros
    const { param1, param2 } = req.body;
    
    if (!param1) {
      return res.status(400).json({ 
        success: false, 
        message: 'param1 is required' 
      });
    }
    
    // 2. Lógica de negócio
    const result = await processData(param1, param2);
    
    // 3. Resposta padronizada
    const response = {
      success: true,
      data: result,
      message: 'Operation completed'
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error in endpointName:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});
```

### **Middleware Obrigatório:**

```javascript
// ✅ SEMPRE INCLUIR
- CORS configurado
- express.json()
- Request logging
- Authentication middleware
- Global error handler
```

### **Resposta Padronizada:**

```javascript
// ✅ SUCESSO
{
  "success": true,
  "data": {},
  "message": "Optional message"
}

// ✅ ERRO
{
  "success": false,
  "message": "Error description",
  "code": "ERROR_CODE"
}
```

---

## 🎨 **3. PADRÕES DE FRONTEND**

### **Estrutura de Serviços API:**

```typescript
// ✅ USAR SERVIÇOS GERADOS
import { productsAPI } from '@/services/api-generated';

// ✅ PADRÃO DE CHAMADA
const handleCreateProduct = async (data) => {
  try {
    const response = await productsAPI.create(data);
    if (response.data.success) {
      // Handle success
    }
  } catch (error) {
    // Handle error
  }
};
```

### **Tratamento de Erros Obrigatório:**

```typescript
// ✅ SEMPRE IMPLEMENTAR
- Loading states
- Error boundaries
- Fallback UI
- User feedback (toast/alerts)
```

---

## 📁 **4. ORGANIZAÇÃO DE ARQUIVOS**

### **Estrutura Obrigatória:**

```
client/src/
├── components/
│   ├── ui/                    # Componentes base
│   ├── forms/                 # Formulários
│   └── layouts/               # Layouts
├── pages/                     # Páginas
├── services/
│   ├── api-generated.ts       # ✅ GERADO AUTOMATICAMENTE
│   └── endpoints.ts           # ✅ MANTER EXISTENTE
├── lib/
│   └── utils.ts               # Utilitários
└── types/                     # Tipos TypeScript
```

```
server/src/
├── index-managed.js           # ✅ BACKEND PRINCIPAL
├── middleware/                # Middlewares
├── routes/                    # Rotas modulares (futuro)
└── utils/                     # Utilitários
```

---

## 🔍 **5. PROCESSO DE VALIDAÇÃO**

### **Checklist Obrigatório Antes de Commit:**

```bash
# ✅ 1. Validar rotas
node api-route-manager.js validate

# ✅ 2. Verificar status
node api-route-manager.js status

# ✅ 3. Testar backend
curl http://localhost:3334/health

# ✅ 4. Testar frontend
# Verificar se carrega sem erros 404
```

### **Critérios de Aprovação:**

- ✅ Todas as rotas documentadas no registry
- ✅ Validação de rotas passa sem erros
- ✅ Backend responde corretamente
- ✅ Frontend conecta sem erros 404
- ✅ Tratamento de erros implementado

---

## 🚀 **6. PROCESSO DE DEPLOY**

### **Pré-Deploy Obrigatório:**

```bash
# 1. Sincronizar tudo
node api-route-manager.js sync

# 2. Validar implementação
node api-route-manager.js validate

# 3. Gerar código final
node api-route-manager.js generate

# 4. Testar localmente
# Backend + Frontend funcionando
```

### **Arquivos de Deploy:**

- ✅ `server/src/index-managed.js` - Backend principal
- ✅ `api-route-registry.json` - Registry atualizado
- ✅ Configurações de ambiente corretas

---

## 📊 **7. MONITORAMENTO E MANUTENÇÃO**

### **Verificações Periódicas:**

```bash
# Diário
node api-route-manager.js status

# Semanal
node api-route-manager.js audit

# Antes de releases
node api-route-manager.js sync
```

### **Métricas Obrigatórias:**

- Taxa de implementação de rotas
- Tempo de resposta das APIs
- Erros 404 no frontend
- Consistência do registry

---

## 🔒 **8. REGRAS DE SEGURANÇA**

### **Autenticação Obrigatória:**

```javascript
// ✅ SEMPRE USAR authenticate middleware
app.get('/protected-route', authenticate, handler);

// ✅ VALIDAR tokens
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Authentication required' 
    });
  }
  next();
};
```

### **Validação de Entrada:**

```javascript
// ✅ SEMPRE VALIDAR
if (!requiredParam) {
  return res.status(400).json({ 
    success: false, 
    message: 'Parameter is required' 
  });
}
```

---

## 📝 **9. DOCUMENTAÇÃO OBRIGATÓRIA**

### **Para Cada Nova Rota:**

```json
// ✅ DOCUMENTAR NO REGISTRY
{
  "method": "POST",
  "path": "/endpoint",
  "implemented": true,
  "authentication": true,
  "description": "Clear description",
  "requestSchema": {
    "param1": "string",
    "param2": "number"
  },
  "responseSchema": {
    "success": "boolean",
    "data": "object"
  }
}
```

### **Comentários Obrigatórios:**

```javascript
// ✅ SEMPRE INCLUIR
/**
 * Route description
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
```

---

## ⚠️ **10. VIOLAÇÕES E PENALIDADES**

### **Violações Graves:**

- ❌ Criar rotas sem documentar no registry
- ❌ Deploy sem validação de rotas
- ❌ Modificar backend sem seguir padrões
- ❌ Ignorar tratamento de erros

### **Processo de Correção:**

1. **Identificação** via `node api-route-manager.js audit`
2. **Correção** via `node api-route-manager.js fix`
3. **Validação** via `node api-route-manager.js validate`
4. **Documentação** da correção

---

## 🎯 **RESUMO EXECUTIVO**

### **COMANDOS ESSENCIAIS:**

```bash
# Status atual
node api-route-manager.js status

# Sincronizar tudo
node api-route-manager.js sync

# Validar antes de commit
node api-route-manager.js validate

# Usar backend gerenciado
node server/src/index-managed.js
```

### **ARQUIVOS PRINCIPAIS:**

- `api-route-registry.json` - Fonte da verdade
- `server/src/index-managed.js` - Backend principal
- `api-route-manager.js` - Ferramenta de gestão

---

**🏷️ Este padrão é OBRIGATÓRIO para todos os desenvolvedores do True Label. Violações resultam em rejeição de código e necessidade de refatoração.**

**📅 Vigência: A partir de 15/06/2025**
**🔄 Revisão: Trimestral**
