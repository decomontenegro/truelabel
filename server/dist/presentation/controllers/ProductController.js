"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductController = void 0;
const PrismaProductRepository_1 = require("../../infrastructure/database/repositories/PrismaProductRepository");
const UseCaseFactory_1 = require("../../infrastructure/factories/UseCaseFactory");
const prisma_1 = require("../../lib/prisma");
const ApplicationErrors_1 = require("../../application/errors/ApplicationErrors");
class ProductController {
    constructor() {
        this.createProductUseCase = UseCaseFactory_1.UseCaseFactory.createProductUseCase();
    }
    async create(req, res, next) {
        try {
            const userId = req.user.id;
            const brandId = req.body.brandId || req.user.brandId;
            if (!brandId) {
                throw new ApplicationErrors_1.ApplicationError('Brand ID is required', 400);
            }
            const productDTO = await this.createProductUseCase.execute({
                ...req.body,
                brandId
            });
            res.status(201).json({
                status: 'success',
                data: productDTO
            });
        }
        catch (error) {
            next(error);
        }
    }
    async list(req, res, next) {
        try {
            const { page = 1, limit = 10, search, category, status } = req.query;
            const userId = req.user.id;
            const isAdmin = req.user.role === 'ADMIN';
            const { ProductService } = await Promise.resolve().then(() => __importStar(require('../../services/product.service')));
            const result = await ProductService.getProducts({
                search: search,
                category: category,
                status: status,
                brandId: !isAdmin ? req.user.brandId : undefined
            }, {
                page: Number(page),
                limit: Number(limit)
            }, userId, isAdmin);
            res.json({
                status: 'success',
                data: result.products,
                pagination: result.pagination
            });
        }
        catch (error) {
            next(error);
        }
    }
    async getById(req, res, next) {
        try {
            const { id } = req.params;
            const { ProductService } = await Promise.resolve().then(() => __importStar(require('../../services/product.service')));
            const product = await ProductService.getProductDetails(id);
            if (!product) {
                throw new ApplicationErrors_1.ApplicationError('Product not found', 404);
            }
            res.json({
                status: 'success',
                data: product
            });
        }
        catch (error) {
            next(error);
        }
    }
    async update(req, res, next) {
        try {
            const { id } = req.params;
            const userId = req.user.id;
            const { ProductService } = await Promise.resolve().then(() => __importStar(require('../../services/product.service')));
            const product = await ProductService.updateProduct(id, req.body, userId);
            res.json({
                status: 'success',
                data: product
            });
        }
        catch (error) {
            next(error);
        }
    }
    async delete(req, res, next) {
        try {
            const { id } = req.params;
            const userId = req.user.id;
            const prisma = (0, prisma_1.getPrismaClient)();
            const productRepository = new PrismaProductRepository_1.PrismaProductRepository(prisma);
            const product = await productRepository.findById(id);
            if (!product) {
                throw new ApplicationErrors_1.ApplicationError('Product not found', 404);
            }
            if (!product.canBeDeleted()) {
                throw new ApplicationErrors_1.ApplicationError('Product cannot be deleted in current status', 400);
            }
            await productRepository.delete(id);
            res.json({
                status: 'success',
                message: 'Product deleted successfully'
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.ProductController = ProductController;
//# sourceMappingURL=ProductController.js.map