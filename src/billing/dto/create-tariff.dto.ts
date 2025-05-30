import { Field, InputType } from '@nestjs/graphql';
import { IsEnum, IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';
import { Transform } from 'class-transformer';
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
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return parseFloat(value);
    }
    return value;
  })
  price: number;

  @Field(() => TariffCategory)
  @IsEnum(TariffCategory)
  category: TariffCategory;
} 