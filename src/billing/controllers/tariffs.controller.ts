import { Controller, Get, Post, Body, UseGuards, Req, Param } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tariff, TariffCategory } from '../entities';
import { CreateTariffDto } from '../dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuthUserRole } from '../../auth/entities/user.entity';

@Controller('tariffs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TariffsController {
  constructor(
    @InjectRepository(Tariff)
    private tariffRepository: Repository<Tariff>,
  ) {}

  @Post()
  @Roles(AuthUserRole.SUPERADMIN, AuthUserRole.CLINIC_ADMIN)
  async create(@Body() createTariffDto: CreateTariffDto, @Req() req) {
    const tariff = this.tariffRepository.create({
      ...createTariffDto,
      tenantId: req.user.tenantId,
    });
    return this.tariffRepository.save(tariff);
  }

  @Get()
  @Roles(AuthUserRole.SUPERADMIN, AuthUserRole.CLINIC_ADMIN, AuthUserRole.EMPLOYEE)
  async findAll(@Req() req) {
    return this.tariffRepository.find({
      where: { tenantId: req.user.tenantId },
    });
  }

  @Get('category/:category')
  @Roles(AuthUserRole.SUPERADMIN, AuthUserRole.CLINIC_ADMIN, AuthUserRole.EMPLOYEE)
  async findByCategory(@Param('category') category: TariffCategory, @Req() req) {
    return this.tariffRepository.find({
      where: {
        tenantId: req.user.tenantId,
        category,
      },
    });
  }
} 