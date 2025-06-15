import { Entity } from '../base/Entity';
import { DomainError } from '../errors/DomainError';
import { ProductStatus } from '../enums/ProductStatus';
import { ProductCategory } from '../enums/ProductCategory';
import { EAN } from '../value-objects/EAN';
import { ProductName } from '../value-objects/ProductName';
import { Claim } from '../value-objects/Claim';

export interface ProductProps {
  name: ProductName;
  description?: string;
  ean: EAN;
  category: ProductCategory;
  status: ProductStatus;
  brandId: string;
  claims: Claim[];
  ingredients: string[];
  nutritionalInfo?: Record<string, any>;
  images: string[];
  createdAt: Date;
  updatedAt: Date;
}

export class Product extends Entity<ProductProps> {
  private constructor(props: ProductProps, id?: string) {
    super(props, id);
  }

  static create(
    props: {
      name: string;
      description?: string;
      ean: string;
      category: ProductCategory;
      brandId: string;
      claims?: string[];
      ingredients?: string[];
      nutritionalInfo?: Record<string, any>;
      images?: string[];
    },
    id?: string
  ): Product {
    const productName = ProductName.create(props.name);
    const productEAN = EAN.create(props.ean);
    const productClaims = (props.claims || []).map(claim => Claim.create(claim));

    const now = new Date();
    
    return new Product(
      {
        name: productName,
        description: props.description,
        ean: productEAN,
        category: props.category,
        status: ProductStatus.PENDING,
        brandId: props.brandId,
        claims: productClaims,
        ingredients: props.ingredients || [],
        nutritionalInfo: props.nutritionalInfo,
        images: props.images || [],
        createdAt: now,
        updatedAt: now,
      },
      id
    );
  }

  static reconstitute(props: ProductProps, id: string): Product {
    return new Product(props, id);
  }

  // Getters
  get name(): string {
    return this.props.name.value;
  }

  get description(): string | undefined {
    return this.props.description;
  }

  get ean(): string {
    return this.props.ean.value;
  }

  get category(): ProductCategory {
    return this.props.category;
  }

  get status(): ProductStatus {
    return this.props.status;
  }

  get brandId(): string {
    return this.props.brandId;
  }

  get claims(): string[] {
    return this.props.claims.map(claim => claim.value);
  }

  get ingredients(): string[] {
    return this.props.ingredients;
  }

  get nutritionalInfo(): Record<string, any> | undefined {
    return this.props.nutritionalInfo;
  }

  get images(): string[] {
    return this.props.images;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // Business logic methods
  updateName(name: string): void {
    if (this.isValidated()) {
      throw new DomainError('Cannot update name of validated product');
    }
    
    this.props.name = ProductName.create(name);
    this.markAsUpdated();
  }

  updateDescription(description: string): void {
    if (this.isValidated()) {
      throw new DomainError('Cannot update description of validated product');
    }
    
    this.props.description = description;
    this.markAsUpdated();
  }

  addClaim(claim: string): void {
    if (this.isValidated()) {
      throw new DomainError('Cannot add claims to validated product');
    }

    const newClaim = Claim.create(claim);
    
    if (this.props.claims.some(c => c.equals(newClaim))) {
      throw new DomainError('Claim already exists');
    }

    this.props.claims.push(newClaim);
    this.markAsUpdated();
  }

  removeClaim(claim: string): void {
    if (this.isValidated()) {
      throw new DomainError('Cannot remove claims from validated product');
    }

    const claimToRemove = Claim.create(claim);
    this.props.claims = this.props.claims.filter(c => !c.equals(claimToRemove));
    this.markAsUpdated();
  }

  updateIngredients(ingredients: string[]): void {
    if (this.isValidated()) {
      throw new DomainError('Cannot update ingredients of validated product');
    }

    this.props.ingredients = ingredients;
    this.markAsUpdated();
  }

  updateNutritionalInfo(info: Record<string, any>): void {
    if (this.isValidated()) {
      throw new DomainError('Cannot update nutritional info of validated product');
    }

    this.props.nutritionalInfo = info;
    this.markAsUpdated();
  }

  addImage(imageUrl: string): void {
    if (this.props.images.length >= 10) {
      throw new DomainError('Maximum number of images reached (10)');
    }

    if (this.props.images.includes(imageUrl)) {
      throw new DomainError('Image already exists');
    }

    this.props.images.push(imageUrl);
    this.markAsUpdated();
  }

  removeImage(imageUrl: string): void {
    this.props.images = this.props.images.filter(img => img !== imageUrl);
    this.markAsUpdated();
  }

  // Status management
  canBeValidated(): boolean {
    return this.props.status === ProductStatus.PENDING || 
           this.props.status === ProductStatus.REJECTED;
  }

  markAsInValidation(): void {
    if (!this.canBeValidated()) {
      throw new DomainError(
        `Product cannot be validated in status: ${this.props.status}`
      );
    }

    this.props.status = ProductStatus.IN_VALIDATION;
    this.markAsUpdated();
  }

  markAsValidated(): void {
    if (this.props.status !== ProductStatus.IN_VALIDATION) {
      throw new DomainError(
        'Product must be in validation to be marked as validated'
      );
    }

    this.props.status = ProductStatus.VALIDATED;
    this.markAsUpdated();
  }

  markAsValidatedWithRemarks(remarks: string[]): void {
    if (this.props.status !== ProductStatus.IN_VALIDATION) {
      throw new DomainError(
        'Product must be in validation to be marked as validated with remarks'
      );
    }

    if (remarks.length === 0) {
      throw new DomainError('Remarks are required when validating with remarks');
    }

    this.props.status = ProductStatus.VALIDATED_WITH_REMARKS;
    this.markAsUpdated();
  }

  markAsRejected(reason: string): void {
    if (this.props.status !== ProductStatus.IN_VALIDATION) {
      throw new DomainError(
        'Product must be in validation to be rejected'
      );
    }

    if (!reason || reason.trim().length === 0) {
      throw new DomainError('Rejection reason is required');
    }

    this.props.status = ProductStatus.REJECTED;
    this.markAsUpdated();
  }

  suspend(reason: string): void {
    if (this.props.status !== ProductStatus.VALIDATED && 
        this.props.status !== ProductStatus.VALIDATED_WITH_REMARKS) {
      throw new DomainError('Only validated products can be suspended');
    }

    if (!reason || reason.trim().length === 0) {
      throw new DomainError('Suspension reason is required');
    }

    this.props.status = ProductStatus.SUSPENDED;
    this.markAsUpdated();
  }

  reactivate(): void {
    if (this.props.status !== ProductStatus.SUSPENDED) {
      throw new DomainError('Only suspended products can be reactivated');
    }

    this.props.status = ProductStatus.VALIDATED;
    this.markAsUpdated();
  }

  // Validation rules
  isValidated(): boolean {
    return this.props.status === ProductStatus.VALIDATED || 
           this.props.status === ProductStatus.VALIDATED_WITH_REMARKS;
  }

  isActive(): boolean {
    return this.props.status !== ProductStatus.SUSPENDED;
  }

  canBeDeleted(): boolean {
    return this.props.status === ProductStatus.PENDING || 
           this.props.status === ProductStatus.REJECTED;
  }

  hasRequiredInfoForValidation(): boolean {
    return this.props.claims.length > 0 && 
           this.props.ingredients.length > 0;
  }

  // Utility methods
  private markAsUpdated(): void {
    this.props.updatedAt = new Date();
  }

  toJSON(): Record<string, any> {
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