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
exports.InvoicingService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const event_emitter_1 = require("@nestjs/event-emitter");
const entities_1 = require("../entities");
const events_1 = require("../events");
let InvoicingService = class InvoicingService {
    invoiceRepository;
    invoiceLineRepository;
    eventEmitter;
    constructor(invoiceRepository, invoiceLineRepository, eventEmitter) {
        this.invoiceRepository = invoiceRepository;
        this.invoiceLineRepository = invoiceLineRepository;
        this.eventEmitter = eventEmitter;
    }
    async createDraft(tenantId, createInvoiceDto) {
        const invoice = this.invoiceRepository.create({
            tenantId,
            patientId: createInvoiceDto.patientId,
            number: createInvoiceDto.number || `INV-${Date.now()}`,
            status: entities_1.InvoiceStatus.DRAFT,
            dueAt: createInvoiceDto.dueAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            encounterId: createInvoiceDto.encounterId,
            issueDate: createInvoiceDto.issueDate || new Date(),
            billingAddress: createInvoiceDto.billingAddress,
            notes: createInvoiceDto.notes,
        });
        return this.invoiceRepository.save(invoice);
    }
    async addLine(tenantId, addLineDto) {
        const invoice = await this.invoiceRepository.findOne({
            where: { id: addLineDto.invoiceId, tenantId },
            relations: ['lines'],
        });
        if (!invoice) {
            throw new common_1.NotFoundException(`Invoice with ID ${addLineDto.invoiceId} not found`);
        }
        if (invoice.status !== entities_1.InvoiceStatus.DRAFT) {
            throw new Error('Cannot add lines to an invoice that is not in DRAFT status');
        }
        const invoiceLine = this.invoiceLineRepository.create({
            invoiceId: invoice.id,
            description: addLineDto.description,
            qty: addLineDto.qty,
            unitPrice: addLineDto.unitPrice,
            thirdPartyRate: addLineDto.thirdPartyRate,
            tax: addLineDto.tax,
        });
        await this.invoiceLineRepository.save(invoiceLine);
        return this.recalculateTotal(invoice.id);
    }
    async send(tenantId, updateStatusDto) {
        const invoice = await this.invoiceRepository.findOne({
            where: { id: updateStatusDto.invoiceId, tenantId },
            relations: ['lines', 'patient'],
        });
        if (!invoice) {
            throw new common_1.NotFoundException(`Invoice with ID ${updateStatusDto.invoiceId} not found`);
        }
        if (invoice.status !== entities_1.InvoiceStatus.DRAFT) {
            throw new Error('Only invoices in DRAFT status can be sent');
        }
        if (!invoice.lines || invoice.lines.length === 0) {
            throw new Error('Cannot send an invoice without lines');
        }
        invoice.status = entities_1.InvoiceStatus.SENT;
        const savedInvoice = await this.invoiceRepository.save(invoice);
        this.eventEmitter.emit('invoice.sent', new events_1.InvoiceSentEvent(savedInvoice));
        return savedInvoice;
    }
    async markPaid(tenantId, updateStatusDto) {
        const invoice = await this.invoiceRepository.findOne({
            where: { id: updateStatusDto.invoiceId, tenantId },
        });
        if (!invoice) {
            throw new common_1.NotFoundException(`Invoice with ID ${updateStatusDto.invoiceId} not found`);
        }
        invoice.status = entities_1.InvoiceStatus.PAID;
        return this.invoiceRepository.save(invoice);
    }
    async remindOverdue(tenantId) {
        const now = new Date();
        const overdueInvoices = await this.invoiceRepository.find({
            where: {
                tenantId,
                status: entities_1.InvoiceStatus.SENT,
                dueAt: (0, typeorm_2.LessThan)(now),
            },
            relations: ['patient'],
        });
        const updatedInvoices = overdueInvoices.map(invoice => {
            invoice.status = entities_1.InvoiceStatus.OVERDUE;
            return invoice;
        });
        if (updatedInvoices.length > 0) {
            await this.invoiceRepository.save(updatedInvoices);
        }
        return updatedInvoices;
    }
    async recalculateTotal(invoiceId) {
        const invoice = await this.invoiceRepository.findOne({
            where: { id: invoiceId },
            relations: ['lines'],
        });
        if (!invoice) {
            throw new common_1.NotFoundException(`Invoice with ID ${invoiceId} not found`);
        }
        let total = 0;
        if (invoice.lines && invoice.lines.length > 0) {
            for (const line of invoice.lines) {
                const lineTotal = line.qty * line.unitPrice;
                const thirdPartyAmount = lineTotal * (line.thirdPartyRate / 100);
                const taxAmount = (lineTotal - thirdPartyAmount) * (line.tax / 100);
                total += lineTotal - thirdPartyAmount + taxAmount;
            }
        }
        invoice.total = total;
        return this.invoiceRepository.save(invoice);
    }
    async findAll(tenantId) {
        return this.invoiceRepository.find({
            where: { tenantId },
            relations: ['patient', 'lines'],
            order: { issueDate: 'DESC' }
        });
    }
    async findOne(tenantId, id) {
        const invoice = await this.invoiceRepository.findOne({
            where: { id, tenantId },
            relations: ['patient', 'lines', 'payments']
        });
        if (!invoice) {
            throw new common_1.NotFoundException(`Facture avec l'ID ${id} non trouvée`);
        }
        return invoice;
    }
};
exports.InvoicingService = InvoicingService;
exports.InvoicingService = InvoicingService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(entities_1.Invoice)),
    __param(1, (0, typeorm_1.InjectRepository)(entities_1.InvoiceLine)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        event_emitter_1.EventEmitter2])
], InvoicingService);
//# sourceMappingURL=invoicing.service.js.map