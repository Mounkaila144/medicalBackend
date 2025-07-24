import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Invoice, InvoiceLine } from '../entities';
import { CreateInvoiceDto, AddInvoiceLineDto, UpdateInvoiceStatusDto } from '../dto';
export declare class InvoicingService {
    private invoiceRepository;
    private invoiceLineRepository;
    private eventEmitter;
    constructor(invoiceRepository: Repository<Invoice>, invoiceLineRepository: Repository<InvoiceLine>, eventEmitter: EventEmitter2);
    createDraft(tenantId: string, createInvoiceDto: CreateInvoiceDto): Promise<Invoice>;
    addLine(tenantId: string, addLineDto: AddInvoiceLineDto): Promise<Invoice>;
    send(tenantId: string, updateStatusDto: UpdateInvoiceStatusDto): Promise<Invoice>;
    markPaid(tenantId: string, updateStatusDto: UpdateInvoiceStatusDto): Promise<Invoice>;
    remindOverdue(tenantId: string): Promise<Invoice[]>;
    private recalculateTotal;
    findAll(tenantId: string): Promise<Invoice[]>;
    findOne(tenantId: string, id: string): Promise<Invoice>;
}
