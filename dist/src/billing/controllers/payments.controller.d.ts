import { PaymentsService } from '../services/payments.service';
import { CreatePaymentDto } from '../dto';
import { Repository } from 'typeorm';
import { Payment } from '../entities/payment.entity';
export declare class PaymentsController {
    private readonly paymentsService;
    private paymentRepository;
    constructor(paymentsService: PaymentsService, paymentRepository: Repository<Payment>);
    recordPayment(createPaymentDto: CreatePaymentDto, req: any): Promise<Payment>;
    getPayments(req: any, invoiceId?: string): Promise<Payment[]>;
}
