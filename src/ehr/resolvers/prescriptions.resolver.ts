import { Resolver, Query, Mutation, Args, Context } from '@nestjs/graphql';
import { PrescriptionsService } from '../services/prescriptions.service';
import { Prescription } from '../entities/prescription.entity';
import { CreatePrescriptionDto } from '../dto/create-prescription.dto';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from '../../common/guards/gql-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';

@Resolver(() => Prescription)
@UseGuards(GqlAuthGuard, RolesGuard)
export class PrescriptionsResolver {
  constructor(private readonly prescriptionsService: PrescriptionsService) {}

  @Mutation(() => Prescription)
  @Roles(UserRole.DOCTOR, UserRole.SUPERVISOR)
  async createPrescription(
    @Args('createPrescriptionDto') createPrescriptionDto: CreatePrescriptionDto,
    @Context() context,
  ) {
    return this.prescriptionsService.create(context.req.user.tenantId, createPrescriptionDto);
  }

  @Query(() => [Prescription])
  @Roles(UserRole.DOCTOR, UserRole.NURSE, UserRole.SUPERVISOR, UserRole.PHARMACIST)
  async prescriptions(@Context() context) {
    return this.prescriptionsService.findAll(context.req.user.tenantId);
  }

  @Query(() => Prescription)
  @Roles(UserRole.DOCTOR, UserRole.NURSE, UserRole.SUPERVISOR, UserRole.PHARMACIST)
  async prescription(@Args('id') id: string) {
    return this.prescriptionsService.findOne(id);
  }
} 