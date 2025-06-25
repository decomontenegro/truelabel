import * as React from 'react';
import { QRCode as QRCodeGenerator } from 'react-qrcode-generator';
import { cn } from '../utils/cn';

export interface QRCodeProps {
  value: string;
  size?: number;
  level?: 'L' | 'M' | 'Q' | 'H';
  backgroundColor?: string;
  foregroundColor?: string;
  className?: string;
  logo?: string;
  logoSize?: number;
}

export function QRCode({
  value,
  size = 256,
  level = 'M',
  backgroundColor = '#FFFFFF',
  foregroundColor = '#000000',
  className,
  logo,
  logoSize = 60,
}: QRCodeProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);

  return (
    <div
      ref={containerRef}
      className={cn('relative inline-block', className)}
      style={{ width: size, height: size }}
    >
      <QRCodeGenerator
        value={value}
        size={size}
        level={level}
        bgcolor={backgroundColor}
        fgcolor={foregroundColor}
      />
      {logo && (
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-2 rounded-lg"
          style={{ width: logoSize, height: logoSize }}
        >
          <img
            src={logo}
            alt="QR Code Logo"
            className="h-full w-full object-contain"
          />
        </div>
      )}
    </div>
  );
}

export interface QRCodeScannerProps {
  onScan: (data: string) => void;
  onError?: (error: Error) => void;
  className?: string;
}

export function QRCodeScanner({
  onScan,
  onError,
  className,
}: QRCodeScannerProps) {
  // QR Scanner implementation would go here
  // This is a placeholder as it requires camera access and additional libraries
  return (
    <div className={cn('relative', className)}>
      <div className="aspect-square w-full bg-gray-900 rounded-lg flex items-center justify-center">
        <p className="text-white text-center">
          QR Scanner requires camera permissions
        </p>
      </div>
    </div>
  );
}