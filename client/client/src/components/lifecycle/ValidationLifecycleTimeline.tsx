import React from 'react';
import { Clock, AlertCircle, CheckCircle, XCircle, RefreshCw, Calendar } from 'lucide-react';
import { format, formatDistanceToNow, isPast, isWithinInterval, addDays } from 'date-fns';

interface LifecycleEvent {
  id: string;
  type: 'created' | 'validated' | 'expired' | 'revalidated' | 'suspended' | 'reactivated' | 'formula_changed';
  date: Date;
  title: string;
  description: string;
  actor?: string;
  metadata?: Record<string, any>;
}

interface ValidationLifecycleTimelineProps {
  events: LifecycleEvent[];
  currentStatus: 'active' | 'expired' | 'suspended' | 'pending_revalidation';
  expiryDate?: Date;
  nextRevalidationDate?: Date;
  onEventClick?: (event: LifecycleEvent) => void;
}

export const ValidationLifecycleTimeline: React.FC<ValidationLifecycleTimelineProps> = ({
  events,
  currentStatus,
  expiryDate,
  nextRevalidationDate,
  onEventClick
}) => {
  const getEventIcon = (type: LifecycleEvent['type']) => {
    switch (type) {
      case 'created':
        return <Calendar className="h-5 w-5" />;
      case 'validated':
        return <CheckCircle className="h-5 w-5" />;
      case 'expired':
        return <XCircle className="h-5 w-5" />;
      case 'revalidated':
        return <RefreshCw className="h-5 w-5" />;
      case 'suspended':
        return <AlertCircle className="h-5 w-5" />;
      case 'reactivated':
        return <CheckCircle className="h-5 w-5" />;
      case 'formula_changed':
        return <AlertCircle className="h-5 w-5" />;
      default:
        return <Clock className="h-5 w-5" />;
    }
  };

  const getEventColor = (type: LifecycleEvent['type']) => {
    switch (type) {
      case 'created':
        return 'bg-blue-100 text-blue-600 border-blue-200';
      case 'validated':
      case 'reactivated':
        return 'bg-green-100 text-green-600 border-green-200';
      case 'expired':
        return 'bg-red-100 text-red-600 border-red-200';
      case 'revalidated':
        return 'bg-indigo-100 text-indigo-600 border-indigo-200';
      case 'suspended':
      case 'formula_changed':
        return 'bg-orange-100 text-orange-600 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const getStatusBadge = () => {
    const badges = {
      active: { bg: 'bg-green-100', text: 'text-green-800', label: 'Active' },
      expired: { bg: 'bg-red-100', text: 'text-red-800', label: 'Expired' },
      suspended: { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Suspended' },
      pending_revalidation: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending Revalidation' }
    };

    const badge = badges[currentStatus];
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };

  const getUpcomingWarnings = () => {
    const warnings = [];
    
    if (expiryDate && !isPast(expiryDate)) {
      const daysUntilExpiry = Math.ceil((expiryDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      if (daysUntilExpiry <= 30) {
        warnings.push({
          type: 'expiry',
          message: `Expires in ${formatDistanceToNow(expiryDate)}`,
          severity: daysUntilExpiry <= 7 ? 'high' : 'medium'
        });
      }
    }

    if (nextRevalidationDate && !isPast(nextRevalidationDate)) {
      const daysUntilRevalidation = Math.ceil((nextRevalidationDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      if (daysUntilRevalidation <= 14) {
        warnings.push({
          type: 'revalidation',
          message: `Revalidation due in ${formatDistanceToNow(nextRevalidationDate)}`,
          severity: daysUntilRevalidation <= 3 ? 'high' : 'medium'
        });
      }
    }

    return warnings;
  };

  const warnings = getUpcomingWarnings();
  const sortedEvents = [...events].sort((a, b) => b.date.getTime() - a.date.getTime());

  return (
    <div className="space-y-6">
      {/* Status Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Validation Lifecycle</h3>
          {getStatusBadge()}
        </div>

        {/* Warnings */}
        {warnings.length > 0 && (
          <div className="space-y-2 mb-4">
            {warnings.map((warning, index) => (
              <div
                key={index}
                className={`flex items-center gap-2 p-3 rounded-lg ${
                  warning.severity === 'high' 
                    ? 'bg-red-50 text-red-800' 
                    : 'bg-orange-50 text-orange-800'
                }`}
              >
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <span className="text-sm font-medium">{warning.message}</span>
              </div>
            ))}
          </div>
        )}

        {/* Key Dates */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {expiryDate && (
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Expiry Date</p>
                <p className="text-sm font-medium text-gray-900">
                  {format(expiryDate, 'PPP')}
                </p>
              </div>
            </div>
          )}
          {nextRevalidationDate && (
            <div className="flex items-center gap-3">
              <RefreshCw className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Next Revalidation</p>
                <p className="text-sm font-medium text-gray-900">
                  {format(nextRevalidationDate, 'PPP')}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h4 className="text-md font-semibold text-gray-900 mb-6">Event Timeline</h4>
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-6 top-8 bottom-0 w-0.5 bg-gray-200"></div>

          {/* Events */}
          <div className="space-y-6">
            {sortedEvents.map((event, index) => {
              const isLast = index === sortedEvents.length - 1;
              return (
                <div
                  key={event.id}
                  className={`relative flex gap-4 ${onEventClick ? 'cursor-pointer hover:bg-gray-50 -mx-4 px-4 py-2 rounded-lg transition-colors' : ''}`}
                  onClick={() => onEventClick?.(event)}
                >
                  {/* Event dot and icon */}
                  <div className={`relative z-10 flex items-center justify-center w-12 h-12 rounded-full border-2 ${getEventColor(event.type)}`}>
                    {getEventIcon(event.type)}
                  </div>

                  {/* Event content */}
                  <div className={`flex-1 ${isLast ? '' : 'pb-6'}`}>
                    <div className="flex items-start justify-between">
                      <div>
                        <h5 className="font-medium text-gray-900">{event.title}</h5>
                        <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                        {event.actor && (
                          <p className="text-xs text-gray-500 mt-2">By: {event.actor}</p>
                        )}
                      </div>
                      <time className="text-sm text-gray-500 ml-4 flex-shrink-0">
                        {format(event.date, 'PPp')}
                      </time>
                    </div>

                    {/* Metadata */}
                    {event.metadata && Object.keys(event.metadata).length > 0 && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <dl className="grid grid-cols-2 gap-2 text-sm">
                          {Object.entries(event.metadata).map(([key, value]) => (
                            <div key={key}>
                              <dt className="text-gray-500">{key}:</dt>
                              <dd className="font-medium text-gray-900">{String(value)}</dd>
                            </div>
                          ))}
                        </dl>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};