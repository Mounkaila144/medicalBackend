import { Repository } from 'typeorm';
import { Tariff, TariffCategory } from '../entities';
import { CreateTariffDto } from '../dto';
export declare class TariffsController {
    private tariffRepository;
    constructor(tariffRepository: Repository<Tariff>);
    create(createTariffDto: CreateTariffDto, req: any): Promise<Tariff>;
    findAll(req: any): Promise<Tariff[]>;
    findByCategory(category: TariffCategory, req: any): Promise<Tariff[]>;
}
