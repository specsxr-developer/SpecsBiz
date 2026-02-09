
'use client';

import { useState, useEffect } from "react";
import { 
  Settings, 
  Coins, 
  Shield, 
  Database,
  Trash2,
  Lock,
  AlertTriangle,
  Languages,
  FileText,
  Download,
  Calendar,
  CheckCircle2,
  Users,
  Package,
  ShoppingCart
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
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { cn } from "@/lib/utils";

const CURRENCIES = [
  { label: 'Taka (৳)', value: '৳' },
  { label: 'Dollar ($)', value: '$' },
  { label: 'Euro (€)', value: '€' },
  { label: 'Pound (£)', value: '£' },
  { label: 'Rupee (₹)', value: '₹' },
  { label: 'Riyal (SAR)', value: 'SAR ' },
];

const LANGUAGES = [
  { label: 'বাংলা (Bengali)', value: 'bn' },
  { label: 'English', value: 'en' },
];

export default function SettingsPage() {
  const { products, sales, customers, currency, language, actions } = useBusinessData();
  const { toast } = useToast();
  const t = translations[language];
  
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [exportDate, setExportDate] = useState("");

  useEffect(() => {
    setExportDate(new Date().toLocaleString());
  }, []);

  const handleCurrencyChange = (val: string) => {
    actions.setCurrency(val);
    toast({
      title: language === 'en' ? "Settings Updated" : "সেটিংস আপডেট হয়েছে",
      description: (language === 'en' ? "Currency changed to " : "কারেন্সি পরিবর্তন হয়েছে: ") + val,
    });
  };

  const handleLanguageChange = (val: 'en' | 'bn') => {
    actions.setLanguage(val);
    toast({
      title: val === 'en' ? "Language Changed" : "ভাষা পরিবর্তন করা হয়েছে",
      description: val === 'en' ? "System language is now English" : "সিস্টেমের ভাষা এখন বাংলা",
    });
  };

  const handleReset = async () => {
    if (password === "specsxr") {
      setIsDeleting(true);
      try {
        await actions.resetAllData();
        toast({ title: "System Reset", description: "All data has been permanently deleted." });
      } catch (e) {
        toast({ title: "Reset Failed", variant: "destructive" });
        setIsDeleting(false);
      }
    } else {
      toast({ title: "Wrong Password", description: "Access denied.", variant: "destructive" });
      setPassword("");
    }
  };

  const handleMasterPrint = () => {
    toast({ title: "Generating Master Report", description: "Preparing PDF layout..." });
    setTimeout(() => {
      window.print();
    }, 1000);
  };

  const logoUrl = PlaceHolderImages.find(img => img.id === 'app-logo')?.imageUrl;

  // Calculate Master Totals
  const totalStockValue = products.reduce((acc, p) => acc + (p.sellingPrice * p.stock), 0);
  const totalRevenue = sales.reduce((acc, s) => acc + (s.total || 0), 0);
  const totalBaki = customers.reduce((acc, c) => acc + (c.totalDue || 0), 0);

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500 pb-20 relative">
      
      {/* MASTER PRINT TEMPLATE (Hidden from UI, visible only on print) */}
      <div className="hidden print:block space-y-8 w-full p-4">
        <div className="flex flex-col items-center text-center border-b-2 border-primary pb-6">
          {logoUrl && <img src={logoUrl} alt="Logo" className="h-20 w-20 mb-2" />}
          <h1 className="text-4xl font-black text-primary uppercase">SpecsBiz - Master Audit Report</h1>
          <p className="text-sm font-bold opacity-60 mt-1">Exported on: {exportDate}</p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 border-2 border-primary rounded-xl text-center">
            <p className="text-[10px] font-bold uppercase opacity-60">Total Stock Value</p>
            <p className="text-2xl font-black">{currency}{totalStockValue.toLocaleString()}</p>
          </div>
          <div className="p-4 border-2 border-primary rounded-xl text-center bg-primary/5">
            <p className="text-[10px] font-bold uppercase opacity-60">Total Revenue (All Time)</p>
            <p className="text-2xl font-black">{currency}{totalRevenue.toLocaleString()}</p>
          </div>
          <div className="p-4 border-2 border-destructive rounded-xl text-center">
            <p className="text-[10px] font-bold uppercase opacity-60 text-destructive">Market Dues (Baki)</p>
            <p className="text-2xl font-black text-destructive">{currency}{totalBaki.toLocaleString()}</p>
          </div>
        </div>

        {/* Inventory Section */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold border-l-4 border-primary pl-3 flex items-center gap-2">
            <Package className="w-5 h-5" /> Detailed Inventory List ({products.length} Items)
          </h2>
          <table className="w-full border-collapse">
            <thead className="bg-primary/10">
              <tr>
                <th className="border p-2 text-left text-xs uppercase">Product Name</th>
                <th className="border p-2 text-left text-xs uppercase">Category</th>
                <th className="border p-2 text-right text-xs uppercase">Buy Price</th>
                <th className="border p-2 text-right text-xs uppercase">Sell Price</th>
                <th className="border p-2 text-center text-xs uppercase">Stock</th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => (
                <tr key={p.id}>
                  <td className="border p-2 text-sm font-bold">{p.name}</td>
                  <td className="border p-2 text-xs">{p.category}</td>
                  <td className="border p-2 text-right text-xs">{currency}{p.purchasePrice}</td>
                  <td className="border p-2 text-right text-xs">{currency}{p.sellingPrice}</td>
                  <td className={cn("border p-2 text-center text-xs font-bold", p.stock < 5 && "text-destructive")}>{p.stock} {p.unit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Sales Section */}
        <div className="space-y-4 break-before-page">
          <h2 className="text-xl font-bold border-l-4 border-primary pl-3 flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" /> Sales History (Latest Records)
          </h2>
          <table className="w-full border-collapse">
            <thead className="bg-primary/10">
              <tr>
                <th className="border p-2 text-left text-xs uppercase">Date</th>
                <th className="border p-2 text-left text-xs uppercase">Items/Description</th>
                <th className="border p-2 text-right text-xs uppercase">Total</th>
                <th className="border p-2 text-right text-xs uppercase">Profit</th>
              </tr>
            </thead>
            <tbody>
              {sales.slice(0, 50).map(s => (
                <tr key={s.id}>
                  <td className="border p-2 text-xs">{new Date(s.saleDate).toLocaleDateString()}</td>
                  <td className="border p-2 text-xs font-medium">
                    {s.isBakiPayment ? `Baki Payment: ${s.bakiProductName}` : s.items?.map((i: any) => i.name).join(', ')}
                  </td>
                  <td className="border p-2 text-right text-sm font-black">{currency}{s.total?.toLocaleString()}</td>
                  <td className="border p-2 text-right text-xs text-green-600 font-bold">{currency}{s.profit?.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Customers Section */}
        <div className="space-y-4 break-before-page">
          <h2 className="text-xl font-bold border-l-4 border-destructive pl-3 flex items-center gap-2 text-destructive">
            <Users className="w-5 h-5" /> Active Debtors (Baki List)
          </h2>
          <table className="w-full border-collapse">
            <thead className="bg-destructive/10">
              <tr>
                <th className="border p-2 text-left text-xs uppercase">Customer Name</th>
                <th className="border p-2 text-left text-xs uppercase">Phone</th>
                <th className="border p-2 text-right text-xs uppercase">Total Owed</th>
              </tr>
            </thead>
            <tbody>
              {customers.filter(c => c.totalDue > 0).map(c => (
                <tr key={c.id}>
                  <td className="border p-2 text-sm font-bold">{c.firstName} {c.lastName}</td>
                  <td className="border p-2 text-xs">{c.phone}</td>
                  <td className="border p-2 text-right text-sm font-black text-destructive">{currency}{c.totalDue?.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-12 text-center text-[10px] text-muted-foreground border-t pt-4 italic">
          This document is an official data export from SpecsBiz Intelligence Engine. 
          Total database items analyzed: {products.length + sales.length + customers.length} entries.
        </div>
      </div>

      {/* REGULAR UI */}
      <div className="flex items-center gap-3 print:hidden">
        <div className="p-2 bg-accent/10 rounded-xl">
          <Settings className="w-6 h-6 text-accent" />
        </div>
        <div>
          <h2 className="text-2xl font-bold font-headline text-primary">{t.systemSettings}</h2>
          <p className="text-sm text-muted-foreground">{t.configurePrefs}</p>
        </div>
      </div>

      <div className="grid gap-6 print:hidden">
        
        {/* Full Data Export Card */}
        <Card className="border-accent/20 shadow-lg bg-white overflow-hidden">
          <div className="bg-accent/5 p-4 border-b border-accent/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-accent text-white p-2 rounded-lg">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-lg">Full Data Export (A to Z)</CardTitle>
                <CardDescription>Generate a complete business audit PDF report.</CardDescription>
              </div>
            </div>
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Live Data Sync</Badge>
          </div>
          <CardContent className="p-6 space-y-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              আপনার ব্যবসার ইনভেন্টরি, সেলস এবং কাস্টমারদের যাবতীয় ডাটা একটি প্রফেশনাল পিডিএফ ফরম্যাটে ডাউনলোড করুন। এটি আপনার অডিট এবং ব্যাকআপের জন্য সাহায্য করবে।
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-2">
               <div className="flex items-center gap-2 text-xs font-bold bg-muted/30 p-2 rounded-lg">
                 <Package className="w-4 h-4 text-accent" /> {products.length} Products
               </div>
               <div className="flex items-center gap-2 text-xs font-bold bg-muted/30 p-2 rounded-lg">
                 <ShoppingCart className="w-4 h-4 text-accent" /> {sales.length} Sales
               </div>
               <div className="flex items-center gap-2 text-xs font-bold bg-muted/30 p-2 rounded-lg">
                 <Users className="w-4 h-4 text-accent" /> {customers.length} Customers
               </div>
            </div>
            <Button 
              className="w-full bg-accent hover:bg-accent/90 h-14 text-lg font-bold gap-2 shadow-xl shadow-accent/20"
              onClick={handleMasterPrint}
            >
              <Download className="w-5 h-5" /> Download Master Audit PDF
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Languages className="w-5 h-5 text-accent" />
              <CardTitle>{t.language}</CardTitle>
            </div>
            <CardDescription>Select your preferred system language.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border rounded-xl bg-muted/5">
              <div className="space-y-0.5">
                <Label className="text-base font-bold">{t.language}</Label>
                <p className="text-xs text-muted-foreground">Switch between English and Bengali.</p>
              </div>
              <Select value={language} onValueChange={handleLanguageChange}>
                <SelectTrigger className="w-full sm:w-[180px] h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((l) => (
                    <SelectItem key={l.value} value={l.value}>
                      {l.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Coins className="w-5 h-5 text-accent" />
              <CardTitle>{t.baseCurrency}</CardTitle>
            </div>
            <CardDescription>Select the currency symbol used throughout the app.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border rounded-xl bg-muted/5">
              <div className="space-y-0.5">
                <Label className="text-base font-bold">{t.baseCurrency}</Label>
                <p className="text-xs text-muted-foreground">This will be shown on all bills and reports.</p>
              </div>
              <Select value={currency} onValueChange={handleCurrencyChange}>
                <SelectTrigger className="w-full sm:w-[180px] h-11">
                  <SelectValue placeholder="Select Currency" />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-500/50 bg-red-50/50 mt-8 shadow-inner">
          <CardHeader>
            <div className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              <CardTitle>{t.dangerZone}</CardTitle>
            </div>
            <CardDescription className="text-red-600/70">
              Critical actions that will permanently affect your business data.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border border-red-200/50 rounded-lg bg-white/50">
            <div className="space-y-1">
              <p className="text-sm font-bold text-red-700">{t.resetSystem}</p>
              <p className="text-xs text-muted-foreground">
                Everything including Inventory, Sales, and Customers will be deleted.
              </p>
            </div>
            <Button 
              variant="destructive" 
              size="sm" 
              className="h-9 px-4 font-bold shrink-0"
              onClick={() => setIsResetOpen(true)}
            >
              <Trash2 className="w-4 h-4 mr-1" /> {t.resetSystem}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isResetOpen} onOpenChange={setIsResetOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" /> Permanent Wipe
            </DialogTitle>
            <DialogDescription>
              This action will permanently delete ALL inventory, sales, and customer data from this device and the cloud.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase flex items-center gap-1">
                <Lock className="w-3 h-3" /> Master Reset Password
              </Label>
              <Input 
                type="password" 
                placeholder="Enter secret password..." 
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="h-11"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="destructive" 
              className="w-full h-12 font-bold" 
              onClick={handleReset}
              disabled={isDeleting || !password}
            >
              {isDeleting ? "Wiping Data..." : "Confirm Full Reset"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <style jsx global>{`
        @media print {
          .print\\:hidden, nav, header, footer, button, .fixed { display: none !important; }
          body { background: white !important; padding: 0 !important; margin: 0 !important; }
          main { padding: 0 !important; margin: 0 !important; width: 100% !important; max-width: 100% !important; }
          .rounded-lg, .rounded-xl { border-radius: 0 !important; }
          .shadow-lg, .shadow-xl, .shadow-sm { box-shadow: none !important; }
          table { width: 100% !important; border-collapse: collapse !important; border: 1px solid #000 !important; }
          th, td { border: 1px solid #000 !important; padding: 8px !important; color: black !important; }
          .text-primary { color: #191970 !important; }
          .text-destructive { color: #cc0000 !important; }
          .break-before-page { break-before: page; }
        }
      `}</style>
    </div>
  );
}
