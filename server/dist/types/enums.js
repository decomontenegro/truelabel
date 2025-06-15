"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRole = exports.ValidationQueuePriority = exports.ValidationQueueStatus = void 0;
var ValidationQueueStatus;
(function (ValidationQueueStatus) {
    ValidationQueueStatus["PENDING"] = "PENDING";
    ValidationQueueStatus["IN_PROGRESS"] = "IN_PROGRESS";
    ValidationQueueStatus["COMPLETED"] = "COMPLETED";
    ValidationQueueStatus["FAILED"] = "FAILED";
})(ValidationQueueStatus || (exports.ValidationQueueStatus = ValidationQueueStatus = {}));
var ValidationQueuePriority;
(function (ValidationQueuePriority) {
    ValidationQueuePriority["HIGH"] = "HIGH";
    ValidationQueuePriority["MEDIUM"] = "MEDIUM";
    ValidationQueuePriority["LOW"] = "LOW";
})(ValidationQueuePriority || (exports.ValidationQueuePriority = ValidationQueuePriority = {}));
var UserRole;
(function (UserRole) {
    UserRole["ADMIN"] = "ADMIN";
    UserRole["BRAND"] = "BRAND";
    UserRole["LABORATORY"] = "LABORATORY";
    UserRole["USER"] = "USER";
})(UserRole || (exports.UserRole = UserRole = {}));
//# sourceMappingURL=enums.js.map