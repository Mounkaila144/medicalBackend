import { Controller, Post, Get, Body, Query, UseGuards, Req } from '@nestjs/common';
import { PaymentsService } from '../services/payments.service';
import { CreatePaymentDto } from '../dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuthUserRole } from '../../auth/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from '../entities/payment.entity';

@Controller('payments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
  ) {}

  @Post()
  @Roles(AuthUserRole.SUPERADMIN, AuthUserRole.CLINIC_ADMIN, AuthUserRole.EMPLOYEE)
  async recordPayment(@Body() createPaymentDto: CreatePaymentDto, @Req() req) {
    return this.paymentsService.recordPayment(req.user.tenantId, createPaymentDto);
  }

  @Get()
  @Roles(AuthUserRole.SUPERADMIN, AuthUserRole.CLINIC_ADMIN, AuthUserRole.EMPLOYEE)
  async getPayments(@Req() req, @Query('invoiceId') invoiceId?: string) {
    if (invoiceId) {
      return this.paymentRepository.find({
        where: { 
          invoiceId,
          invoice: { tenantId: req.user.tenantId }
        },
        relations: ['invoice'],
      });
    }
    
    return this.paymentRepository.find({
      where: { 
        invoice: { tenantId: req.user.tenantId }
      },
      relations: ['invoice'],
    });
  }
} 