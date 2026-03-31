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
export type InspectionId = bigint;
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
export interface InviteCode {
    code: string;
    created: Time;
    used: boolean;
}
export interface InspectionItem {
    category: string;
    subcategory: string;
    description: string;
    quantity: Option<bigint>;
    photoIds: Array<string>;
    stillPresent: boolean;
}
export interface InspectionRoundInput {
    reporterName: string;
    standplaats: string;
    trekkerKenteken: string;
    aanhangerKenteken: string;
    items: Array<InspectionItem>;
}
export interface InspectionRound {
    id: InspectionId;
    reporterName: string;
    standplaats: string;
    trekkerKenteken: string;
    aanhangerKenteken: string;
    reportDate: Time;
    reportedBy: Principal;
    items: Array<InspectionItem>;
}
export interface CategoryStat {
    category: string;
    standplaats: string;
    count: bigint;
    totalQuantity: bigint;
    month: string;
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
    generateInviteCode(): Promise<string>;
    redeemInviteCode(code: string): Promise<void>;
    getInviteCodes(): Promise<Array<InviteCode>>;
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
    addInspectionRound(input: InspectionRoundInput): Promise<InspectionId>;
    getAllInspectionRounds(): Promise<Array<InspectionRound>>;
    getMyInspectionRounds(): Promise<Array<InspectionRound>>;
    getInspectionRoundsByStandplaats(standplaats: string): Promise<Array<InspectionRound>>;
    getInspectionStats(): Promise<Array<CategoryStat>>;
}
