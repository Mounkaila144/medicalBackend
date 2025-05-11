import { Resolver, Query, Mutation, Args, Context } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from '../entities';
import { PaymentsService } from '../services';
import { CreatePaymentDto } from '../dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';

@Resolver(() => Payment)
@UseGuards(JwtAuthGuard, RolesGuard)
export class PaymentsResolver {
  constructor(
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    private paymentsService: PaymentsService,
  ) {}

  @Query(() => [Payment])
  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST)
  async paymentsByInvoice(@Args('invoiceId') invoiceId: string, @Context() context) {
    return this.paymentRepository.find({
      where: { 
        invoiceId,
        invoice: { tenantId: context.req.user.tenantId }
      },
      relations: ['invoice'],
    });
  }

  @Mutation(() => Payment)
  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST)
  async createPayment(
    @Args('createPaymentDto') createPaymentDto: CreatePaymentDto,
    @Context() context,
  ) {
    return this.paymentsService.recordPayment(context.req.user.tenantId, createPaymentDto);
  }
} 