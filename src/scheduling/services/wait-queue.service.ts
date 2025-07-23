import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { WaitQueueEntry } from '../entities/wait-queue-entry.entity';
import { CreateWaitQueueEntryDto } from '../dto/create-wait-queue-entry.dto';
import { UpdateWaitQueueEntryDto } from '../dto/update-wait-queue-entry.dto';
import { WaitQueueUpdatedEvent } from '../events/wait-queue-updated.event';

@Injectable()
export class WaitQueueService {
  constructor(
    @InjectRepository(WaitQueueEntry)
    private waitQueueRepository: Repository<WaitQueueEntry>,
    private eventEmitter: EventEmitter2,
  ) {}

  async enqueue(tenantId: string, createDto: CreateWaitQueueEntryDto): Promise<WaitQueueEntry> {
    // Vérifier si le patient est déjà dans la file d'attente
    const existingEntry = await this.waitQueueRepository.findOne({
      where: {
        tenantId,
        patientId: createDto.patientId,
        servedAt: IsNull(),
      },
    });

    if (existingEntry) {
      throw new ConflictException('Le patient est déjà dans la file d\'attente');
    }

    // Trouver le dernier rang
    const lastEntry = await this.waitQueueRepository.findOne({
      where: { tenantId, servedAt: IsNull() },
      order: { rank: 'DESC' },
    });

    const nextRank = lastEntry ? lastEntry.rank + 1 : 1;

    // Créer la nouvelle entrée
    const entry = this.waitQueueRepository.create({
      tenantId,
      patientId: createDto.patientId,
      practitionerId: createDto.practitionerId,
      priority: createDto.priority,
      reason: createDto.reason,
      rank: nextRank,
    });

    const savedEntry = await this.waitQueueRepository.save(entry);
    
    // Émettre l'événement de mise à jour
    await this.emitQueueUpdatedEvent(tenantId);

    // TODO: Retourner avec les relations une fois qu'elles fonctionnent
    return savedEntry;
  }

  async callNext(tenantId: string): Promise<WaitQueueEntry | null> {
    // Trouver le patient suivant dans la file d'attente
    const nextEntry = await this.waitQueueRepository.findOne({
      where: { tenantId, servedAt: IsNull() },
      order: { rank: 'ASC' },
    });

    if (!nextEntry) {
      return null;
    }

    // Marquer comme servi
    nextEntry.servedAt = new Date();
    await this.waitQueueRepository.save(nextEntry);
    
    // Émettre l'événement de mise à jour
    await this.emitQueueUpdatedEvent(tenantId);

    return nextEntry;
  }

  async getQueue(tenantId: string): Promise<WaitQueueEntry[]> {
    return this.waitQueueRepository.find({
      where: { tenantId, servedAt: IsNull() },
      order: { rank: 'ASC' },
      // TODO: Ajouter les relations une fois qu'elles fonctionnent
      // relations: ['patient', 'practitioner'],
    });
  }

  async updateEntry(tenantId: string, entryId: string, updateData: UpdateWaitQueueEntryDto): Promise<WaitQueueEntry> {
    try {
      const entry = await this.waitQueueRepository.findOne({
        where: { id: entryId, tenantId, servedAt: IsNull() },
      });

      if (!entry) {
        throw new NotFoundException('Entrée de file d\'attente introuvable');
      }

      // Si on change le patient, vérifier qu'il n'est pas déjà en file
      if (updateData.patientId && updateData.patientId !== entry.patientId) {
        const existingEntry = await this.waitQueueRepository.findOne({
          where: {
            tenantId,
            patientId: updateData.patientId,
            servedAt: IsNull(),
          },
        });

        if (existingEntry) {
          throw new ConflictException('Le patient est déjà dans la file d\'attente');
        }
      }

      // Mettre à jour les champs
      Object.assign(entry, updateData);
      const updatedEntry = await this.waitQueueRepository.save(entry);
      
      // Émettre l'événement de mise à jour
      await this.emitQueueUpdatedEvent(tenantId);

      // TODO: Retourner avec les relations une fois qu'elles fonctionnent
      return updatedEntry;
    } catch (error) {
      // Re-lancer les erreurs connues
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }
      // Transformer les autres erreurs en erreurs internes
      throw new Error(`Erreur lors de la mise à jour de l'entrée: ${error.message}`);
    }
  }

  async removeEntry(tenantId: string, entryId: string): Promise<void> {
    try {
      const entry = await this.waitQueueRepository.findOne({
        where: { id: entryId, tenantId, servedAt: IsNull() },
      });

      if (!entry) {
        throw new NotFoundException('Entrée de file d\'attente introuvable');
      }

      await this.waitQueueRepository.remove(entry);
      
      // Émettre l'événement de mise à jour
      await this.emitQueueUpdatedEvent(tenantId);
    } catch (error) {
      // Re-lancer les erreurs connues
      if (error instanceof NotFoundException) {
        throw error;
      }
      // Transformer les autres erreurs en erreurs internes
      throw new Error(`Erreur lors de la suppression de l'entrée: ${error.message}`);
    }
  }

  private async emitQueueUpdatedEvent(tenantId: string): Promise<void> {
    try {
      const currentQueue = await this.getQueue(tenantId);
      this.eventEmitter.emit(
        'wait-queue.updated',
        new WaitQueueUpdatedEvent(tenantId, currentQueue),
      );
    } catch (error) {
      // Log l'erreur mais ne pas faire échouer l'opération principale
      console.error('Erreur lors de l\'émission de l\'événement wait-queue.updated:', error);
    }
  }
} 