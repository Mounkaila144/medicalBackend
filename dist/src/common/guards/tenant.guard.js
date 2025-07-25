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
Object.defineProperty(exports, "__esModule", { value: true });
exports.TenantGuard = void 0;
const common_1 = require("@nestjs/common");
const graphql_1 = require("@nestjs/graphql");
const core_1 = require("@nestjs/core");
let TenantGuard = class TenantGuard {
    reflector;
    constructor(reflector) {
        this.reflector = reflector;
    }
    canActivate(context) {
        const isGraphQL = context.getType().toString() !== 'http';
        let request;
        if (isGraphQL) {
            const ctx = graphql_1.GqlExecutionContext.create(context);
            request = ctx.getContext().req;
        }
        else {
            request = context.switchToHttp().getRequest();
        }
        const user = request.user;
        if (!user) {
            throw new common_1.ForbiddenException('Vous n\'avez pas accès à ce tenant');
        }
        const requestedTenantId = request.params?.tenantId ||
            request.query?.tenantId ||
            request.headers?.['x-tenant-id'];
        if (!requestedTenantId) {
            return true;
        }
        request['tenantId'] = requestedTenantId;
        if (user.isAdmin) {
            return true;
        }
        if (user.tenantId === requestedTenantId ||
            (user.tenants && user.tenants.includes(requestedTenantId))) {
            return true;
        }
        throw new common_1.ForbiddenException(`Vous n'avez pas accès au tenant ${requestedTenantId}`);
    }
};
exports.TenantGuard = TenantGuard;
exports.TenantGuard = TenantGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector])
], TenantGuard);
//# sourceMappingURL=tenant.guard.js.map