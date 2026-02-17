
'use client';

import { useState, useEffect } from "react";
import { 
  Settings, 
  Trash2,
  Lock,
  AlertTriangle,
  Languages,
  Download,
  Sparkles,
  Key,
  Info,
  Loader2,
  RefreshCw,
  Activity,
  CheckCircle2,
  FileText,
  AlertCircle,
  X,
  Cpu,
  UserCheck,
  ShieldAlert,
  Plus,
  Users,
  Power,
  Copy,
  Edit2,
  Save,
  Clock,
  RotateCcw
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
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useBusinessData } from "@/hooks/use-business-data";
import { useToast } from "@/hooks/use-toast";
import { translations } from "@/lib/translations";
import { verifyAiKey } from "@/ai/flows/verify-ai-key";
import { cn } from "@/lib/utils";
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from "@/firebase";
import { collection, doc, setDoc, updateDoc, query, orderBy, serverTimestamp, deleteDoc, getDocs, writeBatch } from "firebase/firestore";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";

/**
 * MASTER ADMIN PANEL
 * Only visible to specsxr@gmail.com
 */
function MasterDeveloperPanel() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  
  const [editingCodeId, setEditingCodeId] = useState<string | null>(null);
  const [assignName, setAssignName] = useState("");

  const codesQuery = useMemoFirebase(() => {
    if (!db || user?.email !== 'specsxr@gmail.com') return null;
    return query(collection(db, 'registrationCodes'), orderBy('createdAt', 'desc'));
  }, [db, user?.email]);

  const { data: codes, isLoading } = useCollection(codesQuery);

  const generateNewCode = async () => {
    const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    try {
      await setDoc(doc(db, 'registrationCodes', newCode), {
        code: newCode,
        isUsed: false,
        status: 'active',
        assignedTo: '',
        createdAt: serverTimestamp()
      });
      toast({ title: "New Code Generated", description: `Code: ${newCode}` });
    } catch (e) {
      toast({ variant: "destructive", title: "Failed to generate code" });
    }
  };

  const toggleUserStatus = async (code: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      await updateDoc(doc(db, 'registrationCodes', code), { status: newStatus });
      toast({ title: `Status changed to ${newStatus}` });
    } catch (e) {
      toast({ variant: "destructive", title: "Failed to update status" });
    }
  };

  const handleUpdateAssignedTo = async (code: string) => {
    try {
      await updateDoc(doc(db, 'registrationCodes', code), { assignedTo: assignName });
      setEditingCodeId(null);
      setAssignName("");
      toast({ title: "Info Updated" });
    } catch (e) {
      toast({ variant: "destructive", title: "Update failed" });
    }
  };

  const handleCancelDelete = async (code: string) => {
    try {
      await updateDoc(doc(db, 'registrationCodes', code), { 
        status: 'active', 
        deleteRequestedAt: null 
      });
      toast({ title: "Deletion Cancelled" });
    } catch (e) {
      toast({ variant: "destructive", title: "Failed to cancel" });
    }
  };

  const handleFinalConfirmDelete = async (code: string, userId: string) => {
    if (!db) return;
    try {
      const subCollections = ['products', 'sales', 'customers', 'procurements', 'aiMessages', 'advisorMessages', 'notes'];
      
      for (const coll of subCollections) {
        const snap = await getDocs(collection(db, 'users', userId, coll));
        const batch = writeBatch(db);
        snap.docs.forEach(d => batch.delete(d.ref));
        await batch.commit();
      }
      
      await deleteDoc(doc(db, 'users', userId));

      await updateDoc(doc(db, 'registrationCodes', code), { 
        status: 'deleted',
        isUsed: true
      });

      toast({ title: "Account & Data Permanently Wiped" });
    } catch (e) {
      toast({ variant: "destructive", title: "Wipe failed", description: "Internal storage error." });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard" });
  };

  if (user?.email !== 'specsxr@gmail.com') return null;

  return (
    <Card className="border-red-500/30 shadow-2xl bg-white overflow-hidden ring-4 ring-red-500/5 rounded-[2.5rem] mb-8">
      <div className="bg-red-600 text-white p-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md border border-white/30">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <div>
            <CardTitle className="text-xl font-black uppercase tracking-tighter">Master Developer Control</CardTitle>
            <CardDescription className="text-red-100 text-xs">Managing registration access & users.</CardDescription>
          </div>
        </div>
        <Button onClick={generateNewCode} className="bg-white text-red-600 hover:bg-red-50 rounded-xl font-black uppercase text-[10px] h-10 gap-2">
          <Plus className="w-4 h-4" /> Generate Code
        </Button>
      </div>
      <CardContent className="p-0">
        <ScrollArea className="h-[450px]">
          {isLoading ? (
            <div className="p-10 text-center animate-pulse text-red-600 font-bold">Fetching codes...</div>
          ) : (
            <div className="divide-y">
              {codes?.map((c) => {
                const isInactive = c.status === 'inactive';
                const isPendingDel = c.status === 'pending_deletion';
                const isDeleted = c.status === 'deleted';
                const isActive = c.isUsed && !isInactive && !isPendingDel && !isDeleted;

                return (
                  <div key={c.id} className={cn("p-4 space-y-3 transition-all", isPendingDel ? "bg-red-50" : "hover:bg-red-50/30")}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "h-10 w-10 rounded-xl flex items-center justify-center font-black text-xs border shadow-sm",
                          isActive ? "bg-green-50 text-green-700 border-green-100" : 
                          isInactive ? "bg-red-50 text-red-700 border-red-100" :
                          isPendingDel ? "bg-orange-50 text-orange-700 border-orange-100" :
                          isDeleted ? "bg-gray-50 text-gray-700 border-gray-100" :
                          "bg-amber-50 text-amber-700 border-amber-100"
                        )}>
                          {c.code.slice(0, 2)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-black text-primary font-mono">{c.code}</p>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(c.code)}><Copy className="w-3 h-3" /></Button>
                          </div>
                          {editingCodeId === c.id ? (
                            <div className="flex items-center gap-2 mt-1">
                              <Input size={1} className="h-7 text-[10px] w-32" placeholder="Assign to name..." value={assignName} onChange={e => setAssignName(e.target.value)} />
                              <Button size="icon" className="h-7 w-7 bg-green-600" onClick={() => handleUpdateAssignedTo(c.code)}><Save className="w-3 h-3" /></Button>
                              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditingCodeId(null)}><X className="w-3 h-3" /></Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 mt-0.5">
                              <p className="text-[9px] font-bold text-muted-foreground uppercase">
                                {c.assignedTo ? `For: ${c.assignedTo}` : 'No assignment'}
                              </p>
                              <Button variant="ghost" className="h-4 p-0 text-accent hover:bg-transparent" onClick={() => { setEditingCodeId(c.id); setAssignName(c.assignedTo || ""); }}>
                                <Edit2 className="w-2.5 h-2.5" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="text-right mr-2">
                          <p className="text-[8px] font-black uppercase opacity-40">Status</p>
                          <Badge className={cn(
                            "border-none text-[8px] font-black h-5 uppercase", 
                            isActive ? "bg-green-500" : isInactive ? "bg-red-500" : isPendingDel ? "bg-orange-500" : isDeleted ? "bg-gray-500" : "bg-amber-500"
                          )}>
                            {c.status === 'active' && c.isUsed ? 'ACTIVE' : c.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        <Switch 
                          checked={!isInactive && !isDeleted} 
                          onCheckedChange={() => toggleUserStatus(c.code, c.status)} 
                          disabled={isDeleted || isPendingDel}
                        />
                      </div>
                    </div>

                    {isPendingDel && (
                      <div className="pl-14 pt-4 border-t border-red-200 mt-2">
                        <div className="bg-white p-4 rounded-2xl shadow-sm border border-red-100">
                          <p className="text-[10px] font-black text-red-600 flex items-center gap-1.5 uppercase mb-3">
                            <AlertTriangle className="w-4 h-4" /> User requested permanent deletion
                          </p>
                          <div className="flex flex-col sm:flex-row gap-3">
                            <Button className="flex-1 bg-red-600 hover:bg-red-700 text-[10px] h-11 font-black uppercase rounded-xl shadow-lg" onClick={() => handleFinalConfirmDelete(c.code, c.userId)}>
                              <Trash2 className="w-4 h-4 mr-2" /> Confirm & Wipe All Data
                            </Button>
                            <Button variant="outline" className="flex-1 border-primary text-primary hover:bg-primary/5 text-[10px] h-11 font-black uppercase rounded-xl" onClick={() => handleCancelDelete(c.code)}>
                              <RotateCcw className="w-4 h-4 mr-2" /> Cancel Request
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}

                    {c.isUsed && !isDeleted && (
                      <div className="pl-14">
                        <p className="text-[9px] font-medium text-primary/60 flex items-center gap-1.5">
                          <UserCheck className="w-3.5 h-3.5" /> Used by: <span className="font-bold text-primary">{c.userEmail}</span>
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
              {(!codes || codes.length === 0) && (
                <div className="p-20 text-center text-muted-foreground italic text-xs">No codes generated yet.</div>
              )}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

export default function SettingsPage() {
  const { user } = useUser();
  const db = useFirestore();
  const { products, sales, aiApiKey, aiModel, language, actions } = useBusinessData();
  const { toast } = useToast();
  const t = translations[language];
  
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [isDeleteAccOpen, setIsDeleteAccOpen] = useState(false);
  const [isExportOptionsOpen, setIsExportOptionsOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [deleteCodeInput, setDeleteCodeInput] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [newAiKey, setNewAiKey] = useState(aiApiKey || "");
  const [isVerifying, setIsVerifying] = useState(false);
  const [detectedModel, setDetectedModel] = useState<string | null>(aiModel || null);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  const userProfileRef = useMemoFirebase(() => {
    if (!user?.uid || !db) return null;
    return doc(db, 'users', user.uid);
  }, [user?.uid, db]);
  const { data: profile } = useDoc(userProfileRef);

  useEffect(() => {
    setNewAiKey(aiApiKey || "");
  }, [aiApiKey]);

  const handleLanguageChange = (val: 'en' | 'bn') => {
    actions.setLanguage(val);
    toast({ title: val === 'en' ? "Language Changed" : "ভাষা পরিবর্তন করা হয়েছে" });
  };

  const handleVerifyAndSaveKey = async () => {
    const cleanedKey = newAiKey.trim().replace(/^["']|["']$/g, '');
    if (!cleanedKey) return;
    setIsVerifying(true);
    try {
      const result = await verifyAiKey({ apiKey: cleanedKey });
      if (result.success) {
        const modelName = result.detectedModel || "gemini-1.5-flash";
        setDetectedModel(modelName);
        actions.setAiConfig(cleanedKey, modelName);
        toast({ title: "AI Brain Activated!" });
      } else {
        setVerifyError(result.message);
      }
    } catch (e) {
      setVerifyError("Connection Error");
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
    }
  };

  const handleDeleteAccountRequest = async () => {
    if (!profile?.usedCode || !db || !user?.uid) return;
    
    const inputCode = deleteCodeInput.trim().toUpperCase();
    const actualCode = profile.usedCode.trim().toUpperCase();

    if (inputCode === actualCode) {
      setIsDeleting(true);
      const codeDocRef = doc(db, 'registrationCodes', actualCode);
      
      const updateData = {
        status: 'pending_deletion',
        deleteRequestedAt: serverTimestamp(),
        userId: user.uid,
        userEmail: user.email || ''
      };

      updateDoc(codeDocRef, updateData)
        .then(() => {
          toast({ title: "Deletion Request Sent", description: "Account will be wiped in 3 days." });
          setIsDeleteAccOpen(false);
        })
        .catch(async (serverError) => {
          const permissionError = new FirestorePermissionError({
            path: codeDocRef.path,
            operation: 'update',
            requestResourceData: updateData,
          });
          errorEmitter.emit('permission-error', permissionError);
        })
        .finally(() => {
          setIsDeleting(false);
        });
    } else {
      toast({ variant: "destructive", title: "Invalid Activation Code" });
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20 px-2">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-accent/10 rounded-2xl shadow-sm"><Settings className="w-6 h-6 text-accent" /></div>
        <div>
          <h2 className="text-2xl font-black text-primary uppercase tracking-tighter">{t.systemSettings}</h2>
          <p className="text-[10px] font-bold text-accent uppercase tracking-[0.3em]">{t.configurePrefs}</p>
        </div>
      </div>

      <div className="grid gap-8">
        <MasterDeveloperPanel />

        <Card className="border-primary/30 shadow-xl bg-white overflow-hidden rounded-[2.5rem]">
          <div className="bg-primary text-white p-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 p-3 rounded-2xl border border-white/30"><Cpu className="w-7 h-7 text-accent animate-pulse" /></div>
              <CardTitle className="text-lg font-black uppercase">Universal AI Brain</CardTitle>
            </div>
            <Badge className={cn("border-none h-6 px-3 text-[9px] font-black", aiApiKey ? "bg-green-500" : "bg-amber-500")}>
              {aiApiKey ? "ACTIVE" : "OFFLINE"}
            </Badge>
          </div>
          <CardContent className="p-6 space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-black uppercase text-primary">Master API Key</Label>
                <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-[10px] text-accent font-black uppercase hover:underline">Get Free Key</a>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Input type="password" placeholder="Paste Key..." value={newAiKey} onChange={e => setNewAiKey(e.target.value)} className="h-14 bg-muted/30 rounded-xl" />
                <Button className="bg-primary h-14 px-8 font-black uppercase shadow-lg" onClick={handleVerifyAndSaveKey} disabled={isVerifying}>
                  {isVerifying ? <Loader2 className="w-5 h-5 animate-spin" /> : "Verify"}
                </Button>
              </div>
              {detectedModel && <div className="bg-emerald-50 p-4 rounded-xl border-2 border-emerald-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Activity className="w-5 h-5 text-emerald-600" />
                  <p className="text-xs font-black text-emerald-800">{detectedModel} Activated</p>
                </div>
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              </div>}
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="rounded-[2rem]">
            <CardHeader><CardTitle className="text-sm uppercase flex items-center gap-2"><Languages className="w-4 h-4" /> {t.language}</CardTitle></CardHeader>
            <CardContent>
              <Select value={language} onValueChange={handleLanguageChange}>
                <SelectTrigger className="h-12 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="bn">বাংলা (Bengali)</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card className="rounded-[2rem]">
            <CardHeader><CardTitle className="text-sm uppercase flex items-center gap-2"><Download className="w-4 h-4" /> Backup</CardTitle></CardHeader>
            <CardContent>
              <Button className="w-full h-12 bg-accent rounded-xl font-bold gap-2" onClick={() => setIsExportOptionsOpen(true)}><FileText className="w-4 h-4" /> Export Data</Button>
            </CardContent>
          </Card>
        </div>

        <Card className="border-red-500/50 bg-red-50/50 rounded-[2rem] overflow-hidden">
          <CardHeader className="bg-red-500/10"><CardTitle className="text-sm font-black text-red-600 uppercase flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> {t.dangerZone}</CardTitle></CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="flex justify-between items-center border-b border-red-500/10 pb-4">
              <p className="text-xs font-bold text-red-700">Wipe all data from cloud and local.</p>
              <Button variant="destructive" className="rounded-xl font-black text-[10px] uppercase" onClick={() => setIsResetOpen(true)}>{t.resetSystem}</Button>
            </div>
            
            {user?.email !== 'specsxr@gmail.com' && (
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <p className="text-xs font-black text-red-800 uppercase">Permanently Delete Account</p>
                  <p className="text-[10px] text-red-600/70 font-medium">Cloud account and all linked data will be wiped.</p>
                </div>
                <Button variant="outline" className="border-red-500 text-red-600 hover:bg-red-50 rounded-xl font-black text-[10px] uppercase h-10 px-6" onClick={() => setIsDeleteAccOpen(true)}>
                  Delete Forever
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isResetOpen} onOpenChange={setIsResetOpen}>
        <DialogContent className="rounded-[2rem]">
          <DialogHeader><DialogTitle className="text-destructive font-black uppercase">Master Wipe</DialogTitle></DialogHeader>
          <div className="py-4 space-y-4">
            <Input type="password" value={password} onChange={e => setPassword(e.target.value)} className="h-14 text-center text-2xl font-black rounded-2xl" placeholder="••••••••" />
          </div>
          <DialogFooter><Button variant="destructive" className="w-full h-14 rounded-2xl font-black uppercase" onClick={handleReset} disabled={isDeleting}>Confirm Format</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteAccOpen} onOpenChange={setIsDeleteAccOpen}>
        <DialogContent className="rounded-[2.5rem] sm:max-w-[450px]">
          <DialogHeader>
            <div className="mx-auto bg-red-100 p-4 rounded-full w-fit mb-4"><ShieldAlert className="w-10 h-10 text-red-600" /></div>
            <DialogTitle className="text-center text-2xl font-black text-primary uppercase">Security Verification</DialogTitle>
            <DialogDescription className="text-center font-medium text-sm">
              Sir, to permanently delete your account, please enter your original **Activation Code** received from the developer.
            </DialogDescription>
          </DialogHeader>
          <div className="py-6 space-y-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Your Activation Code</Label>
              <Input 
                placeholder="XXXXXX" 
                value={deleteCodeInput} 
                onChange={e => setDeleteCodeInput(e.target.value)} 
                className="h-16 text-3xl font-black text-center bg-red-50 border-red-100 rounded-2xl tracking-[5px] text-red-700" 
              />
            </div>
            <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 flex items-start gap-3">
              <Clock className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
              <p className="text-[10px] text-amber-800 leading-relaxed font-bold">
                NOTE: You will have **3 days** before the data is permanently wiped. Contact developer if you wish to cancel during this time.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="destructive" 
              className="w-full h-16 rounded-2xl font-black uppercase text-lg shadow-xl transition-all active:scale-95" 
              onClick={handleDeleteAccountRequest} 
              disabled={isDeleting || !deleteCodeInput}
            >
              {isDeleting ? <Loader2 className="w-6 h-6 animate-spin" /> : "Request Permanent Deletion"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
