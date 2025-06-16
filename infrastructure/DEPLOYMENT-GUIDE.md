# True Label - Guia Completo de Deploy em Produção

## 📋 Índice

1. [Pré-requisitos](#pré-requisitos)
2. [Preparação do Ambiente](#preparação-do-ambiente)
3. [Deploy da Infraestrutura](#deploy-da-infraestrutura)
4. [Deploy da Aplicação](#deploy-da-aplicação)
5. [Configuração de Domínio](#configuração-de-domínio)
6. [Verificação e Testes](#verificação-e-testes)
7. [Monitoramento](#monitoramento)
8. [Troubleshooting](#troubleshooting)
9. [Rollback](#rollback)
10. [Manutenção](#manutenção)

## 🔧 Pré-requisitos

### Ferramentas Necessárias

```bash
# Terraform (>= 1.5.0)
brew install terraform

# AWS CLI
brew install awscli

# Docker
brew install docker

# Node.js 18+
brew install node@18

# jq (para parsing JSON)
brew install jq
```

### Contas e Acessos

1. **AWS Account**
   - Acesso administrativo ou IAM user com permissões necessárias
   - Créditos ou limite de gastos configurado

2. **Cloudflare Account**
   - Domínio já configurado
   - API Token com permissões de DNS

3. **Domínio**
   - Registrado e apontando para Cloudflare

### Configuração AWS CLI

```bash
# Configurar credenciais
aws configure

# Verificar acesso
aws sts get-caller-identity
```

## 🚀 Preparação do Ambiente

### 1. Clone o Repositório

```bash
git clone https://github.com/your-org/true-label.git
cd true-label
```

### 2. Configurar Variáveis do Terraform

```bash
cd infrastructure/terraform
cp terraform.tfvars.example terraform.tfvars
```

Edite `terraform.tfvars`:

```hcl
# Configurações essenciais
environment = "production"
aws_region  = "sa-east-1"
domain_name = "truelabel.com.br"

# Cloudflare
cloudflare_zone_id   = "your-zone-id"
cloudflare_api_token = "your-api-token"

# Configurações de recursos
api_cpu           = 1024
api_memory        = 2048
api_desired_count = 3

# Segurança
allowed_ips = [
  "200.xxx.xxx.xxx/32",  # Seu IP
]

# Alertas
alarm_email = "devops@truelabel.com.br"
```

### 3. Configurar Secrets

Crie um arquivo `.env.production` na raiz:

```bash
# Domínio
DOMAIN_NAME=truelabel.com.br

# AWS Region
AWS_REGION=sa-east-1
```

## 📦 Deploy da Infraestrutura

### 1. Inicializar e Planejar

```bash
# Navegar para o diretório de scripts
cd infrastructure/scripts

# Planejar infraestrutura
./deploy-infrastructure.sh production plan
```

### 2. Revisar o Plano

Revise cuidadosamente o output do Terraform:
- Recursos a serem criados
- Estimativa de custos
- Configurações de segurança

### 3. Aplicar Infraestrutura

```bash
# Aplicar mudanças
./deploy-infrastructure.sh production apply
```

Este processo criará:
- VPC com subnets públicas e privadas
- ECS Cluster com Fargate
- RDS PostgreSQL
- ElastiCache Redis
- Application Load Balancer
- CloudFront Distribution
- S3 Buckets
- Certificados SSL
- WAF e security groups

### 4. Salvar Outputs

```bash
# Os outputs são salvos automaticamente em:
cat infrastructure/terraform/outputs.json
```

## 🚀 Deploy da Aplicação

### 1. Build e Deploy

```bash
# Definir variáveis de ambiente
export DOMAIN_NAME=truelabel.com.br
export AWS_REGION=sa-east-1

# Deploy da aplicação
./infrastructure/scripts/deploy-application.sh production v1.0.0
```

O script irá:
1. Construir e fazer push da imagem Docker
2. Compilar e fazer upload do frontend
3. Executar migrations do banco
4. Atualizar o serviço ECS
5. Invalidar cache do CloudFront
6. Executar health checks

### 2. Verificar Deploy

```bash
# Verificar status do ECS
aws ecs describe-services \
  --cluster truelabel-cluster-production \
  --services truelabel-api-production

# Ver logs
aws logs tail /ecs/truelabel-production --follow
```

## 🌐 Configuração de Domínio

### 1. Configurar DNS no Cloudflare

Os registros DNS são criados automaticamente pelo Terraform, mas verifique:

1. Acesse o painel do Cloudflare
2. Verifique os registros:
   - `@` → CloudFront distribution
   - `www` → CloudFront distribution
   - `api` → ALB

### 2. Configurar SSL/TLS

No Cloudflare:
1. SSL/TLS → Overview → Full (strict)
2. SSL/TLS → Edge Certificates → Always Use HTTPS: ON
3. SSL/TLS → Edge Certificates → Minimum TLS Version: 1.2

## ✅ Verificação e Testes

### 1. Testes de Conectividade

```bash
# Testar API
curl https://api.truelabel.com.br/health

# Testar Frontend
curl https://truelabel.com.br

# Testar certificado SSL
openssl s_client -connect truelabel.com.br:443 -servername truelabel.com.br
```

### 2. Testes Funcionais

1. Acesse https://truelabel.com.br
2. Teste login com credenciais padrão
3. Crie um produto teste
4. Gere um QR code
5. Escaneie o QR code

### 3. Testes de Performance

```bash
# Teste de carga básico
ab -n 1000 -c 10 https://api.truelabel.com.br/health
```

## 📊 Monitoramento

### 1. CloudWatch Dashboard

Acesse o dashboard criado automaticamente:
- https://console.aws.amazon.com/cloudwatch
- Dashboards → truelabel-production

### 2. Alertas Configurados

- CPU/Memory alta (ECS, RDS, Redis)
- Erros 5xx no ALB
- Hosts não saudáveis
- Espaço em disco baixo

### 3. Logs

```bash
# API logs
aws logs tail /ecs/truelabel-production --follow

# VPC Flow logs
aws logs tail /aws/vpc/flowlogs/truelabel-production --follow
```

## 🔧 Troubleshooting

### Problemas Comuns

#### 1. Deploy falha no ECS

```bash
# Verificar eventos do serviço
aws ecs describe-services \
  --cluster truelabel-cluster-production \
  --services truelabel-api-production \
  --query 'services[0].events[0:10]'

# Verificar logs da task
aws logs get-log-events \
  --log-group-name /ecs/truelabel-production \
  --log-stream-name <log-stream-name>
```

#### 2. Erro de conexão com RDS

```bash
# Conectar via bastion
ssh ec2-user@<bastion-ip>
psql -h <rds-endpoint> -U truelabel_admin -d truelabel
```

#### 3. Frontend não carrega

```bash
# Verificar S3
aws s3 ls s3://truelabel-static-production/

# Verificar CloudFront
aws cloudfront get-distribution --id <distribution-id>
```

### Comandos Úteis

```bash
# Reiniciar serviço ECS
aws ecs update-service \
  --cluster truelabel-cluster-production \
  --service truelabel-api-production \
  --force-new-deployment

# Escalar serviço
aws ecs update-service \
  --cluster truelabel-cluster-production \
  --service truelabel-api-production \
  --desired-count 5

# Ver métricas
aws cloudwatch get-metric-statistics \
  --namespace AWS/ECS \
  --metric-name CPUUtilization \
  --dimensions Name=ServiceName,Value=truelabel-api-production \
  --start-time 2024-01-01T00:00:00Z \
  --end-time 2024-01-01T23:59:59Z \
  --period 300 \
  --statistics Average
```

## 🔄 Rollback

### Rollback Rápido

```bash
# 1. Identificar versão anterior
aws ecr describe-images \
  --repository-name truelabel-api \
  --query 'imageDetails[*].[imageTags[0],imagePushedAt]' \
  --output table

# 2. Atualizar task definition
aws ecs register-task-definition \
  --family truelabel-api-production \
  --container-definitions file://previous-task-def.json

# 3. Atualizar serviço
aws ecs update-service \
  --cluster truelabel-cluster-production \
  --service truelabel-api-production \
  --task-definition truelabel-api-production:PREVIOUS_VERSION
```

### Rollback Completo

```bash
# Restaurar infraestrutura de backup
cd infrastructure/terraform
terraform apply -target=aws_db_instance.main -replace=aws_db_instance.main
```

## 🛠️ Manutenção

### Backup Manual

```bash
# Backup do banco
aws rds create-db-snapshot \
  --db-instance-identifier truelabel-db-production \
  --db-snapshot-identifier manual-backup-$(date +%Y%m%d%H%M%S)

# Backup de arquivos
aws s3 sync s3://truelabel-uploads-production/ ./backup/uploads/
```

### Atualizações de Segurança

```bash
# Atualizar AMI do bastion
terraform apply -target=aws_instance.bastion

# Rotacionar secrets
aws secretsmanager rotate-secret \
  --secret-id truelabel-jwt-secret-production
```

### Monitoramento de Custos

```bash
# Ver custos atuais
aws ce get-cost-and-usage \
  --time-period Start=2024-01-01,End=2024-01-31 \
  --granularity MONTHLY \
  --metrics "UnblendedCost" \
  --group-by Type=DIMENSION,Key=SERVICE
```

## 📞 Suporte

### Contatos de Emergência

- **DevOps Lead**: devops@truelabel.com.br
- **On-call**: +55 11 9XXXX-XXXX
- **Slack**: #truelabel-incidents

### Documentação Adicional

- [Arquitetura do Sistema](../TRUST-LABEL-PROJECT-ANALYSIS.md)
- [Runbook de Incidentes](./INCIDENT-RUNBOOK.md)
- [Plano de DR](./DISASTER-RECOVERY.md)

## ✅ Checklist Final

- [ ] Infraestrutura provisionada com sucesso
- [ ] Aplicação deployada e funcionando
- [ ] DNS configurado corretamente
- [ ] SSL/TLS funcionando
- [ ] Monitoramento ativo
- [ ] Alertas configurados
- [ ] Backup automático funcionando
- [ ] Documentação atualizada
- [ ] Equipe treinada

---

**Última atualização**: Janeiro 2024
**Versão**: 1.0.0