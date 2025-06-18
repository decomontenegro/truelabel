import { Product } from '../../domain/entities/Product';
import { ProductDTO } from '../dtos/product/ProductDTO';
export declare class ProductMapper {
    static toDTO(product: Product, additionalData?: {
        brandName?: string;
        validations?: any[];
        qrCode?: any;
    }): ProductDTO;
    static toDTOList(products: Product[], additionalDataMap?: Map<string, any>): ProductDTO[];
}
//# sourceMappingURL=ProductMapper.d.ts.map