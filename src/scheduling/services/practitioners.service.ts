import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Practitioner } from '../entities/practitioner.entity';
import { Availability } from '../entities/availability.entity';
import { CreatePractitionerDto } from '../dto/create-practitioner.dto';
import { DayOfWeek } from '../dto/create-practitioner.dto';

@Injectable()
export class PractitionersService {
  constructor(
    @InjectRepository(Practitioner)
    private practitionerRepository: Repository<Practitioner>,
    @InjectRepository(Availability)
    private availabilityRepository: Repository<Availability>,
  ) {}

  async create(tenantId: string, createPractitionerDto: CreatePractitionerDto): Promise<Practitioner> {
    // Create the practitioner
    const practitioner = this.practitionerRepository.create({
      tenantId,
      firstName: createPractitionerDto.firstName,
      lastName: createPractitionerDto.lastName,
      specialty: createPractitionerDto.speciality,
      color: createPractitionerDto.color,
    });

    const savedPractitioner = await this.practitionerRepository.save(practitioner);

    // Create availabilities for each working hour
    const availabilities = createPractitionerDto.workingHours.flatMap(workingHour => {
      const weekday = this.mapDayOfWeekToNumber(workingHour.dayOfWeek);
      
      return workingHour.slots.map(slot => 
        this.availabilityRepository.create({
          practitionerId: savedPractitioner.id,
          weekday,
          start: slot.start,
          end: slot.end,
        })
      );
    });

    await this.availabilityRepository.save(availabilities);

    return savedPractitioner;
  }

  private mapDayOfWeekToNumber(dayOfWeek: DayOfWeek): number {
    const mapping = {
      [DayOfWeek.MONDAY]: 1,
      [DayOfWeek.TUESDAY]: 2,
      [DayOfWeek.WEDNESDAY]: 3,
      [DayOfWeek.THURSDAY]: 4,
      [DayOfWeek.FRIDAY]: 5,
      [DayOfWeek.SATURDAY]: 6,
      [DayOfWeek.SUNDAY]: 7,
    };
    return mapping[dayOfWeek];
  }
} 