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
exports.Tariff = exports.TariffCategory = void 0;
const typeorm_1 = require("typeorm");
const graphql_1 = require("@nestjs/graphql");
var TariffCategory;
(function (TariffCategory) {
    TariffCategory["CONSULTATION"] = "CONSULTATION";
    TariffCategory["ACT"] = "ACT";
    TariffCategory["HOSPITAL"] = "HOSPITAL";
})(TariffCategory || (exports.TariffCategory = TariffCategory = {}));
(0, graphql_1.registerEnumType)(TariffCategory, {
    name: 'TariffCategory',
});
let Tariff = class Tariff {
    code;
    tenantId;
    label;
    price;
    category;
};
exports.Tariff = Tariff;
__decorate([
    (0, typeorm_1.PrimaryColumn)(),
    (0, graphql_1.Field)(() => graphql_1.ID),
    __metadata("design:type", String)
], Tariff.prototype, "code", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'tenant_id' }),
    (0, graphql_1.Field)(),
    __metadata("design:type", String)
], Tariff.prototype, "tenantId", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    (0, graphql_1.Field)(),
    __metadata("design:type", String)
], Tariff.prototype, "label", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2 }),
    (0, graphql_1.Field)(),
    __metadata("design:type", Number)
], Tariff.prototype, "price", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: TariffCategory,
        default: TariffCategory.ACT,
    }),
    (0, graphql_1.Field)(() => TariffCategory),
    __metadata("design:type", String)
], Tariff.prototype, "category", void 0);
exports.Tariff = Tariff = __decorate([
    (0, graphql_1.ObjectType)(),
    (0, typeorm_1.Entity)('tariffs')
], Tariff);
//# sourceMappingURL=tariff.entity.js.map