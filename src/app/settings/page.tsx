'use client';

import { useState, useEffect } from "react";
import { 
  Settings, 
  Trash2,
  Lock,
  AlertTriangle,
  Languages,
  Download,
  Printer,
  Sparkles,
  Key,
  Info,
  Loader2,
  RefreshCw,
  Activity,
  CheckCircle2,
  FileText,
  AlertCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useBusinessData } from "@/hooks/use-business-data";
import { useToast } from "@/hooks/use-toast";
import { translations } from "@/lib/translations";
import { verifyAiKey } from "@/ai/flows/verify-ai-key";
import { cn } from "@/lib/utils";

const LANGUAGES = [
  { label: 'বাংলা (Bengali)', value: 'bn' },
  { label: 'English', value: 'en' },
];

export default function SettingsPage() {
  const { products, sales, customers, currency, language, aiApiKey, actions } = useBusinessData();
  const { toast } = useToast();
  const t = translations[language];
  
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [isExportOptionsOpen, setIsExportOptionsOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  
  // AI State
  const [newAiKey, setNewAiKey] = useState(aiApiKey || "");
  const [isVerifying, setIsVerifying] = useState(false);
  const [detectedModel, setDetectedModel] = useState<string | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  useEffect(() => {
    setNewAiKey(aiApiKey || "");
  }, [aiApiKey]);

  const handleLanguageChange = (val: 'en' | 'bn') => {
    actions.setLanguage(val);
    toast({ title: val === 'en' ? "Language Changed" : "ভাষা পরিবর্তন করা হয়েছে" });
  };

  const handleVerifyAndSaveKey = async () => {
    if (!newAiKey.trim()) {
      toast({ variant: "destructive", title: "Key Required" });
      return;
    }

    setIsVerifying(true);
    setDetectedModel(null);
    setVerifyError(null);

    try {
      // REAL-TIME VERIFICATION: Calling the server action
      const result = await verifyAiKey({ apiKey: newAiKey });
      
      if (result.success) {
        setDetectedModel(result.detectedModel || "AI System Active");
        actions.setAiApiKey(newAiKey);
        toast({
          title: language === 'en' ? "AI Activated!" : "এআই সক্রিয় হয়েছে!",
          description: result.message
        });
      } else {
        setVerifyError(result.message);
        toast({
          variant: "destructive",
          title: language === 'en' ? "Verification Failed" : "ভেরিফিকেশন ব্যর্থ",
          description: "Please check the error message below the input."
        });
      }
    } catch (e: any) {
      setVerifyError("সার্ভারের সাথে যোগাযোগ করা যাচ্ছে না। দয়া করে আবার চেষ্টা করুন।");
      toast({ variant: "destructive", title: "Connection Error", description: "Could not reach AI verify service." });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleReset = async () => {
    if (password === "specsxr") {
      setIsDeleting(true);
      await actions.resetAllData();
      toast({ title: "System Reset" });
    } else {
      toast({ title: "Wrong Password", variant: "destructive" });
      setPassword("");
    }
  };

  const handleDownloadCSV = () => {
    setIsExportOptionsOpen(false);
    toast({ title: "Generating Document..." });
    // Export logic...
    const csvContent = "SpecsBiz Data Report\nInventory: " + products.length + "\nSales: " + sales.length;
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "specsbiz_backup.csv";
    link.click();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-accent/10 rounded-xl">
          <Settings className="w-6 h-6 text-accent" />
        </div>
        <div>
          <h2 className="text-2xl font-bold font-headline text-primary">{t.systemSettings}</h2>
          <p className="text-sm text-muted-foreground">{t.configurePrefs}</p>
        </div>
      </div>

      <div className="grid gap-6">
        {/* SpecsAI REAL Activation Card */}
        <Card className="border-primary/30 shadow-2xl bg-white overflow-hidden ring-4 ring-primary/5">
          <div className="bg-primary text-white p-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md border border-white/30">
                <Sparkles className="w-7 h-7 text-accent" />
              </div>
              <div>
                <CardTitle className="text-xl font-black uppercase tracking-tighter">SpecsAI Master Activation</CardTitle>
                <CardDescription className="text-white/70 text-xs">Real-time model detection & secure brain sync.</CardDescription>
              </div>
            </div>
            <Badge className={cn("border-none h-7 px-3 text-[10px] font-black uppercase tracking-widest", aiApiKey ? "bg-green-500" : "bg-amber-500")}>
              {aiApiKey ? "SYSTEM ACTIVE" : "BRAIN OFFLINE"}
            </Badge>
          </div>
          <CardContent className="p-6 space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-black flex items-center gap-2 text-primary">
                  <Key className="w-4 h-4" /> AI PROVIDER API KEY
                </Label>
                <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-[10px] text-accent font-black uppercase hover:underline flex items-center gap-1">
                  Get Gemini Key <RefreshCw className="w-2.5 h-2.5" />
                </a>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Input 
                  type="password" 
                  placeholder="Paste your Gemini API Key here..."
                  value={newAiKey}
                  onChange={(e) => {
                    setNewAiKey(e.target.value);
                    setVerifyError(null);
                  }}
                  className={cn(
                    "h-14 bg-muted/30 focus:ring-primary font-mono text-xs border-primary/10 rounded-xl",
                    verifyError && "border-destructive focus:ring-destructive"
                  )}
                />
                <Button 
                  className="bg-primary hover:bg-primary/90 h-14 px-8 font-black uppercase shadow-xl transition-all active:scale-95 shrink-0"
                  onClick={handleVerifyAndSaveKey}
                  disabled={isVerifying}
                >
                  {isVerifying ? <Loader2 className="w-5 h-5 animate-spin" /> : "Verify & Activate"}
                </Button>
              </div>

              {verifyError && (
                <div className="bg-red-50 p-4 rounded-xl border-2 border-destructive/20 flex items-start gap-3 animate-in slide-in-from-top-2">
                  <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-destructive uppercase">Verification Failed</p>
                    <p className="text-sm font-bold text-destructive/80">{verifyError}</p>
                  </div>
                </div>
              )}

              {detectedModel && (
                <div className="bg-green-50 p-4 rounded-xl border-2 border-green-100 flex items-center justify-between animate-in slide-in-from-top-2">
                  <div className="flex items-center gap-3">
                    <Activity className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="text-[10px] font-black text-green-600 uppercase">Status: Connected</p>
                      <p className="text-sm font-bold text-green-800">{detectedModel}</p>
                    </div>
                  </div>
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                </div>
              )}

              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex gap-4">
                <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                  <Info className="w-6 h-6 text-blue-600" />
                </div>
                <div className="space-y-1">
                  <p className="text-[11px] text-blue-800 leading-relaxed font-medium">
                    আপনার এপিআই কি এখন থেকে সরাসরি **গুগল সার্ভারে** ভেরিফাই হবে। কি যোগ করার সাথে সাথেই এআই আপনার দোকানের ডাটা রিয়েল-টাইমে অ্যানালাইসিস করা শুরু করবে।
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Export Card */}
        <Card className="border-accent/20 shadow-lg bg-white overflow-hidden">
          <div className="bg-accent/5 p-4 border-b border-accent/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-accent text-white p-2 rounded-lg"><FileText className="w-5 h-5" /></div>
              <CardTitle className="text-lg">Full Data Export</CardTitle>
            </div>
          </div>
          <CardContent className="p-6">
            <Button className="w-full bg-accent hover:bg-accent/90 h-14 text-lg font-bold gap-2 shadow-xl" onClick={() => setIsExportOptionsOpen(true)}>
              <Download className="w-5 h-5" /> Export Business Data
            </Button>
          </CardContent>
        </Card>

        {/* Language Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Languages className="w-5 h-5 text-accent" />
              <CardTitle>{t.language}</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <Select value={language} onValueChange={handleLanguageChange}>
              <SelectTrigger className="w-full h-11"><SelectValue /></SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((l) => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-red-500/50 bg-red-50/50">
          <CardHeader>
            <div className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              <CardTitle>{t.dangerZone}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="flex justify-between items-center p-4 border border-red-200 rounded-lg bg-white/50">
            <p className="text-sm font-bold text-red-700">{t.resetSystem}</p>
            <Button variant="destructive" size="sm" onClick={() => setIsResetOpen(true)}>{t.resetSystem}</Button>
          </CardContent>
        </Card>
      </div>

      {/* Dialogs */}
      <Dialog open={isResetOpen} onOpenChange={setIsResetOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader><DialogTitle>Confirm Wipe</DialogTitle></DialogHeader>
          <div className="py-4 space-y-4">
            <Label className="text-xs font-bold uppercase">Master Password ('specsxr')</Label>
            <Input type="password" value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="destructive" className="w-full h-12" onClick={handleReset} disabled={isDeleting || !password}>
              {isDeleting ? "Wiping..." : "Confirm Full Reset"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isExportOptionsOpen} onOpenChange={setIsExportOptionsOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader><DialogTitle>Export Data</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-6">
            <Button variant="outline" className="h-20" onClick={handleDownloadCSV}><Download className="mr-2 h-5 w-5" /> Download CSV</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
