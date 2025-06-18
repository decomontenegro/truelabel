"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValueObject = void 0;
class ValueObject {
    constructor(props) {
        this.props = Object.freeze(props);
    }
    equals(valueObject) {
        if (valueObject === null || valueObject === undefined) {
            return false;
        }
        if (valueObject.props === undefined) {
            return false;
        }
        return JSON.stringify(this.props) === JSON.stringify(valueObject.props);
    }
}
exports.ValueObject = ValueObject;
//# sourceMappingURL=ValueObject.js.map