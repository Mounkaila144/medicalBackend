import { Resolver, Query, Mutation, Args, Context } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tariff, TariffCategory } from '../entities';
import { CreateTariffDto } from '../dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';

@Resolver(() => Tariff)
@UseGuards(JwtAuthGuard, RolesGuard)
export class TariffsResolver {
  constructor(
    @InjectRepository(Tariff)
    private tariffRepository: Repository<Tariff>,
  ) {}

  @Query(() => [Tariff])
  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.NURSE, UserRole.RECEPTIONIST)
  async tariffs(@Context() context) {
    return this.tariffRepository.find({
      where: { tenantId: context.req.user.tenantId },
    });
  }

  @Query(() => [Tariff])
  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.NURSE, UserRole.RECEPTIONIST)
  async tariffsByCategory(
    @Args('category') category: TariffCategory,
    @Context() context,
  ) {
    return this.tariffRepository.find({
      where: {
        tenantId: context.req.user.tenantId,
        category,
      },
    });
  }

  @Mutation(() => Tariff)
  @Roles(UserRole.ADMIN)
  async createTariff(
    @Args('createTariffDto') createTariffDto: CreateTariffDto,
    @Context() context,
  ) {
    const tariff = this.tariffRepository.create({
      ...createTariffDto,
      tenantId: context.req.user.tenantId,
    });
    return this.tariffRepository.save(tariff);
  }
} 