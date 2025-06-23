import React, { useState, useEffect } from 'react';
import { Plus, Search, Building2, Mail, Phone, MapPin, CheckCircle, XCircle, Edit, Trash2 } from 'lucide-react';
import { Laboratory } from '@/types';
import { laboratoryService } from '@/services/laboratoryService';
import { toast } from 'react-hot-toast';

export const LaboratoriesPage: React.FC = () => {
  const [laboratories, setLaboratories] = useState<Laboratory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingLab, setEditingLab] = useState<Laboratory | null>(null);

  // Carregar laboratórios
  const loadLaboratories = async () => {
    try {
      setLoading(true);
      const response = await laboratoryService.getLaboratories({
        search: searchTerm,
        limit: 100
      });
      setLaboratories(response.data);
    } catch (error: any) {
      toast.error('Erro ao carregar laboratórios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLaboratories();
  }, [searchTerm]);

  // Alternar status do laboratório
  const toggleLaboratoryStatus = async (lab: Laboratory) => {
    try {
      await laboratoryService.updateLaboratoryStatus(lab.id, !lab.isActive);
      toast.success(`Laboratório ${!lab.isActive ? 'ativado' : 'desativado'} com sucesso`);
      loadLaboratories();
    } catch (error: any) {
      toast.error('Erro ao alterar status do laboratório');
    }
  };

  // Deletar laboratório
  const deleteLaboratory = async (lab: Laboratory) => {
    if (!confirm(`Tem certeza que deseja remover o laboratório "${lab.name}"?`)) {
      return;
    }

    try {
      await laboratoryService.deleteLaboratory(lab.id);
      toast.success('Laboratório removido com sucesso');
      loadLaboratories();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao remover laboratório');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="loading-spinner w-8 h-8"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Laboratórios</h1>
          <p className="text-gray-600">Gerencie laboratórios certificados</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn btn-primary"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Laboratório
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar laboratórios..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Laboratórios */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {laboratories.map((lab) => (
          <div key={lab.id} className="bg-white rounded-lg shadow-sm border p-6">
            {/* Header do Card */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                <Building2 className="w-8 h-8 text-blue-600 mr-3" />
                <div>
                  <h3 className="font-semibold text-gray-900">{lab.name}</h3>
                  <p className="text-sm text-gray-600">{lab.accreditation}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {lab.isActive ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-500" />
                )}
              </div>
            </div>

            {/* Informações de Contato */}
            <div className="space-y-2 mb-4">
              <div className="flex items-center text-sm text-gray-600">
                <Mail className="w-4 h-4 mr-2" />
                {lab.email}
              </div>
              {lab.phone && (
                <div className="flex items-center text-sm text-gray-600">
                  <Phone className="w-4 h-4 mr-2" />
                  {lab.phone}
                </div>
              )}
              {lab.address && (
                <div className="flex items-center text-sm text-gray-600">
                  <MapPin className="w-4 h-4 mr-2" />
                  {lab.address}
                </div>
              )}
            </div>

            {/* Estatísticas */}
            <div className="bg-gray-50 rounded-lg p-3 mb-4">
              <div className="text-sm text-gray-600">
                <span className="font-medium">{lab._count?.reports || 0}</span> relatórios enviados
              </div>
            </div>

            {/* Status */}
            <div className="mb-4">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                lab.isActive 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {lab.isActive ? 'Ativo' : 'Inativo'}
              </span>
            </div>

            {/* Ações */}
            <div className="flex space-x-2">
              <button
                onClick={() => setEditingLab(lab)}
                className="flex-1 btn btn-outline text-sm"
              >
                <Edit className="w-4 h-4 mr-1" />
                Editar
              </button>
              <button
                onClick={() => toggleLaboratoryStatus(lab)}
                className={`flex-1 btn text-sm ${
                  lab.isActive ? 'btn-secondary' : 'btn-primary'
                }`}
              >
                {lab.isActive ? 'Desativar' : 'Ativar'}
              </button>
              <button
                onClick={() => deleteLaboratory(lab)}
                className="btn btn-outline text-red-600 hover:bg-red-50 text-sm px-3"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Estado vazio */}
      {laboratories.length === 0 && !loading && (
        <div className="text-center py-12">
          <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nenhum laboratório encontrado
          </h3>
          <p className="text-gray-600 mb-4">
            {searchTerm 
              ? 'Tente ajustar os filtros de busca'
              : 'Comece cadastrando o primeiro laboratório'
            }
          </p>
          {!searchTerm && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn btn-primary"
            >
              <Plus className="w-4 h-4 mr-2" />
              Cadastrar Laboratório
            </button>
          )}
        </div>
      )}

      {/* Modais */}
      {showCreateModal && (
        <CreateLaboratoryModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadLaboratories();
          }}
        />
      )}

      {editingLab && (
        <EditLaboratoryModal
          laboratory={editingLab}
          onClose={() => setEditingLab(null)}
          onSuccess={() => {
            setEditingLab(null);
            loadLaboratories();
          }}
        />
      )}
    </div>
  );
};

// Modal de Criação (placeholder - será implementado na próxima etapa)
const CreateLaboratoryModal: React.FC<{
  onClose: () => void;
  onSuccess: () => void;
}> = ({ onClose, onSuccess }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Novo Laboratório</h2>
        <p className="text-gray-600 mb-4">Modal de criação será implementado na próxima etapa</p>
        <div className="flex space-x-3">
          <button onClick={onClose} className="btn btn-secondary flex-1">
            Cancelar
          </button>
          <button onClick={onSuccess} className="btn btn-primary flex-1">
            Criar (Demo)
          </button>
        </div>
      </div>
    </div>
  );
};

// Modal de Edição (placeholder - será implementado na próxima etapa)
const EditLaboratoryModal: React.FC<{
  laboratory: Laboratory;
  onClose: () => void;
  onSuccess: () => void;
}> = ({ laboratory, onClose, onSuccess }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Editar Laboratório</h2>
        <p className="text-gray-600 mb-2">Editando: {laboratory.name}</p>
        <p className="text-gray-600 mb-4">Modal de edição será implementado na próxima etapa</p>
        <div className="flex space-x-3">
          <button onClick={onClose} className="btn btn-secondary flex-1">
            Cancelar
          </button>
          <button onClick={onSuccess} className="btn btn-primary flex-1">
            Salvar (Demo)
          </button>
        </div>
      </div>
    </div>
  );
};

export default LaboratoriesPage;
