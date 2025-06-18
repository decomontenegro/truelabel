"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UseCaseFactory = void 0;
const CreateProductUseCase_1 = require("../../application/use-cases/product/CreateProductUseCase");
const PrismaProductRepository_1 = require("../database/repositories/PrismaProductRepository");
const PrismaBrandRepository_1 = require("../database/repositories/PrismaBrandRepository");
const prisma_1 = require("../../lib/prisma");
class UseCaseFactory {
    static getPrisma() {
        if (!this.prisma) {
            this.prisma = (0, prisma_1.getPrismaClient)();
        }
        return this.prisma;
    }
    static getProductRepository() {
        if (!this.productRepository) {
            this.productRepository = new PrismaProductRepository_1.PrismaProductRepository(this.getPrisma());
        }
        return this.productRepository;
    }
    static getBrandRepository() {
        if (!this.brandRepository) {
            this.brandRepository = new PrismaBrandRepository_1.PrismaBrandRepository(this.getPrisma());
        }
        return this.brandRepository;
    }
    static createProductUseCase() {
        return new CreateProductUseCase_1.CreateProductUseCase(this.getProductRepository(), this.getBrandRepository());
    }
}
exports.UseCaseFactory = UseCaseFactory;
//# sourceMappingURL=UseCaseFactory.js.map