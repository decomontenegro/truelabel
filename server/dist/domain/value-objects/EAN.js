"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BRAZILIAN_EAN_PREFIXES = exports.EAN = void 0;
const ValueObject_1 = require("../base/ValueObject");
const DomainError_1 = require("../errors/DomainError");
class EAN extends ValueObject_1.ValueObject {
    constructor(props) {
        super(props);
    }
    static create(ean) {
        if (!ean || ean.trim().length === 0) {
            throw new DomainError_1.DomainError('EAN cannot be empty');
        }
        const cleanEAN = ean.replace(/\D/g, '');
        if (!this.isValidEAN(cleanEAN)) {
            throw new DomainError_1.DomainError(`Invalid EAN: ${ean}`);
        }
        return new EAN({ value: cleanEAN });
    }
    get value() {
        return this.props.value;
    }
    static isValidEAN(ean) {
        if (ean.length !== 8 && ean.length !== 13) {
            return false;
        }
        if (!/^\d+$/.test(ean)) {
            return false;
        }
        return this.validateCheckDigit(ean);
    }
    static validateCheckDigit(ean) {
        const digits = ean.split('').map(Number);
        const checkDigit = digits.pop();
        let sum = 0;
        for (let i = 0; i < digits.length; i++) {
            sum += digits[i] * (i % 2 === 0 ? 1 : 3);
        }
        const calculatedCheckDigit = (10 - (sum % 10)) % 10;
        return calculatedCheckDigit === checkDigit;
    }
    format() {
        if (this.props.value.length === 8) {
            return `${this.props.value.slice(0, 4)}-${this.props.value.slice(4)}`;
        }
        else {
            return `${this.props.value.slice(0, 3)}-${this.props.value.slice(3, 7)}-${this.props.value.slice(7, 12)}-${this.props.value.slice(12)}`;
        }
    }
    getCountryCode() {
        if (this.props.value.length === 13) {
            const prefix = this.props.value.slice(0, 3);
            if (prefix >= '789' && prefix <= '790') {
                return 'BR';
            }
            return 'UNKNOWN';
        }
        return 'N/A';
    }
    toString() {
        return this.props.value;
    }
}
exports.EAN = EAN;
exports.BRAZILIAN_EAN_PREFIXES = ['789', '790'];
//# sourceMappingURL=EAN.js.map