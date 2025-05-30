import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { PractitionersService } from '../services/practitioners.service';
import { CreatePractitionerDto } from '../dto/create-practitioner.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuthUserRole } from '../../auth/entities/user.entity';

@Controller('practitioners')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PractitionersController {
  constructor(private readonly practitionersService: PractitionersService) {}

  @Post()
  @Roles(AuthUserRole.SUPERADMIN, AuthUserRole.CLINIC_ADMIN)
  async create(@Body() createPractitionerDto: CreatePractitionerDto, @Req() req) {
    return this.practitionersService.create(req.user.tenantId, createPractitionerDto);
  }
} 