import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Tenant } from '../../auth/entities/tenant.entity';
import { StaffRole } from '../enums/staff-role.enum';
import { Shift } from './shift.entity';
import { LeaveRequest } from './leave-request.entity';
import { Timesheet } from './timesheet.entity';

@Entity('staff')
export class Staff {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @Column({ type: 'varchar', length: 100 })
  firstName: string;

  @Column({ type: 'varchar', length: 100 })
  lastName: string;

  @Column({
    type: 'enum',
    enum: StaffRole,
    default: StaffRole.NURSE
  })
  role: StaffRole;

  @Column({ type: 'date' })
  hireDate: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  salary: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Shift, shift => shift.staff)
  shifts: Shift[];

  @OneToMany(() => LeaveRequest, leaveRequest => leaveRequest.staff)
  leaveRequests: LeaveRequest[];

  @OneToMany(() => Timesheet, timesheet => timesheet.staff)
  timesheets: Timesheet[];
} 