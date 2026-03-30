export interface CachedVehicle {
  id: string; // bigint serialized as string
  vehicleNumber: string;
  vehicleType: string;
}

const STORAGE_KEY = "wagenpark_vehicles_v1";

export function getCachedVehicles(): CachedVehicle[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CachedVehicle[]) : [];
  } catch {
    return [];
  }
}

export function saveVehicleToCache(vehicle: CachedVehicle): void {
  const existing = getCachedVehicles();
  const idx = existing.findIndex((v) => v.id === vehicle.id);
  if (idx >= 0) {
    existing[idx] = vehicle;
  } else {
    existing.push(vehicle);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
}

export function removeVehicleFromCache(id: string): void {
  const updated = getCachedVehicles().filter((v) => v.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

export function getVehicleNumberById(id: string): string {
  const cached = getCachedVehicles().find((v) => v.id === id);
  return cached ? cached.vehicleNumber : `V-${id}`;
}

export function getVehicleByNumber(
  vehicleNumber: string,
): CachedVehicle | undefined {
  return getCachedVehicles().find(
    (v) => v.vehicleNumber.toLowerCase() === vehicleNumber.toLowerCase(),
  );
}
