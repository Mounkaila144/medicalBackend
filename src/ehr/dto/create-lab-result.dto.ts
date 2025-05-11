import { Field, InputType } from '@nestjs/graphql';
import { IsDate, IsObject, IsOptional, IsString, IsUUID } from 'class-validator';

@InputType()
export class CreateLabResultDto {
  @Field()
  @IsUUID()
  patientId: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsUUID()
  encounterId?: string;

  @Field()
  @IsString()
  labName: string;

  @Field()
  @IsObject()
  result: Record<string, any>;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  filePath?: string;

  @Field()
  @IsDate()
  receivedAt: Date;
} 