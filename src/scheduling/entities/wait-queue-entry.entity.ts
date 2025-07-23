import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { Field, Int, ObjectType } from '@nestjs/graphql';
// TODO: Imports temporairement commentés
// import { Patient } from '../../patients/entities/patient.entity';
// import { Practitioner } from '../entities/practitioner.entity';

export enum Priority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

@ObjectType()
@Entity('wait_queue_entries')
export class WaitQueueEntry {
  @Field()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @Field()
  @Column({ name: 'patient_id', type: 'uuid' })
  patientId: string;

  @Field({ nullable: true })
  @Column({ name: 'practitioner_id', type: 'uuid', nullable: true })
  practitionerId?: string;

  @Field({ nullable: true })
  @Column({ type: 'enum', enum: Priority, nullable: true, default: Priority.NORMAL })
  priority?: Priority;

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  reason?: string;

  @Field(() => Int)
  @Column()
  rank: number;

  @Field()
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Field({ nullable: true })
  @Column({ name: 'served_at', type: 'timestamp', nullable: true })
  servedAt: Date;

  // TODO: Relations temporairement commentées pour debug
  // @Field(() => Patient, { nullable: true })
  // @ManyToOne(() => Patient, { nullable: true })
  // @JoinColumn({ name: 'patient_id' })
  // patient?: Patient;

  // @Field(() => Practitioner, { nullable: true })
  // @ManyToOne(() => Practitioner, { nullable: true })
  // @JoinColumn({ name: 'practitioner_id' })
  // practitioner?: Practitioner;
} 