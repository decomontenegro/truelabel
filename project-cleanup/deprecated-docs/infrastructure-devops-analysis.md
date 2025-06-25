# True Label - Análise Completa de Infraestrutura e DevOps

## 1. Análise de Infraestrutura Atual

### 1.1 Stack Atual
- **Frontend**: Vercel (dist-plum-eight.vercel.app)
- **Backend**: Railway (truelabel-production.up.railway.app)
- **Database**: SQLite (dev) / PostgreSQL (prod)
- **File Storage**: Sistema de arquivos local (Multer)
- **Real-time**: Socket.io
- **CI/CD**: GitHub Actions (parcial)

### 1.2 Limitações Identificadas

#### Frontend (Vercel)
- **Limitações de Functions**: 10 segundos de timeout
- **Cold starts**: Impacto na performance inicial
- **Bandwidth**: Limites no plano free/pro
- **Regional**: Sem controle fino sobre edge locations
- **Custos**: Pode escalar rapidamente com tráfego

#### Backend (Railway)
- **Single Region**: Sem suporte multi-região nativo
- **Escalabilidade**: Limitada a vertical scaling
- **Persistência**: Volumes com limitações de IOPS
- **Custos**: $5/GB RAM + compute time
- **SLA**: 99.5% apenas (inadequado para produção crítica)

#### Arquitetura Geral
- **File Storage**: Local filesystem não escalável
- **Database**: Single point of failure
- **Caching**: Ausência de camada de cache
- **CDN**: Limitado ao Vercel Edge Network
- **Monitoring**: Básico ou inexistente
- **Disaster Recovery**: Sem estratégia clara

### 1.3 Análise de Custos Atuais vs Projetados

#### Custos Atuais (Estimado)
- Vercel Pro: ~$20/mês
- Railway: ~$20-50/mês
- Total: ~$40-70/mês

#### Projeção para Escala (1M MAU)
- Vercel Enterprise: ~$2,000+/mês
- Railway com scaling: ~$500-1,000/mês
- Total: ~$2,500-3,000/mês

#### Solução AWS Proposta (1M MAU)
- Compute (ECS): ~$300/mês
- RDS Multi-AZ: ~$200/mês
- S3 + CloudFront: ~$150/mês
- Load Balancer: ~$25/mês
- Outros: ~$125/mês
- Total: ~$800/mês (70% economia)

### 1.4 Requisitos de Compliance

#### LGPD (Lei Geral de Proteção de Dados)
- Dados devem residir no Brasil ou país adequado
- Direito ao esquecimento
- Portabilidade de dados
- Consentimento explícito
- Logs de auditoria

#### Segurança Alimentar
- Rastreabilidade completa
- Imutabilidade de registros validados
- Cadeia de custódia digital
- Certificações ISO 22000 compatíveis

## 2. Arquitetura de Infraestrutura Target

### 2.1 Design Cloud-Native AWS

```yaml
# infrastructure/aws-architecture.yaml
Infrastructure:
  Regions:
    Primary: sa-east-1 (São Paulo)
    Secondary: us-east-1 (Virginia)
    
  Compute:
    Frontend:
      Service: CloudFront + S3
      Origins:
        - S3 Static Hosting (sa-east-1)
        - S3 Replica (us-east-1)
      Features:
        - Edge Locations globally
        - Origin Shield enabled
        - Compression enabled
        - HTTP/3 support
        
    Backend:
      Service: ECS Fargate
      Configuration:
        - Service Mesh: AWS App Mesh
        - Auto-scaling: Target 70% CPU
        - Health checks: ALB + Route 53
        - Containers:
          - API: 2-10 tasks
          - Workers: 1-5 tasks
          - WebSocket: 2-5 tasks
          
  Database:
    Primary:
      Service: RDS PostgreSQL
      Configuration:
        - Multi-AZ deployment
        - Read replicas: 2
        - Automated backups: 35 days
        - Point-in-time recovery
        - Performance Insights enabled
        
    Cache:
      Service: ElastiCache Redis
      Configuration:
        - Cluster mode enabled
        - Multi-AZ with failover
        - 3 shards, 2 replicas each
        
  Storage:
    Documents:
      Service: S3
      Buckets:
        - truelabel-reports (versioning enabled)
        - truelabel-uploads (lifecycle policies)
        - truelabel-backups (glacier transition)
        
    CDN Assets:
      Service: CloudFront
      Origins:
        - S3 for static assets
        - ALB for dynamic content
        
  Networking:
    VPC:
      CIDR: 10.0.0.0/16
      Subnets:
        - Public: 2 AZs (ALB, NAT)
        - Private: 2 AZs (ECS, RDS)
        - Database: 2 AZs (RDS only)
        
    Security:
      - WAF: Attached to CloudFront
      - Security Groups: Least privilege
      - NACLs: Additional layer
      - VPC Flow Logs: Enabled
      
  Messaging:
    Queues:
      Service: SQS
      Types:
        - validation-queue (FIFO)
        - notification-queue (Standard)
        - report-processing (FIFO)
        
    Events:
      Service: EventBridge
      Buses:
        - default (system events)
        - custom (application events)
```

### 2.2 Kubernetes Alternative (EKS)

```yaml
# infrastructure/eks-architecture.yaml
EKS_Cluster:
  Version: "1.28"
  Regions:
    Primary: sa-east-1
    DR: us-east-1
    
  Node_Groups:
    System:
      Instance: t3.medium
      Min: 2
      Max: 4
      Desired: 2
      
    Application:
      Instance: t3.large
      Min: 2
      Max: 10
      Desired: 3
      Spot: true
      
  Addons:
    - aws-ebs-csi-driver
    - aws-efs-csi-driver
    - vpc-cni
    - kube-proxy
    - coredns
    
  Workloads:
    Frontend:
      Replicas: 2-10
      Resources:
        requests:
          cpu: 100m
          memory: 128Mi
        limits:
          cpu: 500m
          memory: 512Mi
          
    Backend:
      Replicas: 3-15
      Resources:
        requests:
          cpu: 250m
          memory: 512Mi
        limits:
          cpu: 1000m
          memory: 2Gi
          
    Workers:
      Replicas: 1-5
      Resources:
        requests:
          cpu: 500m
          memory: 1Gi
        limits:
          cpu: 2000m
          memory: 4Gi
```

### 2.3 Multi-Region Strategy

```yaml
# infrastructure/multi-region.yaml
Global_Architecture:
  DNS:
    Service: Route 53
    Routing:
      - Geolocation: 
          SA: sa-east-1
          NA: us-east-1
          EU: eu-west-1
      - Health checks: 30s interval
      - Failover: automatic
      
  Data_Replication:
    Database:
      - Aurora Global Database
      - RPO: 1 second
      - RTO: < 1 minute
      
    Storage:
      - S3 Cross-Region Replication
      - EventBridge for changes
      
  Traffic_Distribution:
    CloudFront:
      - Origin Groups with failover
      - Custom error pages
      - Geo-restriction if needed
```

### 2.4 Disaster Recovery Strategy

```yaml
# infrastructure/disaster-recovery.yaml
DR_Strategy:
  Approach: Pilot Light
  
  RPO: 15 minutes
  RTO: 30 minutes
  
  Components:
    Data:
      - Continuous replication to DR region
      - Automated snapshots every 15 min
      - Cross-region backup copies
      
    Infrastructure:
      - IaC in both regions
      - Minimal resources in DR
      - Automated scale-up on failover
      
    Procedures:
      - Automated health checks
      - One-click failover scripts
      - Regular DR drills (monthly)
      
  Runbooks:
    - Failover procedure
    - Rollback procedure
    - Communication plan
    - Validation checklist
```

## 3. Pipeline CI/CD Completo

### 3.1 GitOps Workflow

```yaml
# .github/workflows/gitops-pipeline.yaml
name: GitOps Pipeline

on:
  push:
    branches: [main, develop, release/*]
  pull_request:
    branches: [main, develop]

env:
  AWS_REGION: sa-east-1
  ECR_REPOSITORY: truelabel
  EKS_CLUSTER: truelabel-prod

jobs:
  # Code Quality & Security
  quality-security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
          
      - name: SonarQube Scan
        uses: sonarsource/sonarqube-scan-action@master
        env:
          SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
          
      - name: Trivy Security Scan
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          severity: 'CRITICAL,HIGH'
          
      - name: OWASP Dependency Check
        uses: dependency-check/Dependency-Check_Action@main
        with:
          project: 'truelabel'
          format: 'ALL'
          
      - name: License Check
        run: |
          npx license-checker --production --failOn 'GPL'
          
  # Build & Test
  build-test:
    needs: quality-security
    runs-on: ubuntu-latest
    strategy:
      matrix:
        service: [frontend, backend, workers]
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3
        
      - name: Build Image
        uses: docker/build-push-action@v5
        with:
          context: ./${{ matrix.service }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
          tags: ${{ matrix.service }}:${{ github.sha }}
          
      - name: Run Tests
        run: |
          docker run --rm \
            -e CI=true \
            ${{ matrix.service }}:${{ github.sha }} \
            npm test
            
      - name: Integration Tests
        if: matrix.service == 'backend'
        run: |
          docker-compose -f docker-compose.test.yml up --abort-on-container-exit
          
  # Security Scanning
  security-scan:
    needs: build-test
    runs-on: ubuntu-latest
    steps:
      - name: Container Scan
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: ${{ env.ECR_REPOSITORY }}:${{ github.sha }}
          
      - name: Prisma Cloud Scan
        uses: paloaltonetworks/prisma-cloud-scan@v1
        with:
          prisma_cloud_api: ${{ secrets.PRISMA_CLOUD_API }}
          
      - name: SAST Analysis
        uses: checkmarx/ast-github-action@main
        with:
          cx_api_key: ${{ secrets.CX_API_KEY }}
          
  # Performance Tests
  performance:
    needs: build-test
    runs-on: ubuntu-latest
    steps:
      - name: K6 Load Tests
        uses: grafana/k6-action@v0.3.0
        with:
          filename: tests/performance/load-test.js
          
      - name: Lighthouse CI
        uses: treosh/lighthouse-ci-action@v10
        with:
          urls: |
            http://localhost:3000
            http://localhost:3000/products
            http://localhost:3000/validation
            
  # Deploy to Staging
  deploy-staging:
    needs: [security-scan, performance]
    if: github.ref == 'refs/heads/develop'
    runs-on: ubuntu-latest
    environment: staging
    
    steps:
      - name: Configure AWS
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.AWS_ROLE_ARN }}
          aws-region: ${{ env.AWS_REGION }}
          
      - name: Login to ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v2
        
      - name: Push to ECR
        run: |
          docker tag ${{ matrix.service }}:${{ github.sha }} \
            ${{ steps.login-ecr.outputs.registry }}/${{ env.ECR_REPOSITORY }}:staging-${{ github.sha }}
          docker push ${{ steps.login-ecr.outputs.registry }}/${{ env.ECR_REPOSITORY }}:staging-${{ github.sha }}
          
      - name: Update Kubernetes Manifests
        run: |
          cd k8s/overlays/staging
          kustomize edit set image app=${{ steps.login-ecr.outputs.registry }}/${{ env.ECR_REPOSITORY }}:staging-${{ github.sha }}
          
      - name: Deploy with ArgoCD
        run: |
          argocd app sync truelabel-staging --force
          argocd app wait truelabel-staging --health
          
  # Smoke Tests
  smoke-tests:
    needs: deploy-staging
    runs-on: ubuntu-latest
    steps:
      - name: API Health Check
        run: |
          curl -f https://staging-api.truelabel.com/health || exit 1
          
      - name: E2E Smoke Tests
        run: |
          npm run test:e2e:smoke -- --env=staging
          
  # Progressive Rollout
  progressive-rollout:
    needs: smoke-tests
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment: production
    
    steps:
      - name: Canary Deployment (10%)
        run: |
          kubectl set image deployment/api api=${{ env.ECR_REPOSITORY }}:prod-${{ github.sha }} \
            -n production --record
          kubectl patch service api -n production \
            -p '{"spec":{"selector":{"version":"canary"}}}'
            
      - name: Monitor Canary
        run: |
          # Check metrics for 10 minutes
          ./scripts/monitor-canary.sh
          
      - name: Progressive Rollout (25%, 50%, 100%)
        run: |
          for percent in 25 50 100; do
            kubectl patch deployment api -n production \
              -p '{"spec":{"strategy":{"rollingUpdate":{"maxSurge":"'$percent'%"}}}}'
            sleep 300  # 5 minutes between increases
            ./scripts/check-health.sh || exit 1
          done
          
  # Post-Deployment
  post-deployment:
    needs: progressive-rollout
    runs-on: ubuntu-latest
    steps:
      - name: Update Documentation
        run: |
          ./scripts/generate-release-notes.sh > RELEASE_NOTES.md
          
      - name: Notify Teams
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          text: |
            Deployment Complete!
            Version: ${{ github.sha }}
            Environment: Production
            
      - name: Create Release
        uses: actions/create-release@v1
        with:
          tag_name: v${{ github.run_number }}
          release_name: Release ${{ github.run_number }}
          body_path: RELEASE_NOTES.md
```

### 3.2 Infrastructure as Code

```yaml
# infrastructure/terraform/main.tf
terraform {
  required_version = ">= 1.5.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.23"
    }
  }
  
  backend "s3" {
    bucket         = "truelabel-terraform-state"
    key            = "infrastructure/terraform.tfstate"
    region         = "sa-east-1"
    encrypt        = true
    dynamodb_table = "terraform-locks"
  }
}

module "networking" {
  source = "./modules/networking"
  
  vpc_cidr = "10.0.0.0/16"
  availability_zones = ["sa-east-1a", "sa-east-1b", "sa-east-1c"]
  
  public_subnets  = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  private_subnets = ["10.0.11.0/24", "10.0.12.0/24", "10.0.13.0/24"]
  database_subnets = ["10.0.21.0/24", "10.0.22.0/24", "10.0.23.0/24"]
  
  enable_nat_gateway = true
  enable_vpn_gateway = true
  enable_flow_logs   = true
  
  tags = local.common_tags
}

module "security" {
  source = "./modules/security"
  
  vpc_id = module.networking.vpc_id
  
  # WAF Rules
  waf_rules = {
    rate_limiting = {
      limit = 2000
      window = 300
    }
    geo_blocking = {
      allowed_countries = ["BR", "US", "GB"]
    }
    ip_reputation = {
      enabled = true
    }
  }
  
  # Security Groups
  security_groups = {
    alb = {
      ingress_rules = ["http-80-tcp", "https-443-tcp"]
      egress_rules  = ["all-all"]
    }
    ecs = {
      ingress_rules = ["all-tcp"]
      ingress_with_source_security_group_id = [
        {
          from_port   = 0
          to_port     = 65535
          protocol    = "tcp"
          source_security_group_id = module.security.security_groups["alb"].id
        }
      ]
    }
    rds = {
      ingress_rules = ["postgresql-tcp"]
      ingress_with_source_security_group_id = [
        {
          from_port   = 5432
          to_port     = 5432
          protocol    = "tcp"
          source_security_group_id = module.security.security_groups["ecs"].id
        }
      ]
    }
  }
  
  tags = local.common_tags
}

module "compute" {
  source = "./modules/compute"
  
  cluster_name = "truelabel-prod"
  
  services = {
    api = {
      cpu    = 512
      memory = 1024
      count  = 3
      autoscaling = {
        min = 2
        max = 10
        target_cpu = 70
        target_memory = 80
      }
    }
    worker = {
      cpu    = 1024
      memory = 2048
      count  = 2
      autoscaling = {
        min = 1
        max = 5
        target_cpu = 80
      }
    }
    websocket = {
      cpu    = 256
      memory = 512
      count  = 2
      autoscaling = {
        min = 2
        max = 5
      }
    }
  }
  
  load_balancer = {
    type = "application"
    certificate_arn = aws_acm_certificate.main.arn
    enable_http2 = true
    enable_deletion_protection = true
  }
  
  tags = local.common_tags
}

module "database" {
  source = "./modules/database"
  
  # RDS Configuration
  rds = {
    engine         = "postgres"
    engine_version = "15.4"
    instance_class = "db.r6g.large"
    
    allocated_storage     = 100
    max_allocated_storage = 1000
    storage_encrypted     = true
    
    multi_az               = true
    backup_retention_period = 35
    backup_window          = "03:00-04:00"
    maintenance_window     = "sun:04:00-sun:05:00"
    
    enabled_cloudwatch_logs_exports = ["postgresql"]
    performance_insights_enabled    = true
    
    read_replicas = 2
  }
  
  # ElastiCache Configuration
  elasticache = {
    engine         = "redis"
    engine_version = "7.0"
    node_type      = "cache.r6g.large"
    
    num_cache_clusters = 3
    automatic_failover_enabled = true
    
    at_rest_encryption_enabled = true
    transit_encryption_enabled = true
    
    snapshot_retention_limit = 7
    snapshot_window         = "03:00-05:00"
  }
  
  tags = local.common_tags
}

module "storage" {
  source = "./modules/storage"
  
  buckets = {
    reports = {
      versioning = true
      lifecycle_rules = [
        {
          id      = "archive-old-reports"
          enabled = true
          transition = [
            {
              days          = 90
              storage_class = "STANDARD_IA"
            },
            {
              days          = 365
              storage_class = "GLACIER"
            }
          ]
        }
      ]
      replication = {
        role   = aws_iam_role.replication.arn
        rules = [
          {
            id       = "replicate-to-us-east-1"
            status   = "Enabled"
            priority = 1
            destination = {
              bucket = "arn:aws:s3:::truelabel-reports-replica"
              storage_class = "STANDARD_IA"
            }
          }
        ]
      }
    }
    uploads = {
      versioning = false
      lifecycle_rules = [
        {
          id      = "delete-temp-uploads"
          enabled = true
          expiration = {
            days = 30
          }
        }
      ]
      cors_rules = [
        {
          allowed_methods = ["GET", "PUT", "POST"]
          allowed_origins = ["https://truelabel.com"]
          allowed_headers = ["*"]
          max_age_seconds = 3000
        }
      ]
    }
  }
  
  cloudfront = {
    price_class = "PriceClass_200"
    
    origins = {
      s3 = {
        domain_name = module.storage.buckets["uploads"].bucket_regional_domain_name
        origin_id   = "S3-uploads"
      }
      alb = {
        domain_name = module.compute.load_balancer.dns_name
        origin_id   = "ALB-api"
        custom_origin_config = {
          http_port              = 80
          https_port             = 443
          origin_protocol_policy = "https-only"
        }
      }
    }
    
    default_cache_behavior = {
      allowed_methods  = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
      cached_methods   = ["GET", "HEAD"]
      target_origin_id = "ALB-api"
      
      forwarded_values = {
        query_string = true
        headers      = ["Origin", "Access-Control-Request-Method", "Access-Control-Request-Headers"]
        cookies = {
          forward = "all"
        }
      }
      
      viewer_protocol_policy = "redirect-to-https"
      min_ttl                = 0
      default_ttl            = 0
      max_ttl                = 31536000
    }
    
    ordered_cache_behaviors = [
      {
        path_pattern     = "/static/*"
        target_origin_id = "S3-uploads"
        
        forwarded_values = {
          query_string = false
          cookies = {
            forward = "none"
          }
        }
        
        viewer_protocol_policy = "redirect-to-https"
        min_ttl                = 86400
        default_ttl            = 604800
        max_ttl                = 31536000
        compress               = true
      }
    ]
  }
  
  tags = local.common_tags
}

module "monitoring" {
  source = "./modules/monitoring"
  
  cloudwatch = {
    log_retention_days = 30
    
    alarms = {
      high_cpu = {
        metric_name         = "CPUUtilization"
        threshold           = 80
        evaluation_periods  = 2
        period              = 300
        statistic           = "Average"
        comparison_operator = "GreaterThanThreshold"
      }
      high_memory = {
        metric_name         = "MemoryUtilization"
        threshold           = 85
        evaluation_periods  = 2
        period              = 300
        statistic           = "Average"
        comparison_operator = "GreaterThanThreshold"
      }
      api_errors = {
        metric_name         = "4XXError"
        threshold           = 10
        evaluation_periods  = 1
        period              = 60
        statistic           = "Sum"
        comparison_operator = "GreaterThanThreshold"
      }
    }
    
    dashboards = {
      main = {
        name = "TrueLabel-Main"
        widgets = [
          {
            type = "metric"
            properties = {
              metrics = [
                ["AWS/ECS", "CPUUtilization", "ServiceName", "api"],
                ["...", "MemoryUtilization", ".", "."]
              ]
              period = 300
              stat   = "Average"
              region = "sa-east-1"
              title  = "ECS Service Metrics"
            }
          }
        ]
      }
    }
  }
  
  xray = {
    enabled = true
    sampling_rate = 0.1
  }
  
  tags = local.common_tags
}

# Outputs
output "api_endpoint" {
  value = "https://${aws_route53_record.api.name}"
}

output "cloudfront_distribution" {
  value = module.storage.cloudfront_distribution_domain_name
}

output "database_endpoint" {
  value     = module.database.rds_endpoint
  sensitive = true
}
```

## 4. Monitoring e Observability

### 4.1 Stack de Observabilidade

```yaml
# monitoring/observability-stack.yaml
version: '3.8'

services:
  # Metrics Collection
  prometheus:
    image: prom/prometheus:latest
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--storage.tsdb.retention.time=30d'
      - '--web.enable-lifecycle'
    ports:
      - "9090:9090"
      
  # Metrics Visualization
  grafana:
    image: grafana/grafana:latest
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_PASSWORD}
      - GF_INSTALL_PLUGINS=grafana-clock-panel,grafana-simple-json-datasource
    volumes:
      - grafana_data:/var/lib/grafana
      - ./grafana/provisioning:/etc/grafana/provisioning
      - ./grafana/dashboards:/var/lib/grafana/dashboards
    ports:
      - "3000:3000"
      
  # Log Aggregation
  loki:
    image: grafana/loki:latest
    volumes:
      - ./loki-config.yaml:/etc/loki/local-config.yaml
      - loki_data:/loki
    command: -config.file=/etc/loki/local-config.yaml
    ports:
      - "3100:3100"
      
  # Log Shipper
  promtail:
    image: grafana/promtail:latest
    volumes:
      - /var/log:/var/log:ro
      - /var/lib/docker/containers:/var/lib/docker/containers:ro
      - ./promtail-config.yaml:/etc/promtail/config.yml
    command: -config.file=/etc/promtail/config.yml
    
  # Tracing
  jaeger:
    image: jaegertracing/all-in-one:latest
    environment:
      - COLLECTOR_ZIPKIN_HOST_PORT=:9411
      - COLLECTOR_OTLP_ENABLED=true
    ports:
      - "5775:5775/udp"
      - "6831:6831/udp"
      - "6832:6832/udp"
      - "5778:5778"
      - "16686:16686"
      - "14268:14268"
      - "14250:14250"
      - "9411:9411"
      
  # Alert Manager
  alertmanager:
    image: prom/alertmanager:latest
    volumes:
      - ./alertmanager.yml:/etc/alertmanager/alertmanager.yml
      - alertmanager_data:/alertmanager
    command:
      - '--config.file=/etc/alertmanager/alertmanager.yml'
      - '--storage.path=/alertmanager'
    ports:
      - "9093:9093"
      
  # Node Exporter
  node-exporter:
    image: prom/node-exporter:latest
    container_name: node-exporter
    restart: unless-stopped
    volumes:
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
      - /:/rootfs:ro
    command:
      - '--path.procfs=/host/proc'
      - '--path.rootfs=/rootfs'
      - '--path.sysfs=/host/sys'
      - '--collector.filesystem.mount-points-exclude=^/(sys|proc|dev|host|etc)($$|/)'
    ports:
      - "9100:9100"

volumes:
  prometheus_data:
  grafana_data:
  loki_data:
  alertmanager_data:
```

### 4.2 Configuração de Alertas

```yaml
# monitoring/alerts/rules.yml
groups:
  - name: API Alerts
    interval: 30s
    rules:
      # High Error Rate
      - alert: HighErrorRate
        expr: |
          sum(rate(http_requests_total{status=~"5.."}[5m])) 
          / 
          sum(rate(http_requests_total[5m])) > 0.05
        for: 5m
        labels:
          severity: critical
          team: backend
        annotations:
          summary: "High error rate detected"
          description: "Error rate is above 5% (current: {{ $value | humanizePercentage }})"
          
      # High Response Time
      - alert: HighResponseTime
        expr: |
          histogram_quantile(0.95, 
            sum(rate(http_request_duration_seconds_bucket[5m])) by (le)
          ) > 1
        for: 5m
        labels:
          severity: warning
          team: backend
        annotations:
          summary: "High API response time"
          description: "95th percentile response time is above 1s"
          
      # Database Connection Issues
      - alert: DatabaseConnectionFailure
        expr: |
          mysql_up == 0 or pg_up == 0
        for: 1m
        labels:
          severity: critical
          team: backend
        annotations:
          summary: "Database connection failure"
          description: "Cannot connect to database"
          
  - name: Infrastructure Alerts
    interval: 30s
    rules:
      # High CPU Usage
      - alert: HighCPUUsage
        expr: |
          100 - (avg by (instance) (irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 80
        for: 10m
        labels:
          severity: warning
          team: infrastructure
        annotations:
          summary: "High CPU usage detected"
          description: "CPU usage is above 80% on {{ $labels.instance }}"
          
      # High Memory Usage
      - alert: HighMemoryUsage
        expr: |
          (1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100 > 85
        for: 10m
        labels:
          severity: warning
          team: infrastructure
        annotations:
          summary: "High memory usage detected"
          description: "Memory usage is above 85% on {{ $labels.instance }}"
          
      # Disk Space Low
      - alert: DiskSpaceLow
        expr: |
          (node_filesystem_avail_bytes{fstype!~"tmpfs|fuse.lxcfs|squashfs|vfat"} 
          / node_filesystem_size_bytes{fstype!~"tmpfs|fuse.lxcfs|squashfs|vfat"}) * 100 < 15
        for: 5m
        labels:
          severity: warning
          team: infrastructure
        annotations:
          summary: "Low disk space"
          description: "Disk space is below 15% on {{ $labels.instance }}"
          
  - name: Business Alerts
    interval: 1m
    rules:
      # QR Code Generation Failure
      - alert: QRCodeGenerationFailure
        expr: |
          sum(rate(qr_generation_failures_total[5m])) > 0
        for: 5m
        labels:
          severity: critical
          team: backend
        annotations:
          summary: "QR code generation failures"
          description: "QR code generation is failing"
          
      # Validation Queue Backlog
      - alert: ValidationQueueBacklog
        expr: |
          validation_queue_size > 100
        for: 10m
        labels:
          severity: warning
          team: backend
        annotations:
          summary: "Large validation queue backlog"
          description: "Validation queue has {{ $value }} items pending"
          
      # Report Upload Failures
      - alert: ReportUploadFailures
        expr: |
          sum(rate(report_upload_failures_total[5m])) > 5
        for: 5m
        labels:
          severity: critical
          team: backend
        annotations:
          summary: "Report upload failures"
          description: "Multiple report upload failures detected"
```

### 4.3 Dashboards

```json
// monitoring/grafana/dashboards/main-dashboard.json
{
  "dashboard": {
    "title": "TrueLabel Main Dashboard",
    "panels": [
      {
        "title": "API Request Rate",
        "targets": [
          {
            "expr": "sum(rate(http_requests_total[5m])) by (method, status)"
          }
        ],
        "type": "graph"
      },
      {
        "title": "Response Time (p50, p95, p99)",
        "targets": [
          {
            "expr": "histogram_quantile(0.5, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))",
            "legendFormat": "p50"
          },
          {
            "expr": "histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))",
            "legendFormat": "p95"
          },
          {
            "expr": "histogram_quantile(0.99, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))",
            "legendFormat": "p99"
          }
        ],
        "type": "graph"
      },
      {
        "title": "Error Rate",
        "targets": [
          {
            "expr": "sum(rate(http_requests_total{status=~\"5..\"}[5m])) / sum(rate(http_requests_total[5m]))"
          }
        ],
        "type": "stat",
        "format": "percentunit"
      },
      {
        "title": "Active Users",
        "targets": [
          {
            "expr": "active_users_total"
          }
        ],
        "type": "stat"
      },
      {
        "title": "QR Codes Generated",
        "targets": [
          {
            "expr": "sum(rate(qr_codes_generated_total[1h]))"
          }
        ],
        "type": "graph"
      },
      {
        "title": "Validation Queue Size",
        "targets": [
          {
            "expr": "validation_queue_size"
          }
        ],
        "type": "graph"
      },
      {
        "title": "Database Connections",
        "targets": [
          {
            "expr": "mysql_global_status_threads_connected"
          }
        ],
        "type": "graph"
      },
      {
        "title": "Cache Hit Rate",
        "targets": [
          {
            "expr": "redis_hits_total / (redis_hits_total + redis_misses_total)"
          }
        ],
        "type": "stat",
        "format": "percentunit"
      }
    ]
  }
}
```

### 4.4 Cost Monitoring

```yaml
# monitoring/cost-optimization.yaml
CostMonitoring:
  AWS_Cost_Explorer:
    Budgets:
      - name: Monthly-Total
        amount: 1000
        alerts:
          - threshold: 80
            recipients: [finance@truelabel.com]
          - threshold: 100
            recipients: [finance@truelabel.com, cto@truelabel.com]
            
    Tags:
      - Environment: [production, staging, development]
      - Service: [api, frontend, database, storage]
      - Team: [backend, frontend, infrastructure]
      
  Optimization_Rules:
    Compute:
      - Use Spot instances for non-critical workloads
      - Implement auto-scaling based on actual usage
      - Right-size instances quarterly
      
    Storage:
      - Lifecycle policies for S3
      - Intelligent tiering enabled
      - Delete unattached EBS volumes
      
    Database:
      - Use reserved instances for predictable workloads
      - Enable auto-pause for development databases
      - Optimize queries to reduce compute
      
    Network:
      - Use CloudFront for static assets
      - Minimize cross-AZ traffic
      - Implement request coalescing
      
  Reports:
    - Daily cost breakdown by service
    - Weekly trend analysis
    - Monthly optimization recommendations
    - Quarterly executive summary
```

## 5. Migration Strategy

### 5.1 Phase 1: Preparation (Week 1-2)

```yaml
Phase1_Preparation:
  Infrastructure_Setup:
    - Create AWS accounts (prod, staging, dev)
    - Setup IAM roles and policies
    - Configure networking (VPC, subnets, security groups)
    - Setup Terraform state backend
    - Create ECR repositories
    
  Code_Preparation:
    - Containerize all applications
    - Add health check endpoints
    - Implement graceful shutdown
    - Add distributed tracing
    - Update configuration management
    
  Data_Analysis:
    - Catalog all data sources
    - Identify migration dependencies
    - Plan data transformation if needed
    - Estimate migration time
    - Create rollback procedures
```

### 5.2 Phase 2: Parallel Run (Week 3-4)

```yaml
Phase2_ParallelRun:
  Deploy_to_AWS:
    - Deploy infrastructure with Terraform
    - Setup database replication
    - Deploy applications to ECS/EKS
    - Configure load balancers
    - Setup monitoring
    
  Data_Sync:
    - Enable database replication
    - Sync file storage to S3
    - Verify data integrity
    - Monitor replication lag
    
  Testing:
    - Run integration tests
    - Perform load testing
    - Validate all endpoints
    - Test failover scenarios
```

### 5.3 Phase 3: Traffic Migration (Week 5)

```yaml
Phase3_TrafficMigration:
  DNS_Preparation:
    - Lower TTL to 60 seconds
    - Create weighted routing
    - Setup health checks
    
  Progressive_Migration:
    Day1:
      - Route 10% traffic to AWS
      - Monitor all metrics
      - Check error rates
      
    Day2:
      - Increase to 25%
      - Run comparison tests
      
    Day3:
      - Increase to 50%
      - Full feature validation
      
    Day4:
      - Increase to 90%
      - Keep 10% on old infrastructure
      
    Day5:
      - Route 100% to AWS
      - Old infrastructure on standby
```

### 5.4 Phase 4: Cutover (Week 6)

```yaml
Phase4_Cutover:
  Final_Steps:
    - Update all DNS records
    - Disable old infrastructure
    - Archive old data
    - Update documentation
    - Team training
    
  Validation:
    - Full system test
    - Performance benchmarks
    - Security scan
    - Compliance check
    
  Communication:
    - Notify all stakeholders
    - Update status page
    - Send customer communication
```

### 5.5 Rollback Plan

```yaml
Rollback_Plan:
  Triggers:
    - Error rate > 5%
    - Response time > 2s (p95)
    - Data inconsistency detected
    - Critical feature failure
    
  Procedure:
    Immediate (< 5 min):
      - Revert DNS changes
      - Stop data replication
      - Enable old infrastructure
      
    Short-term (< 1 hour):
      - Restore from backups if needed
      - Sync any new data back
      - Investigate root cause
      
    Communication:
      - Alert incident team
      - Update status page
      - Notify stakeholders
      - Post-mortem planning
```

## 6. Implementação Prática

### 6.1 Scripts de Automação

```bash
#!/bin/bash
# scripts/deploy.sh

set -euo pipefail

ENVIRONMENT=${1:-staging}
VERSION=${2:-latest}

echo "🚀 Deploying TrueLabel to ${ENVIRONMENT}"

# Validate environment
if [[ ! "${ENVIRONMENT}" =~ ^(staging|production)$ ]]; then
    echo "❌ Invalid environment. Use 'staging' or 'production'"
    exit 1
fi

# Build and push images
echo "📦 Building Docker images..."
docker-compose build

echo "🔐 Logging into ECR..."
aws ecr get-login-password --region sa-east-1 | \
    docker login --username AWS --password-stdin ${ECR_REGISTRY}

echo "⬆️ Pushing images..."
docker-compose push

# Deploy with Terraform
echo "🏗️ Applying infrastructure changes..."
cd infrastructure/terraform
terraform init
terraform workspace select ${ENVIRONMENT}
terraform apply -auto-approve -var="app_version=${VERSION}"

# Update ECS services
echo "🔄 Updating ECS services..."
aws ecs update-service \
    --cluster truelabel-${ENVIRONMENT} \
    --service api \
    --force-new-deployment

# Wait for deployment
echo "⏳ Waiting for deployment to complete..."
aws ecs wait services-stable \
    --cluster truelabel-${ENVIRONMENT} \
    --services api worker websocket

# Run smoke tests
echo "🧪 Running smoke tests..."
./scripts/smoke-tests.sh ${ENVIRONMENT}

echo "✅ Deployment completed successfully!"
```

### 6.2 Monitoring Setup

```bash
#!/bin/bash
# scripts/setup-monitoring.sh

set -euo pipefail

echo "📊 Setting up monitoring stack..."

# Deploy Prometheus Operator
kubectl apply -f https://github.com/prometheus-operator/prometheus-operator/releases/download/v0.68.0/bundle.yaml

# Deploy Grafana
helm repo add grafana https://grafana.github.io/helm-charts
helm install grafana grafana/grafana \
    --namespace monitoring \
    --create-namespace \
    --values monitoring/grafana-values.yaml

# Deploy Loki
helm install loki grafana/loki-stack \
    --namespace monitoring \
    --values monitoring/loki-values.yaml

# Deploy Jaeger
kubectl apply -f monitoring/jaeger.yaml

# Configure dashboards
kubectl apply -f monitoring/dashboards/

# Setup alerts
kubectl apply -f monitoring/alerts/

echo "✅ Monitoring stack deployed!"
echo "📈 Grafana URL: https://grafana.truelabel.com"
echo "🔍 Jaeger URL: https://jaeger.truelabel.com"
```

## 7. Conclusão e Próximos Passos

### Benefícios da Nova Arquitetura

1. **Escalabilidade**: Auto-scaling horizontal em todas as camadas
2. **Confiabilidade**: Multi-AZ, DR automático, 99.99% SLA
3. **Performance**: CDN global, caching multicamada, <100ms latência
4. **Segurança**: WAF, encryption at rest/transit, compliance ready
5. **Custo**: 70% redução vs. solução atual em escala
6. **Observabilidade**: Full stack monitoring e alerting

### Timeline de Implementação

- **Semanas 1-2**: Setup inicial e preparação
- **Semanas 3-4**: Deploy e testes em paralelo
- **Semana 5**: Migração progressiva de tráfego
- **Semana 6**: Cutover final e estabilização
- **Semana 7-8**: Otimização e documentação

### Investimento Estimado

- **Infraestrutura AWS**: ~$800/mês (escala atual)
- **Ferramentas DevOps**: ~$200/mês
- **Tempo de Implementação**: 6-8 semanas
- **Treinamento Team**: 2 semanas

### Recomendações Finais

1. Começar com ambiente de staging completo
2. Implementar observability desde o início
3. Automatizar tudo que for possível
4. Documentar decisões arquiteturais
5. Treinar equipe continuamente
6. Estabelecer SLOs claros
7. Implementar chaos engineering
8. Manter runbooks atualizados

Esta arquitetura fornece uma base sólida para o crescimento global da TrueLabel, com capacidade de escalar para milhões de usuários mantendo alta disponibilidade e performance.