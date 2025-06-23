# 🤝 Guia de Contribuição - True Label

Obrigado por considerar contribuir com o True Label! Este documento fornece diretrizes para contribuições.

## 📋 Código de Conduta

Ao participar deste projeto, você concorda em seguir nosso [Código de Conduta](CODE_OF_CONDUCT.md).

## 🚀 Como Contribuir

### **1. Reportar Bugs**

- Use o template de [Bug Report](.github/ISSUE_TEMPLATE/bug_report.md)
- Verifique se o bug já não foi reportado
- Inclua passos detalhados para reproduzir
- Adicione screenshots se aplicável

### **2. Sugerir Funcionalidades**

- Use o template de [Feature Request](.github/ISSUE_TEMPLATE/feature_request.md)
- Descreva claramente o problema que a funcionalidade resolveria
- Inclua casos de uso específicos
- Considere alternativas

### **3. Contribuir com Código**

#### **Configuração do Ambiente**
```bash
# 1. Fork o repositório
# 2. Clone seu fork
git clone https://github.com/SEU_USERNAME/true-label.git
cd true-label

# 3. Configure o ambiente
npm install
cd server && npm install
cd ../client && npm install

# 4. Configure variáveis de ambiente
cp server/.env.example server/.env
cp client/.env.example client/.env

# 5. Configure o banco de dados
cd server
npx prisma db push
npm run seed
```

#### **Fluxo de Desenvolvimento**
```bash
# 1. Crie uma branch para sua feature
git checkout -b feature/nome-da-feature

# 2. Faça suas mudanças
# 3. Execute os testes
npm test

# 4. Commit suas mudanças
git commit -m "feat: adiciona nova funcionalidade"

# 5. Push para seu fork
git push origin feature/nome-da-feature

# 6. Abra um Pull Request
```

## 📝 Padrões de Código

### **Commits**
Use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: adiciona nova funcionalidade
fix: corrige bug específico
docs: atualiza documentação
style: mudanças de formatação
refactor: refatoração de código
test: adiciona ou corrige testes
chore: mudanças de build/ferramentas
```

### **TypeScript**
- Use tipagem estrita
- Evite `any`
- Documente interfaces complexas
- Use nomes descritivos

### **React**
- Use componentes funcionais
- Implemente hooks customizados quando apropriado
- Mantenha componentes pequenos e focados
- Use TypeScript para props

### **Backend**
- Valide dados de entrada
- Use middleware para funcionalidades comuns
- Implemente tratamento de erros adequado
- Documente APIs

## 🧪 Testes

### **Frontend**
```bash
cd client
npm test
```

### **Backend**
```bash
cd server
npm test
```

### **Cobertura**
Mantenha cobertura de testes acima de 80%:
```bash
npm run test:coverage
```

## 📚 Documentação

### **Atualizando Documentação**
- Atualize README.md se necessário
- Documente novas APIs em docs/API_DOCUMENTATION.md
- Atualize manual do usuário se aplicável
- Mantenha changelog atualizado

### **Comentários no Código**
- Comente código complexo
- Use JSDoc para funções públicas
- Explique o "porquê", não apenas o "o quê"

## 🎨 Design e UI

### **Diretrizes**
- Siga o [Design System](docs/BRAND_GUIDELINES.md)
- Use componentes existentes quando possível
- Mantenha consistência visual
- Teste em diferentes dispositivos

### **Acessibilidade**
- Use semantic HTML
- Implemente navegação por teclado
- Adicione alt text para imagens
- Mantenha contraste adequado

## 🔍 Revisão de Código

### **Para Autores**
- Faça auto-revisão antes de submeter
- Escreva descrição clara do PR
- Responda feedback construtivamente
- Mantenha PRs pequenos e focados

### **Para Revisores**
- Seja construtivo e respeitoso
- Foque na qualidade do código
- Teste as mudanças localmente
- Aprove apenas quando satisfeito

## 📊 Processo de Release

### **Versionamento**
Seguimos [Semantic Versioning](https://semver.org/):
- **MAJOR**: Mudanças incompatíveis
- **MINOR**: Funcionalidades compatíveis
- **PATCH**: Correções compatíveis

### **Changelog**
- Atualize CHANGELOG.md
- Categorize mudanças
- Inclua breaking changes
- Mencione contribuidores

## 🏷️ Labels

### **Issues**
- `bug` - Problemas/bugs
- `enhancement` - Novas funcionalidades
- `documentation` - Melhorias na documentação
- `good first issue` - Bom para iniciantes
- `help wanted` - Precisa de ajuda
- `priority: high` - Alta prioridade

### **Pull Requests**
- `work in progress` - Em desenvolvimento
- `ready for review` - Pronto para revisão
- `needs changes` - Precisa de mudanças
- `approved` - Aprovado

## 🎯 Áreas de Contribuição

### **Frontend**
- Componentes React
- Páginas e layouts
- Integração com APIs
- Testes unitários

### **Backend**
- APIs REST
- Autenticação
- Banco de dados
- Testes de integração

### **Documentação**
- Guias de usuário
- Documentação técnica
- Tutoriais
- Exemplos

### **Design**
- UI/UX improvements
- Acessibilidade
- Responsividade
- Design system

## 📞 Suporte

### **Dúvidas**
- 💬 [GitHub Discussions](https://github.com/decomontenegro/true-label/discussions)
- 📧 Email: dev@truelabel.com

### **Bugs Urgentes**
- 🐛 [GitHub Issues](https://github.com/decomontenegro/true-label/issues)
- 📧 Email: suporte@truelabel.com

## 🙏 Reconhecimento

Contribuidores são reconhecidos:
- No README.md
- No changelog
- Em releases
- Na documentação

## 📄 Licença

Ao contribuir, você concorda que suas contribuições serão licenciadas sob a [MIT License](LICENSE).

---

**Obrigado por contribuir com o True Label! 🚀**
