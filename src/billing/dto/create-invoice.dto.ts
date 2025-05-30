import { Field, InputType } from '@nestjs/graphql';
import { IsDate, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { BillingAddressDto } from './billing-address.dto';

@InputType()
export class CreateInvoiceDto {
  @Field()
  @IsUUID()
  @IsNotEmpty()
  patientId: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  number?: string;

  @Field({ nullable: true })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  dueAt?: Date;

  @Field({ nullable: true })
  @IsUUID()
  @IsOptional()
  encounterId?: string;

  @Field({ nullable: true })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  issueDate?: Date;

  @Field(() => BillingAddressDto, { nullable: true })
  @IsOptional()
  billingAddress?: BillingAddressDto;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  notes?: string;
} 