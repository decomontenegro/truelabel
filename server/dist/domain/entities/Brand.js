"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Brand = void 0;
const Entity_1 = require("../base/Entity");
const DomainError_1 = require("../errors/DomainError");
const Email_1 = require("../value-objects/Email");
const BrandName_1 = require("../value-objects/BrandName");
const CNPJ_1 = require("../value-objects/CNPJ");
const Website_1 = require("../value-objects/Website");
class Brand extends Entity_1.Entity {
    constructor(props, id) {
        super(props, id);
    }
    static create(props, id) {
        const brandName = BrandName_1.BrandName.create(props.name);
        const brandEmail = Email_1.Email.create(props.email);
        const brandCNPJ = props.cnpj ? CNPJ_1.CNPJ.create(props.cnpj) : undefined;
        const brandWebsite = props.website ? Website_1.Website.create(props.website) : undefined;
        const now = new Date();
        return new Brand({
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
        }, id);
    }
    static reconstitute(props, id) {
        return new Brand(props, id);
    }
    get name() {
        return this.props.name.value;
    }
    get email() {
        return this.props.email.value;
    }
    get cnpj() {
        return this.props.cnpj?.value;
    }
    get description() {
        return this.props.description;
    }
    get logo() {
        return this.props.logo;
    }
    get website() {
        return this.props.website?.value;
    }
    get address() {
        return this.props.address;
    }
    get isActive() {
        return this.props.isActive;
    }
    get isVerified() {
        return this.props.isVerified;
    }
    get verifiedAt() {
        return this.props.verifiedAt;
    }
    get userId() {
        return this.props.userId;
    }
    get createdAt() {
        return this.props.createdAt;
    }
    get updatedAt() {
        return this.props.updatedAt;
    }
    updateName(name) {
        this.props.name = BrandName_1.BrandName.create(name);
        this.markAsUpdated();
    }
    updateEmail(email) {
        this.props.email = Email_1.Email.create(email);
        this.markAsUpdated();
    }
    updateCNPJ(cnpj) {
        this.props.cnpj = CNPJ_1.CNPJ.create(cnpj);
        this.markAsUpdated();
    }
    updateDescription(description) {
        if (description.length > 1000) {
            throw new DomainError_1.DomainError('Description cannot exceed 1000 characters');
        }
        this.props.description = description;
        this.markAsUpdated();
    }
    updateLogo(logoUrl) {
        try {
            new URL(logoUrl);
        }
        catch {
            throw new DomainError_1.DomainError('Invalid logo URL');
        }
        this.props.logo = logoUrl;
        this.markAsUpdated();
    }
    updateWebsite(website) {
        this.props.website = Website_1.Website.create(website);
        this.markAsUpdated();
    }
    updateAddress(address) {
        this.validateAddress(address);
        this.props.address = address;
        this.markAsUpdated();
    }
    verify() {
        if (this.props.isVerified) {
            throw new DomainError_1.DomainError('Brand is already verified');
        }
        if (!this.canBeVerified()) {
            throw new DomainError_1.DomainError('Brand must have CNPJ and address to be verified');
        }
        this.props.isVerified = true;
        this.props.verifiedAt = new Date();
        this.markAsUpdated();
    }
    unverify(reason) {
        if (!this.props.isVerified) {
            throw new DomainError_1.DomainError('Brand is not verified');
        }
        if (!reason || reason.trim().length === 0) {
            throw new DomainError_1.DomainError('Reason is required to unverify brand');
        }
        this.props.isVerified = false;
        this.props.verifiedAt = undefined;
        this.markAsUpdated();
    }
    activate() {
        if (this.props.isActive) {
            throw new DomainError_1.DomainError('Brand is already active');
        }
        this.props.isActive = true;
        this.markAsUpdated();
    }
    deactivate(reason) {
        if (!this.props.isActive) {
            throw new DomainError_1.DomainError('Brand is already inactive');
        }
        if (!reason || reason.trim().length === 0) {
            throw new DomainError_1.DomainError('Reason is required to deactivate brand');
        }
        this.props.isActive = false;
        this.markAsUpdated();
    }
    canBeVerified() {
        return !!this.props.cnpj && !!this.props.address;
    }
    canCreateProducts() {
        return this.props.isActive && this.props.isVerified;
    }
    hasCompleteProfile() {
        return !!(this.props.cnpj &&
            this.props.description &&
            this.props.logo &&
            this.props.website &&
            this.props.address);
    }
    validateAddress(address) {
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
            if (!address[field]) {
                throw new DomainError_1.DomainError(`Address ${field} is required`);
            }
        }
        if (address.country === 'BR' || address.country === 'Brasil') {
            const cepRegex = /^\d{5}-?\d{3}$/;
            if (!cepRegex.test(address.zipCode)) {
                throw new DomainError_1.DomainError('Invalid Brazilian ZIP code format');
            }
        }
    }
    markAsUpdated() {
        this.props.updatedAt = new Date();
    }
    toJSON() {
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
exports.Brand = Brand;
//# sourceMappingURL=Brand.js.map