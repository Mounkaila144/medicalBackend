import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';

import { WaitQueueService } from '../services/wait-queue.service';
import { WaitQueueEntry } from '../entities/wait-queue-entry.entity';
import { CreateWaitQueueEntryDto } from '../dto/create-wait-queue-entry.dto';
import { TenantId } from '../../common/decorators/tenant-id.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';

@Controller('wait-queue')
@UseGuards(JwtAuthGuard, TenantGuard)
export class WaitQueueController {
  constructor(private readonly waitQueueService: WaitQueueService) {}

  @Post()
  async addToQueue(
    @TenantId() tenantId: string,
    @Body() createDto: CreateWaitQueueEntryDto,
  ): Promise<WaitQueueEntry> {
    return this.waitQueueService.enqueue(tenantId, createDto);
  }

  @Post('enqueue')
  async enqueue(
    @TenantId() tenantId: string,
    @Body() createDto: CreateWaitQueueEntryDto,
  ): Promise<WaitQueueEntry> {
    return this.waitQueueService.enqueue(tenantId, createDto);
  }

  @Post('call-next')
  async callNext(
    @TenantId() tenantId: string,
  ): Promise<WaitQueueEntry | null> {
    return this.waitQueueService.callNext(tenantId);
  }

  @Get()
  async getQueue(
    @TenantId() tenantId: string,
  ): Promise<WaitQueueEntry[]> {
    return this.waitQueueService.getQueue(tenantId);
  }
} 