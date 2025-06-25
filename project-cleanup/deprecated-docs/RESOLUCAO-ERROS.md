# Resolução de Erros - True Label

## Erro: Failed to fetch dynamically imported module (Nutrição)

### Problema
A página de nutrição está com erro de importação dinâmica no Vite.

### Solução Temporária

1. **Limpar cache do navegador**:
   - Pressione `Cmd + Shift + R` (Mac) ou `Ctrl + Shift + F5` (Windows)
   - Ou abra as ferramentas de desenvolvedor (F12) > Application > Clear Storage

2. **Se persistir, acesse em aba anônima**:
   - Chrome: `Cmd + Shift + N` (Mac) ou `Ctrl + Shift + N` (Windows)
   - Faça login novamente

3. **Alternativa - Usar outra porta**:
   ```bash
   # Parar processos atuais
   pkill -f "concurrently"
   
   # Iniciar em porta diferente
   cd /Users/andremontenegro/true\ label
   PORT=9102 npm run dev:frontend
   ```

### Páginas Funcionando ✅
- Login
- Dashboard
- Certificações
- Produtos
- Laboratórios
- Relatórios

### Página com Problema ⚠️
- Nutrição (temporariamente)

## Credenciais

**Admin**: admin@cpgvalidation.com / admin123
**Marca**: marca@exemplo.com / brand123
**Lab**: analista@labexemplo.com / lab123