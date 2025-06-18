"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductName = void 0;
const ValueObject_1 = require("../base/ValueObject");
const DomainError_1 = require("../errors/DomainError");
class ProductName extends ValueObject_1.ValueObject {
    constructor(props) {
        super(props);
    }
    static create(name) {
        if (!name || name.trim().length === 0) {
            throw new DomainError_1.DomainError('Product name cannot be empty');
        }
        const trimmedName = name.trim();
        if (trimmedName.length < this.MIN_LENGTH) {
            throw new DomainError_1.DomainError(`Product name must have at least ${this.MIN_LENGTH} characters`);
        }
        if (trimmedName.length > this.MAX_LENGTH) {
            throw new DomainError_1.DomainError(`Product name cannot exceed ${this.MAX_LENGTH} characters`);
        }
        if (this.containsProhibitedCharacters(trimmedName)) {
            throw new DomainError_1.DomainError('Product name contains invalid characters');
        }
        return new ProductName({ value: this.sanitize(trimmedName) });
    }
    get value() {
        return this.props.value;
    }
    static containsProhibitedCharacters(name) {
        const prohibitedPattern = /[\x00-\x1F\x7F]/;
        return prohibitedPattern.test(name);
    }
    static sanitize(name) {
        return name
            .replace(/\s+/g, ' ')
            .trim();
    }
    getSlug() {
        return this.props.value
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }
    getInitials() {
        const words = this.props.value.split(' ').filter(word => word.length > 0);
        if (words.length === 1) {
            return words[0].substring(0, 2).toUpperCase();
        }
        return words
            .slice(0, 2)
            .map(word => word[0])
            .join('')
            .toUpperCase();
    }
    toString() {
        return this.props.value;
    }
}
exports.ProductName = ProductName;
ProductName.MIN_LENGTH = 3;
ProductName.MAX_LENGTH = 200;
//# sourceMappingURL=ProductName.js.map