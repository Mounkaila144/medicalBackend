export declare enum Priority {
    LOW = "LOW",
    NORMAL = "NORMAL",
    HIGH = "HIGH",
    URGENT = "URGENT"
}
export declare class WaitQueueEntry {
    id: string;
    tenantId: string;
    patientId: string;
    practitionerId?: string;
    priority?: Priority;
    reason?: string;
    rank: number;
    createdAt: Date;
    servedAt: Date;
}
