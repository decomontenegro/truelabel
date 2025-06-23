import puppeteer from 'puppeteer';
import fs from 'fs';

const BASE_URL = 'http://localhost:3001';

async function testDashboardUX() {
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1920, height: 1080 }
  });

  const report = {
    timestamp: new Date().toISOString(),
    issues: [],
    navigation: [],
    responsiveness: [],
    visual: [],
    functionality: [],
    accessibility: [],
    performance: [],
    suggestions: []
  };

  try {
    const page = await browser.newPage();
    
    // Interceptar console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        report.functionality.push(`Console Error: ${msg.text()}`);
      }
    });

    console.log('🔐 Fazendo login...');
    await page.goto(BASE_URL + '/login', { waitUntil: 'networkidle2' });
    
    // Aguardar campos carregarem
    await page.waitForSelector('input[type="email"]');
    await page.waitForSelector('input[type="password"]');
    
    // Limpar campos e preencher
    const emailInput = await page.$('input[type="email"]');
    await emailInput.click({ clickCount: 3 });
    await page.type('input[type="email"]', 'admin@truelabel.com');
    
    const passwordInput = await page.$('input[type="password"]');
    await passwordInput.click({ clickCount: 3 });
    await page.type('input[type="password"]', 'admin123');
    
    // Clicar no botão de login
    await page.click('button[type="submit"]');
    
    // Aguardar navegação ou erro
    try {
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 5000 });
      console.log('✅ Login realizado!');
    } catch (e) {
      // Verificar se ainda estamos na página de login
      const currentUrl = page.url();
      if (currentUrl.includes('login')) {
        // Procurar mensagem de erro
        const errorMessage = await page.evaluate(() => {
          const alerts = document.querySelectorAll('[role="alert"], .error, .alert-error');
          return alerts.length > 0 ? alerts[0].textContent : null;
        });
        
        if (errorMessage) {
          report.functionality.push(`Erro de login: ${errorMessage}`);
          console.log(`❌ Erro de login: ${errorMessage}`);
        }
      }
    }
    
    // Verificar onde estamos
    const finalUrl = page.url();
    console.log(`📍 URL atual: ${finalUrl}`);
    
    // Screenshot da página atual
    await page.screenshot({ path: './screenshots/current-page.png', fullPage: true });
    
    if (finalUrl.includes('products') || finalUrl.includes('dashboard')) {
      console.log('\n📊 Analisando dashboard...');
      
      // 1. ESTRUTURA DA PÁGINA
      const pageStructure = await page.evaluate(() => {
        const structure = {
          sidebar: false,
          header: false,
          mainContent: false,
          navigation: [],
          cards: 0,
          charts: 0,
          tables: 0
        };
        
        // Procurar sidebar
        const sidebarSelectors = ['aside', '.sidebar', '[data-testid="sidebar"]', 'nav[role="navigation"]'];
        for (const selector of sidebarSelectors) {
          if (document.querySelector(selector)) {
            structure.sidebar = true;
            break;
          }
        }
        
        // Procurar header
        const headerSelectors = ['header', '.header', '[data-testid="header"]'];
        for (const selector of headerSelectors) {
          if (document.querySelector(selector)) {
            structure.header = true;
            break;
          }
        }
        
        // Procurar main content
        const mainSelectors = ['main', '.main-content', '[role="main"]'];
        for (const selector of mainSelectors) {
          if (document.querySelector(selector)) {
            structure.mainContent = true;
            break;
          }
        }
        
        // Contar elementos
        structure.navigation = Array.from(document.querySelectorAll('nav a')).map(a => ({
          text: a.textContent.trim(),
          href: a.href
        }));
        
        structure.cards = document.querySelectorAll('.card, [class*="card"]').length;
        structure.charts = document.querySelectorAll('canvas, svg[class*="chart"], .recharts-wrapper').length;
        structure.tables = document.querySelectorAll('table').length;
        
        return structure;
      });
      
      console.log('Estrutura encontrada:');
      console.log(`- Sidebar: ${pageStructure.sidebar ? '✅' : '❌'}`);
      console.log(`- Header: ${pageStructure.header ? '✅' : '❌'}`);
      console.log(`- Main Content: ${pageStructure.mainContent ? '✅' : '❌'}`);
      console.log(`- Links de navegação: ${pageStructure.navigation.length}`);
      console.log(`- Cards: ${pageStructure.cards}`);
      console.log(`- Gráficos: ${pageStructure.charts}`);
      console.log(`- Tabelas: ${pageStructure.tables}`);
      
      // Reportar problemas estruturais
      if (!pageStructure.sidebar) report.visual.push('Sidebar não encontrada');
      if (!pageStructure.header) report.visual.push('Header não encontrado');
      if (!pageStructure.mainContent) report.visual.push('Área principal não encontrada');
      if (pageStructure.navigation.length < 3) report.navigation.push('Poucos links de navegação');
      if (pageStructure.cards === 0) report.visual.push('Nenhum card de estatística encontrado');
      if (pageStructure.charts === 0) report.visual.push('Nenhum gráfico encontrado');
      
      // 2. TESTAR RESPONSIVIDADE
      console.log('\n📱 Testando responsividade...');
      
      const viewports = [
        { name: 'mobile', width: 375, height: 667 },
        { name: 'tablet', width: 768, height: 1024 },
        { name: 'desktop', width: 1920, height: 1080 }
      ];
      
      for (const vp of viewports) {
        await page.setViewport(vp);
        await new Promise(r => setTimeout(r, 500));
        
        const responsiveIssues = await page.evaluate((viewport) => {
          const issues = [];
          
          // Verificar scroll horizontal
          if (document.documentElement.scrollWidth > window.innerWidth) {
            issues.push('Scroll horizontal presente');
          }
          
          // Mobile specific
          if (viewport.width < 768) {
            const hamburger = document.querySelector('[class*="menu-toggle"], [aria-label*="menu"]');
            if (!hamburger) issues.push('Menu mobile não encontrado');
          }
          
          return issues;
        }, vp);
        
        responsiveIssues.forEach(issue => {
          report.responsiveness.push(`${vp.name}: ${issue}`);
        });
        
        await page.screenshot({ 
          path: `./screenshots/responsive-${vp.name}.png`, 
          fullPage: true 
        });
      }
      
      // 3. TESTAR FUNCIONALIDADES
      console.log('\n🎯 Testando funcionalidades...');
      
      // Voltar para desktop
      await page.setViewport({ width: 1920, height: 1080 });
      
      // Busca
      const searchInput = await page.$('input[type="search"], input[placeholder*="buscar" i], input[placeholder*="search" i]');
      if (!searchInput) {
        report.functionality.push('Campo de busca não encontrado');
      }
      
      // Notificações
      const notificationIcon = await page.$('[class*="notification"], [aria-label*="notification"]');
      if (!notificationIcon) {
        report.functionality.push('Sistema de notificações não encontrado');
      }
      
      // 4. ACESSIBILIDADE
      console.log('\n♿ Verificando acessibilidade...');
      
      const a11yIssues = await page.evaluate(() => {
        const issues = [];
        
        // Imagens sem alt
        const imagesWithoutAlt = document.querySelectorAll('img:not([alt])').length;
        if (imagesWithoutAlt > 0) {
          issues.push(`${imagesWithoutAlt} imagens sem atributo alt`);
        }
        
        // Botões sem texto acessível
        document.querySelectorAll('button').forEach(btn => {
          if (!btn.textContent.trim() && !btn.getAttribute('aria-label')) {
            issues.push('Botão sem texto ou aria-label encontrado');
          }
        });
        
        // Formulários sem labels
        const inputsWithoutLabel = document.querySelectorAll('input:not([aria-label])').length;
        if (inputsWithoutLabel > 0) {
          issues.push(`${inputsWithoutLabel} campos sem label`);
        }
        
        return issues;
      });
      
      a11yIssues.forEach(issue => report.accessibility.push(issue));
      
      // 5. PERFORMANCE
      console.log('\n⚡ Analisando performance...');
      
      const metrics = await page.metrics();
      const performance = await page.evaluate(() => {
        const nav = performance.getEntriesByType('navigation')[0];
        return {
          loadTime: nav.loadEventEnd - nav.loadEventStart,
          domContentLoaded: nav.domContentLoadedEventEnd - nav.domContentLoadedEventStart,
          resources: performance.getEntriesByType('resource').length
        };
      });
      
      console.log(`- Tempo de carregamento: ${performance.loadTime}ms`);
      console.log(`- Recursos carregados: ${performance.resources}`);
      
      if (performance.loadTime > 3000) {
        report.performance.push(`Tempo de carregamento alto: ${performance.loadTime}ms`);
      }
      
      // 6. GERAR SUGESTÕES
      console.log('\n💡 Gerando sugestões...');
      
      if (report.visual.length > 0) {
        report.suggestions.push('Implementar design system consistente');
      }
      if (report.navigation.length > 0) {
        report.suggestions.push('Melhorar estrutura de navegação');
      }
      if (report.responsiveness.length > 0) {
        report.suggestions.push('Otimizar para dispositivos móveis');
      }
      if (report.accessibility.length > 0) {
        report.suggestions.push('Melhorar acessibilidade seguindo WCAG 2.1');
      }
      if (report.performance.length > 0) {
        report.suggestions.push('Otimizar performance de carregamento');
      }
      
    } else {
      report.issues.push('Não foi possível acessar o dashboard após login');
      console.log('❌ Não conseguimos acessar o dashboard');
    }
    
    // SALVAR RELATÓRIO
    const finalReport = {
      timestamp: report.timestamp,
      url: BASE_URL,
      currentPage: finalUrl,
      totalIssues: Object.values(report).reduce((acc, val) => 
        Array.isArray(val) ? acc + val.length : acc, 0
      ),
      report: report
    };
    
    fs.writeFileSync('ux-test-final-report.json', JSON.stringify(finalReport, null, 2));
    
    // Gerar relatório markdown
    let markdown = `# Relatório Final de UX - True Label Dashboard\n\n`;
    markdown += `**Data:** ${new Date().toLocaleString('pt-BR')}\n`;
    markdown += `**URL:** ${BASE_URL}\n`;
    markdown += `**Página atual:** ${finalUrl}\n\n`;
    
    markdown += `## Resumo\n\n`;
    markdown += `- Total de problemas: ${finalReport.totalIssues}\n\n`;
    
    Object.entries(report).forEach(([category, items]) => {
      if (Array.isArray(items) && items.length > 0) {
        markdown += `### ${category.charAt(0).toUpperCase() + category.slice(1)}\n\n`;
        items.forEach(item => markdown += `- ${item}\n`);
        markdown += '\n';
      }
    });
    
    fs.writeFileSync('ux-test-final-report.md', markdown);
    
    console.log('\n✅ Teste concluído!');
    console.log('📄 Relatórios salvos:');
    console.log('- ux-test-final-report.json');
    console.log('- ux-test-final-report.md');
    console.log('- Screenshots em ./screenshots/');
    
  } catch (error) {
    console.error('❌ Erro durante teste:', error);
    report.issues.push(`Erro fatal: ${error.message}`);
  } finally {
    // Manter navegador aberto para inspeção
    console.log('\n⏸️ Navegador ficará aberto por 20 segundos...');
    await new Promise(r => setTimeout(r, 20000));
    await browser.close();
  }
}

testDashboardUX();