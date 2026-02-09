
'use client';

import { useState } from "react";
import { 
  Settings, 
  Coins, 
  Shield, 
  Database,
  Trash2,
  Lock,
  AlertTriangle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
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

const CURRENCIES = [
  { label: 'Taka (৳)', value: '৳' },
  { label: 'Dollar ($)', value: '$' },
  { label: 'Euro (€)', value: '€' },
  { label: 'Pound (£)', value: '£' },
  { label: 'Rupee (₹)', value: '₹' },
  { label: 'Riyal (SAR)', value: 'SAR ' },
];

export default function SettingsPage() {
  const { currency, actions } = useBusinessData();
  const { toast } = useToast();
  
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const handleCurrencyChange = (val: string) => {
    actions.setCurrency(val);
    toast({
      title: "Settings Updated",
      description: `Default currency changed to ${val}`,
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

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500 pb-20 relative">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-accent/10 rounded-xl">
          <Settings className="w-6 h-6 text-accent" />
        </div>
        <div>
          <h2 className="text-2xl font-bold font-headline text-primary">System Settings</h2>
          <p className="text-sm text-muted-foreground">Configure your business preferences.</p>
        </div>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Coins className="w-5 h-5 text-accent" />
              <CardTitle>Regional & Currency</CardTitle>
            </div>
            <CardDescription>Select the currency symbol used throughout the app.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border rounded-xl bg-muted/5">
              <div className="space-y-0.5">
                <Label className="text-base font-bold">Base Currency</Label>
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

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-accent" />
              <CardTitle>Data Management</CardTitle>
            </div>
            <CardDescription>Manage your offline storage and sync preferences.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 border rounded-xl flex items-center justify-between opacity-50 cursor-not-allowed">
              <div className="space-y-0.5">
                <Label className="font-bold">Auto Backup</Label>
                <p className="text-xs text-muted-foreground">Automatically backup local data to cloud.</p>
              </div>
              <div className="h-6 w-10 bg-muted rounded-full relative">
                <div className="absolute left-1 top-1 h-4 w-4 bg-white rounded-full" />
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground italic">Note: These advanced data features are currently managed by the Cloud Sync system.</p>
          </CardContent>
        </Card>

        <Card className="border-destructive/20 bg-destructive/5">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-destructive" />
              <CardTitle className="text-destructive">Privacy & Security</CardTitle>
            </div>
            <CardDescription>Manage access keys and account visibility.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm">Your secret access key is currently active. Change your password in the Cloud Sync portal if you need to revoke access.</p>
          </CardContent>
        </Card>
      </div>

      {/* Small Secret Reset Button */}
      <div className="mt-12 pt-8 border-t flex justify-center">
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-[10px] text-muted-foreground hover:text-destructive opacity-30 hover:opacity-100 transition-opacity"
          onClick={() => setIsResetOpen(true)}
        >
          <Trash2 className="w-3 h-3 mr-1" /> Secret Wipe
        </Button>
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
    </div>
  );
}
