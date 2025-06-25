# TRUST Label - Guia de Uso

## 🚀 Sistema de QR Code Inteligente com Rastreamento

### Status: ✅ IMPLEMENTADO E FUNCIONAL

## Como Iniciar

Execute o comando abaixo para iniciar todos os serviços:

```bash
./start-trust-label.sh
```

Isso iniciará:
- Servidor Web (porta 8001)
- API de Tracking (porta 5001)

## URLs Disponíveis

### 1. Sistema Principal
**http://localhost:8001/trust-label-enhanced.html**
- Dashboard principal com estatísticas
- Cadastro de produtos
- Geração de QR codes inteligentes
- Visualização de produtos validados

### 2. Dashboard de Analytics
**http://localhost:8001/qr-analytics-dashboard.html**
- Visualização em tempo real de scans
- Gráficos de tendências
- Top produtos escaneados
- Análise por dispositivo e localização

### 3. Página de Verificação (Consumidor)
**http://localhost:8001/verify.html**
- Interface para consumidores
- Verificação de autenticidade
- Visualização de claims validados
- Trust Score do produto

### 4. API de Tracking
**http://localhost:5001**
- Endpoints REST para tracking
- Geração de QR codes
- Analytics e relatórios

## Funcionalidades Implementadas

### ✅ Sistema de QR Code Inteligente
- Geração de QR codes únicos por produto
- Rastreamento de cada scan
- Coleta de dados: localização, dispositivo, navegador
- Armazenamento em banco SQLite

### ✅ Analytics em Tempo Real
- Dashboard com métricas ao vivo
- Gráficos interativos (Chart.js)
- Atividade em tempo real
- Exportação de dados

### ✅ Portal do Consumidor
- Verificação instantânea via QR code
- Visualização de claims validados
- Trust Score visual
- Compartilhamento social

## API Endpoints

### POST /api/v1/qr/generate
Gera novo QR code rastreável
```json
{
  "product_id": "123",
  "product_name": "Óleo de Coco",
  "brand": "NaturalLife",
  "validation_data": {...}
}
```

### GET/POST /api/v1/qr/track/{qr_id}
Rastreia scan de QR code

### GET /api/v1/qr/{qr_id}/analytics
Obtém analytics detalhados do QR

### GET /api/v1/analytics/dashboard
Estatísticas gerais do dashboard

### GET /api/v1/qr/verify/{qr_id}
Verifica autenticidade do produto

## Fluxo de Uso

1. **Cadastrar Produto**
   - Acesse o sistema principal
   - Clique em "Novo Produto"
   - Preencha dados e claims

2. **Gerar QR Code**
   - Na lista de produtos, clique em "QR Code"
   - QR é gerado com tracking habilitado
   - Baixe ou imprima o código

3. **Consumidor Escaneia**
   - QR direciona para página de verificação
   - Scan é rastreado automaticamente
   - Dados são coletados (anônimos)

4. **Visualizar Analytics**
   - Acesse dashboard de analytics
   - Veja scans em tempo real
   - Analise métricas e tendências

## Próximos Passos

### 🔄 Em Progresso
- [ ] Fluxo completo de validação laboratorial

### 📋 Pendentes
- [ ] Dashboard analytics com IA insights
- [ ] Validação automática de claims via IA
- [ ] Sistema de notificações em tempo real
- [ ] Integração blockchain real
- [ ] Sistema de selos brasileiros
- [ ] Deploy em produção

## Estrutura de Arquivos

```
trust-label/
├── trust-label-enhanced.html      # Sistema principal
├── qr-analytics-dashboard.html    # Dashboard analytics
├── verify.html                    # Página do consumidor
├── qr-tracking-api.py            # API backend
├── start-web-server.py           # Servidor web
├── start-trust-label.sh          # Script de inicialização
└── qr_tracking.db                # Banco de dados (criado automaticamente)
```

## Tecnologias Utilizadas

- **Frontend**: HTML5, Tailwind CSS, Chart.js
- **Backend**: Python Flask
- **Banco de Dados**: SQLite
- **QR Code**: qrcode.js
- **Analytics**: Chart.js

## Notas Importantes

1. O banco de dados SQLite é criado automaticamente na primeira execução
2. Todos os dados de tracking são anônimos
3. QR codes são permanentes uma vez gerados
4. Sistema funciona 100% offline após instalação
5. Compatível com todos os navegadores modernos

---

**TRUST Label** - Transparência e rastreabilidade em cada produto! 🚀