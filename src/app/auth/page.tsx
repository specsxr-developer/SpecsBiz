
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut 
} from 'firebase/auth';
import { useUser, useFirestore } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Store, LogIn, LogOut, ShieldCheck, Loader2, UserPlus, MailCheck, ChevronLeft } from 'lucide-react';
import { doc, setDoc } from 'firebase/firestore';
import { sendWelcomeEmail } from '@/actions/send-welcome-email';
import { sendVerificationCode } from '@/actions/send-verification-code';

export default function AuthPage() {
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();
  const router = useRouter();
  const auth = getAuth();
  const db = useFirestore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Verification States
  const [step, setStep] = useState<'auth' | 'verify'>('auth');
  const [generatedCode, setGeneratedCode] = useState('');
  const [enteredCode, setEnteredCode] = useState('');

  const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const handleInitialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    
    setLoading(true);
    try {
      if (isRegistering) {
        // Step 1: Send OTP instead of creating account
        const otp = generateOTP();
        setGeneratedCode(otp);
        
        const res = await sendVerificationCode(email, otp);
        if (res.success) {
          setStep('verify');
          toast({ 
            title: "Verification Sent!", 
            description: `We've sent a 6-digit code to ${email}` 
          });
        } else {
          throw new Error(res.error || "Failed to send code.");
        }
      } else {
        // Standard Login
        await signInWithEmailAndPassword(auth, email, password);
        toast({ 
          title: "Welcome back", 
          description: "Successfully connected to your business cloud." 
        });
        router.push('/');
      }
    } catch (error: any) {
      console.error("Auth Error:", error.code);
      let errorMsg = error.message || "Authentication failed. Please check your internet.";
      if (error.code === 'auth/user-not-found') errorMsg = "Account not found. Please register first.";
      else if (error.code === 'auth/wrong-password') errorMsg = "Incorrect password. Please try again.";
      
      toast({ 
        variant: "destructive", 
        title: "Error", 
        description: errorMsg 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (enteredCode !== generatedCode) {
      toast({ variant: "destructive", title: "Invalid Code", description: "The code you entered is incorrect." });
      return;
    }

    setLoading(true);
    try {
      // Step 2: Final Account Creation
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      if (db && userCredential.user) {
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          id: userCredential.user.uid,
          email: email,
          role: 'owner',
          createdAt: new Date().toISOString()
        });
      }
      
      // Welcome Email in background
      sendWelcomeEmail(email).catch(err => console.error("Welcome email failed", err));
      
      toast({ 
        title: "Account Verified!", 
        description: "Welcome to SpecsBiz! Your cloud space is now active." 
      });
      router.push('/');
    } catch (error: any) {
      toast({ variant: "destructive", title: "Registration Failed", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    toast({ title: "Logged Out", description: "You are now in local-only mode." });
  };

  if (isUserLoading) return (
    <div className="flex h-screen items-center justify-center gap-2 text-primary font-medium bg-background">
      <Loader2 className="w-8 h-8 animate-spin text-accent" />
      <span className="text-sm font-black uppercase tracking-widest opacity-50">Syncing Brain...</span>
    </div>
  );

  if (user) {
    return (
      <div className="flex h-[80vh] items-center justify-center p-6">
        <Card className="w-full max-w-md text-center shadow-2xl border-accent/20 rounded-[2.5rem] overflow-hidden bg-white">
          <CardHeader className="bg-accent/5 pb-8">
            <div className="mx-auto bg-green-100 p-5 rounded-full w-fit mb-4 shadow-inner">
              <ShieldCheck className="w-12 h-12 text-green-600" />
            </div>
            <CardTitle className="text-3xl font-black text-primary uppercase tracking-tighter">Cloud Active</CardTitle>
            <CardDescription className="font-bold text-accent text-xs mt-1">{user.email}</CardDescription>
          </CardHeader>
          <CardContent className="p-8 space-y-4">
            <p className="text-sm font-medium text-muted-foreground bg-muted/30 p-6 rounded-2xl leading-relaxed">
              Your business data is safely synchronized. Any changes you make will be updated across all devices logged into this account.
            </p>
          </CardContent>
          <CardFooter className="p-8 pt-0">
            <Button variant="outline" className="w-full h-14 gap-2 border-destructive text-destructive hover:bg-destructive/5 rounded-2xl font-black uppercase" onClick={handleLogout}>
              <LogOut className="w-5 h-5" /> Disconnect Cloud
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // --- Step 2: Verification UI ---
  if (step === 'verify') {
    return (
      <div className="flex h-[90vh] items-center justify-center p-6 animate-in slide-in-from-right duration-500">
        <Card className="w-full max-w-md shadow-2xl border-accent/10 rounded-[3rem] overflow-hidden bg-white">
          <CardHeader className="text-center p-8 bg-accent/5">
            <div className="mx-auto bg-primary p-5 rounded-[1.5rem] w-fit mb-2 shadow-xl">
              <MailCheck className="w-10 h-10 text-white" />
            </div>
            <CardTitle className="text-3xl font-black text-primary uppercase tracking-tighter">Verify Email</CardTitle>
            <CardDescription className="text-[10px] font-bold uppercase tracking-widest opacity-60">Enter the 6-digit code sent to your mail</CardDescription>
          </CardHeader>
          
          <CardContent className="p-8">
            <form onSubmit={handleVerifyAndCreate} className="space-y-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase ml-1 opacity-60">Verification Code</Label>
                <Input 
                  placeholder="000000"
                  maxLength={6}
                  value={enteredCode}
                  onChange={e => setEnteredCode(e.target.value)}
                  required
                  className="h-16 rounded-2xl bg-muted/20 border-none text-4xl text-center font-black tracking-[10px] focus:ring-2 focus:ring-accent"
                />
              </div>
              
              <Button className="w-full bg-accent hover:bg-accent/90 h-16 text-lg font-black uppercase shadow-2xl transition-all active:scale-95 rounded-2xl" disabled={loading}>
                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : "Verify & Activate Account"}
              </Button>
            </form>

            <button 
              onClick={() => { setStep('auth'); setEnteredCode(''); }}
              className="mt-6 flex items-center justify-center gap-2 w-full text-xs font-black text-muted-foreground uppercase tracking-widest hover:text-primary transition-all"
            >
              <ChevronLeft className="w-4 h-4" /> Change Email
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // --- Step 1: Initial Auth UI ---
  return (
    <div className="flex h-[90vh] items-center justify-center p-6 animate-in fade-in duration-700">
      <Card className="w-full max-w-md shadow-[0_30px_80px_rgba(0,0,0,0.1)] border-accent/10 rounded-[3rem] overflow-hidden bg-white">
        <CardHeader className="text-center space-y-2 p-8 bg-accent/5">
          <div className="mx-auto bg-accent p-5 rounded-[1.5rem] w-fit mb-2 shadow-xl shadow-accent/20">
            <Store className="w-10 h-10 text-white" />
          </div>
          <CardTitle className="text-4xl font-black text-primary uppercase tracking-tighter">SpecsBiz Cloud</CardTitle>
          <CardDescription className="text-xs font-bold uppercase tracking-widest opacity-60">
            {isRegistering ? 'Create your business account' : 'Access your business cloud'}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="p-8">
          <form onSubmit={handleInitialSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[10px] font-black uppercase ml-1 opacity-60">Email Address</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="owner@yourshop.com" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="h-14 rounded-2xl bg-muted/20 border-none focus:ring-2 focus:ring-accent font-bold"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" title="At least 6 characters" className="text-[10px] font-black uppercase ml-1 opacity-60">Secure Password</Label>
              <Input 
                id="password" 
                type="password" 
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="h-14 rounded-2xl bg-muted/20 border-none focus:ring-2 focus:ring-accent font-bold"
              />
            </div>
            
            <Button className="w-full bg-accent hover:bg-accent/90 gap-2 h-16 text-lg font-black uppercase shadow-2xl transition-all active:scale-95 rounded-2xl" disabled={loading}>
              {loading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                isRegistering ? <MailCheck className="w-6 h-6" /> : <LogIn className="w-6 h-6" />
              )}
              {loading ? "Processing..." : (isRegistering ? "Get Verification Code" : "Connect to Cloud")}
            </Button>
          </form>

          <div className="mt-8 text-center">
            <button 
              type="button"
              onClick={() => setIsRegistering(!isRegistering)}
              className="text-xs font-black text-accent uppercase tracking-widest hover:underline transition-all"
            >
              {isRegistering ? "Already have an account? Login" : "Don't have an account? Register Now"}
            </button>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-4 border-t border-black/5 p-8 bg-muted/5">
          <p className="text-[10px] text-center text-muted-foreground leading-relaxed font-bold uppercase opacity-40">
            By connecting, your business data will be synced securely across all your devices.
          </p>
          <Button variant="ghost" className="w-full h-10 text-xs font-black uppercase tracking-widest text-muted-foreground hover:bg-black/5" onClick={() => router.push('/')}>
            Use Offline Mode
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
