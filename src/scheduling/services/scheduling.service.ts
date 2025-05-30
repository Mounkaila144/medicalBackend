import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, LessThan, MoreThan, Between } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Cron } from '@nestjs/schedule';

import { Appointment } from '../entities/appointment.entity';
import { Practitioner } from '../entities/practitioner.entity';
import { CreateAppointmentDto } from '../dto/create-appointment.dto';
import { RescheduleAppointmentDto } from '../dto/reschedule-appointment.dto';
import { CancelAppointmentDto } from '../dto/cancel-appointment.dto';
import { AppointmentStatus } from '../enums/appointment-status.enum';
import { AppointmentCreatedEvent } from '../events/appointment-created.event';
import { AppointmentCancelledEvent } from '../events/appointment-cancelled.event';

@Injectable()
export class SchedulingService {
  constructor(
    @InjectRepository(Appointment)
    private appointmentRepository: Repository<Appointment>,
    @InjectRepository(Practitioner)
    private practitionerRepository: Repository<Practitioner>,
    private eventEmitter: EventEmitter2,
  ) {}

  async book(tenantId: string, createAppointmentDto: CreateAppointmentDto): Promise<Appointment> {
    // Vérifier la disponibilité du praticien
    const isAvailable = await this.checkAvailability(
      createAppointmentDto.practitionerId,
      createAppointmentDto.startAt,
      createAppointmentDto.endAt,
    );

    if (!isAvailable) {
      throw new Error('Le praticien n\'est pas disponible sur ce créneau');
    }

    // Créer le rendez-vous
    const appointment = this.appointmentRepository.create({
      tenantId,
      ...createAppointmentDto,
      status: AppointmentStatus.BOOKED,
    });

    const savedAppointment = await this.appointmentRepository.save(appointment);
    
    // Émettre l'événement de création
    this.eventEmitter.emit(
      'appointment.created',
      new AppointmentCreatedEvent(savedAppointment),
    );

    return savedAppointment;
  }

  async reschedule(tenantId: string, rescheduleDto: RescheduleAppointmentDto): Promise<Appointment> {
    const appointment = await this.appointmentRepository.findOne({
      where: { id: rescheduleDto.appointmentId, tenantId },
    });

    if (!appointment) {
      throw new Error('Rendez-vous non trouvé');
    }

    // Si changement de praticien, vérifier sa disponibilité
    const practitionerId = rescheduleDto.practitionerId || appointment.practitionerId;
    const isAvailable = await this.checkAvailability(
      practitionerId,
      rescheduleDto.startAt,
      rescheduleDto.endAt,
      appointment.id,
    );

    if (!isAvailable) {
      throw new Error('Le praticien n\'est pas disponible sur ce créneau');
    }

    // Mettre à jour le rendez-vous
    appointment.startAt = rescheduleDto.startAt;
    appointment.endAt = rescheduleDto.endAt;
    
    if (rescheduleDto.practitionerId) {
      appointment.practitionerId = rescheduleDto.practitionerId;
    }
    
    if (rescheduleDto.room) {
      appointment.room = rescheduleDto.room;
    }

    return this.appointmentRepository.save(appointment);
  }

  async cancel(
    tenantId: string, 
    appointmentId: string,
    cancelDto?: CancelAppointmentDto,
  ): Promise<Appointment> {
    const appointment = await this.appointmentRepository.findOne({
      where: { id: appointmentId, tenantId },
    });

    if (!appointment) {
      throw new Error('Rendez-vous non trouvé');
    }

    appointment.status = AppointmentStatus.CANCELLED;
    if (cancelDto?.cancellationReason) {
      appointment.reason = `Annulé: ${cancelDto.cancellationReason}`;
    }
    
    const updatedAppointment = await this.appointmentRepository.save(appointment);
    
    // Émettre l'événement d'annulation
    this.eventEmitter.emit(
      'appointment.cancelled',
      new AppointmentCancelledEvent(updatedAppointment, cancelDto?.notifyPatient ?? true),
    );

    return updatedAppointment;
  }

  async listAgenda(tenantId: string, practitionerId: string, date: Date): Promise<Appointment[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return this.appointmentRepository.find({
      where: {
        tenantId,
        practitionerId,
        startAt: MoreThan(startOfDay),
        endAt: LessThan(endOfDay),
        status: Not(AppointmentStatus.CANCELLED),
      },
      order: { startAt: 'ASC' },
    });
  }

  private async checkAvailability(
    practitionerId: string,
    start: Date,
    end: Date,
    excludeAppointmentId?: string,
  ): Promise<boolean> {
    const query = this.appointmentRepository
      .createQueryBuilder('appointment')
      .where('appointment.practitioner_id = :practitionerId', { practitionerId })
      .andWhere('appointment.status != :cancelledStatus', { cancelledStatus: AppointmentStatus.CANCELLED })
      .andWhere(
        '(appointment.start_at < :end AND appointment.end_at > :start)',
        { start, end },
      );

    if (excludeAppointmentId) {
      query.andWhere('appointment.id != :excludeId', { excludeId: excludeAppointmentId });
    }

    const conflictingAppointments = await query.getCount();
    return conflictingAppointments === 0;
  }

  @Cron('0 0 * * *') // Tous les jours à minuit
  async sendDailyReminders() {
    // Trouver les rendez-vous dans 24h
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const startOfDay = new Date(tomorrow);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(tomorrow);
    endOfDay.setHours(23, 59, 59, 999);

    const appointments = await this.appointmentRepository.find({
      where: {
        startAt: Between(startOfDay, endOfDay),
        status: AppointmentStatus.BOOKED,
      },
      relations: ['practitioner'],
    });

    // Émettre un événement pour chaque rappel
    for (const appointment of appointments) {
      this.eventEmitter.emit('appointment.reminder.24h', { appointment });
    }
  }

  @Cron('0 * * * *') // Toutes les heures
  async sendHourlyReminders() {
    // Trouver les rendez-vous dans 1h
    const oneHourLater = new Date();
    oneHourLater.setHours(oneHourLater.getHours() + 1);
    
    const start = new Date(oneHourLater);
    start.setMinutes(0, 0, 0);
    
    const end = new Date(oneHourLater);
    end.setMinutes(59, 59, 999);

    const appointments = await this.appointmentRepository.find({
      where: {
        startAt: Between(start, end),
        status: AppointmentStatus.BOOKED,
      },
      relations: ['practitioner'],
    });

    // Émettre un événement pour chaque rappel
    for (const appointment of appointments) {
      this.eventEmitter.emit('appointment.reminder.1h', { appointment });
    }
  }
} 