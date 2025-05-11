import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { WaitQueueEntry } from '../entities/wait-queue-entry.entity';
import { CreateWaitQueueEntryDto } from '../dto/create-wait-queue-entry.dto';
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
      throw new Error('Le patient est déjà dans la file d\'attente');
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
      rank: nextRank,
    });

    const savedEntry = await this.waitQueueRepository.save(entry);
    
    // Émettre l'événement de mise à jour
    await this.emitQueueUpdatedEvent(tenantId);

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
    });
  }

  private async emitQueueUpdatedEvent(tenantId: string): Promise<void> {
    const currentQueue = await this.getQueue(tenantId);
    this.eventEmitter.emit(
      'wait-queue.updated',
      new WaitQueueUpdatedEvent(tenantId, currentQueue),
    );
  }
} 