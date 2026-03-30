import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate, useParams } from "@tanstack/react-router";
import {
  Calendar,
  ChevronLeft,
  Loader2,
  MapPin,
  Tag,
  User,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { StatusBadge } from "../components/StatusBadge";
import {
  useGetAllDamageReports,
  useIsAdmin,
  useUpdateDamageStatus,
} from "../hooks/useQueries";
import { getVehicleNumberById } from "../utils/vehicleCache";

export function MeldingDetail() {
  const { id } = useParams({ from: "/meldingen/$id" });
  const navigate = useNavigate();
  const { data: reports = [], isLoading } = useGetAllDamageReports();
  const updateStatus = useUpdateDamageStatus();
  const { data: isAdmin } = useIsAdmin();
  const [newStatus, setNewStatus] = useState("");

  const report = reports.find((r) => r.id.toString() === id);

  const handleStatusUpdate = async () => {
    if (!newStatus || !report) return;
    try {
      await updateStatus.mutateAsync({ id: report.id, status: newStatus });
      toast.success("Status bijgewerkt");
    } catch {
      toast.error("Fout bij bijwerken status");
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-4" data-ocid="detail.loading_state">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="p-6" data-ocid="detail.error_state">
        <p className="text-muted-foreground">Melding niet gevonden.</p>
        <Button
          variant="ghost"
          className="mt-4"
          onClick={() => navigate({ to: "/" })}
        >
          <ChevronLeft size={16} className="mr-1" />
          Terug naar dashboard
        </Button>
      </div>
    );
  }

  const vehicleNumber = getVehicleNumberById(report.vehicleId.toString());
  const reportDate = new Date(
    Number(report.reportDate) / 1_000_000,
  ).toLocaleDateString("nl-NL", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate({ to: "/" })}
          className="mb-5"
          data-ocid="detail.back.button"
        >
          <ChevronLeft size={16} className="mr-1" />
          Terug
        </Button>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Schademelding #{report.id.toString()}
            </h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              {vehicleNumber} · {report.damageType}
            </p>
          </div>
          <div className="flex gap-2">
            <StatusBadge value={report.severity} type="severity" />
            <StatusBadge value={report.status} type="status" />
          </div>
        </div>

        <div className="grid gap-4">
          {/* Main details */}
          <Card className="shadow-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Tag size={14} className="text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">
                      Type Schade
                    </p>
                    <p className="text-sm font-semibold mt-0.5">
                      {report.damageType}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Calendar size={14} className="text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">
                      Datum Melding
                    </p>
                    <p className="text-sm font-semibold mt-0.5 capitalize">
                      {reportDate}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <MapPin size={14} className="text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">
                      Locatie
                    </p>
                    <p className="text-sm font-semibold mt-0.5">
                      {report.locationDescription || "—"}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <User size={14} className="text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">
                      Gemeld door
                    </p>
                    <p className="text-xs font-mono font-semibold mt-0.5">
                      {report.reportedBy.toString().slice(0, 16)}...
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-xs text-muted-foreground font-medium mb-1.5">
                  Omschrijving
                </p>
                <p className="text-sm text-foreground bg-muted/40 rounded-lg p-3 leading-relaxed">
                  {report.description}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Photos */}
          {report.photoIds.length > 0 && (
            <Card className="shadow-card border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">
                  Foto's ({report.photoIds.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {report.photoIds.map((photoId) => (
                    <a
                      key={photoId}
                      href={photoId}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-xl overflow-hidden aspect-square block hover:opacity-90 transition-opacity border border-border"
                    >
                      <img
                        src={photoId}
                        alt="Schade foto"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Status update (admin only) */}
          {isAdmin && (
            <Card className="shadow-card border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Status Bijwerken</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-3 items-end">
                  <div className="flex-1 space-y-2">
                    <Label>Nieuwe Status</Label>
                    <Select value={newStatus} onValueChange={setNewStatus}>
                      <SelectTrigger data-ocid="detail.status.select">
                        <SelectValue placeholder="Selecteer status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Open">Open</SelectItem>
                        <SelectItem value="In Reparatie">
                          In Reparatie
                        </SelectItem>
                        <SelectItem value="Opgelost">Opgelost</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    onClick={handleStatusUpdate}
                    disabled={!newStatus || updateStatus.isPending}
                    data-ocid="detail.status.save_button"
                  >
                    {updateStatus.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Opslaan
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </motion.div>
    </div>
  );
}
