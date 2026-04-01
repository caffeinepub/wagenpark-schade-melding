import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  CategoryStat,
  DamageReport,
  DamageReportInput,
  InspectionRound,
  InspectionRoundInput,
  InviteCode,
  UserRole,
  Vehicle,
} from "../backend.d";
import { getProfile, saveProfile } from "../utils/profileStore";
import {
  getCachedVehicles,
  removeVehicleFromCache,
  saveVehicleToCache,
} from "../utils/vehicleCache";
import { useActor } from "./useActor";
import { useInternetIdentity } from "./useInternetIdentity";

export function useGetAllVehicles() {
  const { actor, isFetching } = useActor();
  return useQuery<Vehicle[]>({
    queryKey: ["vehicles"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllVehicles();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetCachedVehicles() {
  return getCachedVehicles();
}

export function useGetAllDamageReports() {
  const { actor, isFetching } = useActor();
  return useQuery<DamageReport[]>({
    queryKey: ["damageReports"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllDamageReports();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetOpenDamages() {
  const { actor, isFetching } = useActor();
  return useQuery<DamageReport[]>({
    queryKey: ["openDamages"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getOpenDamages();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetReportsByUser(userId: string | undefined) {
  const { actor, isFetching } = useActor();
  return useQuery<DamageReport[]>({
    queryKey: ["reportsByUser", userId],
    queryFn: async () => {
      if (!actor || !userId) return [];
      const { Principal } = await import("@dfinity/principal");
      return actor.getReportsByUser(Principal.fromText(userId));
    },
    enabled: !!actor && !isFetching && !!userId,
  });
}

export function useIsAdmin() {
  const { actor, isFetching } = useActor();
  return useQuery<boolean>({
    queryKey: ["isAdmin"],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetCallerUserRole() {
  const { actor, isFetching } = useActor();
  return useQuery<UserRole>({
    queryKey: ["callerRole"],
    queryFn: async () => {
      if (!actor) throw new Error("no actor");
      return actor.getCallerUserRole();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddVehicle() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      vehicleNumber,
      vehicleType,
    }: { vehicleNumber: string; vehicleType: string }) => {
      if (!actor) throw new Error("no actor");
      const id = await actor.addVehicle(vehicleNumber, vehicleType);
      saveVehicleToCache({ id: id.toString(), vehicleNumber, vehicleType });
      return id;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["vehicles"] }),
  });
}

export function useRemoveVehicle() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vehicleId: bigint) => {
      if (!actor) throw new Error("no actor");
      await actor.removeVehicle(vehicleId);
      removeVehicleFromCache(vehicleId.toString());
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["vehicles"] }),
  });
}

export function useAddDamageReport() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: DamageReportInput) => {
      if (!actor) throw new Error("no actor");
      return actor.addDamageReport(input);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["damageReports"] });
      qc.invalidateQueries({ queryKey: ["openDamages"] });
    },
  });
}

export function useUpdateDamageStatus() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: bigint; status: string }) => {
      if (!actor) throw new Error("no actor");
      return actor.updateDamageReportStatus(id, status);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["damageReports"] });
      qc.invalidateQueries({ queryKey: ["openDamages"] });
    },
  });
}

export function useGetCallerUserProfile() {
  const { identity, isInitializing } = useInternetIdentity();
  const principalId = identity?.getPrincipal().toString();

  return useQuery<{ name: string } | null>({
    queryKey: ["currentUserProfile", principalId],
    queryFn: () => {
      if (!principalId) return null;
      return getProfile(principalId);
    },
    enabled: !isInitializing && !!principalId,
    retry: false,
  });
}

export function useSaveCallerUserProfile() {
  const { identity } = useInternetIdentity();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (profile: { name: string }) => {
      const principalId = identity?.getPrincipal().toString();
      if (!principalId) throw new Error("not authenticated");
      saveProfile({ name: profile.name, principalId });
    },
    onSuccess: () => {
      const principalId = identity?.getPrincipal().toString();
      qc.invalidateQueries({ queryKey: ["currentUserProfile", principalId] });
    },
  });
}

export function useGenerateInviteCode() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (): Promise<string> => {
      if (!actor) throw new Error("no actor");
      return (actor as any).generateInviteCode();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["inviteCodes"] }),
  });
}

export function useRedeemInviteCode() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async (code: string): Promise<void> => {
      if (!actor) throw new Error("no actor");
      return (actor as any).redeemInviteCode(code);
    },
  });
}

export function useGetInviteCodes() {
  const { actor, isFetching } = useActor();
  return useQuery<InviteCode[]>({
    queryKey: ["inviteCodes"],
    queryFn: async () => {
      if (!actor) return [];
      return (actor as any).getInviteCodes();
    },
    enabled: !!actor && !isFetching,
  });
}

// Inspection Round hooks
export function useAddInspectionRound() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: any) => {
      if (!actor) throw new Error("no actor");
      return (actor as any).addInspectionRound(input);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["allInspectionRounds"] });
      qc.invalidateQueries({ queryKey: ["myInspectionRounds"] });
      qc.invalidateQueries({ queryKey: ["inspectionStats"] });
    },
  });
}

export function useGetAllInspectionRounds() {
  const { actor, isFetching } = useActor();
  return useQuery<InspectionRound[]>({
    queryKey: ["allInspectionRounds"],
    queryFn: async () => {
      if (!actor) return [];
      return (actor as any).getAllInspectionRounds();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetMyInspectionRounds() {
  const { actor, isFetching } = useActor();
  return useQuery<InspectionRound[]>({
    queryKey: ["myInspectionRounds"],
    queryFn: async () => {
      if (!actor) return [];
      return (actor as any).getMyInspectionRounds();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetInspectionStats() {
  const { actor, isFetching } = useActor();
  return useQuery<CategoryStat[]>({
    queryKey: ["inspectionStats"],
    queryFn: async () => {
      if (!actor) return [];
      return (actor as any).getInspectionStats();
    },
    enabled: !!actor && !isFetching,
  });
}
