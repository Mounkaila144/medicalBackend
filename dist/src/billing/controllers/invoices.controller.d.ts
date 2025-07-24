import { InvoicingService } from '../services/invoicing.service';
import { CreateInvoiceDto, AddInvoiceLineDto, UpdateInvoiceStatusDto } from '../dto';
export declare class InvoicesController {
    private readonly invoicingService;
    constructor(invoicingService: InvoicingService);
    createDraft(createInvoiceDto: CreateInvoiceDto, req: any): Promise<import("../entities").Invoice>;
    addLine(addLineDto: AddInvoiceLineDto, req: any): Promise<import("../entities").Invoice>;
    send(updateStatusDto: UpdateInvoiceStatusDto, req: any): Promise<import("../entities").Invoice>;
    markPaid(updateStatusDto: UpdateInvoiceStatusDto, req: any): Promise<import("../entities").Invoice>;
    remindOverdue(req: any): Promise<import("../entities").Invoice[]>;
    findAll(req: any): Promise<import("../entities").Invoice[]>;
    findOne(id: string, req: any): Promise<import("../entities").Invoice>;
}
