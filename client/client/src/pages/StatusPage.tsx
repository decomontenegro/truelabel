import React, { useEffect, useState } from 'react';
import { CheckCircle, AlertCircle, XCircle, Clock } from 'lucide-react';

interface ServiceStatus {
  name: string;
  status: 'operational' | 'degraded' | 'down' | 'maintenance';
  responseTime: number;
  uptime: number;
  lastChecked: Date;
}

interface Incident {
  id: string;
  title: string;
  status: 'investigating' | 'identified' | 'monitoring' | 'resolved';
  impact: 'none' | 'minor' | 'major' | 'critical';
  createdAt: Date;
  updatedAt: Date;
  updates: Array<{
    message: string;
    timestamp: Date;
  }>;
}

export default function StatusPage() {
  const [services, setServices] = useState<ServiceStatus[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [overallStatus, setOverallStatus] = useState<'operational' | 'degraded' | 'down'>('operational');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch status data
    const fetchStatus = async () => {
      try {
        // This would be replaced with actual API calls
        const mockServices: ServiceStatus[] = [
          {
            name: 'API',
            status: 'operational',
            responseTime: 45,
            uptime: 99.98,
            lastChecked: new Date()
          },
          {
            name: 'Web Application',
            status: 'operational',
            responseTime: 120,
            uptime: 99.99,
            lastChecked: new Date()
          },
          {
            name: 'Database',
            status: 'operational',
            responseTime: 12,
            uptime: 99.95,
            lastChecked: new Date()
          },
          {
            name: 'QR Code Service',
            status: 'operational',
            responseTime: 85,
            uptime: 99.97,
            lastChecked: new Date()
          },
          {
            name: 'AI Validation Engine',
            status: 'operational',
            responseTime: 230,
            uptime: 99.90,
            lastChecked: new Date()
          }
        ];

        setServices(mockServices);
        
        // Calculate overall status
        const hasDown = mockServices.some(s => s.status === 'down');
        const hasDegraded = mockServices.some(s => s.status === 'degraded');
        
        if (hasDown) {
          setOverallStatus('down');
        } else if (hasDegraded) {
          setOverallStatus('degraded');
        } else {
          setOverallStatus('operational');
        }

        setLoading(false);
      } catch (error) {
        console.error('Error fetching status:', error);
        setLoading(false);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'operational':
        return <CheckCircle className="w-5 h-5 text-green-500" data-testid="check-icon" />;
      case 'degraded':
        return <AlertCircle className="w-5 h-5 text-yellow-500" data-testid="alert-icon" />;
      case 'down':
        return <XCircle className="w-5 h-5 text-red-500" data-testid="x-icon" />;
      case 'maintenance':
        return <Clock className="w-5 h-5 text-blue-500" data-testid="clock-icon" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational':
        return 'text-green-600 bg-green-50';
      case 'degraded':
        return 'text-yellow-600 bg-yellow-50';
      case 'down':
        return 'text-red-600 bg-red-50';
      case 'maintenance':
        return 'text-blue-600 bg-blue-50';
      default:
        return '';
    }
  };

  const getOverallStatusMessage = () => {
    switch (overallStatus) {
      case 'operational':
        return 'All Systems Operational';
      case 'degraded':
        return 'Partial System Outage';
      case 'down':
        return 'Major System Outage';
      default:
        return 'Unknown Status';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center" role="status">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking system status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Trust Label System Status</h1>
          <p className="mt-2 text-gray-600">Current status and incident history</p>
        </div>

        {/* Overall Status */}
        <div className={`rounded-lg p-6 mb-8 ${getStatusColor(overallStatus)}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {getStatusIcon(overallStatus)}
              <span className="text-2xl font-semibold">{getOverallStatusMessage()}</span>
            </div>
            <span className="text-sm">
              Last updated: {new Date().toLocaleTimeString()}
            </span>
          </div>
        </div>

        {/* Services Status */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Services</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {services.map((service) => (
              <div key={service.name} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(service.status)}
                    <div>
                      <p className="font-medium text-gray-900">{service.name}</p>
                      <p className="text-sm text-gray-500">
                        {service.uptime}% uptime
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {service.responseTime}ms
                    </p>
                    <p className="text-xs text-gray-500">Response time</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Incident History */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Incident History</h2>
          </div>
          <div className="px-6 py-4">
            {incidents.length === 0 ? (
              <p className="text-gray-500">No recent incidents</p>
            ) : (
              <div className="space-y-4">
                {incidents.map((incident) => (
                  <div key={incident.id} className="border-l-4 border-gray-200 pl-4">
                    <h3 className="font-medium text-gray-900">{incident.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {incident.status} - {incident.impact} impact
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {incident.updatedAt.toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            Need to report an issue?{' '}
            <a href="/contact" className="text-blue-600 hover:underline">
              Contact Support
            </a>
          </p>
          <p className="mt-2">
            Subscribe to updates via{' '}
            <a href="/api/status/subscribe" className="text-blue-600 hover:underline">
              RSS
            </a>
            {' or '}
            <a href="/api/status/webhook" className="text-blue-600 hover:underline">
              Webhook
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}