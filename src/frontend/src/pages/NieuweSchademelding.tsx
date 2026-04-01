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
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "@tanstack/react-router";
import {
  ChevronLeft,
  Image as ImageIcon,
  Loader2,
  Upload,
  X,
} from "lucide-react";
import { motion } from "motion/react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { ExternalBlob } from "../backend";
import { useAddDamageReport, useAddVehicle } from "../hooks/useQueries";
import { getCachedVehicles, saveVehicleToCache } from "../utils/vehicleCache";

interface PhotoEntry {
  preview: string;
  file: File;
  blob?: ExternalBlob;
  uploaded?: string;
}

export function NieuweSchademelding() {
  const navigate = useNavigate();
  const addReport = useAddDamageReport();
  const addVehicle = useAddVehicle();

  const [tijdstip, setTijdstip] = useState(() => {
    const now = new Date();
    return now.toTimeString().slice(0, 5);
  });
  const [trekkerKenteken, setTrekkerKenteken] = useState("");
  const [aanhangerKenteken, setAanhangerKenteken] = useState("");
  const [damageType, setDamageType] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState("");
  const [location, setLocation] = useState("");
  const [photos, setPhotos] = useState<PhotoEntry[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const remaining = 3 - photos.length;
    const toAdd = files.slice(0, remaining);
    const newPhotos = toAdd.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setPhotos((prev) => [...prev, ...newPhotos]);
    setUploadProgress((prev) => [...prev, ...toAdd.map(() => 0)]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removePhoto = (preview: string) => {
    setPhotos((prev) => {
      const idx = prev.findIndex((p) => p.preview === preview);
      if (idx >= 0) URL.revokeObjectURL(prev[idx].preview);
      return prev.filter((p) => p.preview !== preview);
    });
    setUploadProgress((prev) => prev.slice(0, -1));
  };

  const uploadPhotos = async (): Promise<string[]> => {
    const ids: string[] = [];
    for (let i = 0; i < photos.length; i++) {
      const photo = photos[i];
      const arrayBuffer = await photo.file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      const blob = ExternalBlob.fromBytes(bytes).withUploadProgress((pct) => {
        setUploadProgress((prev) => {
          const updated = [...prev];
          updated[i] = pct;
          return updated;
        });
      });
      const directUrl = blob.getDirectURL();
      ids.push(directUrl);
    }
    return ids;
  };

  /**
   * Resolve a vehicleId for the given kenteken.
   * 1. Check local cache first (fast path).
   * 2. If not cached, auto-register the vehicle as type "Trekker" so the
   *    report can always be submitted, even on a fresh device or after a
   *    redeployment that wiped the backend state.
   */
  const normalizeKenteken = (k: string) => k.toUpperCase().replace(/-/g, "");

  const resolveVehicleId = async (kenteken: string): Promise<bigint> => {
    const normalized = normalizeKenteken(kenteken);
    // Try cache first
    const cached = getCachedVehicles().find(
      (v) => normalizeKenteken(v.vehicleNumber) === normalized,
    );
    if (cached) {
      return BigInt(cached.id);
    }

    // Not in cache → auto-add to backend and cache the returned ID
    const newId = await addVehicle.mutateAsync({
      vehicleNumber: normalized,
      vehicleType: "Trekker",
    });
    saveVehicleToCache({
      id: newId.toString(),
      vehicleNumber: normalized,
      vehicleType: "Trekker",
    });
    return newId;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !tijdstip ||
      !trekkerKenteken ||
      !damageType ||
      !description ||
      !severity
    ) {
      toast.error("Vul alle verplichte velden in");
      return;
    }

    // Prepend tijdstip + aanhanger to description
    let fullDescription = `Tijdstip: ${tijdstip}`;
    if (aanhangerKenteken.trim()) {
      fullDescription += ` | Aanhanger: ${aanhangerKenteken.trim()}`;
    }
    fullDescription += `\n\n${description}`;

    setUploading(true);
    try {
      // Resolve vehicleId — auto-registers the vehicle if needed
      const vehicleId = await resolveVehicleId(trekkerKenteken);

      const photoIds = photos.length > 0 ? await uploadPhotos() : [];
      await addReport.mutateAsync({
        vehicleId,
        damageType,
        description: fullDescription,
        severity,
        locationDescription: location,
        photoIds,
      });
      toast.success("Schademelding ingediend!");
      navigate({ to: "/mijn-meldingen" });
    } catch (err: any) {
      const msg: string =
        typeof err?.message === "string" ? err.message : String(err ?? "");

      if (
        msg.toLowerCase().includes("vehicle") ||
        msg.toLowerCase().includes("voertuig")
      ) {
        toast.error(
          "Fout bij opslaan van het voertuig. Controleer het kenteken en probeer opnieuw.",
          { duration: 6000 },
        );
      } else if (
        msg.toLowerCase().includes("authorized") ||
        msg.toLowerCase().includes("not allowed")
      ) {
        toast.error(
          "Fout bij opslaan. Probeer opnieuw of neem contact op met de beheerder.",
          { duration: 8000 },
        );
      } else {
        toast.error(
          `Fout bij indienen melding: ${msg || "Onbekende fout. Probeer opnieuw."}`,
          { duration: 6000 },
        );
      }
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const isBusy = uploading || addReport.isPending || addVehicle.isPending;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center gap-3 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate({ to: "/" })}
            data-ocid="melden.back.button"
          >
            <ChevronLeft size={16} className="mr-1" />
            Terug
          </Button>
        </div>

        <Card className="shadow-card border-border">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl">Nieuwe Schademelding</CardTitle>
            <p className="text-sm text-muted-foreground">
              Vul de gegevens in over de schade aan het voertuig
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Tijdstip */}
              <div className="space-y-2">
                <Label htmlFor="tijdstip">
                  Tijdstip <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="tijdstip"
                  type="time"
                  value={tijdstip}
                  onChange={(e) => setTijdstip(e.target.value)}
                  required
                  data-ocid="melden.tijdstip.input"
                />
              </div>

              {/* Kenteken Trekker */}
              <div className="space-y-2">
                <Label htmlFor="trekkerKenteken">
                  Kenteken Trekker <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="trekkerKenteken"
                  placeholder="bv. AB123C (streepjes worden automatisch verwijderd)"
                  value={trekkerKenteken}
                  onChange={(e) =>
                    setTrekkerKenteken(e.target.value.toUpperCase())
                  }
                  data-ocid="melden.trekker_kenteken.input"
                />
              </div>

              {/* Kenteken Aanhanger */}
              <div className="space-y-2">
                <Label htmlFor="aanhangerKenteken">Kenteken Aanhanger</Label>
                <Input
                  id="aanhangerKenteken"
                  placeholder="bv. AB123C (optioneel)"
                  value={aanhangerKenteken}
                  onChange={(e) =>
                    setAanhangerKenteken(e.target.value.toUpperCase())
                  }
                  data-ocid="melden.aanhanger_kenteken.input"
                />
              </div>

              {/* Damage type */}
              <div className="space-y-2">
                <Label htmlFor="damageType">
                  Type Schade <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="damageType"
                  placeholder="bv. Deuk, Kras, Ruitschade..."
                  value={damageType}
                  onChange={(e) => setDamageType(e.target.value)}
                  data-ocid="melden.damage_type.input"
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">
                  Omschrijving <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="description"
                  placeholder="Beschrijf de schade zo duidelijk mogelijk..."
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  data-ocid="melden.description.textarea"
                />
              </div>

              {/* Severity + Location row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>
                    Ernst <span className="text-destructive">*</span>
                  </Label>
                  <Select value={severity} onValueChange={setSeverity}>
                    <SelectTrigger data-ocid="melden.severity.select">
                      <SelectValue placeholder="Selecteer ernst" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Laag">Laag</SelectItem>
                      <SelectItem value="Gemiddeld">Gemiddeld</SelectItem>
                      <SelectItem value="Hoog">Hoog</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Locatie Omschrijving</Label>
                  <Input
                    id="location"
                    placeholder="bv. Voorkant links"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    data-ocid="melden.location.input"
                  />
                </div>
              </div>

              {/* Photo upload */}
              <div className="space-y-2">
                <Label>Foto's (max. 3)</Label>
                <button
                  type="button"
                  className="w-full border-2 border-dashed border-border rounded-xl p-5 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                  onKeyDown={(e) =>
                    e.key === "Enter" && fileInputRef.current?.click()
                  }
                  data-ocid="melden.photo.dropzone"
                  disabled={photos.length >= 3}
                >
                  <ImageIcon
                    size={24}
                    className="mx-auto mb-2 text-muted-foreground"
                  />
                  <p className="text-sm font-medium text-foreground">
                    Klik om foto's te uploaden
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    JPG, PNG of WEBP — max. 3 foto's
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleFileChange}
                    disabled={photos.length >= 3}
                    data-ocid="melden.photo.upload_button"
                  />
                </button>

                {photos.length > 0 && (
                  <div className="grid grid-cols-3 gap-3 mt-3">
                    {photos.map((photo, idx) => (
                      <div
                        key={photo.preview}
                        className="relative group rounded-lg overflow-hidden aspect-square"
                      >
                        <img
                          src={photo.preview}
                          alt={`Foto ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        {isBusy && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <div className="text-white text-sm font-semibold">
                              {uploadProgress[idx] ?? 0}%
                            </div>
                          </div>
                        )}
                        {!isBusy && (
                          <button
                            type="button"
                            onClick={() => removePhoto(photo.preview)}
                            className="absolute top-1.5 right-1.5 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            aria-label={`Foto ${idx + 1} verwijderen`}
                          >
                            <X size={12} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isBusy}
                data-ocid="melden.submit.submit_button"
              >
                {isBusy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Upload size={16} className="mr-2" />
                Melding Indienen
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
