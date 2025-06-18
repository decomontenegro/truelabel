"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Product = void 0;
const Entity_1 = require("../base/Entity");
const DomainError_1 = require("../errors/DomainError");
const ProductStatus_1 = require("../enums/ProductStatus");
const EAN_1 = require("../value-objects/EAN");
const ProductName_1 = require("../value-objects/ProductName");
const Claim_1 = require("../value-objects/Claim");
class Product extends Entity_1.Entity {
    constructor(props, id) {
        super(props, id);
    }
    static create(props, id) {
        const productName = ProductName_1.ProductName.create(props.name);
        const productEAN = EAN_1.EAN.create(props.ean);
        const productClaims = (props.claims || []).map(claim => Claim_1.Claim.create(claim));
        const now = new Date();
        return new Product({
            name: productName,
            description: props.description,
            ean: productEAN,
            category: props.category,
            status: ProductStatus_1.ProductStatus.PENDING,
            brandId: props.brandId,
            claims: productClaims,
            ingredients: props.ingredients || [],
            nutritionalInfo: props.nutritionalInfo,
            images: props.images || [],
            createdAt: now,
            updatedAt: now,
        }, id);
    }
    static reconstitute(props, id) {
        return new Product(props, id);
    }
    get name() {
        return this.props.name.value;
    }
    get description() {
        return this.props.description;
    }
    get ean() {
        return this.props.ean.value;
    }
    get category() {
        return this.props.category;
    }
    get status() {
        return this.props.status;
    }
    get brandId() {
        return this.props.brandId;
    }
    get claims() {
        return this.props.claims.map(claim => claim.value);
    }
    get ingredients() {
        return this.props.ingredients;
    }
    get nutritionalInfo() {
        return this.props.nutritionalInfo;
    }
    get images() {
        return this.props.images;
    }
    get createdAt() {
        return this.props.createdAt;
    }
    get updatedAt() {
        return this.props.updatedAt;
    }
    updateName(name) {
        if (this.isValidated()) {
            throw new DomainError_1.DomainError('Cannot update name of validated product');
        }
        this.props.name = ProductName_1.ProductName.create(name);
        this.markAsUpdated();
    }
    updateDescription(description) {
        if (this.isValidated()) {
            throw new DomainError_1.DomainError('Cannot update description of validated product');
        }
        this.props.description = description;
        this.markAsUpdated();
    }
    addClaim(claim) {
        if (this.isValidated()) {
            throw new DomainError_1.DomainError('Cannot add claims to validated product');
        }
        const newClaim = Claim_1.Claim.create(claim);
        if (this.props.claims.some(c => c.equals(newClaim))) {
            throw new DomainError_1.DomainError('Claim already exists');
        }
        this.props.claims.push(newClaim);
        this.markAsUpdated();
    }
    removeClaim(claim) {
        if (this.isValidated()) {
            throw new DomainError_1.DomainError('Cannot remove claims from validated product');
        }
        const claimToRemove = Claim_1.Claim.create(claim);
        this.props.claims = this.props.claims.filter(c => !c.equals(claimToRemove));
        this.markAsUpdated();
    }
    updateIngredients(ingredients) {
        if (this.isValidated()) {
            throw new DomainError_1.DomainError('Cannot update ingredients of validated product');
        }
        this.props.ingredients = ingredients;
        this.markAsUpdated();
    }
    updateNutritionalInfo(info) {
        if (this.isValidated()) {
            throw new DomainError_1.DomainError('Cannot update nutritional info of validated product');
        }
        this.props.nutritionalInfo = info;
        this.markAsUpdated();
    }
    addImage(imageUrl) {
        if (this.props.images.length >= 10) {
            throw new DomainError_1.DomainError('Maximum number of images reached (10)');
        }
        if (this.props.images.includes(imageUrl)) {
            throw new DomainError_1.DomainError('Image already exists');
        }
        this.props.images.push(imageUrl);
        this.markAsUpdated();
    }
    removeImage(imageUrl) {
        this.props.images = this.props.images.filter(img => img !== imageUrl);
        this.markAsUpdated();
    }
    canBeValidated() {
        return this.props.status === ProductStatus_1.ProductStatus.PENDING ||
            this.props.status === ProductStatus_1.ProductStatus.REJECTED;
    }
    markAsInValidation() {
        if (!this.canBeValidated()) {
            throw new DomainError_1.DomainError(`Product cannot be validated in status: ${this.props.status}`);
        }
        this.props.status = ProductStatus_1.ProductStatus.IN_VALIDATION;
        this.markAsUpdated();
    }
    markAsValidated() {
        if (this.props.status !== ProductStatus_1.ProductStatus.IN_VALIDATION) {
            throw new DomainError_1.DomainError('Product must be in validation to be marked as validated');
        }
        this.props.status = ProductStatus_1.ProductStatus.VALIDATED;
        this.markAsUpdated();
    }
    markAsValidatedWithRemarks(remarks) {
        if (this.props.status !== ProductStatus_1.ProductStatus.IN_VALIDATION) {
            throw new DomainError_1.DomainError('Product must be in validation to be marked as validated with remarks');
        }
        if (remarks.length === 0) {
            throw new DomainError_1.DomainError('Remarks are required when validating with remarks');
        }
        this.props.status = ProductStatus_1.ProductStatus.VALIDATED_WITH_REMARKS;
        this.markAsUpdated();
    }
    markAsRejected(reason) {
        if (this.props.status !== ProductStatus_1.ProductStatus.IN_VALIDATION) {
            throw new DomainError_1.DomainError('Product must be in validation to be rejected');
        }
        if (!reason || reason.trim().length === 0) {
            throw new DomainError_1.DomainError('Rejection reason is required');
        }
        this.props.status = ProductStatus_1.ProductStatus.REJECTED;
        this.markAsUpdated();
    }
    suspend(reason) {
        if (this.props.status !== ProductStatus_1.ProductStatus.VALIDATED &&
            this.props.status !== ProductStatus_1.ProductStatus.VALIDATED_WITH_REMARKS) {
            throw new DomainError_1.DomainError('Only validated products can be suspended');
        }
        if (!reason || reason.trim().length === 0) {
            throw new DomainError_1.DomainError('Suspension reason is required');
        }
        this.props.status = ProductStatus_1.ProductStatus.SUSPENDED;
        this.markAsUpdated();
    }
    reactivate() {
        if (this.props.status !== ProductStatus_1.ProductStatus.SUSPENDED) {
            throw new DomainError_1.DomainError('Only suspended products can be reactivated');
        }
        this.props.status = ProductStatus_1.ProductStatus.VALIDATED;
        this.markAsUpdated();
    }
    isValidated() {
        return this.props.status === ProductStatus_1.ProductStatus.VALIDATED ||
            this.props.status === ProductStatus_1.ProductStatus.VALIDATED_WITH_REMARKS;
    }
    isActive() {
        return this.props.status !== ProductStatus_1.ProductStatus.SUSPENDED;
    }
    canBeDeleted() {
        return this.props.status === ProductStatus_1.ProductStatus.PENDING ||
            this.props.status === ProductStatus_1.ProductStatus.REJECTED;
    }
    hasRequiredInfoForValidation() {
        return this.props.claims.length > 0 &&
            this.props.ingredients.length > 0;
    }
    markAsUpdated() {
        this.props.updatedAt = new Date();
    }
    toJSON() {
        return {
            id: this.id,
            name: this.name,
            description: this.description,
            ean: this.ean,
            category: this.category,
            status: this.status,
            brandId: this.brandId,
            claims: this.claims,
            ingredients: this.ingredients,
            nutritionalInfo: this.nutritionalInfo,
            images: this.images,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
        };
    }
}
exports.Product = Product;
//# sourceMappingURL=Product.js.map