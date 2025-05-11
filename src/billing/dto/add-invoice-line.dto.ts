import { Field, InputType } from '@nestjs/graphql';
import { IsDecimal, IsNotEmpty, IsOptional, IsString, IsUUID, Min } from 'class-validator';

@InputType()
export class AddInvoiceLineDto {
  @Field()
  @IsUUID()
  @IsNotEmpty()
  invoiceId: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  description: string;

  @Field()
  @IsDecimal()
  @Min(0.01)
  qty: number;

  @Field()
  @IsDecimal()
  @Min(0)
  unitPrice: number;

  @Field({ defaultValue: 0 })
  @IsDecimal()
  @IsOptional()
  thirdPartyRate?: number = 0;

  @Field({ defaultValue: 0 })
  @IsDecimal()
  @IsOptional()
  tax?: number = 0;
} 