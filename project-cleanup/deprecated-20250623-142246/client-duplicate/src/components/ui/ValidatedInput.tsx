import { forwardRef, useState, useEffect } from 'react';
import { AlertCircle, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { sanitizeString } from '@/lib/validation';

interface ValidatedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  validate?: (value: string) => boolean | string;
  sanitize?: boolean;
  showValidIcon?: boolean;
  onValidatedChange?: (value: string, isValid: boolean) => void;
}

const ValidatedInput = forwardRef<HTMLInputElement, ValidatedInputProps>(
  ({
    label,
    error,
    helperText,
    validate,
    sanitize = true,
    showValidIcon = false,
    onValidatedChange,
    onChange,
    onBlur,
    value,
    className,
    required,
    ...props
  }, ref) => {
    const [localError, setLocalError] = useState<string>('');
    const [isValid, setIsValid] = useState(false);
    const [touched, setTouched] = useState(false);

    const displayError = error || localError;

    useEffect(() => {
      if (validate && value && touched) {
        const result = validate(String(value));
        if (typeof result === 'string') {
          setLocalError(result);
          setIsValid(false);
        } else {
          setLocalError('');
          setIsValid(result);
        }
      }
    }, [value, validate, touched]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let newValue = e.target.value;

      // Sanitizar input se habilitado
      if (sanitize && newValue) {
        newValue = sanitizeString(newValue);
        e.target.value = newValue;
      }

      // Validar se fornecido
      if (validate && touched) {
        const result = validate(newValue);
        if (typeof result === 'string') {
          setLocalError(result);
          setIsValid(false);
        } else {
          setLocalError('');
          setIsValid(result);
        }
      }

      // Chamar callbacks
      onChange?.(e);
      onValidatedChange?.(newValue, isValid);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setTouched(true);
      
      // Validar no blur
      if (validate && e.target.value) {
        const result = validate(e.target.value);
        if (typeof result === 'string') {
          setLocalError(result);
          setIsValid(false);
        } else {
          setLocalError('');
          setIsValid(result);
        }
      }

      onBlur?.(e);
    };

    return (
      <div className="space-y-1">
        {label && (
          <label className="block text-sm font-medium text-neutral-700 transition-colors duration-200 hover:text-neutral-900">
            {label}
            {required && <span className="text-error-500 ml-1">*</span>}
          </label>
        )}
        
        <div className="relative">
          <input
            ref={ref}
            value={value}
            onChange={handleChange}
            onBlur={handleBlur}
            className={cn(
              'input',
              displayError && 'input-error',
              isValid && touched && !displayError && 'input-success',
              isValid && showValidIcon && 'pr-10',
              className
            )}
            required={required}
            aria-invalid={!!displayError}
            aria-describedby={
              displayError ? `${props.id}-error` : 
              helperText ? `${props.id}-helper` : 
              undefined
            }
            {...props}
          />
          
          {/* Ícone de validação */}
          {showValidIcon && isValid && touched && !displayError && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <Check className="h-5 w-5 text-success-500 animate-scale-in" />
            </div>
          )}
          
          {/* Ícone de erro */}
          {displayError && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <AlertCircle className="h-5 w-5 text-error-500 animate-scale-in" />
            </div>
          )}
        </div>
        
        {/* Mensagem de erro */}
        {displayError && (
          <p 
            id={`${props.id}-error`}
            className="text-sm text-error-600 animate-slide-down" 
            role="alert"
          >
            {displayError}
          </p>
        )}
        
        {/* Texto de ajuda */}
        {helperText && !displayError && (
          <p 
            id={`${props.id}-helper`}
            className="text-sm text-neutral-500"
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

ValidatedInput.displayName = 'ValidatedInput';

export default ValidatedInput;