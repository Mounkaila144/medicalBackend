import { Column, Entity, ManyToOne, PrimaryGeneratedColumn, JoinColumn } from 'typeorm';
import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Encounter } from './encounter.entity';
import { Practitioner } from './practitioner.entity';

@ObjectType()
@Entity('prescriptions')
export class Prescription {
  @PrimaryGeneratedColumn('uuid')
  @Field(() => ID)
  id: string;

  @ManyToOne(() => Encounter, (encounter) => encounter.prescriptions)
  @JoinColumn({ name: 'encounter_id' })
  @Field(() => Encounter)
  encounter: Encounter;

  @Column({ name: 'encounter_id' })
  encounterId: string;

  @ManyToOne(() => Practitioner)
  @JoinColumn({ name: 'practitioner_id' })
  @Field(() => Practitioner)
  practitioner: Practitioner;

  @Column({ name: 'practitioner_id' })
  practitionerId: string;

  @Column({ name: 'pdf_path', nullable: true })
  @Field({ nullable: true })
  pdfPath: string;

  @Column({ nullable: true })
  @Field({ nullable: true })
  qr: string;

  @Column({ name: 'expires_at', nullable: true })
  @Field({ nullable: true })
  expiresAt: Date;
} 