import React, { useState } from 'react';
import { Check, X, AlertTriangle, Edit2, Save } from 'lucide-react';
import { DataPointValidation } from '@/types';

interface DataPointsReviewProps {
  dataPoints: DataPointValidation[];
  onUpdate?: (dataPoints: DataPointValidation[]) => void;
  readOnly?: boolean;
}

export const DataPointsReview: React.FC<DataPointsReviewProps> = ({ 
  dataPoints, 
  onUpdate,
  readOnly = false 
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedValue, setEditedValue] = useState<any>('');
  const [editedNotes, setEditedNotes] = useState<string>('');

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PASSED':
        return <Check className="w-5 h-5 text-green-600" />;
      case 'FAILED':
        return <X className="w-5 h-5 text-red-600" />;
      case 'WARNING':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      default:
        return <span className="w-5 h-5 text-gray-400">-</span>;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PASSED':
        return 'bg-green-50 border-green-200';
      case 'FAILED':
        return 'bg-red-50 border-red-200';
      case 'WARNING':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const handleEdit = (dataPoint: DataPointValidation) => {
    setEditingId(dataPoint.dataPointId);
    setEditedValue(dataPoint.validatedValue || dataPoint.value);
    setEditedNotes(dataPoint.notes || '');
  };

  const handleSave = () => {
    if (!editingId || !onUpdate) return;

    const updatedDataPoints = dataPoints.map(dp => {
      if (dp.dataPointId === editingId) {
        return {
          ...dp,
          validatedValue: editedValue,
          notes: editedNotes,
          // Recalculate deviation if applicable
          deviation: dp.threshold?.target 
            ? Math.abs((parseFloat(editedValue) - dp.threshold.target) / dp.threshold.target * 100)
            : dp.deviation
        };
      }
      return dp;
    });

    onUpdate(updatedDataPoints);
    setEditingId(null);
    setEditedValue('');
    setEditedNotes('');
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditedValue('');
    setEditedNotes('');
  };

  const groupedDataPoints = dataPoints.reduce((acc, dp) => {
    const category = dp.source || 'OUTROS';
    if (!acc[category]) acc[category] = [];
    acc[category].push(dp);
    return acc;
  }, {} as Record<string, DataPointValidation[]>);

  return (
    <div className="space-y-6">
      {Object.entries(groupedDataPoints).map(([category, points]) => (
        <div key={category} className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="bg-gray-50 px-6 py-3 border-b">
            <h3 className="text-sm font-semibold text-gray-900">
              {category === 'LAB_REPORT' && 'Dados do Relatório Laboratorial'}
              {category === 'MANUAL_ENTRY' && 'Dados Inseridos Manualmente'}
              {category === 'AUTOMATED_ANALYSIS' && 'Dados da Análise Automatizada'}
              {category === 'OUTROS' && 'Outros Dados'}
            </h3>
          </div>

          <div className="divide-y divide-gray-200">
            {points.map((dataPoint) => (
              <div 
                key={dataPoint.dataPointId}
                className={`px-6 py-4 ${getStatusColor(dataPoint.validationStatus)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center">
                      {getStatusIcon(dataPoint.validationStatus)}
                      <h4 className="ml-2 text-sm font-medium text-gray-900">
                        {dataPoint.name}
                      </h4>
                    </div>

                    {editingId === dataPoint.dataPointId ? (
                      <div className="mt-3 space-y-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Valor Validado
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={editedValue}
                              onChange={(e) => setEditedValue(e.target.value)}
                              className="input flex-1 text-sm"
                            />
                            {dataPoint.unit && (
                              <span className="text-sm text-gray-500">{dataPoint.unit}</span>
                            )}
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Observações
                          </label>
                          <textarea
                            value={editedNotes}
                            onChange={(e) => setEditedNotes(e.target.value)}
                            className="input w-full text-sm"
                            rows={2}
                          />
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={handleSave}
                            className="btn btn-primary btn-sm"
                          >
                            <Save className="w-3 h-3 mr-1" />
                            Salvar
                          </button>
                          <button
                            onClick={handleCancel}
                            className="btn btn-secondary btn-sm"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-2 space-y-2">
                        <div className="flex items-baseline gap-4">
                          <div>
                            <span className="text-xs text-gray-500">Valor Original:</span>
                            <span className="ml-2 text-sm font-medium text-gray-900">
                              {dataPoint.value} {dataPoint.unit}
                            </span>
                          </div>
                          
                          {dataPoint.validatedValue && dataPoint.validatedValue !== dataPoint.value && (
                            <div>
                              <span className="text-xs text-gray-500">Valor Validado:</span>
                              <span className="ml-2 text-sm font-medium text-blue-600">
                                {dataPoint.validatedValue} {dataPoint.unit}
                              </span>
                            </div>
                          )}
                        </div>

                        {dataPoint.threshold && (
                          <div className="text-xs text-gray-600">
                            <span>Limites: </span>
                            {dataPoint.threshold.min && <span>Mín: {dataPoint.threshold.min} </span>}
                            {dataPoint.threshold.max && <span>Máx: {dataPoint.threshold.max} </span>}
                            {dataPoint.threshold.target && <span>Alvo: {dataPoint.threshold.target} </span>}
                            {dataPoint.unit && <span>{dataPoint.unit}</span>}
                          </div>
                        )}

                        {dataPoint.deviation !== undefined && (
                          <div className="text-xs">
                            <span className="text-gray-500">Desvio: </span>
                            <span className={`font-medium ${
                              dataPoint.deviation > 10 ? 'text-red-600' : 
                              dataPoint.deviation > 5 ? 'text-yellow-600' : 
                              'text-green-600'
                            }`}>
                              {dataPoint.deviation.toFixed(2)}%
                            </span>
                          </div>
                        )}

                        {dataPoint.notes && (
                          <p className="text-xs text-gray-600 italic">
                            {dataPoint.notes}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {!readOnly && editingId !== dataPoint.dataPointId && (
                    <button
                      onClick={() => handleEdit(dataPoint)}
                      className="ml-4 p-1 text-gray-400 hover:text-gray-600"
                      title="Editar"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Summary Statistics */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Resumo da Validação</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-2 bg-green-100 rounded-full">
              <Check className="w-6 h-6 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {dataPoints.filter(dp => dp.validationStatus === 'PASSED').length}
            </p>
            <p className="text-xs text-gray-600">Aprovados</p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-2 bg-red-100 rounded-full">
              <X className="w-6 h-6 text-red-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {dataPoints.filter(dp => dp.validationStatus === 'FAILED').length}
            </p>
            <p className="text-xs text-gray-600">Reprovados</p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-2 bg-yellow-100 rounded-full">
              <AlertTriangle className="w-6 h-6 text-yellow-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {dataPoints.filter(dp => dp.validationStatus === 'WARNING').length}
            </p>
            <p className="text-xs text-gray-600">Avisos</p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-2 bg-gray-100 rounded-full">
              <span className="text-gray-600">N/A</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {dataPoints.filter(dp => dp.validationStatus === 'NOT_APPLICABLE').length}
            </p>
            <p className="text-xs text-gray-600">Não Aplicável</p>
          </div>
        </div>
      </div>
    </div>
  );
};