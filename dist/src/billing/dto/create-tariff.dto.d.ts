import { TariffCategory } from '../entities/tariff.entity';
export declare class CreateTariffDto {
    code: string;
    label: string;
    price: number;
    category: TariffCategory;
}
export declare class CreateTariffGqlDto {
    code: string;
    label: string;
    price: number;
    category: TariffCategory;
}
