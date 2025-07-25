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
exports.CreatePayrollExportInput = exports.PayrollExportDto = void 0;
const graphql_1 = require("@nestjs/graphql");
const class_validator_1 = require("class-validator");
let PayrollExportDto = class PayrollExportDto {
    id;
    tenantId;
    period;
    filePath;
    generatedAt;
};
exports.PayrollExportDto = PayrollExportDto;
__decorate([
    (0, graphql_1.Field)(() => graphql_1.ID),
    __metadata("design:type", String)
], PayrollExportDto.prototype, "id", void 0);
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", String)
], PayrollExportDto.prototype, "tenantId", void 0);
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", String)
], PayrollExportDto.prototype, "period", void 0);
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", String)
], PayrollExportDto.prototype, "filePath", void 0);
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", Date)
], PayrollExportDto.prototype, "generatedAt", void 0);
exports.PayrollExportDto = PayrollExportDto = __decorate([
    (0, graphql_1.ObjectType)()
], PayrollExportDto);
let CreatePayrollExportInput = class CreatePayrollExportInput {
    tenantId;
    period;
};
exports.CreatePayrollExportInput = CreatePayrollExportInput;
__decorate([
    (0, graphql_1.Field)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreatePayrollExportInput.prototype, "tenantId", void 0);
__decorate([
    (0, graphql_1.Field)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreatePayrollExportInput.prototype, "period", void 0);
exports.CreatePayrollExportInput = CreatePayrollExportInput = __decorate([
    (0, graphql_1.InputType)()
], CreatePayrollExportInput);
//# sourceMappingURL=payroll-export.dto.js.map