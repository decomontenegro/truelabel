import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Package, Truck, Anchor, Plane, Train, Factory, Store } from 'lucide-react';
import { SupplyChainRoute, LocationPoint, RouteSegment } from '@/types/traceability';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface SupplyChainMapProps {
  route: SupplyChainRoute;
  height?: string;
  showDetails?: boolean;
}

const SupplyChainMap: React.FC<SupplyChainMapProps> = ({
  route,
  height = '500px',
  showDetails = true
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [selectedSegment, setSelectedSegment] = useState<RouteSegment | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Transport mode icons
  const transportIcons = {
    SHIP: Anchor,
    TRUCK: Truck,
    RAIL: Train,
    AIR: Plane,
    MIXED: Package
  };

  // Location type icons
  const locationIcons = {
    ORIGIN: MapPin,
    PROCESSING: Factory,
    WAREHOUSE: Package,
    PORT: Anchor,
    DESTINATION: Store
  };

  useEffect(() => {
    // Simulate map loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const getTransportIcon = (mode: RouteSegment['transportMode']) => {
    const Icon = transportIcons[mode] || Package;
    return <Icon className="w-4 h-4" />;
  };

  const getLocationIcon = (type: LocationPoint['type']) => {
    const Icon = locationIcons[type] || MapPin;
    return <Icon className="w-5 h-5" />;
  };

  const formatDistance = (distance?: number) => {
    if (!distance) return 'N/A';
    return `${distance.toLocaleString()} km`;
  };

  const formatDuration = (duration?: number) => {
    if (!duration) return 'N/A';
    const days = Math.floor(duration / 24);
    const hours = duration % 24;
    if (days > 0) {
      return `${days}d ${hours}h`;
    }
    return `${hours}h`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="supply-chain-map space-y-4">
      {/* Map Container */}
      <div 
        ref={mapRef}
        className="relative bg-gray-100 rounded-lg overflow-hidden shadow-inner"
        style={{ height }}
      >
        {/* Placeholder for actual map implementation */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <MapPin className="w-12 h-12 mx-auto mb-2" />
            <p>Interactive map will be displayed here</p>
            <p className="text-sm">Integrate with mapping service (Google Maps, Mapbox, etc.)</p>
          </div>
        </div>

        {/* Route Overview Card */}
        {showDetails && (
          <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-4 max-w-xs">
            <h3 className="font-semibold text-gray-900 mb-2">Route Overview</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Total Distance:</span>
                <span className="font-medium">{formatDistance(route.totalDistance)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Total Duration:</span>
                <span className="font-medium">{formatDuration(route.totalDuration)}</span>
              </div>
              {route.carbonFootprint && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Carbon Footprint:</span>
                  <span className="font-medium">{route.carbonFootprint.toFixed(2)} kg CO₂</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Route Timeline */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Supply Chain Journey</h3>
        <div className="space-y-4">
          {route.routes.map((segment, index) => (
            <div key={index} className="relative">
              {/* Connection Line */}
              {index < route.routes.length - 1 && (
                <div className="absolute left-6 top-12 bottom-0 w-0.5 bg-gray-300"></div>
              )}

              {/* Segment Card */}
              <div
                className={`border rounded-lg p-4 cursor-pointer transition-all ${
                  selectedSegment === segment
                    ? 'border-blue-500 shadow-md bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedSegment(segment === selectedSegment ? null : segment)}
              >
                <div className="flex items-start gap-4">
                  {/* From Location */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="p-2 bg-gray-100 rounded-full text-gray-600">
                        {getLocationIcon(segment.from.type)}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{segment.from.name}</h4>
                        <p className="text-sm text-gray-500">{segment.from.facility || segment.from.address}</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 ml-12">
                      {new Date(segment.startDate).toLocaleDateString()}
                    </p>
                  </div>

                  {/* Transport Mode */}
                  <div className="flex items-center gap-2 px-4">
                    <div className="p-2 bg-blue-100 rounded-full text-blue-600">
                      {getTransportIcon(segment.transportMode)}
                    </div>
                    <div className="text-sm">
                      <p className="font-medium text-gray-700">{segment.transportMode}</p>
                      {segment.carrier && (
                        <p className="text-gray-500">{segment.carrier}</p>
                      )}
                    </div>
                  </div>

                  {/* To Location */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="p-2 bg-gray-100 rounded-full text-gray-600">
                        {getLocationIcon(segment.to.type)}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{segment.to.name}</h4>
                        <p className="text-sm text-gray-500">{segment.to.facility || segment.to.address}</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 ml-12">
                      {segment.endDate ? new Date(segment.endDate).toLocaleDateString() : 'In transit'}
                    </p>
                  </div>
                </div>

                {/* Expanded Details */}
                {selectedSegment === segment && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Distance</p>
                        <p className="font-medium">{formatDistance(segment.distance)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Duration</p>
                        <p className="font-medium">{formatDuration(segment.duration)}</p>
                      </div>
                      {segment.trackingNumber && (
                        <div>
                          <p className="text-gray-500">Tracking #</p>
                          <p className="font-medium font-mono text-xs">{segment.trackingNumber}</p>
                        </div>
                      )}
                      {segment.temperature && segment.temperature.length > 0 && (
                        <div>
                          <p className="text-gray-500">Avg Temperature</p>
                          <p className="font-medium">
                            {(
                              segment.temperature.reduce((sum, log) => sum + log.temperature, 0) /
                              segment.temperature.length
                            ).toFixed(1)}°
                            {segment.temperature[0].unit}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SupplyChainMap;