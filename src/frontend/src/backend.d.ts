import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export type Time = bigint;
export type VehicleId = bigint;
export type DamageId = bigint;
export interface DamageReport {
    id: DamageId;
    status: string;
    lastUpdate: Time;
    locationDescription: string;
    description: string;
    photoIds: Array<string>;
    reportDate: Time;
    reportedBy: Principal;
    damageType: string;
    severity: string;
    vehicleId: VehicleId;
}
export interface DamageReportInput {
    locationDescription: string;
    description: string;
    photoIds: Array<string>;
    damageType: string;
    severity: string;
    vehicleId: VehicleId;
}
export interface Vehicle {
    vehicleType: string;
    vehicleNumber: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addDamageReport(reportInput: DamageReportInput): Promise<DamageId>;
    addPhotoToDamageReport(damageReportId: DamageId, photoId: string): Promise<void>;
    addVehicle(vehicleNumber: string, vehicleType: string): Promise<VehicleId>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    getAllDamageReports(): Promise<Array<DamageReport>>;
    getAllDamagesForVehicle(vehicleId: VehicleId): Promise<Array<DamageReport>>;
    getAllVehicles(): Promise<Array<Vehicle>>;
    getAvailableVehicles(objectType: string): Promise<Array<Vehicle>>;
    getCallerUserRole(): Promise<UserRole>;
    getOpenDamages(): Promise<Array<DamageReport>>;
    getReportsByStatus(status: string): Promise<Array<DamageReport>>;
    getReportsByUser(userId: Principal): Promise<Array<DamageReport>>;
    getReportsForVehicle(vehicleId: VehicleId): Promise<Array<DamageReport>>;
    getVehicleById(vehicleId: VehicleId): Promise<Vehicle>;
    isCallerAdmin(): Promise<boolean>;
    removeVehicle(vehicleId: VehicleId): Promise<void>;
    updateDamageReportStatus(damageReportId: DamageId, newStatus: string): Promise<void>;
}
