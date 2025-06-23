import React, { useEffect, useState } from 'react';
import { Calendar, CheckCircle, XCircle, AlertTriangle, RefreshCw, FileText, Clock } from 'lucide-react';
import { CertificationTimeline as CertificationTimelineType } from '@/types/certifications';
import { certificationService } from '@/services/certificationService';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface CertificationTimelineProps {
  certificationId: string;
}

const CertificationTimeline: React.FC<CertificationTimelineProps> = ({ certificationId }) => {
  const [timeline, setTimeline] = useState<CertificationTimelineType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTimeline();
  }, [certificationId]);

  const loadTimeline = async () => {
    try {
      setLoading(true);
      setError(null);
      const timelineData = await certificationService.getCertificationTimeline(certificationId);
      setTimeline(timelineData);
    } catch (err) {
      console.error('Error loading timeline:', err);
      setError('Erro ao carregar histórico da certificação');
    } finally {
      setLoading(false);
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'ISSUED':
        return { icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-100' };
      case 'RENEWED':
        return { icon: RefreshCw, color: 'text-blue-600', bgColor: 'bg-blue-100' };
      case 'VERIFIED':
        return { icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-100' };
      case 'EXPIRED':
        return { icon: Clock, color: 'text-red-600', bgColor: 'bg-red-100' };
      case 'SUSPENDED':
        return { icon: AlertTriangle, color: 'text-yellow-600', bgColor: 'bg-yellow-100' };
      case 'REVOKED':
        return { icon: XCircle, color: 'text-red-600', bgColor: 'bg-red-100' };
      default:
        return { icon: Calendar, color: 'text-gray-600', bgColor: 'bg-gray-100' };
    }
  };

  const getEventLabel = (type: string) => {
    switch (type) {
      case 'ISSUED': return 'Emitido';
      case 'RENEWED': return 'Renovado';
      case 'VERIFIED': return 'Verificado';
      case 'EXPIRED': return 'Expirado';
      case 'SUSPENDED': return 'Suspenso';
      case 'REVOKED': return 'Revogado';
      default: return type;
    }
  };

  const formatDate = (date: string) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      </div>
    );
  }

  if (!timeline || timeline.events.length === 0) {
    return (
      <div className="text-center py-8">
        <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">Nenhum evento registrado para esta certificação</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200"></div>
      
      <div className="space-y-6">
        {timeline.events.map((event, index) => {
          const { icon: Icon, color, bgColor } = getEventIcon(event.type);
          
          return (
            <div key={event.id} className="relative flex items-start">
              {/* Icon */}
              <div className={`relative z-10 flex items-center justify-center w-16 h-16 rounded-full ${bgColor} border-4 border-white shadow-sm`}>
                <Icon className={`w-6 h-6 ${color}`} />
              </div>
              
              {/* Content */}
              <div className="ml-6 flex-1">
                <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        {getEventLabel(event.type)}
                      </h4>
                      <p className="text-sm text-gray-500">
                        {formatDate(event.date)}
                      </p>
                    </div>
                    {event.documentUrl && (
                      <a
                        href={event.documentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-600 hover:text-primary-700"
                      >
                        <FileText className="w-5 h-5" />
                      </a>
                    )}
                  </div>
                  
                  <p className="text-gray-700">{event.description}</p>
                  
                  {event.performedBy && (
                    <p className="text-sm text-gray-500 mt-2">
                      Por: {event.performedBy}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CertificationTimeline;