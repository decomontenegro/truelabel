import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  ShieldCheck, 
  QrCode, 
  Brain, 
  BarChart3, 
  Users, 
  Building2,
  CheckCircle,
  TrendingUp
} from 'lucide-react'

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-trust-primary/10 to-background pt-20 pb-32">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="mb-4" variant="secondary">
              Powered by AI
            </Badge>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-trust-primary to-trust-secondary bg-clip-text text-transparent">
              TRUST LABEL
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8">
              Plataforma inteligente de validação CPG que conecta claims de produtos 
              a laudos laboratoriais acreditados através de QR codes inteligentes
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="text-lg">
                <Link href="/register">Começar Agora</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="text-lg">
                <Link href="/demo">Ver Demonstração</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Recursos Inteligentes
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <Brain className="w-12 h-12 text-trust-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">IA Avançada</h3>
              <p className="text-muted-foreground">
                Extração automática de claims, análise inteligente de laudos e 
                detecção de anomalias com tecnologia de ponta
              </p>
            </Card>
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <QrCode className="w-12 h-12 text-trust-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">QR Code Inteligente</h3>
              <p className="text-muted-foreground">
                Cada produto recebe um QR code único que conecta consumidores 
                diretamente às validações verificadas
              </p>
            </Card>
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <ShieldCheck className="w-12 h-12 text-trust-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Validação Confiável</h3>
              <p className="text-muted-foreground">
                Integração com laboratórios acreditados como Eurofins, SGS e SFDK 
                para validações independentes
              </p>
            </Card>
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <BarChart3 className="w-12 h-12 text-trust-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Analytics em Tempo Real</h3>
              <p className="text-muted-foreground">
                Dashboards intuitivos com insights sobre scans, validações e 
                comportamento do consumidor
              </p>
            </Card>
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <Users className="w-12 h-12 text-trust-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Portal para Prescritores</h3>
              <p className="text-muted-foreground">
                Ferramentas exclusivas para nutricionistas e profissionais de saúde 
                recomendarem produtos validados
              </p>
            </Card>
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <Building2 className="w-12 h-12 text-trust-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">API Empresarial</h3>
              <p className="text-muted-foreground">
                Integração completa para e-commerce e sistemas corporativos com 
                documentação detalhada
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-trust-primary mb-2">95%+</div>
              <p className="text-muted-foreground">Precisão de Validação</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-trust-primary mb-2">&lt;2s</div>
              <p className="text-muted-foreground">Tempo de Resposta</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-trust-primary mb-2">99.9%</div>
              <p className="text-muted-foreground">Uptime Garantido</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-trust-primary mb-2">24/7</div>
              <p className="text-muted-foreground">Suporte Técnico</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-trust-primary text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Pronto para Transformar sua Transparência?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Junte-se às marcas líderes que já confiam no TRUST LABEL
          </p>
          <Button asChild size="lg" variant="secondary" className="text-lg">
            <Link href="/contact">Fale com Especialista</Link>
          </Button>
        </div>
      </section>
    </div>
  )
}