import React, { useState, useEffect, forwardRef } from 'react';
import { AlertCircle, Check, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

// Validation types
export type ValidationRule = {
  test: (value: any) => boolean;
  message: string;
};

export type ValidationRules = {
  required?: boolean | string;
  minLength?: number | { value: number; message: string };
  maxLength?: number | { value: number; message: string };
  pattern?: RegExp | { value: RegExp; message: string };
  email?: boolean | string;
  url?: boolean | string;
  min?: number | { value: number; message: string };
  max?: number | { value: number; message: string };
  custom?: ValidationRule[];
};

// Field validation hook
export const useFieldValidation = (
  value: any,
  rules?: ValidationRules,
  validateOnChange = true
) => {
  const [error, setError] = useState<string>('');
  const [isValid, setIsValid] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const validate = (val: any = value) => {
    if (!rules) {
      setIsValid(true);
      setError('');
      return true;
    }

    // Required validation
    if (rules.required) {
      const isEmpty = !val || (typeof val === 'string' && !val.trim());
      if (isEmpty) {
        const message = typeof rules.required === 'string' 
          ? rules.required 
          : 'This field is required';
        setError(message);
        setIsValid(false);
        return false;
      }
    }

    // String validations
    if (typeof val === 'string') {
      // Min length
      if (rules.minLength) {
        const minLength = typeof rules.minLength === 'number' 
          ? rules.minLength 
          : rules.minLength.value;
        const message = typeof rules.minLength === 'object' 
          ? rules.minLength.message 
          : `Must be at least ${minLength} characters`;
        
        if (val.length < minLength) {
          setError(message);
          setIsValid(false);
          return false;
        }
      }

      // Max length
      if (rules.maxLength) {
        const maxLength = typeof rules.maxLength === 'number' 
          ? rules.maxLength 
          : rules.maxLength.value;
        const message = typeof rules.maxLength === 'object' 
          ? rules.maxLength.message 
          : `Must be no more than ${maxLength} characters`;
        
        if (val.length > maxLength) {
          setError(message);
          setIsValid(false);
          return false;
        }
      }

      // Pattern
      if (rules.pattern) {
        const pattern = rules.pattern instanceof RegExp 
          ? rules.pattern 
          : rules.pattern.value;
        const message = rules.pattern instanceof RegExp 
          ? 'Invalid format' 
          : rules.pattern.message;
        
        if (!pattern.test(val)) {
          setError(message);
          setIsValid(false);
          return false;
        }
      }

      // Email
      if (rules.email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(val)) {
          const message = typeof rules.email === 'string' 
            ? rules.email 
            : 'Please enter a valid email';
          setError(message);
          setIsValid(false);
          return false;
        }
      }

      // URL
      if (rules.url) {
        try {
          new URL(val);
        } catch {
          const message = typeof rules.url === 'string' 
            ? rules.url 
            : 'Please enter a valid URL';
          setError(message);
          setIsValid(false);
          return false;
        }
      }
    }

    // Number validations
    if (typeof val === 'number') {
      // Min
      if (rules.min !== undefined) {
        const min = typeof rules.min === 'number' ? rules.min : rules.min.value;
        const message = typeof rules.min === 'object' 
          ? rules.min.message 
          : `Must be at least ${min}`;
        
        if (val < min) {
          setError(message);
          setIsValid(false);
          return false;
        }
      }

      // Max
      if (rules.max !== undefined) {
        const max = typeof rules.max === 'number' ? rules.max : rules.max.value;
        const message = typeof rules.max === 'object' 
          ? rules.max.message 
          : `Must be no more than ${max}`;
        
        if (val > max) {
          setError(message);
          setIsValid(false);
          return false;
        }
      }
    }

    // Custom validations
    if (rules.custom) {
      for (const rule of rules.custom) {
        if (!rule.test(val)) {
          setError(rule.message);
          setIsValid(false);
          return false;
        }
      }
    }

    setError('');
    setIsValid(true);
    return true;
  };

  useEffect(() => {
    if (isDirty && validateOnChange) {
      validate();
    }
  }, [value, isDirty, validateOnChange]);

  return {
    error,
    isValid,
    isDirty,
    validate,
    setDirty: () => setIsDirty(true),
    reset: () => {
      setError('');
      setIsValid(false);
      setIsDirty(false);
    },
  };
};

// Enhanced Input component with validation
interface ValidatedFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  rules?: ValidationRules;
  showValidIcon?: boolean;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  onValidChange?: (isValid: boolean) => void;
}

export const ValidatedField = forwardRef<HTMLInputElement, ValidatedFieldProps>(
  ({
    label,
    error: externalError,
    helperText,
    rules,
    showValidIcon = true,
    validateOnChange = true,
    validateOnBlur = true,
    onValidChange,
    onChange,
    onBlur,
    value,
    className,
    required,
    type = 'text',
    ...props
  }, ref) => {
    const validation = useFieldValidation(value, rules, validateOnChange);
    const [showPassword, setShowPassword] = useState(false);
    
    const displayError = externalError || validation.error;
    const isPasswordField = type === 'password';
    const inputType = isPasswordField && showPassword ? 'text' : type;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!validation.isDirty) {
        validation.setDirty();
      }
      onChange?.(e);
      if (validateOnChange) {
        const isValid = validation.validate(e.target.value);
        onValidChange?.(isValid);
      }
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      validation.setDirty();
      if (validateOnBlur) {
        const isValid = validation.validate(e.target.value);
        onValidChange?.(isValid);
      }
      onBlur?.(e);
    };

    return (
      <div className="space-y-1">
        {label && (
          <label className="block text-sm font-medium text-gray-700">
            {label}
            {(required || rules?.required) && (
              <span className="text-red-500 ml-1">*</span>
            )}
          </label>
        )}
        
        <div className="relative">
          <input
            ref={ref}
            type={inputType}
            value={value}
            onChange={handleChange}
            onBlur={handleBlur}
            className={cn(
              'w-full px-3 py-2 border rounded-md shadow-sm',
              'focus:outline-none focus:ring-2 focus:ring-offset-0',
              displayError 
                ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500',
              (showValidIcon || isPasswordField) && 'pr-10',
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
          
          {/* Password toggle */}
          {isPasswordField && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 flex items-center pr-3"
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
              ) : (
                <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
              )}
            </button>
          )}
          
          {/* Validation icons */}
          {!isPasswordField && (
            <>
              {showValidIcon && validation.isValid && validation.isDirty && !displayError && (
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <Check className="h-5 w-5 text-green-500" />
                </div>
              )}
              
              {displayError && validation.isDirty && (
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                </div>
              )}
            </>
          )}
        </div>
        
        {/* Error message with animation */}
        {displayError && validation.isDirty && (
          <p 
            id={`${props.id}-error`}
            className="text-sm text-red-600 animate-fadeIn" 
            role="alert"
          >
            {displayError}
          </p>
        )}
        
        {/* Helper text */}
        {helperText && !displayError && (
          <p 
            id={`${props.id}-helper`}
            className="text-sm text-gray-500"
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

ValidatedField.displayName = 'ValidatedField';

// Password strength indicator
interface PasswordStrengthProps {
  password: string;
  showStrength?: boolean;
  minLength?: number;
}

export const PasswordStrength: React.FC<PasswordStrengthProps> = ({
  password,
  showStrength = true,
  minLength = 8,
}) => {
  const calculateStrength = () => {
    let strength = 0;
    
    if (password.length >= minLength) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z\d]/.test(password)) strength++;

    return Math.min(strength, 4);
  };

  const strength = calculateStrength();
  const strengthLabels = ['Weak', 'Fair', 'Good', 'Strong'];
  const strengthColors = ['bg-red-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500'];

  if (!password || !showStrength) return null;

  return (
    <div className="mt-2 space-y-1">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={cn(
              'h-1 flex-1 rounded-full transition-colors',
              i < strength ? strengthColors[strength - 1] : 'bg-gray-200'
            )}
          />
        ))}
      </div>
      {strength > 0 && (
        <p className="text-xs text-gray-600">
          Password strength: <span className="font-medium">{strengthLabels[strength - 1]}</span>
        </p>
      )}
    </div>
  );
};

// Form validation context for complex forms
interface FormValidationContextValue {
  fields: Record<string, any>;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  isValid: boolean;
  setFieldValue: (name: string, value: any) => void;
  setFieldError: (name: string, error: string) => void;
  setFieldTouched: (name: string, touched: boolean) => void;
  validateField: (name: string) => boolean;
  validateForm: () => boolean;
  resetForm: () => void;
}

const FormValidationContext = React.createContext<FormValidationContextValue | undefined>(
  undefined
);

export const useFormValidation = () => {
  const context = React.useContext(FormValidationContext);
  if (!context) {
    throw new Error('useFormValidation must be used within a FormValidationProvider');
  }
  return context;
};

interface FormValidationProviderProps {
  children: React.ReactNode;
  initialValues?: Record<string, any>;
  validationRules?: Record<string, ValidationRules>;
  onSubmit?: (values: Record<string, any>) => void;
}

export const FormValidationProvider: React.FC<FormValidationProviderProps> = ({
  children,
  initialValues = {},
  validationRules = {},
  onSubmit,
}) => {
  const [fields, setFields] = useState(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Implementation would include all validation logic here
  // This is a simplified version for demonstration

  const value: FormValidationContextValue = {
    fields,
    errors,
    touched,
    isValid: Object.keys(errors).length === 0,
    setFieldValue: (name, value) => {
      setFields(prev => ({ ...prev, [name]: value }));
    },
    setFieldError: (name, error) => {
      setErrors(prev => ({ ...prev, [name]: error }));
    },
    setFieldTouched: (name, touched) => {
      setTouched(prev => ({ ...prev, [name]: touched }));
    },
    validateField: (name) => {
      // Validation logic here
      return true;
    },
    validateForm: () => {
      // Full form validation
      return true;
    },
    resetForm: () => {
      setFields(initialValues);
      setErrors({});
      setTouched({});
    },
  };

  return (
    <FormValidationContext.Provider value={value}>
      {children}
    </FormValidationContext.Provider>
  );
};