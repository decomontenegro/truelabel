#!/bin/bash

# Script para atualizar imports do Prisma em todos os arquivos

echo "🔄 Atualizando imports do Prisma..."

# Arquivos TypeScript que precisam ser atualizados
files=(
  "src/services/validationQueueService.ts"
  "src/services/websocketService.ts"
  "src/controllers/uploadController.ts"
  "src/routes/reports.ts"
  "src/services/reportParserService.ts"
  "src/routes/validations.ts"
  "src/controllers/qrController.ts"
  "src/controllers/analyticsController.ts"
  "src/routes/seals.ts"
  "src/routes/products.ts"
  "src/middleware/auth.ts"
  "src/routes/auth.ts"
  "src/services/emailService.ts"
  "src/controllers/publicController.ts"
  "src/routes/laboratories.ts"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "📝 Atualizando $file..."
    
    # Remove a linha de import do PrismaClient
    sed -i '' '/^import.*PrismaClient.*from.*@prisma\/client/d' "$file"
    sed -i '' '/^const prisma = new PrismaClient/d' "$file"
    
    # Adiciona o novo import se o arquivo usa prisma
    if grep -q "prisma\." "$file"; then
      # Adiciona o import após os outros imports
      sed -i '' '1,/^import/ { /^import/! b; :a; n; /^import/! { i\
import { prisma } from '\''../lib/prisma'\'';
      b; }; ba; }' "$file"
    fi
  fi
done

# Arquivo JavaScript que precisa conversão manual
echo "⚠️  Arquivo que ainda precisa ser convertido para TypeScript:"
echo "  - src/services/analyticsEventService.js"

echo "✅ Atualização concluída!"