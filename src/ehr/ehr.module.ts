import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { Encounter, Prescription, LabResult, AuditLog } from './entities';
import { EncountersService, PrescriptionsService, LabResultsService } from './services';
import { EncountersController, PrescriptionsController, LabResultsController } from './controllers';
import { EncountersResolver, PrescriptionsResolver, LabResultsResolver } from './resolvers';
import { EHRSupervisorGuard } from './guards/ehr-supervisor.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([Encounter, Prescription, LabResult, AuditLog]),
    EventEmitterModule.forRoot(),
  ],
  controllers: [EncountersController, PrescriptionsController, LabResultsController],
  providers: [
    EncountersService, 
    PrescriptionsService, 
    LabResultsService, 
    EncountersResolver, 
    PrescriptionsResolver, 
    LabResultsResolver,
    EHRSupervisorGuard,
  ],
  exports: [EncountersService, PrescriptionsService, LabResultsService],
})
export class EhrModule {} 