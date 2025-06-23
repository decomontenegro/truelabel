import React, { useState } from 'react';
import { FileText, Calendar, AlertCircle, Upload, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { format } from 'date-fns';
import { useAsyncAction } from '../../hooks/useAsyncAction';
import { validationService } from '../../services/validationService';
import { toast } from 'react-hot-toast';

interface RevalidationFormData {
  reason: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  requestedDate?: string;
  formulaChanged: boolean;
  changeDescription?: string;
  attachments?: FileList;
}

interface RevalidationRequestFormProps {
  productId: string;
  productName: string;
  currentValidationId: string;
  expiryDate: Date;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const RevalidationRequestForm: React.FC<RevalidationRequestFormProps> = ({
  productId,
  productName,
  currentValidationId,
  expiryDate,
  onSuccess,
  onCancel
}) => {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  
  const { register, handleSubmit, watch, formState: { errors } } = useForm<RevalidationFormData>({
    defaultValues: {
      urgency: 'medium',
      formulaChanged: false
    }
  });

  const formulaChanged = watch('formulaChanged');

  const { execute: submitRequest, loading } = useAsyncAction(async (data: RevalidationFormData) => {
    const formData = new FormData();
    formData.append('productId', productId);
    formData.append('currentValidationId', currentValidationId);
    formData.append('reason', data.reason);
    formData.append('urgency', data.urgency);
    
    if (data.requestedDate) {
      formData.append('requestedDate', data.requestedDate);
    }
    
    formData.append('formulaChanged', String(data.formulaChanged));
    
    if (data.formulaChanged && data.changeDescription) {
      formData.append('changeDescription', data.changeDescription);
    }

    // Add uploaded files
    uploadedFiles.forEach((file, index) => {
      formData.append(`attachments[${index}]`, file);
    });

    await validationService.requestRevalidation(formData);
    toast.success('Revalidation request submitted successfully');
    onSuccess?.();
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setUploadedFiles(Array.from(e.target.files));
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(files => files.filter((_, i) => i !== index));
  };

  const urgencyLevels = {
    low: { label: 'Low', color: 'text-gray-600', bg: 'bg-gray-100' },
    medium: { label: 'Medium', color: 'text-blue-600', bg: 'bg-blue-100' },
    high: { label: 'High', color: 'text-orange-600', bg: 'bg-orange-100' },
    critical: { label: 'Critical', color: 'text-red-600', bg: 'bg-red-100' }
  };

  return (
    <form onSubmit={handleSubmit(submitRequest)} className="space-y-6">
      {/* Product Info */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-2">Product Information</h4>
        <dl className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-gray-500">Product</dt>
            <dd className="font-medium text-gray-900">{productName}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Current Expiry</dt>
            <dd className="font-medium text-gray-900">{format(expiryDate, 'PPP')}</dd>
          </div>
        </dl>
      </div>

      {/* Reason */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Reason for Revalidation <span className="text-red-500">*</span>
        </label>
        <textarea
          {...register('reason', { required: 'Reason is required' })}
          rows={3}
          className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          placeholder="Explain why revalidation is needed..."
        />
        {errors.reason && (
          <p className="mt-1 text-sm text-red-600">{errors.reason.message}</p>
        )}
      </div>

      {/* Urgency */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Urgency Level <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-4 gap-3">
          {Object.entries(urgencyLevels).map(([value, config]) => (
            <label
              key={value}
              className="relative flex items-center justify-center cursor-pointer"
            >
              <input
                type="radio"
                {...register('urgency')}
                value={value}
                className="sr-only"
              />
              <span className={`
                w-full py-2 px-3 rounded-lg border text-center text-sm font-medium transition-colors
                ${watch('urgency') === value 
                  ? `${config.bg} ${config.color} border-current` 
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }
              `}>
                {config.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Requested Date */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Requested Completion Date (Optional)
        </label>
        <div className="relative">
          <Calendar className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          <input
            type="date"
            {...register('requestedDate')}
            min={format(new Date(), 'yyyy-MM-dd')}
            className="pl-10 w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Formula Change */}
      <div className="space-y-4">
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            {...register('formulaChanged')}
            className="mt-1 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          <div>
            <span className="text-sm font-medium text-gray-700">
              Product formula has changed
            </span>
            <p className="text-xs text-gray-500 mt-1">
              Check this if the product composition or ingredients have been modified
            </p>
          </div>
        </label>

        {formulaChanged && (
          <div className="ml-7">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Describe the changes <span className="text-red-500">*</span>
            </label>
            <textarea
              {...register('changeDescription', { 
                required: formulaChanged ? 'Please describe the formula changes' : false 
              })}
              rows={3}
              className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="List the changes made to the product formula..."
            />
            {errors.changeDescription && (
              <p className="mt-1 text-sm text-red-600">{errors.changeDescription.message}</p>
            )}
          </div>
        )}
      </div>

      {/* Attachments */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Supporting Documents (Optional)
        </label>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
          <input
            type="file"
            multiple
            onChange={handleFileChange}
            className="hidden"
            id="file-upload"
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
          />
          <label
            htmlFor="file-upload"
            className="flex flex-col items-center cursor-pointer"
          >
            <Upload className="h-8 w-8 text-gray-400 mb-2" />
            <span className="text-sm text-gray-600">
              Click to upload or drag and drop
            </span>
            <span className="text-xs text-gray-500 mt-1">
              PDF, DOC, DOCX, JPG, PNG up to 10MB each
            </span>
          </label>

          {uploadedFiles.length > 0 && (
            <div className="mt-4 space-y-2">
              {uploadedFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-700">{file.name}</span>
                    <span className="text-xs text-gray-500">
                      ({(file.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex gap-3">
          <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Important Notice</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>Revalidation requests are processed based on urgency and laboratory availability</li>
              <li>You will receive email notifications about the status of your request</li>
              <li>The QR code will remain active during the revalidation process</li>
              <li>Formula changes may require additional testing and documentation</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? 'Submitting...' : 'Submit Request'}
        </button>
      </div>
    </form>
  );
};