import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Invoice, InvoiceStatus, InvoiceLine } from '../entities';
import { 
  CreateInvoiceDto, 
  AddInvoiceLineDto, 
  UpdateInvoiceStatusDto 
} from '../dto';
import { InvoiceSentEvent } from '../events';

@Injectable()
export class InvoicingService {
  constructor(
    @InjectRepository(Invoice)
    private invoiceRepository: Repository<Invoice>,
    @InjectRepository(InvoiceLine)
    private invoiceLineRepository: Repository<InvoiceLine>,
    private eventEmitter: EventEmitter2,
  ) {}

  async createDraft(tenantId: string, createInvoiceDto: CreateInvoiceDto): Promise<Invoice> {
    const invoice = this.invoiceRepository.create({
      tenantId,
      patientId: createInvoiceDto.patientId,
      number: createInvoiceDto.number || `INV-${Date.now()}`,
      status: InvoiceStatus.DRAFT,
      dueAt: createInvoiceDto.dueAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 jours par défaut
      encounterId: createInvoiceDto.encounterId,
      issueDate: createInvoiceDto.issueDate || new Date(),
      billingAddress: createInvoiceDto.billingAddress,
      notes: createInvoiceDto.notes,
    });

    return this.invoiceRepository.save(invoice);
  }

  async addLine(tenantId: string, addLineDto: AddInvoiceLineDto): Promise<Invoice> {
    const invoice = await this.invoiceRepository.findOne({
      where: { id: addLineDto.invoiceId, tenantId },
      relations: ['lines'],
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${addLineDto.invoiceId} not found`);
    }

    if (invoice.status !== InvoiceStatus.DRAFT) {
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

    // Recalculer le total de la facture
    return this.recalculateTotal(invoice.id);
  }

  async send(tenantId: string, updateStatusDto: UpdateInvoiceStatusDto): Promise<Invoice> {
    const invoice = await this.invoiceRepository.findOne({
      where: { id: updateStatusDto.invoiceId, tenantId },
      relations: ['lines', 'patient'],
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${updateStatusDto.invoiceId} not found`);
    }

    if (invoice.status !== InvoiceStatus.DRAFT) {
      throw new Error('Only invoices in DRAFT status can be sent');
    }

    if (!invoice.lines || invoice.lines.length === 0) {
      throw new Error('Cannot send an invoice without lines');
    }

    invoice.status = InvoiceStatus.SENT;
    const savedInvoice = await this.invoiceRepository.save(invoice);

    // Émettre l'événement
    this.eventEmitter.emit('invoice.sent', new InvoiceSentEvent(savedInvoice));

    return savedInvoice;
  }

  async markPaid(tenantId: string, updateStatusDto: UpdateInvoiceStatusDto): Promise<Invoice> {
    const invoice = await this.invoiceRepository.findOne({
      where: { id: updateStatusDto.invoiceId, tenantId },
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${updateStatusDto.invoiceId} not found`);
    }

    invoice.status = InvoiceStatus.PAID;
    return this.invoiceRepository.save(invoice);
  }

  async remindOverdue(tenantId: string): Promise<Invoice[]> {
    const now = new Date();
    const overdueInvoices = await this.invoiceRepository.find({
      where: {
        tenantId,
        status: InvoiceStatus.SENT,
        dueAt: LessThan(now),
      },
      relations: ['patient'],
    });

    const updatedInvoices = overdueInvoices.map(invoice => {
      invoice.status = InvoiceStatus.OVERDUE;
      return invoice;
    });

    if (updatedInvoices.length > 0) {
      await this.invoiceRepository.save(updatedInvoices);
    }

    return updatedInvoices;
  }

  private async recalculateTotal(invoiceId: string): Promise<Invoice> {
    const invoice = await this.invoiceRepository.findOne({
      where: { id: invoiceId },
      relations: ['lines'],
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${invoiceId} not found`);
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

  async findAll(tenantId: string): Promise<Invoice[]> {
    return this.invoiceRepository.find({
      where: { tenantId },
      relations: ['patient', 'lines'],
      order: { issueDate: 'DESC' }
    });
  }

  async findOne(tenantId: string, id: string): Promise<Invoice> {
    const invoice = await this.invoiceRepository.findOne({
      where: { id, tenantId },
      relations: ['patient', 'lines', 'payments']
    });

    if (!invoice) {
      throw new NotFoundException(`Facture avec l'ID ${id} non trouvée`);
    }

    return invoice;
  }
} 