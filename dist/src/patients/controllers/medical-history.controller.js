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
exports.MedicalHistoryController = void 0;
const common_1 = require("@nestjs/common");
const medical_history_service_1 = require("../services/medical-history.service");
const create_medical_history_item_dto_1 = require("../dto/create-medical-history-item.dto");
const jwt_auth_guard_1 = require("../../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../../auth/guards/roles.guard");
const roles_guard_2 = require("../../auth/guards/roles.guard");
const user_entity_1 = require("../../auth/entities/user.entity");
let MedicalHistoryController = class MedicalHistoryController {
    medicalHistoryService;
    constructor(medicalHistoryService) {
        this.medicalHistoryService = medicalHistoryService;
    }
    async addItem(createItemDto, req) {
        const tenantId = req.user.tenantId;
        return this.medicalHistoryService.addItem(createItemDto, tenantId);
    }
    async listByPatient(patientId, req) {
        const tenantId = req.user.tenantId;
        return this.medicalHistoryService.listByPatient(patientId, tenantId);
    }
    async remove(id, req) {
        const tenantId = req.user.tenantId;
        return this.medicalHistoryService.remove(id, tenantId);
    }
};
exports.MedicalHistoryController = MedicalHistoryController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_guard_2.Roles)(user_entity_1.AuthUserRole.CLINIC_ADMIN, user_entity_1.AuthUserRole.EMPLOYEE),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_medical_history_item_dto_1.CreateMedicalHistoryItemDto, Object]),
    __metadata("design:returntype", Promise)
], MedicalHistoryController.prototype, "addItem", null);
__decorate([
    (0, common_1.Get)('patient/:patientId'),
    (0, roles_guard_2.Roles)(user_entity_1.AuthUserRole.CLINIC_ADMIN, user_entity_1.AuthUserRole.EMPLOYEE),
    __param(0, (0, common_1.Param)('patientId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], MedicalHistoryController.prototype, "listByPatient", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_guard_2.Roles)(user_entity_1.AuthUserRole.CLINIC_ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], MedicalHistoryController.prototype, "remove", null);
exports.MedicalHistoryController = MedicalHistoryController = __decorate([
    (0, common_1.Controller)('patients/medical-history'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [medical_history_service_1.MedicalHistoryService])
], MedicalHistoryController);
//# sourceMappingURL=medical-history.controller.js.map