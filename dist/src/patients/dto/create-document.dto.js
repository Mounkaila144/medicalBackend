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
exports.CreateDocumentDto = void 0;
const class_validator_1 = require("class-validator");
const graphql_1 = require("@nestjs/graphql");
const class_transformer_1 = require("class-transformer");
const scanned_document_entity_1 = require("../entities/scanned-document.entity");
let CreateDocumentDto = class CreateDocumentDto {
    patientId;
    docType;
    tags;
    uploadedBy;
};
exports.CreateDocumentDto = CreateDocumentDto;
__decorate([
    (0, graphql_1.Field)(),
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateDocumentDto.prototype, "patientId", void 0);
__decorate([
    (0, graphql_1.Field)(),
    (0, class_validator_1.IsEnum)(scanned_document_entity_1.DocumentType),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateDocumentDto.prototype, "docType", void 0);
__decorate([
    (0, graphql_1.Field)(() => [String], { nullable: true }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => {
        if (typeof value === 'string') {
            return value.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
        }
        return value;
    }),
    __metadata("design:type", Array)
], CreateDocumentDto.prototype, "tags", void 0);
__decorate([
    (0, graphql_1.Field)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateDocumentDto.prototype, "uploadedBy", void 0);
exports.CreateDocumentDto = CreateDocumentDto = __decorate([
    (0, graphql_1.InputType)()
], CreateDocumentDto);
//# sourceMappingURL=create-document.dto.js.map