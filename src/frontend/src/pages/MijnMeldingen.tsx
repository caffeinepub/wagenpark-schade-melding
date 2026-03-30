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
import { ClipboardList, Eye, Plus } from "lucide-react";
import { motion } from "motion/react";
import { useMemo, useState } from "react";
import { StatusBadge } from "../components/StatusBadge";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useGetReportsByUser } from "../hooks/useQueries";
import { getVehicleNumberById } from "../utils/vehicleCache";

export function MijnMeldingen() {
  const { identity } = useInternetIdentity();
  const userId = identity?.getPrincipal().toString();
  const { data: reports = [], isLoading } = useGetReportsByUser(userId);
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = useMemo(() => {
    return reports.filter((r) => {
      const vNum = getVehicleNumberById(r.vehicleId.toString());
      const matchSearch =
        !search ||
        vNum.toLowerCase().includes(search.toLowerCase()) ||
        r.description.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "all" || r.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [reports, search, statusFilter]);

  return (
    <div className="p-6 space-y-6">
      <motion.div
        className="flex items-start justify-between gap-4"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div>
          <h1 className="text-2xl font-bold text-foreground">Mijn Meldingen</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Overzicht van uw eigen schademeldingen
          </p>
        </div>
        <Button asChild data-ocid="mijn.new_report.primary_button">
          <Link to="/melden">
            <Plus size={16} className="mr-1.5" />
            Nieuwe Melding
          </Link>
        </Button>
      </motion.div>

      <Card className="shadow-card border-border">
        <div className="p-4 border-b border-border">
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              placeholder="Zoek op voertuig of omschrijving..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 text-sm"
              data-ocid="mijn.search.input"
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger
                className="w-full sm:w-40 text-sm"
                data-ocid="mijn.status.select"
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

        {isLoading ? (
          <div className="p-4 space-y-3" data-ocid="mijn.reports.loading_state">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div
            className="flex flex-col items-center py-16 text-muted-foreground"
            data-ocid="mijn.reports.empty_state"
          >
            <ClipboardList size={40} className="mb-3 opacity-40" />
            <p className="font-medium">Geen meldingen gevonden</p>
            <p className="text-sm mt-1">
              U heeft nog geen schademeldingen ingediend
            </p>
            <Button variant="outline" className="mt-4" asChild>
              <Link to="/melden">Eerste melding maken</Link>
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="text-xs font-semibold">
                    Voertuig
                  </TableHead>
                  <TableHead className="text-xs font-semibold">Type</TableHead>
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
                  <TableHead className="text-xs font-semibold">Actie</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((report, idx) => (
                  <TableRow
                    key={report.id.toString()}
                    className="hover:bg-muted/30 cursor-pointer"
                    onClick={() => navigate({ to: `/meldingen/${report.id}` })}
                    data-ocid={`mijn.reports.item.${idx + 1}`}
                  >
                    <TableCell className="text-sm font-medium">
                      {getVehicleNumberById(report.vehicleId.toString())}
                    </TableCell>
                    <TableCell className="text-sm">
                      {report.damageType}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground hidden md:table-cell">
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
                        data-ocid={`mijn.view.button.${idx + 1}`}
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

      {/* Footer */}
      <p className="text-center text-xs text-muted-foreground pt-4">
        © {new Date().getFullYear()}.{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-foreground transition-colors"
        >
          Built with caffeine.ai
        </a>
      </p>
    </div>
  );
}
