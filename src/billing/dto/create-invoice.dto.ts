import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

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
  @IsOptional()
  dueAt?: Date;
} 