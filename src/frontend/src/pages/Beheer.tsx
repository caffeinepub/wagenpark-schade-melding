import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Check,
  Copy,
  Link,
  Loader2,
  MessageCircle,
  Share2,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import {
  useGenerateInviteCode,
  useGetInviteCodes,
  useIsAdmin,
} from "../hooks/useQueries";

export function Beheer() {
  const { data: isAdmin } = useIsAdmin();
  const generateInviteCode = useGenerateInviteCode();
  const { data: inviteCodes = [], isLoading: codesLoading } =
    useGetInviteCodes();

  const appUrl = window.location.origin;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`Gebruik deze link om in te loggen op WagenPark: ${appUrl}`)}`;

  const [copied, setCopied] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [inviteCopied, setInviteCopied] = useState(false);

  const handleCopyApp = async () => {
    try {
      await navigator.clipboard.writeText(appUrl);
      setCopied(true);
      toast.success("Link gekopieerd!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Kopiëren mislukt");
    }
  };

  const handleGenerateInvite = async () => {
    try {
      const code = await generateInviteCode.mutateAsync();
      const url = `${window.location.origin}/?invite=${code}`;
      setGeneratedUrl(url);
      toast.success("Uitnodigingslink aangemaakt");
    } catch {
      toast.error("Fout bij aanmaken uitnodigingslink");
    }
  };

  const handleCopyInvite = async () => {
    if (!generatedUrl) return;
    try {
      await navigator.clipboard.writeText(generatedUrl);
      setInviteCopied(true);
      toast.success("Link gekopieerd!");
      setTimeout(() => setInviteCopied(false), 2000);
    } catch {
      toast.error("Kopiëren mislukt");
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-2xl font-bold text-foreground mb-1">Beheer</h1>
        <p className="text-muted-foreground text-sm">
          Deel de app met collega's en beheer toegangslinks
        </p>
      </motion.div>

      {/* Share app URL */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
      >
        <Card className="shadow-card border-border">
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <Share2 size={16} />
              Deel de app met collega's
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Stuur de link hieronder naar collega's via WhatsApp of kopieer hem
              om te delen via een ander kanaal.
            </p>

            <div className="space-y-2">
              <Label>App-link</Label>
              <div className="flex gap-2">
                <Input
                  value={appUrl}
                  readOnly
                  className="font-mono text-sm bg-muted"
                  data-ocid="beheer.app_url.input"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopyApp}
                  data-ocid="beheer.copy_url.button"
                >
                  {copied ? (
                    <Check size={16} className="text-green-500" />
                  ) : (
                    <Copy size={16} />
                  )}
                </Button>
              </div>
            </div>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              data-ocid="beheer.whatsapp.primary_button"
            >
              <Button className="w-full gap-2 bg-green-600 hover:bg-green-700 text-white">
                <MessageCircle size={16} />
                Deel via WhatsApp
              </Button>
            </a>
          </CardContent>
        </Card>
      </motion.div>

      {/* Admin-only: invite links */}
      {isAdmin && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card className="shadow-card border-border">
            <CardHeader className="pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <Link size={16} />
                Uitnodigingslinks
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Genereer een persoonlijke uitnodigingslink voor een collega.
                Elke link is eenmalig geldig.
              </p>

              <Button
                onClick={handleGenerateInvite}
                disabled={generateInviteCode.isPending}
                data-ocid="beheer.generate_invite.primary_button"
              >
                {generateInviteCode.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Link size={16} className="mr-2" />
                )}
                Genereer uitnodigingslink
              </Button>

              {generatedUrl && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-2"
                >
                  <Label>Uitnodigingslink</Label>
                  <div className="flex gap-2">
                    <Input
                      value={generatedUrl}
                      readOnly
                      className="font-mono text-xs"
                      data-ocid="beheer.invite_url.input"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleCopyInvite}
                      data-ocid="beheer.copy_invite.button"
                    >
                      {inviteCopied ? (
                        <Check size={16} className="text-green-500" />
                      ) : (
                        <Copy size={16} />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Deze link kan eenmalig gebruikt worden. Kopieer en deel hem
                    met de collega die toegang nodig heeft.
                  </p>
                </motion.div>
              )}

              {/* Invite codes table */}
              <div className="pt-2">
                <h3 className="text-sm font-semibold mb-3">Aangemaakt links</h3>
                {codesLoading ? (
                  <div
                    className="flex items-center gap-2 text-muted-foreground text-sm"
                    data-ocid="beheer.invite_codes.loading_state"
                  >
                    <Loader2 size={14} className="animate-spin" />
                    Laden...
                  </div>
                ) : inviteCodes.length === 0 ? (
                  <div
                    className="flex flex-col items-center py-8 text-muted-foreground"
                    data-ocid="beheer.invite_codes.empty_state"
                  >
                    <Link size={28} className="mb-2 opacity-30" />
                    <p className="text-sm">
                      Nog geen uitnodigingslinks aangemaakt
                    </p>
                  </div>
                ) : (
                  <Table data-ocid="beheer.invite_codes.table">
                    <TableHeader>
                      <TableRow className="bg-muted/40">
                        <TableHead className="text-xs font-semibold">
                          Code
                        </TableHead>
                        <TableHead className="text-xs font-semibold">
                          Aangemaakt
                        </TableHead>
                        <TableHead className="text-xs font-semibold">
                          Status
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {inviteCodes.map((ic, idx) => (
                        <TableRow
                          key={ic.code}
                          data-ocid={`beheer.invite_codes.item.${idx + 1}`}
                        >
                          <TableCell className="font-mono text-xs text-muted-foreground">
                            {ic.code.slice(0, 8)}...
                          </TableCell>
                          <TableCell className="text-sm">
                            {new Date(
                              Number(ic.created) / 1_000_000,
                            ).toLocaleDateString("nl-NL", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </TableCell>
                          <TableCell>
                            {ic.used ? (
                              <Badge variant="secondary">Gebruikt</Badge>
                            ) : (
                              <Badge
                                variant="default"
                                className="bg-green-500/15 text-green-700 hover:bg-green-500/20 border-green-500/30"
                              >
                                Beschikbaar
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
