export declare enum TariffCategory {
    CONSULTATION = "CONSULTATION",
    ACT = "ACT",
    HOSPITAL = "HOSPITAL"
}
export declare class Tariff {
    code: string;
    tenantId: string;
    label: string;
    price: number;
    category: TariffCategory;
}
