import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useNavigate } from "@tanstack/react-router";
import { Loader2, Package, Plus, Shield, Truck } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import {
  useAddVehicle,
  useIsAdmin,
  useRemoveVehicle,
} from "../hooks/useQueries";
import { getCachedVehicles } from "../utils/vehicleCache";

export function VoertuigenBeheer() {
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();
  const addVehicle = useAddVehicle();
  const removeVehicle = useRemoveVehicle();
  const navigate = useNavigate();

  const [vehicleNumber, setVehicleNumber] = useState("");
  const [vehicleType, setVehicleType] = useState("");
  const [vehicles, setVehicles] = useState(() => getCachedVehicles());

  const refreshVehicles = () => setVehicles(getCachedVehicles());

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleNumber.trim() || !vehicleType) {
      toast.error("Vul alle velden in");
      return;
    }
    try {
      await addVehicle.mutateAsync({
        vehicleNumber: vehicleNumber.trim(),
        vehicleType,
      });
      toast.success(`Voertuig ${vehicleNumber} toegevoegd`);
      setVehicleNumber("");
      setVehicleType("");
      refreshVehicles();
    } catch {
      toast.error("Fout bij toevoegen voertuig");
    }
  };

  const handleRemove = async (id: string, number: string) => {
    try {
      await removeVehicle.mutateAsync(BigInt(id));
      toast.success(`Voertuig ${number} verwijderd`);
      refreshVehicles();
    } catch {
      toast.error("Fout bij verwijderen voertuig");
    }
  };

  if (adminLoading) {
    return (
      <div
        className="p-6 flex items-center justify-center"
        data-ocid="voertuigen.loading_state"
      >
        <Loader2 className="animate-spin text-primary" size={24} />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div
        className="p-6 flex flex-col items-center justify-center text-center"
        data-ocid="voertuigen.error_state"
      >
        <Shield size={48} className="text-muted-foreground/40 mb-4" />
        <h2 className="text-lg font-semibold">Geen toegang</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Dit gedeelte is alleen voor beheerders.
        </p>
        <Button
          variant="ghost"
          className="mt-4"
          onClick={() => navigate({ to: "/" })}
        >
          Terug naar dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-2xl font-bold text-foreground mb-1">
          Voertuigen Beheer
        </h1>
        <p className="text-muted-foreground text-sm">
          Beheer trekkers en aanhangers in het wagenpark
        </p>
      </motion.div>

      {/* Add vehicle form */}
      <Card className="shadow-card border-border">
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Plus size={16} />
            Voertuig Toevoegen
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleAdd}
            className="flex flex-col sm:flex-row gap-3"
          >
            <div className="flex-1 space-y-2">
              <Label htmlFor="vehicleNumber">Wagennummer</Label>
              <Input
                id="vehicleNumber"
                placeholder="bv. T-001"
                value={vehicleNumber}
                onChange={(e) => setVehicleNumber(e.target.value)}
                data-ocid="voertuigen.vehicle_number.input"
              />
            </div>
            <div className="w-full sm:w-44 space-y-2">
              <Label>Type</Label>
              <Select value={vehicleType} onValueChange={setVehicleType}>
                <SelectTrigger data-ocid="voertuigen.vehicle_type.select">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="trekker">Trekker</SelectItem>
                  <SelectItem value="aanhanger">Aanhanger</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                type="submit"
                disabled={addVehicle.isPending}
                data-ocid="voertuigen.add.primary_button"
              >
                {addVehicle.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Plus size={16} className="mr-2" />
                )}
                Toevoegen
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Vehicles table */}
      <Card className="shadow-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            Geregistreerde Voertuigen ({vehicles.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {vehicles.length === 0 ? (
            <div
              className="flex flex-col items-center py-12 text-muted-foreground"
              data-ocid="voertuigen.vehicles.empty_state"
            >
              <Truck size={36} className="mb-3 opacity-30" />
              <p className="text-sm">Nog geen voertuigen geregistreerd</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="text-xs font-semibold">
                    Wagennummer
                  </TableHead>
                  <TableHead className="text-xs font-semibold">Type</TableHead>
                  <TableHead className="text-xs font-semibold">
                    Acties
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vehicles.map((v, idx) => (
                  <TableRow
                    key={v.id}
                    data-ocid={`voertuigen.vehicles.item.${idx + 1}`}
                  >
                    <TableCell className="font-semibold text-sm">
                      {v.vehicleNumber}
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1.5 text-sm">
                        {v.vehicleType === "trekker" ? (
                          <Truck size={14} className="text-primary" />
                        ) : (
                          <Package size={14} className="text-primary" />
                        )}
                        {v.vehicleType === "trekker" ? "Trekker" : "Aanhanger"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="destructive"
                            size="sm"
                            data-ocid={`voertuigen.vehicles.delete_button.${idx + 1}`}
                          >
                            Verwijder
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent data-ocid="voertuigen.delete.dialog">
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Voertuig verwijderen?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              Weet u zeker dat u voertuig{" "}
                              <strong>{v.vehicleNumber}</strong> wilt
                              verwijderen? Dit kan niet ongedaan worden gemaakt.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel data-ocid="voertuigen.delete.cancel_button">
                              Annuleren
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() =>
                                handleRemove(v.id, v.vehicleNumber)
                              }
                              className="bg-destructive hover:bg-destructive/90"
                              data-ocid="voertuigen.delete.confirm_button"
                            >
                              Verwijderen
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
