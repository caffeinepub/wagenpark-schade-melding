import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "@tanstack/react-router";
import {
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Image as ImageIcon,
  Loader2,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { ExternalBlob } from "../backend";
import { useAddInspectionRound } from "../hooks/useQueries";

type CategoryKey =
  | "schade"
  | "technisch"
  | "banden"
  | "vloeistoffen"
  | "veiligheid"
  | "documenten"
  | "interieur"
  | "overig";

interface CategoryDef {
  key: CategoryKey;
  emoji: string;
  label: string;
  subcategories: string[];
  showQuantity?: boolean;
  quantityItems?: string[];
}

const CATEGORIES: CategoryDef[] = [
  {
    key: "schade",
    emoji: "🔴",
    label: "Schade",
    subcategories: [
      "Carrosserie deuk/kras",
      "Ruitschade",
      "Lakschade",
      "Bumper schade",
      "Spiegelschade",
    ],
  },
  {
    key: "technisch",
    emoji: "🔧",
    label: "Technisch Mankement",
    subcategories: [
      "Motorstoring",
      "Remprobleem",
      "Elektrisch defect",
      "Verlichting defect",
      "Hydraulica",
      "Klimaat/airco",
    ],
  },
  {
    key: "banden",
    emoji: "⚫",
    label: "Banden",
    subcategories: [
      "Lekke band",
      "Gladde banden/slijtage",
      "Onbalans",
      "Bandspanning laag",
    ],
  },
  {
    key: "vloeistoffen",
    emoji: "💧",
    label: "Vloeistoffen",
    subcategories: [
      "Koelvloeistof",
      "Motorolie",
      "Ruitensproeier",
      "Remvloeistof",
      "AdBlue",
    ],
    showQuantity: true,
    quantityItems: [
      "Koelvloeistof",
      "Motorolie",
      "Ruitensproeier",
      "Remvloeistof",
      "AdBlue",
    ],
  },
  {
    key: "veiligheid",
    emoji: "🦺",
    label: "Veiligheid & Lading",
    subcategories: [
      "Spanbanden (aantal)",
      "Veiligheidsvest",
      "Gevarendriehoek",
      "EHBO-kit",
      "Brandblusser",
      "Sleepkabel",
      "Startkabels",
    ],
    showQuantity: true,
    quantityItems: ["Spanbanden (aantal)"],
  },
  {
    key: "documenten",
    emoji: "📄",
    label: "Documenten & Toegang",
    subcategories: [
      "Tankpas kwijt/defect",
      "Kentekenbewijs ontbreekt",
      "Verzekeringspapieren",
      "Keuringsrapport",
    ],
  },
  {
    key: "interieur",
    emoji: "🧤",
    label: "Interieur & Verbruik",
    subcategories: [
      "Handschoenen",
      "Schoonmaakmiddelen",
      "Lampjes/zekeringen",
      "Opladers",
      "Overige verbruiksmaterialen",
    ],
  },
  {
    key: "overig",
    emoji: "➕",
    label: "Overig",
    subcategories: [],
  },
];

interface SubItemState {
  checked: boolean;
  description: string;
  quantity: string;
  stillPresent: boolean;
  photos: Array<{ preview: string; file: File }>;
}

interface CategoryState {
  subItems: Record<string, SubItemState>;
  overigDescription: string;
  overigPhotos: Array<{ preview: string; file: File }>;
  stillPresent: boolean;
}

function defaultSubItem(): SubItemState {
  return {
    checked: false,
    description: "",
    quantity: "",
    stillPresent: true,
    photos: [],
  };
}

function defaultCategoryState(cat: CategoryDef): CategoryState {
  const subItems: Record<string, SubItemState> = {};
  for (const sub of cat.subcategories) {
    subItems[sub] = defaultSubItem();
  }
  return {
    subItems,
    overigDescription: "",
    overigPhotos: [],
    stillPresent: true,
  };
}

const STEP_LABELS = ["Basisgegevens", "Zijn er meldingen?", "Details"];

export function NieuweRondje() {
  const navigate = useNavigate();
  const addRound = useAddInspectionRound();

  const [step, setStep] = useState(0);

  // Step 1
  const today = new Date();
  const [datum, setDatum] = useState(today.toISOString().slice(0, 10));
  const [tijd, setTijd] = useState(today.toTimeString().slice(0, 5));
  const [melder, setMelder] = useState("");
  const [standplaats, setStandplaats] = useState("");
  const [trekker, setTrekker] = useState("");
  const [aanhanger, setAanhanger] = useState("");

  // Step 2
  const [heeftMeldingen, setHeeftMeldingen] = useState<boolean | null>(null);
  const [selectedCats, setSelectedCats] = useState<Set<CategoryKey>>(new Set());

  // Step 3
  const [catStates, setCatStates] = useState<
    Record<CategoryKey, CategoryState>
  >(() => {
    const s: Partial<Record<CategoryKey, CategoryState>> = {};
    for (const cat of CATEGORIES) {
      s[cat.key] = defaultCategoryState(cat);
    }
    return s as Record<CategoryKey, CategoryState>;
  });

  const [submitting, setSubmitting] = useState(false);
  const photoInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const overigPhotoRef = useRef<HTMLInputElement | null>(null);

  const updateSubItem = (
    catKey: CategoryKey,
    subKey: string,
    patch: Partial<SubItemState>,
  ) => {
    setCatStates((prev) => ({
      ...prev,
      [catKey]: {
        ...prev[catKey],
        subItems: {
          ...prev[catKey].subItems,
          [subKey]: { ...prev[catKey].subItems[subKey], ...patch },
        },
      },
    }));
  };

  const addPhotosToSub = (
    catKey: CategoryKey,
    subKey: string,
    files: File[],
  ) => {
    const current = catStates[catKey].subItems[subKey].photos;
    const remaining = 3 - current.length;
    const toAdd = files.slice(0, remaining).map((f) => ({
      file: f,
      preview: URL.createObjectURL(f),
    }));
    updateSubItem(catKey, subKey, { photos: [...current, ...toAdd] });
  };

  const removePhotoFromSub = (
    catKey: CategoryKey,
    subKey: string,
    preview: string,
  ) => {
    URL.revokeObjectURL(preview);
    const photos = catStates[catKey].subItems[subKey].photos.filter(
      (p) => p.preview !== preview,
    );
    updateSubItem(catKey, subKey, { photos });
  };

  const addPhotosToOverig = (files: File[]) => {
    const current = catStates.overig.overigPhotos;
    const remaining = 3 - current.length;
    const toAdd = files.slice(0, remaining).map((f) => ({
      file: f,
      preview: URL.createObjectURL(f),
    }));
    setCatStates((prev) => ({
      ...prev,
      overig: { ...prev.overig, overigPhotos: [...current, ...toAdd] },
    }));
  };

  const toggleCat = (key: CategoryKey) => {
    setSelectedCats((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const uploadFiles = async (files: File[]): Promise<string[]> => {
    return Promise.all(
      files.map(async (file) => {
        const bytes = new Uint8Array(await file.arrayBuffer());
        const blob = ExternalBlob.fromBytes(bytes);
        return blob.getDirectURL();
      }),
    );
  };

  const handleNee = async () => {
    if (!melder || !standplaats || !trekker) {
      toast.error("Vul alle verplichte velden in");
      return;
    }
    setSubmitting(true);
    try {
      const normTrekker = trekker.toUpperCase().replace(/-/g, "");
      const normAanhanger = aanhanger.toUpperCase().replace(/-/g, "");
      await addRound.mutateAsync({
        reporterName: melder,
        standplaats,
        trekkerKenteken: normTrekker,
        aanhangerKenteken: normAanhanger,
        items: [],
      });
      toast.success("Alles in orde geregistreerd!");
      navigate({ to: "/mijn-meldingen" });
    } catch {
      toast.error("Fout bij opslaan. Probeer opnieuw.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const items: Array<{
        category: string;
        subcategory: string;
        description: string;
        quantity: [] | [bigint];
        photoIds: string[];
        stillPresent: boolean;
      }> = [];

      for (const catKey of selectedCats) {
        const cat = CATEGORIES.find((c) => c.key === catKey)!;
        const state = catStates[catKey];

        if (catKey === "overig") {
          if (state.overigDescription.trim()) {
            const photoIds = await uploadFiles(
              state.overigPhotos.map((p) => p.file),
            );
            items.push({
              category: "overig",
              subcategory: "",
              description: state.overigDescription,
              quantity: [],
              photoIds,
              stillPresent: state.stillPresent,
            });
          }
        } else {
          for (const sub of cat.subcategories) {
            const subState = state.subItems[sub];
            if (!subState.checked) continue;
            const photoIds = await uploadFiles(
              subState.photos.map((p) => p.file),
            );
            const hasQty =
              cat.quantityItems?.includes(sub) && subState.quantity.trim();
            items.push({
              category: catKey,
              subcategory: sub,
              description: subState.description,
              quantity: hasQty
                ? [BigInt(Math.round(Number(subState.quantity)))]
                : [],
              photoIds,
              stillPresent: subState.stillPresent,
            });
          }
        }
      }

      const normTrekker = trekker.toUpperCase().replace(/-/g, "");
      const normAanhanger = aanhanger.toUpperCase().replace(/-/g, "");
      await addRound.mutateAsync({
        reporterName: melder,
        standplaats,
        trekkerKenteken: normTrekker,
        aanhangerKenteken: normAanhanger,
        items,
      });
      toast.success("Rondje opgeslagen!");
      navigate({ to: "/mijn-meldingen" });
    } catch {
      toast.error("Fout bij opslaan. Probeer opnieuw.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Back + title */}
        <div className="flex items-center gap-3 mb-5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              step > 0 ? setStep((s) => s - 1) : navigate({ to: "/" })
            }
            data-ocid="rondje.back.button"
          >
            <ChevronLeft size={16} className="mr-1" />
            Terug
          </Button>
          <div className="flex items-center gap-2">
            <ClipboardCheck size={20} className="text-primary" />
            <h1 className="text-xl font-bold text-foreground">Rondje Melden</h1>
          </div>
        </div>

        {/* Progress */}
        <div className="flex gap-2 mb-6">
          {STEP_LABELS.map((label, i) => (
            <div key={label} className="flex-1">
              <div
                className={`h-1.5 rounded-full mb-1 transition-colors ${
                  i <= step ? "bg-primary" : "bg-muted"
                }`}
              />
              <p
                className={`text-xs text-center ${
                  i === step
                    ? "text-primary font-semibold"
                    : "text-muted-foreground"
                }`}
              >
                {label}
              </p>
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* STEP 1 */}
          {step === 0 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
            >
              <Card className="shadow-card border-border">
                <CardHeader className="pb-4">
                  <CardTitle className="text-base">
                    Stap 1: Basisgegevens
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="datum">Datum</Label>
                      <Input
                        id="datum"
                        type="date"
                        value={datum}
                        onChange={(e) => setDatum(e.target.value)}
                        data-ocid="rondje.datum.input"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="tijd">Tijd</Label>
                      <Input
                        id="tijd"
                        type="time"
                        value={tijd}
                        onChange={(e) => setTijd(e.target.value)}
                        data-ocid="rondje.tijd.input"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="melder">
                      Naam melder <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="melder"
                      placeholder="Volledige naam"
                      value={melder}
                      onChange={(e) => setMelder(e.target.value)}
                      data-ocid="rondje.melder.input"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="standplaats">
                      Standplaats <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="standplaats"
                      placeholder="bv. Amsterdam, Rotterdam"
                      value={standplaats}
                      onChange={(e) => setStandplaats(e.target.value)}
                      data-ocid="rondje.standplaats.input"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="trekker">
                      Kenteken Trekker{" "}
                      <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="trekker"
                      placeholder="bv. AB123C (zonder streepjes)"
                      value={trekker}
                      onChange={(e) => setTrekker(e.target.value.toUpperCase())}
                      data-ocid="rondje.trekker.input"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="aanhanger">Kenteken Aanhanger</Label>
                    <Input
                      id="aanhanger"
                      placeholder="bv. AB123C (zonder streepjes, optioneel)"
                      value={aanhanger}
                      onChange={(e) =>
                        setAanhanger(e.target.value.toUpperCase())
                      }
                      data-ocid="rondje.aanhanger.input"
                    />
                  </div>
                  <Button
                    className="w-full"
                    disabled={!melder || !standplaats || !trekker}
                    onClick={() => setStep(1)}
                    data-ocid="rondje.step1.primary_button"
                  >
                    Volgende
                    <ChevronRight size={16} className="ml-1" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* STEP 2 */}
          {step === 1 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
            >
              <Card className="shadow-card border-border">
                <CardHeader className="pb-4">
                  <CardTitle className="text-base">
                    Stap 2: Zijn er meldingen?
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Trekker: <strong>{trekker}</strong>
                    {aanhanger && (
                      <>
                        {" "}
                        | Aanhanger: <strong>{aanhanger}</strong>
                      </>
                    )}
                    {" — "}
                    {standplaats}
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {heeftMeldingen === null && (
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        className="flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-all"
                        onClick={() => setHeeftMeldingen(false)}
                        data-ocid="rondje.nee.button"
                      >
                        <span className="text-3xl">✅</span>
                        <span className="font-semibold text-foreground">
                          Alles in orde
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Geen meldingen
                        </span>
                      </button>
                      <button
                        type="button"
                        className="flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-border hover:border-destructive hover:bg-destructive/5 transition-all"
                        onClick={() => setHeeftMeldingen(true)}
                        data-ocid="rondje.ja.button"
                      >
                        <span className="text-3xl">⚠️</span>
                        <span className="font-semibold text-foreground">
                          Ja, er zijn meldingen
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Selecteer categorieën
                        </span>
                      </button>
                    </div>
                  )}

                  {heeftMeldingen === false && (
                    <div className="text-center py-4 space-y-4">
                      <p className="text-muted-foreground text-sm">
                        Rondje wordt opgeslagen als "Alles in orde".
                      </p>
                      <Button
                        className="w-full"
                        onClick={handleNee}
                        disabled={submitting}
                        data-ocid="rondje.bevestig_nee.primary_button"
                      >
                        {submitting && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Bevestigen & Opslaan
                      </Button>
                      <Button
                        variant="ghost"
                        className="w-full"
                        onClick={() => setHeeftMeldingen(null)}
                        data-ocid="rondje.terug_keuze.button"
                      >
                        Terug naar keuze
                      </Button>
                    </div>
                  )}

                  {heeftMeldingen === true && (
                    <div className="space-y-4">
                      <p className="text-sm font-medium text-foreground">
                        Selecteer categorieën (meerdere mogelijk):
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {CATEGORIES.map((cat) => (
                          <button
                            key={cat.key}
                            type="button"
                            onClick={() => toggleCat(cat.key)}
                            className={`flex items-center gap-3 p-3 rounded-lg border-2 text-left transition-all ${
                              selectedCats.has(cat.key)
                                ? "border-primary bg-primary/10"
                                : "border-border hover:border-primary/50"
                            }`}
                            data-ocid={`rondje.cat_${cat.key}.toggle`}
                          >
                            <span className="text-xl shrink-0">
                              {cat.emoji}
                            </span>
                            <span className="text-sm font-medium text-foreground">
                              {cat.label}
                            </span>
                            {selectedCats.has(cat.key) && (
                              <span className="ml-auto w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                                <span className="text-primary-foreground text-xs">
                                  ✓
                                </span>
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                      <Button
                        className="w-full"
                        disabled={selectedCats.size === 0}
                        onClick={() => setStep(2)}
                        data-ocid="rondje.step2.primary_button"
                      >
                        Volgende: Details invullen
                        <ChevronRight size={16} className="ml-1" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* STEP 3 */}
          {step === 2 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
            >
              <div className="space-y-4">
                {CATEGORIES.filter((c) => selectedCats.has(c.key)).map(
                  (cat) => (
                    <CategoryDetailSection
                      key={cat.key}
                      cat={cat}
                      state={catStates[cat.key]}
                      onUpdateSub={(sub, patch) =>
                        updateSubItem(cat.key, sub, patch)
                      }
                      onAddPhotos={(sub, files) =>
                        addPhotosToSub(cat.key, sub, files)
                      }
                      onRemovePhoto={(sub, preview) =>
                        removePhotoFromSub(cat.key, sub, preview)
                      }
                      onAddOverigPhotos={(files) => addPhotosToOverig(files)}
                      onRemoveOverigPhoto={(preview) => {
                        URL.revokeObjectURL(preview);
                        setCatStates((prev) => ({
                          ...prev,
                          overig: {
                            ...prev.overig,
                            overigPhotos: prev.overig.overigPhotos.filter(
                              (p) => p.preview !== preview,
                            ),
                          },
                        }));
                      }}
                      onOverigDescChange={(val) =>
                        setCatStates((prev) => ({
                          ...prev,
                          overig: { ...prev.overig, overigDescription: val },
                        }))
                      }
                      photoInputRefs={photoInputRefs}
                      overigPhotoRef={overigPhotoRef}
                    />
                  ),
                )}

                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleSubmit}
                  disabled={submitting}
                  data-ocid="rondje.submit.primary_button"
                >
                  {submitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  <ClipboardCheck size={18} className="mr-2" />
                  Rondje Opslaan
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

function CategoryDetailSection({
  cat,
  state,
  onUpdateSub,
  onAddPhotos,
  onRemovePhoto,
  onAddOverigPhotos,
  onRemoveOverigPhoto,
  onOverigDescChange,
  photoInputRefs,
  overigPhotoRef,
}: {
  cat: CategoryDef;
  state: CategoryState;
  onUpdateSub: (sub: string, patch: Partial<SubItemState>) => void;
  onAddPhotos: (sub: string, files: File[]) => void;
  onRemovePhoto: (sub: string, preview: string) => void;
  onAddOverigPhotos: (files: File[]) => void;
  onRemoveOverigPhoto: (preview: string) => void;
  onOverigDescChange: (val: string) => void;
  photoInputRefs: React.MutableRefObject<
    Record<string, HTMLInputElement | null>
  >;
  overigPhotoRef: React.MutableRefObject<HTMLInputElement | null>;
}) {
  return (
    <Card className="shadow-card border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <span>{cat.emoji}</span>
          {cat.label}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {cat.key === "overig" ? (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="overig-desc">Omschrijving</Label>
              <Textarea
                id="overig-desc"
                placeholder="Beschrijf wat er gemeld moet worden..."
                rows={3}
                value={state.overigDescription}
                onChange={(e) => onOverigDescChange(e.target.value)}
                data-ocid="rondje.overig.textarea"
              />
            </div>
            <PhotoUpload
              photos={state.overigPhotos}
              onAdd={(files) => onAddOverigPhotos(files)}
              onRemove={(preview) => onRemoveOverigPhoto(preview)}
              inputRef={(el) => {
                overigPhotoRef.current = el;
              }}
              inputKey="overig"
            />
            <div className="flex items-center gap-3">
              <Switch
                id={"still-overig"}
                checked={state.stillPresent}
                onCheckedChange={(_val) =>
                  // handled in parent via overig state
                  onOverigDescChange(state.overigDescription)
                }
                data-ocid="rondje.overig.switch"
              />
              <Label
                htmlFor="still-overig"
                className="text-sm text-muted-foreground"
              >
                Nog steeds aanwezig
              </Label>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {cat.subcategories.map((sub) => {
              const subState = state.subItems[sub];
              const showQty = cat.quantityItems?.includes(sub);
              return (
                <div key={sub} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id={`${cat.key}-${sub}`}
                      checked={subState.checked}
                      onCheckedChange={(v) =>
                        onUpdateSub(sub, { checked: !!v })
                      }
                      data-ocid={`rondje.${cat.key}.checkbox`}
                    />
                    <Label
                      htmlFor={`${cat.key}-${sub}`}
                      className="text-sm font-medium cursor-pointer"
                    >
                      {sub}
                    </Label>
                  </div>

                  {subState.checked && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="ml-6 space-y-2"
                    >
                      <Textarea
                        placeholder="Omschrijving (optioneel)..."
                        rows={2}
                        value={subState.description}
                        onChange={(e) =>
                          onUpdateSub(sub, { description: e.target.value })
                        }
                        className="text-sm"
                        data-ocid={`rondje.${cat.key}.textarea`}
                      />
                      {showQty && (
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min="0"
                            placeholder={
                              cat.key === "vloeistoffen" ? "Liters" : "Aantal"
                            }
                            value={subState.quantity}
                            onChange={(e) =>
                              onUpdateSub(sub, { quantity: e.target.value })
                            }
                            className="w-32 text-sm"
                            data-ocid={`rondje.${cat.key}.input`}
                          />
                          <span className="text-xs text-muted-foreground">
                            {cat.key === "vloeistoffen" ? "liter" : "stuks"}
                          </span>
                        </div>
                      )}
                      <PhotoUpload
                        photos={subState.photos}
                        onAdd={(files) => onAddPhotos(sub, files)}
                        onRemove={(preview) => onRemovePhoto(sub, preview)}
                        inputRef={(el) => {
                          photoInputRefs.current[`${cat.key}-${sub}`] = el;
                        }}
                        inputKey={`${cat.key}-${sub}`}
                      />
                      <div className="flex items-center gap-2">
                        <Switch
                          id={`still-${cat.key}-${sub}`}
                          checked={subState.stillPresent}
                          onCheckedChange={(v) =>
                            onUpdateSub(sub, { stillPresent: v })
                          }
                          data-ocid={`rondje.${cat.key}.switch`}
                        />
                        <Label
                          htmlFor={`still-${cat.key}-${sub}`}
                          className="text-xs text-muted-foreground"
                        >
                          Nog steeds aanwezig
                        </Label>
                      </div>
                    </motion.div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PhotoUpload({
  photos,
  onAdd,
  onRemove,
  inputRef,
  inputKey,
}: {
  photos: Array<{ preview: string; file: File }>;
  onAdd: (files: File[]) => void;
  onRemove: (preview: string) => void;
  inputRef: (el: HTMLInputElement | null) => void;
  inputKey: string;
}) {
  const localRef = useRef<HTMLInputElement | null>(null);

  return (
    <div className="space-y-2">
      {photos.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {photos.map((p, i) => (
            <div
              key={p.preview}
              className="relative group w-16 h-16 rounded-lg overflow-hidden"
            >
              <img
                src={p.preview}
                alt={`Foto ${i + 1}`}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => onRemove(p.preview)}
                className="absolute top-0.5 right-0.5 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label={`Foto ${i + 1} verwijderen`}
              >
                <X size={10} />
              </button>
            </div>
          ))}
        </div>
      )}
      {photos.length < 3 && (
        <button
          type="button"
          className="flex items-center gap-2 text-xs text-muted-foreground border border-dashed border-border rounded-lg px-3 py-2 hover:border-primary/50 hover:text-primary transition-colors"
          onClick={() => localRef.current?.click()}
          data-ocid={`rondje.photo_${inputKey}.upload_button`}
        >
          <ImageIcon size={14} />
          Foto toevoegen
          <input
            ref={(el) => {
              localRef.current = el;
              inputRef(el);
            }}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              const files = Array.from(e.target.files ?? []);
              if (files.length) onAdd(files);
              if (e.target) e.target.value = "";
            }}
          />
        </button>
      )}
    </div>
  );
}
