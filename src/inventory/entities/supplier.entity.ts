import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { ObjectType, Field, ID } from '@nestjs/graphql';
import { Tenant } from '../../auth/entities/tenant.entity';

@ObjectType()
@Entity()
export class Supplier {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => Tenant)
  @ManyToOne(() => Tenant, { nullable: false })
  tenant: Tenant;

  @Field(() => String)
  @Column()
  name: string;

  @Field(() => String)
  @Column({ type: 'json' })
  contact: Record<string, any>;
} 