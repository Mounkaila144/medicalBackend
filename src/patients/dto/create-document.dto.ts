import { IsArray, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { Field, InputType } from '@nestjs/graphql';
import { DocumentType } from '../entities/scanned-document.entity';

@InputType()
export class CreateDocumentDto {
  @Field()
  @IsUUID()
  @IsNotEmpty()
  patientId: string;

  @Field()
  @IsEnum(DocumentType)
  @IsNotEmpty()
  docType: DocumentType;

  @Field(() => [String], { nullable: true })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @Field()
  @IsString()
  @IsNotEmpty()
  uploadedBy: string;
} 