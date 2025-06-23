import puppeteer from 'puppeteer';

async function testLoginAndDashboard() {
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized']
  });

  try {
    const page = await browser.newPage();
    
    console.log('1. Acessando página de login...');
    await page.goto('http://localhost:3001/login');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('2. Preenchendo formulário de login...');
    await page.type('input[type="email"]', 'admin@truelabel.com.br');
    await page.type('input[type="password"]', 'admin123');
    
    console.log('3. Clicando no botão de login...');
    await Promise.all([
      page.waitForNavigation(),
      page.click('button[type="submit"]')
    ]);
    
    console.log('4. URL após login:', page.url());
    
    // Aguardar um pouco para ver a página
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Verificar se estamos no dashboard
    const currentUrl = page.url();
    if (currentUrl.includes('dashboard') || currentUrl.includes('products')) {
      console.log('✅ Login bem-sucedido! Estamos no dashboard/produtos');
      
      // Analisar estrutura da página
      const pageStructure = await page.evaluate(() => {
        const structure = {
          title: document.title,
          url: window.location.href,
          headers: Array.from(document.querySelectorAll('h1, h2')).map(h => h.textContent),
          links: Array.from(document.querySelectorAll('a')).map(a => ({
            text: a.textContent.trim(),
            href: a.href
          })).filter(l => l.text),
          buttons: Array.from(document.querySelectorAll('button')).map(b => b.textContent.trim()).filter(t => t),
          mainContent: document.querySelector('main, [role="main"], .main-content') ? 'Found' : 'Not found',
          sidebar: document.querySelector('aside, nav[class*="sidebar"], .sidebar') ? 'Found' : 'Not found'
        };
        return structure;
      });
      
      console.log('\n📊 Estrutura da página:');
      console.log('- Título:', pageStructure.title);
      console.log('- Headers:', pageStructure.headers);
      console.log('- Links encontrados:', pageStructure.links.length);
      console.log('- Botões:', pageStructure.buttons);
      console.log('- Conteúdo principal:', pageStructure.mainContent);
      console.log('- Sidebar:', pageStructure.sidebar);
      
    } else {
      console.log('❌ Login falhou ou redirecionamento incorreto');
      console.log('URL atual:', currentUrl);
    }
    
    // Manter o navegador aberto por mais tempo para inspeção manual
    console.log('\n⏸️ Navegador ficará aberto por 30 segundos para inspeção manual...');
    await new Promise(resolve => setTimeout(resolve, 30000));
    
  } catch (error) {
    console.error('Erro:', error.message);
  } finally {
    await browser.close();
  }
}

testLoginAndDashboard();