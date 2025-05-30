import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { InvoicingService } from '../services/invoicing.service';
import { CreateInvoiceDto, AddInvoiceLineDto, UpdateInvoiceStatusDto } from '../dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuthUserRole } from '../../auth/entities/user.entity';

@Controller('invoices')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InvoicesController {
  constructor(private readonly invoicingService: InvoicingService) {}

  @Post()
  @Roles(AuthUserRole.SUPERADMIN, AuthUserRole.CLINIC_ADMIN, AuthUserRole.EMPLOYEE)
  async createDraft(@Body() createInvoiceDto: CreateInvoiceDto, @Req() req) {
    return this.invoicingService.createDraft(req.user.tenantId, createInvoiceDto);
  }

  @Post('line')
  @Roles(AuthUserRole.SUPERADMIN, AuthUserRole.CLINIC_ADMIN, AuthUserRole.EMPLOYEE)
  async addLine(@Body() addLineDto: AddInvoiceLineDto, @Req() req) {
    return this.invoicingService.addLine(req.user.tenantId, addLineDto);
  }

  @Post('send')
  @Roles(AuthUserRole.SUPERADMIN, AuthUserRole.CLINIC_ADMIN, AuthUserRole.EMPLOYEE)
  async send(@Body() updateStatusDto: UpdateInvoiceStatusDto, @Req() req) {
    return this.invoicingService.send(req.user.tenantId, updateStatusDto);
  }

  @Post('mark-paid')
  @Roles(AuthUserRole.SUPERADMIN, AuthUserRole.CLINIC_ADMIN, AuthUserRole.EMPLOYEE)
  async markPaid(@Body() updateStatusDto: UpdateInvoiceStatusDto, @Req() req) {
    return this.invoicingService.markPaid(req.user.tenantId, updateStatusDto);
  }

  @Post('remind-overdue')
  @Roles(AuthUserRole.SUPERADMIN, AuthUserRole.CLINIC_ADMIN, AuthUserRole.EMPLOYEE)
  async remindOverdue(@Req() req) {
    return this.invoicingService.remindOverdue(req.user.tenantId);
  }

  @Get()
  @Roles(AuthUserRole.SUPERADMIN, AuthUserRole.CLINIC_ADMIN, AuthUserRole.EMPLOYEE)
  async findAll(@Req() req) {
    return this.invoicingService.findAll(req.user.tenantId);
  }

  @Get(':id')
  @Roles(AuthUserRole.SUPERADMIN, AuthUserRole.CLINIC_ADMIN, AuthUserRole.EMPLOYEE)
  async findOne(@Param('id') id: string, @Req() req) {
    return this.invoicingService.findOne(req.user.tenantId, id);
  }
} 