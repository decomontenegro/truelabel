# Dockerfile para o Backend
FROM node:18-alpine

# Instalar dependências do sistema
RUN apk add --no-cache \
    postgresql-client \
    curl

# Criar diretório da aplicação
WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./
COPY prisma ./prisma/

# Instalar dependências
RUN npm ci --only=production

# Copiar código fonte
COPY . .

# Gerar cliente Prisma
RUN npx prisma generate

# Compilar TypeScript
RUN npm run build

# Criar diretório para uploads
RUN mkdir -p uploads

# Expor porta
EXPOSE 3001

# Comando de inicialização
CMD ["npm", "start"]
