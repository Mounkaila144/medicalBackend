import { Invoice } from './invoice.entity';
export declare enum PaymentMethod {
    CASH = "CASH",
    CARD = "CARD",
    INSURANCE = "INSURANCE",
    ONLINE = "ONLINE"
}
export declare class Payment {
    id: string;
    invoice: Invoice;
    invoiceId: string;
    amount: number;
    method: PaymentMethod;
    paidAt: Date;
    reference: string;
}
