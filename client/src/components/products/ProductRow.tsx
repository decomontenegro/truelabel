import { memo } from 'react';
import { Link } from 'react-router-dom';
import { Eye, Edit, QrCode, Shield, MoreVertical, MapPin } from 'lucide-react';
import { formatDate, getStatusColor, getStatusText } from '@/lib/utils';

interface ProductRowProps {
  product: any;
  userRole?: string;
  onQRCodeClick: (product: any) => void;
}

const ProductRow = memo(({ product, userRole, onQRCodeClick }: ProductRowProps) => {
  const canEdit = userRole === 'BRAND' || userRole === 'ADMIN';

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          {product.imageUrl && (
            <img
              className="h-10 w-10 rounded-lg object-cover mr-3"
              src={product.imageUrl}
              alt={product.name}
              loading="lazy"
            />
          )}
          <div>
            <div className="text-sm font-medium text-gray-900">
              {product.name}
            </div>
            <div className="text-sm text-gray-500">
              {product.brand} • SKU: {product.sku}
            </div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {product.category}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(product.status)}`}>
          {getStatusText(product.status)}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {formatDate(product.createdAt)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
        <div className="flex items-center space-x-2">
          <Link
            to={`/dashboard/products/${product.id}`}
            className="text-primary-600 hover:text-primary-900"
            title="Ver detalhes"
          >
            <Eye className="h-4 w-4" />
          </Link>

          {canEdit && (
            <>
              <Link
                to={`/dashboard/products/${product.id}/edit`}
                className="text-gray-600 hover:text-gray-900"
                title="Editar"
              >
                <Edit className="h-4 w-4" />
              </Link>

              <button
                onClick={() => onQRCodeClick(product)}
                className="text-green-600 hover:text-green-900"
                title={product.qrCode ? "Ver QR Code" : "Gerar QR Code"}
              >
                <QrCode className="h-4 w-4" />
              </button>

              <Link
                to={`/dashboard/products/${product.id}/seals`}
                className="text-blue-600 hover:text-blue-900"
                title="Gerenciar Selos"
              >
                <Shield className="h-4 w-4" />
              </Link>

              <Link
                to={`/dashboard/products/${product.id}/traceability`}
                className="text-purple-600 hover:text-purple-900"
                title="Rastreabilidade"
              >
                <MapPin className="h-4 w-4" />
              </Link>
            </>
          )}

          <button className="text-gray-400 hover:text-gray-600">
            <MoreVertical className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  );
});

ProductRow.displayName = 'ProductRow';

export default ProductRow;