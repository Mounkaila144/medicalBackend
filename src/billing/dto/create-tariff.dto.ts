import { Field, InputType } from '@nestjs/graphql';
import { IsDecimal, IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { TariffCategory } from '../entities/tariff.entity';

@InputType()
export class CreateTariffDto {
  @Field()
  @IsString()
  @IsNotEmpty()
  code: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  label: string;

  @Field()
  @IsDecimal()
  price: number;

  @Field(() => TariffCategory)
  @IsEnum(TariffCategory)
  category: TariffCategory;
} 