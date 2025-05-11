import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { PrescriptionsService } from '../services/prescriptions.service';
import { CreatePrescriptionDto } from '../dto/create-prescription.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';

@Controller('prescriptions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PrescriptionsController {
  constructor(private readonly prescriptionsService: PrescriptionsService) {}

  @Post()
  @Roles(UserRole.DOCTOR, UserRole.SUPERVISOR)
  async create(@Body() createPrescriptionDto: CreatePrescriptionDto, @Req() req) {
    return this.prescriptionsService.create(req.user.tenantId, createPrescriptionDto);
  }

  @Get()
  @Roles(UserRole.DOCTOR, UserRole.NURSE, UserRole.SUPERVISOR, UserRole.PHARMACIST)
  async findAll(@Req() req) {
    return this.prescriptionsService.findAll(req.user.tenantId);
  }

  @Get(':id')
  @Roles(UserRole.DOCTOR, UserRole.NURSE, UserRole.SUPERVISOR, UserRole.PHARMACIST)
  async findOne(@Param('id') id: string) {
    return this.prescriptionsService.findOne(id);
  }
} 