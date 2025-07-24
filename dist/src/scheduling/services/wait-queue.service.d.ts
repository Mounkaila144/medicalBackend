import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { WaitQueueEntry } from '../entities/wait-queue-entry.entity';
import { CreateWaitQueueEntryDto } from '../dto/create-wait-queue-entry.dto';
import { UpdateWaitQueueEntryDto } from '../dto/update-wait-queue-entry.dto';
export declare class WaitQueueService {
    private waitQueueRepository;
    private eventEmitter;
    constructor(waitQueueRepository: Repository<WaitQueueEntry>, eventEmitter: EventEmitter2);
    enqueue(tenantId: string, createDto: CreateWaitQueueEntryDto): Promise<WaitQueueEntry>;
    callNext(tenantId: string): Promise<WaitQueueEntry | null>;
    getQueue(tenantId: string): Promise<WaitQueueEntry[]>;
    updateEntry(tenantId: string, entryId: string, updateData: UpdateWaitQueueEntryDto): Promise<WaitQueueEntry>;
    removeEntry(tenantId: string, entryId: string): Promise<void>;
    private emitQueueUpdatedEvent;
}
