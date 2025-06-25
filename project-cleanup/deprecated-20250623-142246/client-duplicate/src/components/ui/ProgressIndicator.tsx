import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProgressStep {
  id: string;
  label: string;
  description?: string;
}

interface ProgressIndicatorProps {
  steps: ProgressStep[];
  currentStep: number;
  variant?: 'linear' | 'circular';
  showLabels?: boolean;
  className?: string;
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  steps,
  currentStep,
  variant = 'linear',
  showLabels = true,
  className,
}) => {
  if (variant === 'circular') {
    return (
      <CircularProgress
        steps={steps}
        currentStep={currentStep}
        showLabels={showLabels}
        className={className}
      />
    );
  }

  return (
    <LinearProgress
      steps={steps}
      currentStep={currentStep}
      showLabels={showLabels}
      className={className}
    />
  );
};

const LinearProgress: React.FC<ProgressIndicatorProps> = ({
  steps,
  currentStep,
  showLabels = true,
  className,
}) => {
  return (
    <div className={cn('w-full', className)}>
      <div className="relative">
        {/* Progress line */}
        <div className="absolute left-0 top-5 h-0.5 w-full bg-gray-200">
          <div
            className="h-full bg-blue-600 transition-all duration-300"
            style={{
              width: `${(currentStep / (steps.length - 1)) * 100}%`,
            }}
          />
        </div>

        {/* Steps */}
        <div className="relative flex justify-between">
          {steps.map((step, index) => {
            const isCompleted = index < currentStep;
            const isCurrent = index === currentStep;
            const isUpcoming = index > currentStep;

            return (
              <div
                key={step.id}
                className={cn(
                  'flex flex-col items-center',
                  index === 0 && 'items-start',
                  index === steps.length - 1 && 'items-end'
                )}
              >
                {/* Step circle */}
                <div
                  className={cn(
                    'relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 bg-white transition-all duration-300',
                    isCompleted && 'border-blue-600 bg-blue-600',
                    isCurrent && 'border-blue-600 bg-white',
                    isUpcoming && 'border-gray-300 bg-white'
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-5 w-5 text-white" />
                  ) : (
                    <span
                      className={cn(
                        'text-sm font-medium',
                        isCurrent && 'text-blue-600',
                        isUpcoming && 'text-gray-500'
                      )}
                    >
                      {index + 1}
                    </span>
                  )}
                </div>

                {/* Step label */}
                {showLabels && (
                  <div
                    className={cn(
                      'mt-2 text-center',
                      index === 0 && 'text-left',
                      index === steps.length - 1 && 'text-right'
                    )}
                  >
                    <p
                      className={cn(
                        'text-sm font-medium',
                        isCompleted && 'text-gray-900',
                        isCurrent && 'text-blue-600',
                        isUpcoming && 'text-gray-500'
                      )}
                    >
                      {step.label}
                    </p>
                    {step.description && (
                      <p className="mt-1 text-xs text-gray-500">
                        {step.description}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const CircularProgress: React.FC<ProgressIndicatorProps> = ({
  steps,
  currentStep,
  showLabels = true,
  className,
}) => {
  const percentage = (currentStep / (steps.length - 1)) * 100;
  const radius = 70;
  const strokeWidth = 8;
  const normalizedRadius = radius - strokeWidth * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className={cn('flex flex-col items-center', className)}>
      <div className="relative">
        <svg
          height={radius * 2}
          width={radius * 2}
          className="transform -rotate-90"
        >
          {/* Background circle */}
          <circle
            stroke="#e5e7eb"
            fill="transparent"
            strokeWidth={strokeWidth}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          {/* Progress circle */}
          <circle
            stroke="#2563eb"
            fill="transparent"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference + ' ' + circumference}
            style={{ strokeDashoffset }}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
            className="transition-all duration-300"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <p className="text-3xl font-bold text-gray-900">
              {Math.round(percentage)}%
            </p>
            <p className="text-sm text-gray-500">Complete</p>
          </div>
        </div>
      </div>

      {showLabels && (
        <div className="mt-6 space-y-2">
          {steps.map((step, index) => {
            const isCompleted = index < currentStep;
            const isCurrent = index === currentStep;
            const isUpcoming = index > currentStep;

            return (
              <div key={step.id} className="flex items-center space-x-3">
                <div
                  className={cn(
                    'flex h-6 w-6 items-center justify-center rounded-full border-2',
                    isCompleted && 'border-blue-600 bg-blue-600',
                    isCurrent && 'border-blue-600 bg-white',
                    isUpcoming && 'border-gray-300 bg-white'
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-3 w-3 text-white" />
                  ) : (
                    <span
                      className={cn(
                        'text-xs font-medium',
                        isCurrent && 'text-blue-600',
                        isUpcoming && 'text-gray-500'
                      )}
                    >
                      {index + 1}
                    </span>
                  )}
                </div>
                <span
                  className={cn(
                    'text-sm',
                    isCompleted && 'text-gray-900',
                    isCurrent && 'text-blue-600 font-medium',
                    isUpcoming && 'text-gray-500'
                  )}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// Simple progress bar
interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  showPercentage?: boolean;
  size?: 'sm' | 'md' | 'lg';
  color?: 'blue' | 'green' | 'yellow' | 'red';
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  label,
  showPercentage = false,
  size = 'md',
  color = 'blue',
  className,
}) => {
  const percentage = Math.min((value / max) * 100, 100);

  const heights = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  };

  const colors = {
    blue: 'bg-blue-600',
    green: 'bg-green-600',
    yellow: 'bg-yellow-600',
    red: 'bg-red-600',
  };

  return (
    <div className={cn('w-full', className)}>
      {(label || showPercentage) && (
        <div className="mb-1 flex justify-between text-sm">
          {label && <span className="text-gray-700">{label}</span>}
          {showPercentage && (
            <span className="text-gray-500">{Math.round(percentage)}%</span>
          )}
        </div>
      )}
      <div className={cn('w-full bg-gray-200 rounded-full overflow-hidden', heights[size])}>
        <div
          className={cn(
            'h-full transition-all duration-300',
            colors[color]
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};