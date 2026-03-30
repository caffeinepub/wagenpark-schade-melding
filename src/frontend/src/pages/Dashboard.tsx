import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  AlertTriangle,
  Bell,
  Car,
  CheckCircle2,
  ClipboardX,
  Eye,
  Plus,
} from "lucide-react";
import { motion } from "motion/react";
import { useMemo, useState } from "react";
import { StatusBadge } from "../components/StatusBadge";
import { useGetAllDamageReports, useGetAllVehicles } from "../hooks/useQueries";
import { getVehicleNumberById } from "../utils/vehicleCache";

export function Dashboard() {
  const { data: reports = [], isLoading } = useGetAllDamageReports();
  const { data: vehicles = [] } = useGetAllVehicles();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const navigate = useNavigate();

  const kpis = useMemo(() => {
    const open = reports.filter((r) => r.status === "Open").length;
    const solved = reports.filter((r) => r.status === "Opgelost").length;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const inspectedToday = reports.filter((r) => {
      const d = new Date(Number(r.reportDate) / 1_000_000);
      return d >= today;
    }).length;
    return { open, solved, total: vehicles.length, inspectedToday };
  }, [reports, vehicles]);

  const filtered = useMemo(() => {
    return reports.filter((r) => {
      const vNum = getVehicleNumberById(r.vehicleId.toString());
      const matchSearch =
        !search ||
        vNum.toLowerCase().includes(search.toLowerCase()) ||
        r.description.toLowerCase().includes(search.toLowerCase()) ||
        r.damageType.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "all" || r.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [reports, search, statusFilter]);

  const kpiCards = [
    {
      label: "Open Meldingen",
      value: kpis.open,
      icon: <AlertTriangle size={20} className="text-[oklch(0.60_0.21_25)]" />,
      bg: "bg-[oklch(0.95_0.07_25/0.15)]",
    },
    {
      label: "Opgelost",
      value: kpis.solved,
      icon: <CheckCircle2 size={20} className="text-[oklch(0.56_0.17_145)]" />,
      bg: "bg-[oklch(0.94_0.07_145/0.15)]",
    },
    {
      label: "Totaal Voertuigen",
      value: kpis.total,
      icon: <Car size={20} className="text-primary" />,
      bg: "bg-primary/10",
    },
    {
      label: "Geïnspecteerd Vandaag",
      value: kpis.inspectedToday,
      icon: <ClipboardX size={20} className="text-[oklch(0.72_0.15_65)]" />,
      bg: "bg-[oklch(0.96_0.08_80/0.2)]",
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Overzicht van alle schademeldingen
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="relative p-2 rounded-lg hover:bg-accent transition-colors"
            data-ocid="dashboard.bell.button"
            aria-label="Notificaties"
          >
            <Bell size={20} className="text-muted-foreground" />
            {kpis.open > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-destructive" />
            )}
          </button>
          <Button asChild data-ocid="dashboard.new_report.primary_button">
            <Link to="/melden">
              <Plus size={16} className="mr-1.5" />
              Nieuwe Schademelding
            </Link>
          </Button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07, duration: 0.35 }}
          >
            <Card className="shadow-card border-border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-medium text-muted-foreground">
                    {kpi.label}
                  </p>
                  <div
                    className={`w-8 h-8 rounded-lg ${kpi.bg} flex items-center justify-center`}
                  >
                    {kpi.icon}
                  </div>
                </div>
                {isLoading ? (
                  <Skeleton className="h-7 w-12" />
                ) : (
                  <p className="text-2xl font-bold text-foreground">
                    {kpi.value}
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Reports table */}
      <Card className="shadow-card border-border">
        <div className="p-4 border-b border-border">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <h2 className="text-base font-semibold text-foreground">
              Open Schademeldingen
            </h2>
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              <Input
                placeholder="Zoek voertuig of omschrijving..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full sm:w-56 text-sm"
                data-ocid="dashboard.search.input"
              />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger
                  className="w-36 text-sm"
                  data-ocid="dashboard.status.select"
                >
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle statussen</SelectItem>
                  <SelectItem value="Open">Open</SelectItem>
                  <SelectItem value="In Reparatie">In Reparatie</SelectItem>
                  <SelectItem value="Opgelost">Opgelost</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div
            className="p-4 space-y-3"
            data-ocid="dashboard.reports.loading_state"
          >
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-16 text-muted-foreground"
            data-ocid="dashboard.reports.empty_state"
          >
            <ClipboardX size={40} className="mb-3 opacity-40" />
            <p className="font-medium">Geen meldingen gevonden</p>
            <p className="text-sm mt-1">Probeer een andere zoekopdracht</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="text-xs font-semibold">
                    Voertuig
                  </TableHead>
                  <TableHead className="text-xs font-semibold">
                    Type Schade
                  </TableHead>
                  <TableHead className="text-xs font-semibold hidden md:table-cell">
                    Omschrijving
                  </TableHead>
                  <TableHead className="text-xs font-semibold">Ernst</TableHead>
                  <TableHead className="text-xs font-semibold">
                    Status
                  </TableHead>
                  <TableHead className="text-xs font-semibold hidden sm:table-cell">
                    Datum
                  </TableHead>
                  <TableHead className="text-xs font-semibold">
                    Acties
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((report, idx) => (
                  <TableRow
                    key={report.id.toString()}
                    className="hover:bg-muted/30 cursor-pointer"
                    onClick={() => navigate({ to: `/meldingen/${report.id}` })}
                    data-ocid={`dashboard.reports.item.${idx + 1}`}
                  >
                    <TableCell className="text-sm font-medium">
                      {getVehicleNumberById(report.vehicleId.toString())}
                    </TableCell>
                    <TableCell className="text-sm">
                      {report.damageType}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-xs hidden md:table-cell">
                      <span className="line-clamp-1">{report.description}</span>
                    </TableCell>
                    <TableCell>
                      <StatusBadge value={report.severity} type="severity" />
                    </TableCell>
                    <TableCell>
                      <StatusBadge value={report.status} type="status" />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground hidden sm:table-cell">
                      {new Date(
                        Number(report.reportDate) / 1_000_000,
                      ).toLocaleDateString("nl-NL")}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate({ to: `/meldingen/${report.id}` });
                        }}
                        data-ocid={`dashboard.view.button.${idx + 1}`}
                      >
                        <Eye size={14} className="mr-1" />
                        Bekijk
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  );
}
