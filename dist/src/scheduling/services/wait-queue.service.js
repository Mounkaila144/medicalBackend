"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WaitQueueService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const event_emitter_1 = require("@nestjs/event-emitter");
const wait_queue_entry_entity_1 = require("../entities/wait-queue-entry.entity");
const wait_queue_updated_event_1 = require("../events/wait-queue-updated.event");
let WaitQueueService = class WaitQueueService {
    waitQueueRepository;
    eventEmitter;
    constructor(waitQueueRepository, eventEmitter) {
        this.waitQueueRepository = waitQueueRepository;
        this.eventEmitter = eventEmitter;
    }
    async enqueue(tenantId, createDto) {
        const existingEntry = await this.waitQueueRepository.findOne({
            where: {
                tenantId,
                patientId: createDto.patientId,
                servedAt: (0, typeorm_2.IsNull)(),
            },
        });
        if (existingEntry) {
            throw new common_1.ConflictException('Le patient est déjà dans la file d\'attente');
        }
        const lastEntry = await this.waitQueueRepository.findOne({
            where: { tenantId, servedAt: (0, typeorm_2.IsNull)() },
            order: { rank: 'DESC' },
        });
        const nextRank = lastEntry ? lastEntry.rank + 1 : 1;
        const entry = this.waitQueueRepository.create({
            tenantId,
            patientId: createDto.patientId,
            practitionerId: createDto.practitionerId,
            priority: createDto.priority,
            reason: createDto.reason,
            rank: nextRank,
        });
        const savedEntry = await this.waitQueueRepository.save(entry);
        await this.emitQueueUpdatedEvent(tenantId);
        return savedEntry;
    }
    async callNext(tenantId) {
        const nextEntry = await this.waitQueueRepository.findOne({
            where: { tenantId, servedAt: (0, typeorm_2.IsNull)() },
            order: { rank: 'ASC' },
        });
        if (!nextEntry) {
            return null;
        }
        nextEntry.servedAt = new Date();
        await this.waitQueueRepository.save(nextEntry);
        await this.emitQueueUpdatedEvent(tenantId);
        return nextEntry;
    }
    async getQueue(tenantId) {
        return this.waitQueueRepository.find({
            where: { tenantId, servedAt: (0, typeorm_2.IsNull)() },
            order: { rank: 'ASC' },
        });
    }
    async updateEntry(tenantId, entryId, updateData) {
        try {
            const entry = await this.waitQueueRepository.findOne({
                where: { id: entryId, tenantId, servedAt: (0, typeorm_2.IsNull)() },
            });
            if (!entry) {
                throw new common_1.NotFoundException('Entrée de file d\'attente introuvable');
            }
            if (updateData.patientId && updateData.patientId !== entry.patientId) {
                const existingEntry = await this.waitQueueRepository.findOne({
                    where: {
                        tenantId,
                        patientId: updateData.patientId,
                        servedAt: (0, typeorm_2.IsNull)(),
                    },
                });
                if (existingEntry) {
                    throw new common_1.ConflictException('Le patient est déjà dans la file d\'attente');
                }
            }
            Object.assign(entry, updateData);
            const updatedEntry = await this.waitQueueRepository.save(entry);
            await this.emitQueueUpdatedEvent(tenantId);
            return updatedEntry;
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException || error instanceof common_1.ConflictException) {
                throw error;
            }
            throw new Error(`Erreur lors de la mise à jour de l'entrée: ${error.message}`);
        }
    }
    async removeEntry(tenantId, entryId) {
        try {
            const entry = await this.waitQueueRepository.findOne({
                where: { id: entryId, tenantId, servedAt: (0, typeorm_2.IsNull)() },
            });
            if (!entry) {
                throw new common_1.NotFoundException('Entrée de file d\'attente introuvable');
            }
            await this.waitQueueRepository.remove(entry);
            await this.emitQueueUpdatedEvent(tenantId);
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException) {
                throw error;
            }
            throw new Error(`Erreur lors de la suppression de l'entrée: ${error.message}`);
        }
    }
    async emitQueueUpdatedEvent(tenantId) {
        try {
            const currentQueue = await this.getQueue(tenantId);
            this.eventEmitter.emit('wait-queue.updated', new wait_queue_updated_event_1.WaitQueueUpdatedEvent(tenantId, currentQueue));
        }
        catch (error) {
            console.error('Erreur lors de l\'émission de l\'événement wait-queue.updated:', error);
        }
    }
};
exports.WaitQueueService = WaitQueueService;
exports.WaitQueueService = WaitQueueService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(wait_queue_entry_entity_1.WaitQueueEntry)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        event_emitter_1.EventEmitter2])
], WaitQueueService);
//# sourceMappingURL=wait-queue.service.js.map