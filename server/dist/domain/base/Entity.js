"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Entity = void 0;
const uuid_1 = require("uuid");
class Entity {
    constructor(props, id) {
        this._id = id || (0, uuid_1.v4)();
        this.props = props;
    }
    get id() {
        return this._id;
    }
    equals(entity) {
        if (entity === null || entity === undefined) {
            return false;
        }
        if (this === entity) {
            return true;
        }
        if (!this.isEntity(entity)) {
            return false;
        }
        return this._id === entity._id;
    }
    isEntity(v) {
        return v instanceof Entity;
    }
}
exports.Entity = Entity;
//# sourceMappingURL=Entity.js.map