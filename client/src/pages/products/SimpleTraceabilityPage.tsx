import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Factory, Truck, CheckCircle, Clock } from 'lucide-react';

const SimpleTraceabilityPage: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    // Simular carregamento
    const timer = setTimeout(() => {
      setData({
        product: { id: productId, name: 'Produto Exemplo' },
        events: [
          {
            id: '1',
            type: 'HARVEST',
            title: 'Colheita dos Ingredientes',
            description: 'Colheita realizada na fazenda orgânica',
            timestamp: '2025-06-15T06:00:00.000Z',
            location: 'Fazenda Vale Verde - MG',
            temperature: 22,
            humidity: 65
          },
          {
            id: '2',
            type: 'PROCESSING',
            title: 'Processamento Industrial',
            description: 'Processamento e transformação dos ingredientes',
            timestamp: '2025-06-20T08:00:00.000Z',
            location: 'Fábrica Principal - São Paulo, SP',
            temperature: 18,
            humidity: 45
          },
          {
            id: '3',
            type: 'PACKAGING',
            title: 'Embalagem e Rotulagem',
            description: 'Embalagem final e aplicação de rótulos',
            timestamp: '2025-06-21T14:30:00.000Z',
            location: 'Centro de Embalagem - SP',
            temperature: 20,
            humidity: 50
          },
          {
            id: '4',
            type: 'SHIPPING',
            title: 'Expedição para Distribuição',
            description: 'Produto enviado para centros de distribuição',
            timestamp: '2025-06-22T10:00:00.000Z',
            location: 'Centro de Distribuição - SP',
            temperature: 15,
            humidity: 40
          }
        ],
        summary: {
          totalEvents: 4,
          uniqueLocations: 3,
          totalDistance: 450,
          complianceScore: 95
        }
      });
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, [productId]);

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'HARVEST':
        return <Factory className="h-5 w-5 text-green-600" />;
      case 'PROCESSING':
        return <Factory className="h-5 w-5 text-blue-600" />;
      case 'PACKAGING':
        return <CheckCircle className="h-5 w-5 text-purple-600" />;
      case 'SHIPPING':
        return <Truck className="h-5 w-5 text-orange-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando rastreabilidade...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Dados não encontrados</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/dashboard/products')}
                className="mr-4 p-2 rounded-md text-gray-400 hover:text-gray-500"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div className="flex items-center">
                <MapPin className="h-6 w-6 text-purple-600 mr-2" />
                <h1 className="text-xl font-semibold text-gray-900">
                  Rastreabilidade - {data.product.name}
                </h1>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Resumo */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Resumo de Rastreabilidade</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{data.summary.complianceScore}%</div>
                <div className="text-sm text-gray-500">Score de Conformidade</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{data.summary.totalEvents}</div>
                <div className="text-sm text-gray-500">Total de Eventos</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">{data.summary.uniqueLocations}</div>
                <div className="text-sm text-gray-500">Localizações Únicas</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600">{data.summary.totalDistance}km</div>
                <div className="text-sm text-gray-500">Distância Total</div>
              </div>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-6">Timeline de Rastreabilidade</h2>
            <div className="flow-root">
              <ul className="-mb-8">
                {data.events.map((event: any, eventIdx: number) => (
                  <li key={event.id}>
                    <div className="relative pb-8">
                      {eventIdx !== data.events.length - 1 ? (
                        <span
                          className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                          aria-hidden="true"
                        />
                      ) : null}
                      <div className="relative flex space-x-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white border-2 border-gray-300">
                          {getEventIcon(event.type)}
                        </div>
                        <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{event.title}</p>
                            <p className="text-sm text-gray-500">{event.description}</p>
                            <p className="text-xs text-gray-400 mt-1">
                              📍 {event.location}
                              {event.temperature && ` • 🌡️ ${event.temperature}°C`}
                              {event.humidity && ` • 💧 ${event.humidity}%`}
                            </p>
                          </div>
                          <div className="whitespace-nowrap text-right text-sm text-gray-500">
                            <time dateTime={event.timestamp}>
                              {new Date(event.timestamp).toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </time>
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleTraceabilityPage;
