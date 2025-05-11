import { IsDate, IsEmail, IsEnum, IsNotEmpty, IsObject, IsOptional, IsString, IsUUID } from 'class-validator';
import { Field, InputType } from '@nestjs/graphql';
import { Gender } from '../entities/patient.entity';
import { Transform, Type } from 'class-transformer';

@InputType()
export class CreatePatientDto {
  @Field()
  @IsUUID()
  @IsNotEmpty()
  clinicId: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  mrn: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @Field()
  @IsDate()
  @Type(() => Date)
  @IsNotEmpty()
  dob: Date;

  @Field()
  @IsEnum(Gender)
  @IsNotEmpty()
  gender: Gender;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  bloodType?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  phone?: string;

  @Field({ nullable: true })
  @IsEmail()
  @IsOptional()
  email?: string;

  @Field(() => String)
  @IsObject()
  @IsNotEmpty()
  address: any;
} 