import { Column, Entity, PrimaryColumn } from 'typeorm';
import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';

export enum TariffCategory {
  CONSULTATION = 'CONSULTATION',
  ACT = 'ACT',
  HOSPITAL = 'HOSPITAL',
}

registerEnumType(TariffCategory, {
  name: 'TariffCategory',
});

@ObjectType()
@Entity('tariffs')
export class Tariff {
  @PrimaryColumn()
  @Field(() => ID)
  code: string;

  @Column({ name: 'tenant_id' })
  @Field()
  tenantId: string;

  @Column()
  @Field()
  label: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  @Field()
  price: number;

  @Column({
    type: 'enum',
    enum: TariffCategory,
    default: TariffCategory.ACT,
  })
  @Field(() => TariffCategory)
  category: TariffCategory;
} 