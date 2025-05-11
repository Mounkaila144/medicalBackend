import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';

import { SchedulingService } from '../services/scheduling.service';
import { CreateAppointmentDto } from '../dto/create-appointment.dto';
import { RescheduleAppointmentDto } from '../dto/reschedule-appointment.dto';
import { Appointment } from '../entities/appointment.entity';
import { TenantId } from '../../common/decorators/tenant-id.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';

@Controller('appointments')
@UseGuards(JwtAuthGuard, TenantGuard)
export class AppointmentsController {
  constructor(private readonly schedulingService: SchedulingService) {}

  @Post()
  async create(
    @TenantId() tenantId: string,
    @Body() createAppointmentDto: CreateAppointmentDto,
  ): Promise<Appointment> {
    return this.schedulingService.book(tenantId, createAppointmentDto);
  }

  @Put('reschedule')
  async reschedule(
    @TenantId() tenantId: string,
    @Body() rescheduleDto: RescheduleAppointmentDto,
  ): Promise<Appointment> {
    return this.schedulingService.reschedule(tenantId, rescheduleDto);
  }

  @Delete(':id')
  async cancel(
    @TenantId() tenantId: string,
    @Param('id') appointmentId: string,
  ): Promise<Appointment> {
    return this.schedulingService.cancel(tenantId, appointmentId);
  }

  @Get('practitioner/:practitionerId')
  async getPractitionerAppointments(
    @TenantId() tenantId: string,
    @Param('practitionerId') practitionerId: string,
    @Query('date') dateString: string,
  ): Promise<Appointment[]> {
    const date = dateString ? new Date(dateString) : new Date();
    return this.schedulingService.listAgenda(tenantId, practitionerId, date);
  }
} 