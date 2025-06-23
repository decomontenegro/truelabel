import React, { useState } from 'react';
import { 
  Calendar, MapPin, Thermometer, Droplets, FileText, Image, 
  Shield, Package, Truck, Factory, Store, Leaf, AlertCircle,
  ChevronDown, ChevronUp, ExternalLink
} from 'lucide-react';
import { SupplyChainEvent } from '@/types/traceability';
import { format, formatDistanceToNow } from 'date-fns';

interface TraceabilityTimelineProps {
  events: SupplyChainEvent[];
  showFilters?: boolean;
  compactMode?: boolean;
}

const TraceabilityTimeline: React.FC<TraceabilityTimelineProps> = ({
  events,
  showFilters = true,
  compactMode = false
}) => {
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());
  const [selectedType, setSelectedType] = useState<string>('ALL');

  const eventTypeIcons = {
    HARVEST: Leaf,
    PROCESSING: Factory,
    PACKAGING: Package,
    SHIPPING: Truck,
    STORAGE: Package,
    DISTRIBUTION: Truck,
    RETAIL: Store,
    CUSTOM: AlertCircle
  };

  const eventTypeColors = {
    HARVEST: 'bg-green-100 text-green-700 border-green-200',
    PROCESSING: 'bg-blue-100 text-blue-700 border-blue-200',
    PACKAGING: 'bg-purple-100 text-purple-700 border-purple-200',
    SHIPPING: 'bg-orange-100 text-orange-700 border-orange-200',
    STORAGE: 'bg-gray-100 text-gray-700 border-gray-200',
    DISTRIBUTION: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    RETAIL: 'bg-pink-100 text-pink-700 border-pink-200',
    CUSTOM: 'bg-red-100 text-red-700 border-red-200'
  };

  const getEventIcon = (type: SupplyChainEvent['type']) => {
    const Icon = eventTypeIcons[type] || AlertCircle;
    return <Icon className="w-5 h-5" />;
  };

  const toggleEventExpanded = (eventId: string) => {
    const newExpanded = new Set(expandedEvents);
    if (newExpanded.has(eventId)) {
      newExpanded.delete(eventId);
    } else {
      newExpanded.add(eventId);
    }
    setExpandedEvents(newExpanded);
  };

  const filteredEvents = selectedType === 'ALL' 
    ? events 
    : events.filter(event => event.type === selectedType);

  const eventTypes = Array.from(new Set(events.map(e => e.type)));

  return (
    <div className="space-y-4">
      {/* Filters */}
      {showFilters && (
        <div className="bg-white rounded-lg shadow-sm p-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Filter by Event Type</h4>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedType('ALL')}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                selectedType === 'ALL'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Events ({events.length})
            </button>
            {eventTypes.map(type => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors flex items-center gap-1 ${
                  selectedType === type
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {getEventIcon(type)}
                <span>{type} ({events.filter(e => e.type === type).length})</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Supply Chain Timeline</h3>
        
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>
          
          {/* Events */}
          <div className="space-y-6">
            {filteredEvents.map((event, index) => {
              const isExpanded = expandedEvents.has(event.id);
              const Icon = eventTypeIcons[event.type] || AlertCircle;
              
              return (
                <div key={event.id} className="relative">
                  {/* Timeline dot */}
                  <div className="absolute left-4 w-4 h-4 bg-white border-4 border-blue-500 rounded-full z-10"></div>
                  
                  {/* Event card */}
                  <div className="ml-12">
                    <div
                      className={`bg-white border rounded-lg p-4 cursor-pointer transition-all ${
                        isExpanded ? 'border-blue-500 shadow-md' : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => toggleEventExpanded(event.id)}
                    >
                      {/* Event header */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg ${eventTypeColors[event.type]}`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900">{event.title}</h4>
                            <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                            
                            {/* Basic info */}
                            <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-500">
                              <div className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                <span>{event.location}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                <span>{format(new Date(event.timestamp), 'MMM dd, yyyy HH:mm')}</span>
                              </div>
                              {!compactMode && (
                                <span className="text-gray-400">
                                  {formatDistanceToNow(new Date(event.timestamp), { addSuffix: true })}
                                </span>
                              )}
                            </div>

                            {/* Environmental conditions */}
                            {(event.temperature !== undefined || event.humidity !== undefined) && (
                              <div className="flex gap-4 mt-2">
                                {event.temperature !== undefined && (
                                  <div className="flex items-center gap-1 text-sm text-blue-600">
                                    <Thermometer className="w-3 h-3" />
                                    <span>{event.temperature}°C</span>
                                  </div>
                                )}
                                {event.humidity !== undefined && (
                                  <div className="flex items-center gap-1 text-sm text-cyan-600">
                                    <Droplets className="w-3 h-3" />
                                    <span>{event.humidity}%</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        <button className="text-gray-400 hover:text-gray-600">
                          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        </button>
                      </div>

                      {/* Expanded content */}
                      {isExpanded && (
                        <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
                          {/* Documents */}
                          {event.documents && event.documents.length > 0 && (
                            <div>
                              <h5 className="text-sm font-medium text-gray-700 mb-2">Documents</h5>
                              <div className="grid grid-cols-2 gap-2">
                                {event.documents.map((doc, docIndex) => (
                                  <a
                                    key={docIndex}
                                    href={doc.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 p-2 bg-gray-50 rounded hover:bg-gray-100 transition-colors"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <FileText className="w-4 h-4 text-gray-500" />
                                    <span className="text-sm text-gray-700 truncate">{doc.name}</span>
                                    <ExternalLink className="w-3 h-3 text-gray-400 ml-auto" />
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Images */}
                          {event.images && event.images.length > 0 && (
                            <div>
                              <h5 className="text-sm font-medium text-gray-700 mb-2">Images</h5>
                              <div className="grid grid-cols-3 gap-2">
                                {event.images.map((image, imgIndex) => (
                                  <a
                                    key={imgIndex}
                                    href={image}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="relative aspect-square bg-gray-100 rounded overflow-hidden hover:opacity-90 transition-opacity"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <img
                                      src={image}
                                      alt={`Event image ${imgIndex + 1}`}
                                      className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 hover:bg-opacity-20 transition-all">
                                      <Image className="w-6 h-6 text-white opacity-0 hover:opacity-100" />
                                    </div>
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Certifications */}
                          {event.certifications && event.certifications.length > 0 && (
                            <div>
                              <h5 className="text-sm font-medium text-gray-700 mb-2">Certifications</h5>
                              <div className="flex flex-wrap gap-2">
                                {event.certifications.map((cert, certIndex) => (
                                  <div
                                    key={certIndex}
                                    className="flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 rounded-full text-xs"
                                  >
                                    <Shield className="w-3 h-3" />
                                    <span>{cert}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Verification */}
                          {event.verificationHash && (
                            <div className="bg-blue-50 rounded p-3">
                              <div className="flex items-start gap-2">
                                <Shield className="w-4 h-4 text-blue-600 mt-0.5" />
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-blue-900">Verified Event</p>
                                  <p className="text-xs text-blue-700 font-mono mt-1 break-all">
                                    Hash: {event.verificationHash}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Additional metadata */}
                          {event.metadata && Object.keys(event.metadata).length > 0 && (
                            <div>
                              <h5 className="text-sm font-medium text-gray-700 mb-2">Additional Information</h5>
                              <div className="space-y-1">
                                {Object.entries(event.metadata).map(([key, value]) => (
                                  <div key={key} className="flex justify-between text-sm">
                                    <span className="text-gray-500">{key}:</span>
                                    <span className="text-gray-700 font-medium">{String(value)}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {filteredEvents.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>No events found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TraceabilityTimeline;