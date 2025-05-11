import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { InvoicingService } from '../services/invoicing.service';
import { CreateInvoiceDto, AddInvoiceLineDto, UpdateInvoiceStatusDto } from '../dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';

@Controller('invoices')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InvoicesController {
  constructor(private readonly invoicingService: InvoicingService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.RECEPTIONIST)
  async createDraft(@Body() createInvoiceDto: CreateInvoiceDto, @Req() req) {
    return this.invoicingService.createDraft(req.user.tenantId, createInvoiceDto);
  }

  @Post('line')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.RECEPTIONIST)
  async addLine(@Body() addLineDto: AddInvoiceLineDto, @Req() req) {
    return this.invoicingService.addLine(req.user.tenantId, addLineDto);
  }

  @Post('send')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.RECEPTIONIST)
  async send(@Body() updateStatusDto: UpdateInvoiceStatusDto, @Req() req) {
    return this.invoicingService.send(req.user.tenantId, updateStatusDto);
  }

  @Post('mark-paid')
  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST)
  async markPaid(@Body() updateStatusDto: UpdateInvoiceStatusDto, @Req() req) {
    return this.invoicingService.markPaid(req.user.tenantId, updateStatusDto);
  }

  @Post('remind-overdue')
  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST)
  async remindOverdue(@Req() req) {
    return this.invoicingService.remindOverdue(req.user.tenantId);
  }
} 