import { Controller, Get, Post, Body, Param, UseGuards, Req, Query } from '@nestjs/common';
import { LabResultsService } from '../services/lab-results.service';
import { CreateLabResultDto } from '../dto/create-lab-result.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';

@Controller('labs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LabResultsController {
  constructor(private readonly labResultsService: LabResultsService) {}

  @Post()
  @Roles(UserRole.DOCTOR, UserRole.SUPERVISOR, UserRole.LABORATORY_TECHNICIAN)
  async create(@Body() createLabResultDto: CreateLabResultDto, @Req() req) {
    return this.labResultsService.add(req.user.tenantId, createLabResultDto);
  }

  @Get()
  @Roles(UserRole.DOCTOR, UserRole.NURSE, UserRole.SUPERVISOR, UserRole.LABORATORY_TECHNICIAN)
  async findAll(@Req() req) {
    return this.labResultsService.findAll(req.user.tenantId);
  }

  @Get('patient/:patientId')
  @Roles(UserRole.DOCTOR, UserRole.NURSE, UserRole.SUPERVISOR, UserRole.LABORATORY_TECHNICIAN)
  async findAllByPatient(@Param('patientId') patientId: string, @Req() req) {
    return this.labResultsService.findAllByPatient(req.user.tenantId, patientId);
  }

  @Get(':id')
  @Roles(UserRole.DOCTOR, UserRole.NURSE, UserRole.SUPERVISOR, UserRole.LABORATORY_TECHNICIAN)
  async findOne(@Param('id') id: string) {
    return this.labResultsService.findOne(id);
  }
} 