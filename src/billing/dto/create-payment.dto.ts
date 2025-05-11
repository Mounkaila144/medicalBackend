import { Field, InputType } from '@nestjs/graphql';
import { IsDecimal, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { PaymentMethod } from '../entities/payment.entity';

@InputType()
export class CreatePaymentDto {
  @Field()
  @IsUUID()
  @IsNotEmpty()
  invoiceId: string;

  @Field()
  @IsDecimal()
  @Min(0.01)
  amount: number;

  @Field(() => PaymentMethod)
  @IsEnum(PaymentMethod)
  method: PaymentMethod;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  reference?: string;
} 