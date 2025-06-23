import puppeteer from 'puppeteer';
import fs from 'fs';

// Configurações
const BASE_URL = 'http://localhost:3001';
const ADMIN_EMAIL = 'admin@truelabel.com.br';
const ADMIN_PASSWORD = 'admin123';

// Relatório detalhado
const report = {
  timestamp: new Date().toISOString(),
  navigation: [],
  responsiveness: [],
  visual: [],
  functionality: [],
  performance: [],
  accessibility: [],
  suggestions: []
};

async function takeScreenshot(page, name) {
  const screenshotDir = './screenshots';
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir);
  }
  await page.screenshot({ 
    path: `${screenshotDir}/${name}.png`, 
    fullPage: true 
  });
}

async function testDashboard() {
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1920, height: 1080 },
    args: ['--window-size=1920,1080']
  });

  try {
    const page = await browser.newPage();
    
    // Interceptar erros
    page.on('console', msg => {
      if (msg.type() === 'error') {
        report.functionality.push(`Console Error: ${msg.text()}`);
      }
    });

    // 1. LOGIN
    console.log('🔐 Fazendo login...');
    await page.goto(BASE_URL + '/login', { waitUntil: 'networkidle2' });
    await takeScreenshot(page, '01-login-page');
    
    // Fazer login
    await page.type('input[type="email"]', ADMIN_EMAIL);
    await page.type('input[type="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    
    // Aguardar navegação para o dashboard
    try {
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 });
      console.log('✅ Login realizado com sucesso');
      
      // Verificar se estamos no dashboard
      const url = page.url();
      if (!url.includes('dashboard') && !url.includes('products')) {
        report.functionality.push(`Redirecionamento incorreto após login: ${url}`);
      }
    } catch (error) {
      report.functionality.push(`Erro no login: ${error.message}`);
      await takeScreenshot(page, 'login-error');
    }

    await takeScreenshot(page, '02-dashboard-initial');

    // 2. ANALISAR ESTRUTURA DO DASHBOARD
    console.log('\n📊 Analisando estrutura do dashboard...');
    
    const dashboardStructure = await page.evaluate(() => {
      const structure = {
        sidebar: null,
        header: null,
        mainContent: null,
        navigation: [],
        stats: [],
        charts: []
      };

      // Procurar sidebar
      const sidebarSelectors = ['aside', '[role="navigation"]', '.sidebar', '#sidebar', '[class*="sidebar"]'];
      for (const selector of sidebarSelectors) {
        const el = document.querySelector(selector);
        if (el && el.offsetHeight > 100) {
          structure.sidebar = {
            found: true,
            selector: selector,
            width: el.offsetWidth,
            menuItems: el.querySelectorAll('a, button').length
          };
          break;
        }
      }

      // Procurar header
      const headerSelectors = ['header', '.header', '[class*="header"]', 'nav.top'];
      for (const selector of headerSelectors) {
        const el = document.querySelector(selector);
        if (el) {
          structure.header = {
            found: true,
            selector: selector,
            height: el.offsetHeight
          };
          break;
        }
      }

      // Procurar área principal
      const mainSelectors = ['main', '.main', '[class*="main-content"]', '.content'];
      for (const selector of mainSelectors) {
        const el = document.querySelector(selector);
        if (el) {
          structure.mainContent = {
            found: true,
            selector: selector
          };
          break;
        }
      }

      // Coletar links de navegação
      document.querySelectorAll('a[href]').forEach(link => {
        if (!link.href.includes('logout') && link.offsetParent !== null) {
          structure.navigation.push({
            text: link.textContent.trim(),
            href: link.href,
            inSidebar: link.closest('aside, [class*="sidebar"]') !== null
          });
        }
      });

      // Procurar cards de estatísticas
      const statSelectors = ['.stat', '.card', '[class*="stat"]', '[class*="metric"]'];
      statSelectors.forEach(selector => {
        document.querySelectorAll(selector).forEach(el => {
          const text = el.textContent.trim();
          if (text && el.offsetParent !== null) {
            structure.stats.push({
              selector: selector,
              content: text.substring(0, 50)
            });
          }
        });
      });

      // Procurar gráficos
      const chartSelectors = ['canvas', 'svg.chart', '[class*="chart"]', '.recharts-wrapper'];
      chartSelectors.forEach(selector => {
        const charts = document.querySelectorAll(selector);
        if (charts.length > 0) {
          structure.charts.push({
            selector: selector,
            count: charts.length
          });
        }
      });

      return structure;
    });

    // Reportar estrutura
    if (!dashboardStructure.sidebar) {
      report.visual.push('Sidebar não encontrada');
    } else {
      console.log(`✅ Sidebar encontrada: ${dashboardStructure.sidebar.menuItems} itens de menu`);
    }

    if (!dashboardStructure.header) {
      report.visual.push('Header não encontrado');
    } else {
      console.log(`✅ Header encontrado`);
    }

    if (!dashboardStructure.mainContent) {
      report.visual.push('Área principal de conteúdo não encontrada');
    } else {
      console.log(`✅ Área principal encontrada`);
    }

    console.log(`📊 ${dashboardStructure.stats.length} cards de estatísticas encontrados`);
    console.log(`📈 ${dashboardStructure.charts.reduce((acc, c) => acc + c.count, 0)} gráficos encontrados`);
    console.log(`🔗 ${dashboardStructure.navigation.length} links de navegação encontrados`);

    // 3. TESTAR NAVEGAÇÃO
    console.log('\n🔗 Testando navegação principal...');
    
    const mainMenuItems = dashboardStructure.navigation.filter(item => item.inSidebar);
    console.log(`📋 ${mainMenuItems.length} itens no menu principal`);

    // Testar principais seções
    const sectionsToTest = [
      { name: 'Produtos', keywords: ['produtos', 'products'] },
      { name: 'Relatórios', keywords: ['relatórios', 'reports'] },
      { name: 'QR Codes', keywords: ['qr', 'codes'] },
      { name: 'Validações', keywords: ['validações', 'validations'] },
      { name: 'Laboratórios', keywords: ['laboratórios', 'laboratories'] }
    ];

    for (const section of sectionsToTest) {
      const link = mainMenuItems.find(item => 
        section.keywords.some(kw => item.text.toLowerCase().includes(kw))
      );

      if (link) {
        try {
          console.log(`   Testando: ${section.name} (${link.text})`);
          await page.goto(link.href, { waitUntil: 'networkidle2', timeout: 10000 });
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Verificar se carregou
          const hasContent = await page.evaluate(() => {
            return document.body.textContent.length > 100;
          });

          if (!hasContent) {
            report.navigation.push(`Página vazia: ${section.name}`);
          }

          await takeScreenshot(page, `section-${section.name.toLowerCase().replace(/\s+/g, '-')}`);
        } catch (error) {
          report.navigation.push(`Erro ao navegar para ${section.name}: ${error.message}`);
        }
      } else {
        report.navigation.push(`Link não encontrado para: ${section.name}`);
      }
    }

    // 4. TESTAR RESPONSIVIDADE
    console.log('\n📱 Testando responsividade...');
    
    // Voltar ao dashboard
    await page.goto(BASE_URL + '/dashboard', { waitUntil: 'networkidle2' });

    const viewports = [
      { name: 'desktop', width: 1920, height: 1080 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'mobile', width: 375, height: 667 }
    ];

    for (const viewport of viewports) {
      console.log(`   Testando ${viewport.name} (${viewport.width}x${viewport.height})`);
      await page.setViewport(viewport);
      await new Promise(resolve => setTimeout(resolve, 500));

      const responsiveCheck = await page.evaluate((vp) => {
        const issues = [];
        
        // Verificar overflow horizontal
        if (document.documentElement.scrollWidth > document.documentElement.clientWidth) {
          issues.push('Scroll horizontal detectado');
        }

        // Verificar menu mobile
        if (vp.width < 768) {
          const hamburger = document.querySelector('[class*="hamburger"], [class*="menu-toggle"], button[aria-label*="menu"]');
          if (!hamburger) {
            issues.push('Menu hambúrguer não encontrado');
          }

          // Verificar se sidebar está oculta
          const sidebar = document.querySelector('aside, [class*="sidebar"]');
          if (sidebar && sidebar.offsetWidth > 0) {
            const style = window.getComputedStyle(sidebar);
            if (style.position !== 'fixed' && style.position !== 'absolute') {
              issues.push('Sidebar não está oculta em mobile');
            }
          }
        }

        // Verificar texto cortado
        const elements = document.querySelectorAll('*');
        elements.forEach(el => {
          if (el.scrollWidth > el.clientWidth && window.getComputedStyle(el).overflow === 'hidden') {
            const text = el.textContent.trim();
            if (text.length > 10) {
              issues.push(`Texto cortado: "${text.substring(0, 20)}..."`);
            }
          }
        });

        return issues;
      }, viewport);

      responsiveCheck.forEach(issue => {
        report.responsiveness.push(`${viewport.name}: ${issue}`);
      });

      await takeScreenshot(page, `responsive-${viewport.name}`);
    }

    // 5. TESTAR FUNCIONALIDADES INTERATIVAS
    console.log('\n🎯 Testando funcionalidades interativas...');
    
    // Voltar para desktop
    await page.setViewport({ width: 1920, height: 1080 });
    await page.goto(BASE_URL + '/dashboard', { waitUntil: 'networkidle2' });

    // Testar busca
    const searchInput = await page.$('input[type="search"], input[placeholder*="buscar" i], input[placeholder*="search" i]');
    if (searchInput) {
      console.log('   ✅ Campo de busca encontrado');
      await searchInput.type('teste');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(1000);
    } else {
      report.functionality.push('Campo de busca não encontrado');
    }

    // Testar filtros
    const selects = await page.$$('select');
    console.log(`   📊 ${selects.length} elementos select encontrados`);

    // Testar notificações
    const notificationIcon = await page.$('[class*="notification"], [class*="bell"], [aria-label*="notification"]');
    if (notificationIcon) {
      console.log('   ✅ Ícone de notificações encontrado');
      try {
        await notificationIcon.click();
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const dropdown = await page.$('[class*="dropdown"], [class*="popover"], [role="menu"]');
        if (!dropdown) {
          report.functionality.push('Dropdown de notificações não abre');
        }
      } catch (error) {
        report.functionality.push('Erro ao clicar em notificações');
      }
    } else {
      report.functionality.push('Sistema de notificações não encontrado');
    }

    // 6. VERIFICAR ACESSIBILIDADE
    console.log('\n♿ Verificando acessibilidade...');
    
    const accessibilityIssues = await page.evaluate(() => {
      const issues = [];
      
      // Imagens sem alt
      const imagesWithoutAlt = document.querySelectorAll('img:not([alt])');
      if (imagesWithoutAlt.length > 0) {
        issues.push(`${imagesWithoutAlt.length} imagens sem atributo alt`);
      }
      
      // Botões sem texto acessível
      const buttons = document.querySelectorAll('button');
      buttons.forEach(btn => {
        if (!btn.textContent.trim() && !btn.getAttribute('aria-label')) {
          issues.push('Botão sem texto ou aria-label');
        }
      });
      
      // Links sem texto
      const links = document.querySelectorAll('a');
      links.forEach(link => {
        if (!link.textContent.trim() && !link.getAttribute('aria-label')) {
          issues.push('Link sem texto ou aria-label');
        }
      });
      
      // Formulários sem labels
      const inputs = document.querySelectorAll('input, select, textarea');
      inputs.forEach(input => {
        const id = input.id;
        if (id) {
          const label = document.querySelector(`label[for="${id}"]`);
          if (!label && !input.getAttribute('aria-label')) {
            issues.push(`Campo ${input.type || input.tagName} sem label`);
          }
        }
      });
      
      // Contraste de cores (simplificado)
      const getContrastRatio = (rgb1, rgb2) => {
        const getLuminance = (r, g, b) => {
          const [rs, gs, bs] = [r, g, b].map(c => {
            c = c / 255;
            return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
          });
          return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
        };
        
        const l1 = getLuminance(...rgb1);
        const l2 = getLuminance(...rgb2);
        const lighter = Math.max(l1, l2);
        const darker = Math.min(l1, l2);
        
        return (lighter + 0.05) / (darker + 0.05);
      };
      
      // Verificar alguns elementos de texto
      const textElements = document.querySelectorAll('p, span, h1, h2, h3, h4, h5, h6, a, button');
      let lowContrastCount = 0;
      
      textElements.forEach(el => {
        const style = window.getComputedStyle(el);
        const color = style.color.match(/\d+/g);
        const bgColor = style.backgroundColor.match(/\d+/g);
        
        if (color && bgColor) {
          const ratio = getContrastRatio(
            color.map(Number),
            bgColor.map(Number)
          );
          
          if (ratio < 4.5) {
            lowContrastCount++;
          }
        }
      });
      
      if (lowContrastCount > 0) {
        issues.push(`${lowContrastCount} elementos com possível baixo contraste`);
      }
      
      return issues;
    });

    accessibilityIssues.forEach(issue => {
      report.accessibility.push(issue);
    });

    // 7. PERFORMANCE
    console.log('\n⚡ Analisando performance...');
    
    const performanceMetrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0];
      const resources = performance.getEntriesByType('resource');
      
      // Agrupar recursos por tipo
      const resourcesByType = {};
      resources.forEach(resource => {
        const type = resource.name.split('.').pop().split('?')[0];
        if (!resourcesByType[type]) {
          resourcesByType[type] = { count: 0, totalSize: 0 };
        }
        resourcesByType[type].count++;
        resourcesByType[type].totalSize += resource.transferSize || 0;
      });
      
      return {
        loadTime: navigation.loadEventEnd - navigation.loadEventStart,
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        totalResources: resources.length,
        resourcesByType: resourcesByType,
        largestResources: resources
          .sort((a, b) => (b.transferSize || 0) - (a.transferSize || 0))
          .slice(0, 5)
          .map(r => ({
            name: r.name.split('/').pop(),
            size: r.transferSize || 0
          }))
      };
    });

    console.log(`⏱️ Tempo de carregamento: ${performanceMetrics.loadTime}ms`);
    console.log(`📦 Total de recursos: ${performanceMetrics.totalResources}`);

    if (performanceMetrics.loadTime > 3000) {
      report.performance.push(`Tempo de carregamento alto: ${performanceMetrics.loadTime}ms`);
    }

    if (performanceMetrics.totalResources > 100) {
      report.performance.push(`Muitos recursos: ${performanceMetrics.totalResources}`);
    }

    // 8. CONSISTÊNCIA VISUAL
    console.log('\n🎨 Verificando consistência visual...');
    
    const visualConsistency = await page.evaluate(() => {
      const analysis = {
        colors: new Map(),
        fonts: new Set(),
        buttonStyles: new Map(),
        spacing: new Set()
      };
      
      // Analisar todos os elementos
      const elements = document.querySelectorAll('*');
      
      elements.forEach(el => {
        const style = window.getComputedStyle(el);
        
        // Cores
        ['color', 'backgroundColor', 'borderColor'].forEach(prop => {
          const value = style[prop];
          if (value && value !== 'rgba(0, 0, 0, 0)' && value !== 'transparent') {
            analysis.colors.set(value, (analysis.colors.get(value) || 0) + 1);
          }
        });
        
        // Fontes
        if (style.fontFamily) {
          analysis.fonts.add(style.fontFamily);
        }
        
        // Espaçamentos
        ['padding', 'margin'].forEach(prop => {
          const value = style[prop];
          if (value && value !== '0px') {
            analysis.spacing.add(value);
          }
        });
      });
      
      // Analisar botões especificamente
      const buttons = document.querySelectorAll('button, .btn, [class*="button"]');
      buttons.forEach(btn => {
        const style = window.getComputedStyle(btn);
        const styleKey = `${style.backgroundColor}-${style.borderRadius}-${style.padding}`;
        analysis.buttonStyles.set(styleKey, (analysis.buttonStyles.get(styleKey) || 0) + 1);
      });
      
      return {
        uniqueColors: analysis.colors.size,
        topColors: Array.from(analysis.colors.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5),
        uniqueFonts: analysis.fonts.size,
        fonts: Array.from(analysis.fonts),
        uniqueButtonStyles: analysis.buttonStyles.size,
        uniqueSpacings: analysis.spacing.size
      };
    });

    console.log(`🎨 Cores únicas: ${visualConsistency.uniqueColors}`);
    console.log(`🔤 Fontes únicas: ${visualConsistency.uniqueFonts}`);
    console.log(`🔘 Estilos de botão: ${visualConsistency.uniqueButtonStyles}`);

    if (visualConsistency.uniqueColors > 20) {
      report.visual.push(`Muitas cores diferentes: ${visualConsistency.uniqueColors}`);
    }

    if (visualConsistency.uniqueFonts > 3) {
      report.visual.push(`Muitas fontes diferentes: ${visualConsistency.uniqueFonts}`);
      report.visual.push(`Fontes encontradas: ${visualConsistency.fonts.join(', ')}`);
    }

    if (visualConsistency.uniqueButtonStyles > 5) {
      report.visual.push(`Muitos estilos de botão diferentes: ${visualConsistency.uniqueButtonStyles}`);
    }

    // 9. GERAR SUGESTÕES
    console.log('\n💡 Gerando sugestões de melhoria...');
    
    if (report.navigation.length > 0) {
      report.suggestions.push('Revisar links quebrados e implementar testes de navegação automatizados');
    }
    
    if (report.responsiveness.length > 0) {
      report.suggestions.push('Implementar design mobile-first e testar em dispositivos reais');
    }
    
    if (report.visual.length > 0) {
      report.suggestions.push('Criar e documentar um design system unificado');
    }
    
    if (report.functionality.length > 0) {
      report.suggestions.push('Adicionar testes de integração para funcionalidades críticas');
    }
    
    if (report.accessibility.length > 0) {
      report.suggestions.push('Realizar auditoria completa de acessibilidade (WCAG 2.1)');
    }
    
    if (report.performance.length > 0) {
      report.suggestions.push('Otimizar carregamento de recursos e implementar lazy loading');
    }

    // Sugestões específicas baseadas nos achados
    if (!dashboardStructure.sidebar) {
      report.suggestions.push('Implementar navegação lateral consistente');
    }
    
    if (dashboardStructure.stats.length < 3) {
      report.suggestions.push('Adicionar mais métricas e KPIs no dashboard principal');
    }
    
    if (dashboardStructure.charts.length === 0) {
      report.suggestions.push('Incluir visualizações de dados para melhor compreensão');
    }

    // 10. SALVAR RELATÓRIO
    const finalReport = {
      timestamp: report.timestamp,
      url: BASE_URL,
      summary: {
        totalIssues: Object.values(report).reduce((acc, arr) => acc + (Array.isArray(arr) ? arr.length : 0), 0),
        criticalIssues: report.functionality.length + report.navigation.length,
        performanceScore: performanceMetrics.loadTime < 2000 ? 'Bom' : performanceMetrics.loadTime < 4000 ? 'Regular' : 'Ruim',
        accessibilityScore: report.accessibility.length === 0 ? 'Excelente' : report.accessibility.length < 3 ? 'Bom' : 'Precisa melhorar'
      },
      issues: report,
      metrics: {
        performance: performanceMetrics,
        visual: visualConsistency,
        structure: dashboardStructure
      }
    };

    fs.writeFileSync('ux-dashboard-report.json', JSON.stringify(finalReport, null, 2));
    
    // Gerar relatório em Markdown
    let markdown = `# Relatório de UX - Dashboard True Label\n\n`;
    markdown += `**Data:** ${new Date().toLocaleString('pt-BR')}\n`;
    markdown += `**URL:** ${BASE_URL}\n\n`;
    
    markdown += `## Resumo Executivo\n\n`;
    markdown += `- **Total de problemas encontrados:** ${finalReport.summary.totalIssues}\n`;
    markdown += `- **Problemas críticos:** ${finalReport.summary.criticalIssues}\n`;
    markdown += `- **Performance:** ${finalReport.summary.performanceScore}\n`;
    markdown += `- **Acessibilidade:** ${finalReport.summary.accessibilityScore}\n\n`;
    
    markdown += `## Problemas Encontrados\n\n`;
    
    Object.entries(report).forEach(([category, items]) => {
      if (Array.isArray(items) && items.length > 0) {
        markdown += `### ${category.charAt(0).toUpperCase() + category.slice(1)}\n\n`;
        items.forEach(item => {
          markdown += `- ${item}\n`;
        });
        markdown += '\n';
      }
    });
    
    markdown += `## Screenshots\n\n`;
    markdown += `Screenshots foram salvos na pasta ./screenshots/\n\n`;
    
    markdown += `## Próximos Passos\n\n`;
    markdown += `1. Priorizar correção de problemas críticos de navegação e funcionalidade\n`;
    markdown += `2. Implementar melhorias de responsividade para dispositivos móveis\n`;
    markdown += `3. Realizar auditoria completa de acessibilidade\n`;
    markdown += `4. Otimizar performance de carregamento\n`;
    markdown += `5. Estabelecer design system para consistência visual\n`;

    fs.writeFileSync('ux-dashboard-report.md', markdown);
    
    console.log('\n✅ Teste concluído!');
    console.log('📊 Relatório JSON salvo em: ux-dashboard-report.json');
    console.log('📄 Relatório Markdown salvo em: ux-dashboard-report.md');
    console.log('📸 Screenshots salvos em: ./screenshots/');

  } catch (error) {
    console.error('❌ Erro durante os testes:', error);
    report.functionality.push(`Erro fatal: ${error.message}`);
  } finally {
    await browser.close();
  }
}

// Executar teste
testDashboard().catch(console.error);