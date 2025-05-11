import { Field, InputType } from '@nestjs/graphql';
import { IsDate, IsOptional, IsString, IsUUID } from 'class-validator';

@InputType()
export class CreatePrescriptionDto {
  @Field()
  @IsUUID()
  encounterId: string;

  @Field()
  @IsUUID()
  practitionerId: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDate()
  expiresAt?: Date;

  // Contenu de la prescription à générer
  @Field(() => [PrescriptionItemDto])
  items: PrescriptionItemDto[];
}

@InputType()
export class PrescriptionItemDto {
  @Field()
  @IsString()
  medication: string;

  @Field()
  @IsString()
  dosage: string;

  @Field()
  @IsString()
  frequency: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  duration?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  instructions?: string;
} 