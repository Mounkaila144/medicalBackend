"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupplierResolver = void 0;
const graphql_1 = require("@nestjs/graphql");
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../../auth/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const user_entity_1 = require("../../auth/entities/user.entity");
const supplier_service_1 = require("../services/supplier.service");
const supplier_entity_1 = require("../entities/supplier.entity");
const supplier_dto_1 = require("../dto/supplier.dto");
let SupplierResolver = class SupplierResolver {
    supplierService;
    constructor(supplierService) {
        this.supplierService = supplierService;
    }
    async suppliers(user) {
        return this.supplierService.list(user.tenant.id);
    }
    async createSupplier(input, user) {
        return this.supplierService.create(input.name, input.contact, user.tenant);
    }
};
exports.SupplierResolver = SupplierResolver;
__decorate([
    (0, graphql_1.Query)(() => [supplier_entity_1.Supplier]),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [user_entity_1.User]),
    __metadata("design:returntype", Promise)
], SupplierResolver.prototype, "suppliers", null);
__decorate([
    (0, graphql_1.Mutation)(() => supplier_entity_1.Supplier),
    __param(0, (0, graphql_1.Args)('input')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [supplier_dto_1.CreateSupplierInput,
        user_entity_1.User]),
    __metadata("design:returntype", Promise)
], SupplierResolver.prototype, "createSupplier", null);
exports.SupplierResolver = SupplierResolver = __decorate([
    (0, graphql_1.Resolver)(() => supplier_entity_1.Supplier),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [supplier_service_1.SupplierService])
], SupplierResolver);
//# sourceMappingURL=supplier.resolver.js.map