import { FlaskConical } from 'lucide-react';

const LaboratoriesPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Laboratórios</h1>
        <p className="text-gray-600">Gerencie laboratórios parceiros</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="text-center py-12">
          <FlaskConical className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Página em desenvolvimento
          </h3>
          <p className="text-gray-600">
            A página de laboratórios será implementada em breve.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LaboratoriesPage;
