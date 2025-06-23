import { Entity } from '../base/Entity';
import { DomainError } from '../errors/DomainError';
import { Email } from '../value-objects/Email';
import { BrandName } from '../value-objects/BrandName';
import { CNPJ } from '../value-objects/CNPJ';
import { Website } from '../value-objects/Website';

export interface BrandProps {
  name: BrandName;
  email: Email;
  cnpj?: CNPJ;
  description?: string;
  logo?: string;
  website?: Website;
  address?: BrandAddress;
  isActive: boolean;
  isVerified: boolean;
  verifiedAt?: Date;
  userId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BrandAddress {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
}

export class Brand extends Entity<BrandProps> {
  private constructor(props: BrandProps, id?: string) {
    super(props, id);
  }

  static create(
    props: {
      name: string;
      email: string;
      cnpj?: string;
      description?: string;
      logo?: string;
      website?: string;
      address?: BrandAddress;
      userId?: string;
    },
    id?: string
  ): Brand {
    const brandName = BrandName.create(props.name);
    const brandEmail = Email.create(props.email);
    const brandCNPJ = props.cnpj ? CNPJ.create(props.cnpj) : undefined;
    const brandWebsite = props.website ? Website.create(props.website) : undefined;

    const now = new Date();

    return new Brand(
      {
        name: brandName,
        email: brandEmail,
        cnpj: brandCNPJ,
        description: props.description,
        logo: props.logo,
        website: brandWebsite,
        address: props.address,
        isActive: true,
        isVerified: false,
        userId: props.userId,
        createdAt: now,
        updatedAt: now,
      },
      id
    );
  }

  static reconstitute(props: BrandProps, id: string): Brand {
    return new Brand(props, id);
  }

  // Getters
  get name(): string {
    return this.props.name.value;
  }

  get email(): string {
    return this.props.email.value;
  }

  get cnpj(): string | undefined {
    return this.props.cnpj?.value;
  }

  get description(): string | undefined {
    return this.props.description;
  }

  get logo(): string | undefined {
    return this.props.logo;
  }

  get website(): string | undefined {
    return this.props.website?.value;
  }

  get address(): BrandAddress | undefined {
    return this.props.address;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  get isVerified(): boolean {
    return this.props.isVerified;
  }

  get verifiedAt(): Date | undefined {
    return this.props.verifiedAt;
  }

  get userId(): string | undefined {
    return this.props.userId;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // Business logic methods
  updateName(name: string): void {
    this.props.name = BrandName.create(name);
    this.markAsUpdated();
  }

  updateEmail(email: string): void {
    this.props.email = Email.create(email);
    this.markAsUpdated();
  }

  updateCNPJ(cnpj: string): void {
    this.props.cnpj = CNPJ.create(cnpj);
    this.markAsUpdated();
  }

  updateDescription(description: string): void {
    if (description.length > 1000) {
      throw new DomainError('Description cannot exceed 1000 characters');
    }
    this.props.description = description;
    this.markAsUpdated();
  }

  updateLogo(logoUrl: string): void {
    // Validate URL format
    try {
      new URL(logoUrl);
    } catch {
      throw new DomainError('Invalid logo URL');
    }
    this.props.logo = logoUrl;
    this.markAsUpdated();
  }

  updateWebsite(website: string): void {
    this.props.website = Website.create(website);
    this.markAsUpdated();
  }

  updateAddress(address: BrandAddress): void {
    this.validateAddress(address);
    this.props.address = address;
    this.markAsUpdated();
  }

  verify(): void {
    if (this.props.isVerified) {
      throw new DomainError('Brand is already verified');
    }

    if (!this.canBeVerified()) {
      throw new DomainError(
        'Brand must have CNPJ and address to be verified'
      );
    }

    this.props.isVerified = true;
    this.props.verifiedAt = new Date();
    this.markAsUpdated();
  }

  unverify(reason: string): void {
    if (!this.props.isVerified) {
      throw new DomainError('Brand is not verified');
    }

    if (!reason || reason.trim().length === 0) {
      throw new DomainError('Reason is required to unverify brand');
    }

    this.props.isVerified = false;
    this.props.verifiedAt = undefined;
    this.markAsUpdated();
  }

  activate(): void {
    if (this.props.isActive) {
      throw new DomainError('Brand is already active');
    }

    this.props.isActive = true;
    this.markAsUpdated();
  }

  deactivate(reason: string): void {
    if (!this.props.isActive) {
      throw new DomainError('Brand is already inactive');
    }

    if (!reason || reason.trim().length === 0) {
      throw new DomainError('Reason is required to deactivate brand');
    }

    this.props.isActive = false;
    this.markAsUpdated();
  }

  canBeVerified(): boolean {
    return !!this.props.cnpj && !!this.props.address;
  }

  canCreateProducts(): boolean {
    return this.props.isActive && this.props.isVerified;
  }

  hasCompleteProfile(): boolean {
    return !!(
      this.props.cnpj &&
      this.props.description &&
      this.props.logo &&
      this.props.website &&
      this.props.address
    );
  }

  private validateAddress(address: BrandAddress): void {
    const requiredFields = [
      'street',
      'number', 
      'neighborhood',
      'city',
      'state',
      'country',
      'zipCode'
    ];

    for (const field of requiredFields) {
      if (!address[field as keyof BrandAddress]) {
        throw new DomainError(`Address ${field} is required`);
      }
    }

    // Validate Brazilian ZIP code format (CEP)
    if (address.country === 'BR' || address.country === 'Brasil') {
      const cepRegex = /^\d{5}-?\d{3}$/;
      if (!cepRegex.test(address.zipCode)) {
        throw new DomainError('Invalid Brazilian ZIP code format');
      }
    }
  }

  private markAsUpdated(): void {
    this.props.updatedAt = new Date();
  }

  toJSON(): Record<string, any> {
    return {
      id: this.id,
      name: this.name,
      email: this.email,
      cnpj: this.cnpj,
      description: this.description,
      logo: this.logo,
      website: this.website,
      address: this.address,
      isActive: this.isActive,
      isVerified: this.isVerified,
      verifiedAt: this.verifiedAt,
      userId: this.userId,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}