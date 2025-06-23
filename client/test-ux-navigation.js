import puppeteer from 'puppeteer';
import fs from 'fs';

// Configurações
const BASE_URL = 'http://localhost:3001';
const ADMIN_EMAIL = 'admin@truelabel.com.br';
const ADMIN_PASSWORD = 'admin123';

// Resoluções para testar responsividade
const VIEWPORTS = [
  { name: 'Desktop HD', width: 1920, height: 1080 },
  { name: 'Desktop', width: 1366, height: 768 },
  { name: 'Tablet', width: 768, height: 1024 },
  { name: 'Mobile', width: 375, height: 667 }
];

// Relatório de problemas
const issues = {
  navigation: [],
  responsiveness: [],
  visual: [],
  functionality: [],
  performance: [],
  suggestions: []
};

async function testNavigation() {
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized']
  });

  try {
    const page = await browser.newPage();
    
    // Configurar interceptadores para detectar erros
    page.on('console', msg => {
      if (msg.type() === 'error') {
        issues.functionality.push(`Console Error: ${msg.text()}`);
      }
    });

    page.on('pageerror', err => {
      issues.functionality.push(`Page Error: ${err.message}`);
    });

    // 1. LOGIN
    console.log('🔐 Fazendo login...');
    await page.goto(BASE_URL + '/login', { waitUntil: 'networkidle2' });
    
    // Verificar elementos de login
    try {
      await page.waitForSelector('input[type="email"]', { timeout: 5000 });
      await page.type('input[type="email"]', ADMIN_EMAIL);
      await page.type('input[type="password"]', ADMIN_PASSWORD);
      
      // Procurar botão de login
      const loginButton = await page.$('button[type="submit"]');
      if (loginButton) {
        await loginButton.click();
      } else {
        issues.navigation.push('Botão de login não encontrado');
      }

      // Aguardar redirecionamento
      await page.waitForNavigation({ waitUntil: 'networkidle2' });
      console.log('✅ Login realizado com sucesso');
    } catch (error) {
      issues.functionality.push(`Erro no login: ${error.message}`);
      console.error('❌ Erro no login:', error.message);
    }

    // 2. VERIFICAR ESTRUTURA DO DASHBOARD
    console.log('\n📊 Verificando estrutura do dashboard...');
    
    // Verificar elementos principais
    const elements = {
      sidebar: ['nav', 'aside', '[class*="sidebar"]', '[class*="menu"]'],
      header: ['header', '[class*="header"]', '[class*="navbar"]'],
      main: ['main', '[class*="content"]', '[class*="dashboard"]']
    };

    for (const [component, selectors] of Object.entries(elements)) {
      let found = false;
      for (const selector of selectors) {
        try {
          const element = await page.$(selector);
          if (element) {
            found = true;
            console.log(`✅ ${component} encontrado: ${selector}`);
            break;
          }
        } catch (e) {}
      }
      if (!found) {
        issues.visual.push(`${component} não encontrado`);
        console.log(`❌ ${component} não encontrado`);
      }
    }

    // 3. TESTAR NAVEGAÇÃO POR MENUS
    console.log('\n🔗 Testando links de navegação...');
    
    // Coletar todos os links do menu
    const menuLinks = await page.evaluate(() => {
      const links = [];
      const navElements = document.querySelectorAll('nav a, aside a, [class*="menu"] a, [class*="sidebar"] a');
      navElements.forEach(link => {
        if (link.href && !link.href.includes('logout')) {
          links.push({
            text: link.textContent.trim(),
            href: link.href,
            visible: link.offsetParent !== null
          });
        }
      });
      return links;
    });

    console.log(`📋 ${menuLinks.length} links encontrados no menu`);

    // Testar cada link
    for (const link of menuLinks) {
      if (!link.visible) {
        issues.navigation.push(`Link oculto: ${link.text}`);
        continue;
      }

      try {
        console.log(`   Testando: ${link.text} -> ${link.href}`);
        await page.goto(link.href, { waitUntil: 'networkidle2', timeout: 10000 });
        
        // Verificar se carregou corretamente
        const hasError = await page.$('.error, [class*="error"], [class*="404"]');
        if (hasError) {
          issues.navigation.push(`Erro ao acessar: ${link.text} (${link.href})`);
        }

        // Verificar breadcrumbs
        const breadcrumbs = await page.$('[class*="breadcrumb"], nav[aria-label="breadcrumb"]');
        if (!breadcrumbs) {
          issues.navigation.push(`Sem breadcrumbs em: ${link.text}`);
        }

      } catch (error) {
        issues.navigation.push(`Falha ao navegar para ${link.text}: ${error.message}`);
      }
    }

    // 4. TESTAR RESPONSIVIDADE
    console.log('\n📱 Testando responsividade...');
    
    for (const viewport of VIEWPORTS) {
      console.log(`   Testando ${viewport.name} (${viewport.width}x${viewport.height})`);
      await page.setViewport(viewport);
      await page.goto(BASE_URL + '/dashboard', { waitUntil: 'networkidle2' });
      
      // Verificar elementos móveis
      if (viewport.width < 768) {
        // Deve ter menu hambúrguer
        const hamburger = await page.$('[class*="hamburger"], [class*="menu-toggle"], [class*="mobile-menu"]');
        if (!hamburger) {
          issues.responsiveness.push(`Menu móvel não encontrado em ${viewport.name}`);
        }
        
        // Sidebar deve estar oculta por padrão
        const sidebarVisible = await page.evaluate(() => {
          const sidebar = document.querySelector('nav, aside, [class*="sidebar"]');
          if (sidebar) {
            const rect = sidebar.getBoundingClientRect();
            return rect.width > 0 && rect.height > 0;
          }
          return false;
        });
        
        if (sidebarVisible) {
          issues.responsiveness.push(`Sidebar visível em mobile (${viewport.name})`);
        }
      }

      // Verificar overflow horizontal
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      
      if (hasHorizontalScroll) {
        issues.responsiveness.push(`Scroll horizontal detectado em ${viewport.name}`);
      }

      // Verificar sobreposição de elementos
      const overlappingElements = await page.evaluate(() => {
        const elements = document.querySelectorAll('*');
        const overlaps = [];
        
        for (let i = 0; i < elements.length; i++) {
          const rect1 = elements[i].getBoundingClientRect();
          if (rect1.width === 0 || rect1.height === 0) continue;
          
          for (let j = i + 1; j < elements.length; j++) {
            const rect2 = elements[j].getBoundingClientRect();
            if (rect2.width === 0 || rect2.height === 0) continue;
            
            // Verificar sobreposição
            if (!(rect1.right < rect2.left || 
                  rect1.left > rect2.right || 
                  rect1.bottom < rect2.top || 
                  rect1.top > rect2.bottom)) {
              
              // Verificar se não são elementos pai/filho
              if (!elements[i].contains(elements[j]) && !elements[j].contains(elements[i])) {
                overlaps.push({
                  elem1: elements[i].tagName + (elements[i].className ? '.' + elements[i].className : ''),
                  elem2: elements[j].tagName + (elements[j].className ? '.' + elements[j].className : '')
                });
              }
            }
          }
        }
        return overlaps.slice(0, 5); // Limitar a 5 sobreposições
      });

      if (overlappingElements.length > 0) {
        overlappingElements.forEach(overlap => {
          issues.responsiveness.push(`Sobreposição em ${viewport.name}: ${overlap.elem1} e ${overlap.elem2}`);
        });
      }
    }

    // 5. TESTAR GRÁFICOS E ESTATÍSTICAS
    console.log('\n📈 Verificando gráficos e estatísticas...');
    await page.setViewport(VIEWPORTS[0]); // Voltar para desktop
    await page.goto(BASE_URL + '/dashboard', { waitUntil: 'networkidle2' });

    // Procurar por elementos de gráficos
    const chartSelectors = ['canvas', 'svg', '[class*="chart"]', '[class*="graph"]', '.recharts-wrapper'];
    let chartsFound = 0;

    for (const selector of chartSelectors) {
      const charts = await page.$$(selector);
      chartsFound += charts.length;
    }

    if (chartsFound === 0) {
      issues.functionality.push('Nenhum gráfico encontrado no dashboard');
    } else {
      console.log(`✅ ${chartsFound} gráficos encontrados`);
    }

    // Verificar cards de estatísticas
    const statCards = await page.evaluate(() => {
      const cards = document.querySelectorAll('[class*="card"], [class*="stat"], [class*="metric"]');
      return cards.length;
    });

    if (statCards === 0) {
      issues.visual.push('Nenhum card de estatística encontrado');
    } else {
      console.log(`✅ ${statCards} cards de estatísticas encontrados`);
    }

    // 6. TESTAR FILTROS E BUSCA
    console.log('\n🔍 Testando funcionalidades de busca e filtros...');
    
    // Procurar campos de busca
    const searchInputs = await page.$$('input[type="search"], input[placeholder*="search" i], input[placeholder*="buscar" i], input[placeholder*="pesquisar" i]');
    
    if (searchInputs.length === 0) {
      issues.functionality.push('Nenhum campo de busca encontrado');
    } else {
      console.log(`✅ ${searchInputs.length} campos de busca encontrados`);
      
      // Testar primeiro campo de busca
      try {
        await searchInputs[0].type('teste');
        await page.keyboard.press('Enter');
        await page.waitForTimeout(1000);
        
        // Verificar se houve alguma mudança na página
        const hasResults = await page.evaluate(() => {
          return document.body.textContent.includes('teste') || 
                 document.querySelector('[class*="result"], [class*="empty"], [class*="no-data"]');
        });
        
        if (!hasResults) {
          issues.functionality.push('Busca não retorna resultados ou feedback');
        }
      } catch (error) {
        issues.functionality.push(`Erro ao testar busca: ${error.message}`);
      }
    }

    // Procurar filtros
    const filterElements = await page.$$('select, [class*="filter"], [class*="dropdown"], input[type="date"]');
    console.log(`📊 ${filterElements.length} elementos de filtro encontrados`);

    // 7. TESTAR NOTIFICAÇÕES
    console.log('\n🔔 Verificando sistema de notificações...');
    
    const notificationElements = await page.evaluate(() => {
      const elements = [];
      const selectors = ['[class*="notification"]', '[class*="alert"]', '[class*="toast"]', '[class*="badge"]'];
      
      selectors.forEach(selector => {
        document.querySelectorAll(selector).forEach(el => {
          elements.push({
            type: selector,
            visible: el.offsetParent !== null,
            text: el.textContent.trim()
          });
        });
      });
      
      return elements;
    });

    if (notificationElements.length === 0) {
      issues.visual.push('Nenhum elemento de notificação encontrado');
    } else {
      console.log(`✅ ${notificationElements.length} elementos de notificação encontrados`);
    }

    // 8. VERIFICAR CONSISTÊNCIA VISUAL
    console.log('\n🎨 Analisando consistência visual...');
    
    const visualAnalysis = await page.evaluate(() => {
      const analysis = {
        colors: new Set(),
        fonts: new Set(),
        buttonStyles: new Set(),
        inconsistencies: []
      };

      // Analisar cores principais
      const elements = document.querySelectorAll('*');
      elements.forEach(el => {
        const style = window.getComputedStyle(el);
        
        // Cores
        if (style.backgroundColor && style.backgroundColor !== 'rgba(0, 0, 0, 0)') {
          analysis.colors.add(style.backgroundColor);
        }
        
        // Fontes
        if (style.fontFamily) {
          analysis.fonts.add(style.fontFamily);
        }
      });

      // Analisar botões
      const buttons = document.querySelectorAll('button, .btn, [class*="button"]');
      buttons.forEach(btn => {
        const style = window.getComputedStyle(btn);
        analysis.buttonStyles.add(`${style.backgroundColor}-${style.borderRadius}`);
      });

      // Verificar inconsistências
      if (analysis.colors.size > 20) {
        analysis.inconsistencies.push('Muitas cores diferentes (> 20)');
      }
      
      if (analysis.fonts.size > 3) {
        analysis.inconsistencies.push('Muitas fontes diferentes (> 3)');
      }
      
      if (analysis.buttonStyles.size > 5) {
        analysis.inconsistencies.push('Muitos estilos de botão diferentes (> 5)');
      }

      return {
        colorCount: analysis.colors.size,
        fontCount: analysis.fonts.size,
        buttonStyleCount: analysis.buttonStyles.size,
        inconsistencies: analysis.inconsistencies
      };
    });

    console.log(`🎨 Cores únicas: ${visualAnalysis.colorCount}`);
    console.log(`🔤 Fontes únicas: ${visualAnalysis.fontCount}`);
    console.log(`🔘 Estilos de botão: ${visualAnalysis.buttonStyleCount}`);

    visualAnalysis.inconsistencies.forEach(issue => {
      issues.visual.push(issue);
    });

    // 9. TESTAR PERFORMANCE
    console.log('\n⚡ Verificando performance...');
    
    const performanceMetrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0];
      return {
        loadTime: navigation.loadEventEnd - navigation.loadEventStart,
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        resources: performance.getEntriesByType('resource').length
      };
    });

    console.log(`⏱️ Tempo de carregamento: ${performanceMetrics.loadTime}ms`);
    console.log(`📦 Recursos carregados: ${performanceMetrics.resources}`);

    if (performanceMetrics.loadTime > 3000) {
      issues.performance.push(`Tempo de carregamento alto: ${performanceMetrics.loadTime}ms`);
    }

    if (performanceMetrics.resources > 100) {
      issues.performance.push(`Muitos recursos carregados: ${performanceMetrics.resources}`);
    }

    // 10. SUGESTÕES DE MELHORIA
    console.log('\n💡 Gerando sugestões de melhoria...');

    // Analisar acessibilidade básica
    const accessibilityCheck = await page.evaluate(() => {
      const issues = [];
      
      // Verificar alt em imagens
      const imagesWithoutAlt = document.querySelectorAll('img:not([alt])').length;
      if (imagesWithoutAlt > 0) {
        issues.push(`${imagesWithoutAlt} imagens sem atributo alt`);
      }
      
      // Verificar labels em forms
      const inputsWithoutLabel = document.querySelectorAll('input:not([aria-label]):not([id])').length;
      if (inputsWithoutLabel > 0) {
        issues.push(`${inputsWithoutLabel} campos de formulário sem label`);
      }
      
      // Verificar contraste (simplificado)
      const lowContrastElements = [];
      document.querySelectorAll('*').forEach(el => {
        const style = window.getComputedStyle(el);
        const bg = style.backgroundColor;
        const color = style.color;
        
        if (bg && color && bg.includes('rgb') && color.includes('rgb')) {
          // Análise simplificada de contraste
          const bgValues = bg.match(/\d+/g);
          const colorValues = color.match(/\d+/g);
          
          if (bgValues && colorValues) {
            const bgLuminance = (parseInt(bgValues[0]) + parseInt(bgValues[1]) + parseInt(bgValues[2])) / 3;
            const colorLuminance = (parseInt(colorValues[0]) + parseInt(colorValues[1]) + parseInt(colorValues[2])) / 3;
            const contrast = Math.abs(bgLuminance - colorLuminance);
            
            if (contrast < 50) {
              lowContrastElements.push(el.tagName);
            }
          }
        }
      });
      
      if (lowContrastElements.length > 0) {
        issues.push(`Possíveis problemas de contraste em ${lowContrastElements.length} elementos`);
      }
      
      return issues;
    });

    accessibilityCheck.forEach(issue => {
      issues.suggestions.push(`Acessibilidade: ${issue}`);
    });

    // Adicionar sugestões baseadas nos problemas encontrados
    if (issues.navigation.length > 0) {
      issues.suggestions.push('Implementar testes automatizados para links quebrados');
    }
    
    if (issues.responsiveness.length > 0) {
      issues.suggestions.push('Revisar CSS para melhor suporte mobile-first');
    }
    
    if (issues.visual.length > 0) {
      issues.suggestions.push('Criar um design system para maior consistência visual');
    }

    // Gerar relatório final
    console.log('\n📋 RELATÓRIO FINAL DE UX\n' + '='.repeat(50));
    
    Object.entries(issues).forEach(([category, items]) => {
      if (items.length > 0) {
        console.log(`\n${category.toUpperCase()} (${items.length} problemas):`);
        items.forEach((item, index) => {
          console.log(`  ${index + 1}. ${item}`);
        });
      }
    });

    // Salvar relatório em arquivo
    const report = {
      timestamp: new Date().toISOString(),
      url: BASE_URL,
      issues: issues,
      metrics: {
        performance: performanceMetrics,
        visual: visualAnalysis,
        navigation: {
          totalLinks: menuLinks.length,
          testedLinks: menuLinks.filter(l => l.visible).length
        }
      }
    };

    fs.writeFileSync('ux-test-report.json', JSON.stringify(report, null, 2));
    console.log('\n✅ Relatório salvo em ux-test-report.json');

  } catch (error) {
    console.error('❌ Erro durante os testes:', error);
  } finally {
    await browser.close();
  }
}

// Executar testes
testNavigation().catch(console.error);