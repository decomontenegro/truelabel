import { memo } from 'react';
import { Link } from 'react-router-dom';
import { Eye, QrCode, Shield, CheckCircle } from 'lucide-react';
import { formatDate, getStatusColor, getStatusText } from '@/lib/utils';

interface ProductCardProps {
  product: any;
  userRole?: string;
  onQRCodeClick: (product: any) => void;
  onValidateClick?: (product: any) => void;
}

const ProductCard = memo(({ product, userRole, onQRCodeClick, onValidateClick }: ProductCardProps) => {
  const canEdit = userRole === 'BRAND' || userRole === 'ADMIN';

  return (
    <div className="card-hover border-b border-neutral-200 p-4 transition-all duration-200 ease-in-out hover:bg-neutral-50">
      <div className="flex items-start justify-between">
        <div className="flex items-center flex-1">
          {product.imageUrl && (
            <img
              className="h-12 w-12 rounded-lg object-cover mr-3 flex-shrink-0 transition-transform duration-200 hover:scale-105"
              src={product.imageUrl}
              alt={product.name}
              loading="lazy"
            />
          )}
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-neutral-900 truncate">
              {product.name}
            </h3>
            <p className="text-sm text-neutral-500 truncate">
              {product.brand}
            </p>
            <p className="text-xs text-neutral-400">
              SKU: {product.sku}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 ml-2">
          <Link
            to={`/dashboard/products/${product.id}`}
            className="icon-btn text-primary-600 hover:text-primary-700"
            title="Ver detalhes"
          >
            <Eye className="h-4 w-4" />
          </Link>

          {canEdit && (
            <>
              <button
                onClick={() => onQRCodeClick(product)}
                className="icon-btn text-success-600 hover:text-success-700"
                title={product.qrCode ? "Ver QR Code" : "Gerar QR Code"}
              >
                <QrCode className="h-4 w-4" />
              </button>

              <Link
                to={`/dashboard/products/${product.id}/seals`}
                className="icon-btn text-info-600 hover:text-info-700"
                title="Gerenciar Selos"
              >
                <Shield className="h-4 w-4" />
              </Link>

              {product.status !== 'VALIDATED' && onValidateClick && (
                <button
                  onClick={() => onValidateClick(product)}
                  className="icon-btn text-warning-600 hover:text-warning-700"
                  title="Solicitar Validação"
                >
                  <CheckCircle className="h-4 w-4" />
                </button>
              )}
            </>
          )}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <span className={`badge ${getStatusColor(product.status).replace('bg-', 'badge-').split(' ')[0]}`}>
            {getStatusText(product.status)}
          </span>
          <span className="text-xs text-neutral-500">
            {product.category}
          </span>
        </div>
        <span className="text-xs text-neutral-400">
          {formatDate(product.createdAt)}
        </span>
      </div>
    </div>
  );
});

ProductCard.displayName = 'ProductCard';

export default ProductCard;