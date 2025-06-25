# Instruções para Iniciar o True Label

## Opção 1: Dois Terminais (Recomendado)

### Terminal 1 - Backend:
```bash
cd /Users/andremontenegro/true\ label/server
npm run dev
```
Aguarde ver: "🚀 Servidor rodando na porta 9100"

### Terminal 2 - Frontend:
```bash
cd /Users/andremontenegro/true\ label/client
npm run dev
```
Aguarde ver: "➜  Local:   http://localhost:9101/"

## Opção 2: Script Único

Execute no terminal:
```bash
/Users/andremontenegro/true\ label/test-start.sh
```

## Acesso ao Sistema

Após iniciar ambos os serviços:
1. Abra o navegador
2. Acesse: **http://localhost:9101**

## Credenciais de Teste

- **Admin**: admin@truelabel.com / admin123
- **Marca**: marca@exemplo.com / marca123
- **Lab**: analista@labexemplo.com / lab123

## Verificar se está funcionando

Backend: http://localhost:9100/health
Frontend: http://localhost:9101

## Se não funcionar

1. Verifique se as portas estão livres:
```bash
lsof -i :9100
lsof -i :9101
```

2. Mate processos antigos:
```bash
pkill -f tsx
pkill -f vite
```

3. Tente novamente