import { Field, InputType } from '@nestjs/graphql';
import { IsEnum, IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';
import { Transform } from 'class-transformer';
import { TariffCategory } from '../entities/tariff.entity';

export class CreateTariffDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsNotEmpty()
  label: string;

  @IsNumber()
  @Min(0)
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return parseFloat(value);
    }
    return value;
  })
  price: number;

  @IsEnum(TariffCategory)
  category: TariffCategory;
}

// GraphQL version for resolvers
@InputType()
export class CreateTariffGqlDto {
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