import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { EventEmitterModule } from '@nestjs/event-emitter';

import { Practitioner } from './entities/practitioner.entity';
import { Availability } from './entities/availability.entity';
import { Appointment } from './entities/appointment.entity';
import { WaitQueueEntry } from './entities/wait-queue-entry.entity';

import { SchedulingService } from './services/scheduling.service';
import { WaitQueueService } from './services/wait-queue.service';

import { AppointmentsController } from './controllers/appointments.controller';
import { WaitQueueController } from './controllers/wait-queue.controller';

import { AgendaResolver } from './resolvers/agenda.resolver';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Practitioner,
      Availability,
      Appointment,
      WaitQueueEntry,
    ]),
    ScheduleModule.forRoot(),
    EventEmitterModule.forRoot(),
  ],
  providers: [
    SchedulingService,
    WaitQueueService,
    AgendaResolver,
  ],
  controllers: [
    AppointmentsController,
    WaitQueueController,
  ],
  exports: [
    SchedulingService,
    WaitQueueService,
  ],
})
export class SchedulingModule {} 