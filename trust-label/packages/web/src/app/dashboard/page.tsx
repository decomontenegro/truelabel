'use client';

import { useAuth } from '@/contexts/auth.context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Package, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  TrendingUp,
  Users,
  FileText,
  QrCode
} from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();

  const stats = [
    {
      title: 'Produtos',
      value: '12',
      description: 'Total cadastrado',
      icon: Package,
      color: 'text-trust-primary',
    },
    {
      title: 'Validados',
      value: '8',
      description: 'Produtos aprovados',
      icon: CheckCircle,
      color: 'text-trust-validated',
    },
    {
      title: 'Pendentes',
      value: '3',
      description: 'Aguardando análise',
      icon: Clock,
      color: 'text-trust-pending',
    },
    {
      title: 'Expirados',
      value: '1',
      description: 'Precisam renovação',
      icon: AlertCircle,
      color: 'text-trust-expired',
    },
  ];

  const activities = [
    {
      title: 'Whey Protein Premium',
      status: 'Validado',
      date: '2 horas atrás',
      icon: CheckCircle,
      color: 'text-trust-validated',
    },
    {
      title: 'BCAA Complex',
      status: 'Em análise',
      date: '1 dia atrás',
      icon: Clock,
      color: 'text-trust-pending',
    },
    {
      title: 'Creatina Pura',
      status: 'Laudo enviado',
      date: '3 dias atrás',
      icon: FileText,
      color: 'text-trust-primary',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Bem-vindo de volta, {user?.name}!
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts and Activity */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Visão Geral</CardTitle>
            <CardDescription>
              Scans de QR Code nos últimos 30 dias
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] flex items-center justify-center text-muted-foreground">
              [Gráfico de linha será implementado]
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Atividade Recente</CardTitle>
            <CardDescription>
              Últimas atualizações dos seus produtos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activities.map((activity, index) => (
                <div key={index} className="flex items-center space-x-4">
                  <activity.icon className={`h-4 w-4 ${activity.color}`} />
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium">{activity.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {activity.status}
                    </p>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {activity.date}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardHeader className="text-center">
            <Package className="h-8 w-8 mx-auto mb-2 text-trust-primary" />
            <CardTitle className="text-base">Novo Produto</CardTitle>
            <CardDescription className="text-xs">
              Cadastre um novo produto
            </CardDescription>
          </CardHeader>
        </Card>
        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardHeader className="text-center">
            <FileText className="h-8 w-8 mx-auto mb-2 text-trust-primary" />
            <CardTitle className="text-base">Enviar Laudo</CardTitle>
            <CardDescription className="text-xs">
              Adicione um laudo laboratorial
            </CardDescription>
          </CardHeader>
        </Card>
        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardHeader className="text-center">
            <QrCode className="h-8 w-8 mx-auto mb-2 text-trust-primary" />
            <CardTitle className="text-base">Gerar QR Code</CardTitle>
            <CardDescription className="text-xs">
              Crie QR codes para produtos
            </CardDescription>
          </CardHeader>
        </Card>
        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardHeader className="text-center">
            <TrendingUp className="h-8 w-8 mx-auto mb-2 text-trust-primary" />
            <CardTitle className="text-base">Analytics</CardTitle>
            <CardDescription className="text-xs">
              Veja estatísticas detalhadas
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}