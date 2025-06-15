# 📚 True Label API Documentation

## 🌐 Visão Geral

A API True Label fornece endpoints RESTful para gerenciar produtos, validações, relatórios laboratoriais e muito mais. Esta documentação descreve todos os endpoints disponíveis, seus parâmetros e respostas esperadas.

## 🚀 Acesso à Documentação

### Documentação Interativa (Swagger UI)

Quando o servidor estiver rodando, acesse:

```
http://localhost:3000/api-docs
```

### Gerar Documentação JSON

```bash
cd server
npx tsx generate-api-docs.ts
```

## 🔐 Autenticação

A API usa autenticação JWT (JSON Web Tokens). Para acessar endpoints protegidos:

1. Faça login através do endpoint `/api/auth/login`
2. Receba o token JWT na resposta
3. Inclua o token em todas as requisições subsequentes:

```http
Authorization: Bearer <seu-token-jwt>
```

### Exemplo de Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

## 📋 Endpoints Principais

### Auth
- `POST /api/auth/register` - Registrar novo usuário
- `POST /api/auth/login` - Fazer login
- `POST /api/auth/verify` - Verificar token
- `PUT /api/auth/profile` - Atualizar perfil

### Products
- `GET /api/products` - Listar produtos
- `POST /api/products` - Criar produto
- `GET /api/products/:id` - Obter produto
- `PUT /api/products/:id` - Atualizar produto
- `DELETE /api/products/:id` - Deletar produto
- `POST /api/products/:id/qr-code` - Gerar QR code

### Validations
- `GET /api/validations` - Listar validações
- `POST /api/validations` - Criar validação
- `GET /api/validations/:id` - Obter validação
- `PUT /api/validations/:id` - Atualizar validação
- `GET /api/validations/queue` - Fila de validações
- `GET /api/validations/metrics` - Métricas

### Reports
- `GET /api/reports` - Listar relatórios
- `POST /api/reports` - Upload de relatório
- `GET /api/reports/:id` - Obter relatório
- `DELETE /api/reports/:id` - Deletar relatório

### Laboratories
- `GET /api/laboratories` - Listar laboratórios
- `POST /api/laboratories` - Criar laboratório
- `GET /api/laboratories/:id` - Obter laboratório
- `PUT /api/laboratories/:id` - Atualizar laboratório

### Analytics
- `GET /api/analytics/overview` - Visão geral
- `GET /api/analytics/qr-scans` - Scans de QR code
- `GET /api/analytics/products` - Analytics de produtos
- `GET /api/analytics/enhanced` - Analytics avançado

### Public
- `GET /api/public/validation/:qrCode` - Validação pública via QR

## 🎯 Roles e Permissões

### Roles Disponíveis:
- **ADMIN**: Acesso total ao sistema
- **BRAND**: Gerenciar próprios produtos
- **LAB**: Upload de relatórios
- **CONSUMER**: Acesso público

### Permissões por Endpoint:

| Endpoint | ADMIN | BRAND | LAB | CONSUMER |
|----------|-------|-------|-----|----------|
| Products | ✅ | ✅ (próprios) | ❌ | ❌ |
| Validations | ✅ | ✅ (próprios) | ✅ | ❌ |
| Reports | ✅ | ✅ (próprios) | ✅ | ❌ |
| Analytics | ✅ | ✅ (próprios) | ❌ | ❌ |

## 📝 Exemplos de Uso

### Criar Produto

```bash
curl -X POST http://localhost:3000/api/products \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Produto Exemplo",
    "brand": "Marca X",
    "category": "Alimentos",
    "sku": "SKU123",
    "description": "Descrição do produto",
    "claims": ["Sem glúten", "Orgânico"]
  }'
```

### Listar Produtos com Filtros

```bash
curl -X GET "http://localhost:3000/api/products?page=1&limit=10&status=VALIDATED&search=orgânico" \
  -H "Authorization: Bearer <token>"
```

### Upload de Relatório

```bash
curl -X POST http://localhost:3000/api/reports \
  -H "Authorization: Bearer <token>" \
  -F "file=@relatorio.pdf" \
  -F "productId=123e4567-e89b-12d3-a456-426614174000" \
  -F "analysisType=nutritional" \
  -F "laboratoryId=123e4567-e89b-12d3-a456-426614174001"
```

## 🔄 Status de Resposta

### Códigos de Sucesso
- `200 OK` - Requisição bem-sucedida
- `201 Created` - Recurso criado
- `204 No Content` - Sucesso sem conteúdo

### Códigos de Erro
- `400 Bad Request` - Dados inválidos
- `401 Unauthorized` - Não autenticado
- `403 Forbidden` - Sem permissão
- `404 Not Found` - Recurso não encontrado
- `409 Conflict` - Conflito (ex: email já existe)
- `422 Unprocessable Entity` - Erro de validação
- `500 Internal Server Error` - Erro do servidor

## 📊 Formato de Resposta

### Sucesso
```json
{
  "data": {
    // dados da resposta
  },
  "message": "Operação realizada com sucesso"
}
```

### Erro
```json
{
  "error": "Mensagem de erro",
  "details": {
    // detalhes adicionais do erro
  }
}
```

### Paginação
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  }
}
```

## 🛠️ Ferramentas de Desenvolvimento

### Postman Collection
Importe o arquivo `api-documentation.json` no Postman para ter acesso a todos os endpoints pré-configurados.

### VS Code REST Client
Crie um arquivo `.http` com as requisições:

```http
### Login
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "email": "admin@truelabel.com",
  "password": "admin123"
}

### Listar Produtos
GET http://localhost:3000/api/products
Authorization: Bearer {{token}}
```

## 📞 Suporte

Para dúvidas sobre a API:
- Email: api@truelabel.com
- Documentação: http://localhost:3000/api-docs
- GitHub: https://github.com/truelabel/api

## 🔄 Versionamento

A API segue versionamento semântico. A versão atual é `v1` e está incluída na URL base:

```
http://localhost:3000/api/v1/...
```

Mudanças breaking serão introduzidas em novas versões (v2, v3, etc.).