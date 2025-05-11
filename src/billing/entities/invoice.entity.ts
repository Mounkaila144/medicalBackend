import { Column, Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';
import { Patient } from '../../patients/entities/patient.entity';
import { InvoiceLine } from './invoice-line.entity';
import { Payment } from './payment.entity';

export enum InvoiceStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
}

registerEnumType(InvoiceStatus, {
  name: 'InvoiceStatus',
});

@ObjectType()
@Entity('invoices')
export class Invoice {
  @PrimaryGeneratedColumn('uuid')
  @Field(() => ID)
  id: string;

  @Column({ name: 'tenant_id' })
  @Field()
  tenantId: string;

  @ManyToOne(() => Patient)
  @JoinColumn({ name: 'patient_id' })
  @Field(() => Patient)
  patient: Patient;

  @Column({ name: 'patient_id' })
  patientId: string;

  @Column({ unique: true })
  @Field()
  number: string;

  @Column({
    type: 'enum',
    enum: InvoiceStatus,
    default: InvoiceStatus.DRAFT,
  })
  @Field(() => InvoiceStatus)
  status: InvoiceStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  @Field()
  total: number;

  @Column({ name: 'due_at', nullable: true })
  @Field({ nullable: true })
  dueAt: Date;

  @OneToMany(() => InvoiceLine, (line) => line.invoice, { cascade: true })
  @Field(() => [InvoiceLine], { nullable: true })
  lines: InvoiceLine[];

  @OneToMany(() => Payment, (payment) => payment.invoice, { cascade: true })
  @Field(() => [Payment], { nullable: true })
  payments: Payment[];
} 