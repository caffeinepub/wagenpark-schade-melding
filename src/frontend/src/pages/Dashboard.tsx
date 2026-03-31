import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  AlertTriangle,
  Bell,
  Car,
  CheckCircle2,
  ClipboardCheck,
  ClipboardX,
  Eye,
  MapPin,
  Plus,
  Wrench,
} from "lucide-react";
import { motion } from "motion/react";
import { useMemo, useState } from "react";
import { StatusBadge } from "../components/StatusBadge";
import {
  useGetAllDamageReports,
  useGetAllInspectionRounds,
  useGetAllVehicles,
  useGetInspectionStats,
} from "../hooks/useQueries";
import { getVehicleNumberById } from "../utils/vehicleCache";

const CATEGORY_COLORS: Record<string, string> = {
  schade: "bg-red-100 text-red-800 border-red-200",
  technisch: "bg-orange-100 text-orange-800 border-orange-200",
  banden: "bg-zinc-100 text-zinc-800 border-zinc-200",
  vloeistoffen: "bg-blue-100 text-blue-800 border-blue-200",
  veiligheid: "bg-yellow-100 text-yellow-800 border-yellow-200",
  documenten: "bg-purple-100 text-purple-800 border-purple-200",
  interieur: "bg-green-100 text-green-800 border-green-200",
  overig: "bg-muted text-muted-foreground border-border",
};

const CATEGORY_LABELS: Record<string, string> = {
  schade: "🔴 Schade",
  technisch: "🔧 Technisch",
  banden: "⚫ Banden",
  vloeistoffen: "💧 Vloeistoffen",
  veiligheid: "🦺 Veiligheid & Lading",
  documenten: "📄 Documenten",
  interieur: "🧤 Interieur",
  overig: "➕ Overig",
};

export function Dashboard() {
  const { data: reports = [], isLoading } = useGetAllDamageReports();
  const { data: vehicles = [] } = useGetAllVehicles();
  const { data: inspectionStats = [] } = useGetInspectionStats();
  const { data: allRounds = [] } = useGetAllInspectionRounds();
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

  // Planner stats
  const currentMonth = new Date().toISOString().slice(0, 7); // "2026-03"
  const currentMonthStats = useMemo(
    () => inspectionStats.filter((s) => s.month === currentMonth),
    [inspectionStats, currentMonth],
  );

  const standplaatsen = useMemo(() => {
    const set = new Set<string>();
    for (const r of allRounds) set.add(r.standplaats);
    return Array.from(set).sort();
  }, [allRounds]);

  const roundsThisMonth = useMemo(() => {
    return allRounds.filter((r) => {
      const d = new Date(Number(r.reportDate) / 1_000_000);
      return d.toISOString().slice(0, 7) === currentMonth;
    });
  }, [allRounds, currentMonth]);

  const roundsByStandplaats = useMemo(() => {
    const map: Record<string, number> = {};
    for (const r of roundsThisMonth) {
      map[r.standplaats] = (map[r.standplaats] ?? 0) + 1;
    }
    return map;
  }, [roundsThisMonth]);

  const overigItems = useMemo(() => {
    const items: Array<{
      standplaats: string;
      description: string;
      date: Date;
    }> = [];
    for (const r of allRounds.slice().reverse().slice(0, 20)) {
      for (const item of r.items) {
        if (item.category === "overig" && item.description.trim()) {
          items.push({
            standplaats: r.standplaats,
            description: item.description,
            date: new Date(Number(r.reportDate) / 1_000_000),
          });
        }
      }
    }
    return items.slice(0, 10);
  }, [allRounds]);

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
          <div className="flex flex-col gap-2">
            <Button
              asChild
              size="lg"
              data-ocid="dashboard.rondje.primary_button"
            >
              <Link to="/rondje">
                <ClipboardCheck size={16} className="mr-1.5" />
                Rondje Melden
              </Link>
            </Button>
            <Button asChild data-ocid="dashboard.new_report.primary_button">
              <Link to="/melden">
                <Plus size={16} className="mr-1.5" />
                Schademelding
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              data-ocid="dashboard.new_storing.secondary_button"
            >
              <Link to="/storing">
                <Wrench size={16} className="mr-1.5" />
                Storing Voertuig
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              data-ocid="dashboard.new_mankement.secondary_button"
            >
              <Link to="/mankement">
                <Wrench size={16} className="mr-1.5" />
                Mankementen
              </Link>
            </Button>
          </div>
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

      {/* Tabs */}
      <Tabs defaultValue="meldingen" data-ocid="dashboard.main.tab">
        <TabsList>
          <TabsTrigger value="meldingen" data-ocid="dashboard.meldingen.tab">
            Meldingen
          </TabsTrigger>
          <TabsTrigger value="planner" data-ocid="dashboard.planner.tab">
            Planner Overzicht
          </TabsTrigger>
        </TabsList>

        {/* MELDINGEN TAB */}
        <TabsContent value="meldingen" className="mt-4">
          <Card className="shadow-card border-border">
            <div className="p-4 border-b border-border">
              <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                <h2 className="text-base font-semibold text-foreground">
                  Open Meldingen
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
                        Type Melding
                      </TableHead>
                      <TableHead className="text-xs font-semibold hidden md:table-cell">
                        Omschrijving
                      </TableHead>
                      <TableHead className="text-xs font-semibold">
                        Ernst
                      </TableHead>
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
                        onClick={() =>
                          navigate({ to: `/meldingen/${report.id}` })
                        }
                        data-ocid={`dashboard.reports.item.${idx + 1}`}
                      >
                        <TableCell className="text-sm font-medium">
                          {getVehicleNumberById(report.vehicleId.toString())}
                        </TableCell>
                        <TableCell className="text-sm">
                          <span className="flex items-center gap-1.5">
                            {(report.damageType.startsWith("[STORING]") ||
                              report.damageType.startsWith("[MANKEMENT]")) && (
                              <Wrench
                                size={13}
                                className="text-amber-500 shrink-0"
                              />
                            )}
                            {report.damageType
                              .replace("[STORING] ", "")
                              .replace("[MANKEMENT] ", "")}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-xs hidden md:table-cell">
                          <span className="line-clamp-1">
                            {report.description}
                          </span>
                        </TableCell>
                        <TableCell>
                          <StatusBadge
                            value={report.severity}
                            type="severity"
                          />
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
        </TabsContent>

        {/* PLANNER TAB */}
        <TabsContent value="planner" className="mt-4 space-y-6">
          {/* Actie items */}
          <div>
            <h2 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
              <AlertTriangle size={16} className="text-amber-500" />
              Actie Items —{" "}
              {new Date().toLocaleString("nl-NL", {
                month: "long",
                year: "numeric",
              })}
            </h2>
            {currentMonthStats.length === 0 ? (
              <Card className="shadow-card border-border">
                <CardContent
                  className="py-10 flex flex-col items-center text-muted-foreground"
                  data-ocid="planner.stats.empty_state"
                >
                  <ClipboardX size={32} className="mb-2 opacity-40" />
                  <p className="text-sm">
                    Geen rondes geregistreerd deze maand.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {currentMonthStats
                  .filter((s) => Number(s.count) > 0)
                  .map((stat, idx) => {
                    const colorClass =
                      CATEGORY_COLORS[stat.category] ?? CATEGORY_COLORS.overig;
                    const label =
                      CATEGORY_LABELS[stat.category] ?? stat.category;
                    const hasQty = Number(stat.totalQuantity) > 0;
                    return (
                      <motion.div
                        key={`${stat.standplaats}-${stat.category}`}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.04 }}
                        data-ocid={`planner.action.item.${idx + 1}`}
                      >
                        <Card className={`border ${colorClass} shadow-sm`}>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="font-semibold text-sm flex items-center gap-1.5">
                                  <MapPin size={13} />
                                  {stat.standplaats}
                                </p>
                                <p className="text-xs mt-0.5">{label}</p>
                              </div>
                              <span className="text-xl font-bold">
                                {Number(stat.count)}
                              </span>
                            </div>
                            {hasQty && (
                              <p className="text-xs mt-2 font-medium">
                                Totaal: {Number(stat.totalQuantity)}{" "}
                                {stat.category === "vloeistoffen"
                                  ? "liter"
                                  : "stuks"}
                              </p>
                            )}
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
              </div>
            )}
          </div>

          {/* Rondes per standplaats */}
          <div>
            <h2 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
              <ClipboardCheck size={16} className="text-primary" />
              Rondes per Standplaats — deze maand
            </h2>
            {standplaatsen.length === 0 ? (
              <Card className="shadow-card border-border">
                <CardContent
                  className="py-8 flex flex-col items-center text-muted-foreground"
                  data-ocid="planner.rounds.empty_state"
                >
                  <p className="text-sm">Nog geen rondes geregistreerd.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {standplaatsen.map((sp, idx) => (
                  <motion.div
                    key={sp}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    data-ocid={`planner.standplaats.item.${idx + 1}`}
                  >
                    <Card className="shadow-card border-border">
                      <CardContent className="p-4 text-center">
                        <p className="text-2xl font-bold text-primary">
                          {roundsByStandplaats[sp] ?? 0}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1 font-medium">
                          {sp}
                        </p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Overig meldingen */}
          <div>
            <h2 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
              <span>➕</span>
              Recente "Overig"-meldingen
            </h2>
            {overigItems.length === 0 ? (
              <Card className="shadow-card border-border">
                <CardContent
                  className="py-8 flex flex-col items-center text-muted-foreground"
                  data-ocid="planner.overig.empty_state"
                >
                  <p className="text-sm">Geen overige meldingen gevonden.</p>
                </CardContent>
              </Card>
            ) : (
              <Card className="shadow-card border-border">
                <CardContent className="p-0">
                  {overigItems.map((item, idx) => (
                    <div
                      key={`${item.standplaats}-${idx}`}
                      className={`flex items-start gap-3 p-3 ${
                        idx < overigItems.length - 1
                          ? "border-b border-border"
                          : ""
                      }`}
                      data-ocid={`planner.overig.item.${idx + 1}`}
                    >
                      <span className="text-base shrink-0">➕</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground line-clamp-2">
                          {item.description}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {item.standplaats} —{" "}
                          {item.date.toLocaleDateString("nl-NL")}
                        </p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
