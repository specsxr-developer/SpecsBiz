
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail
} from 'firebase/auth';
import { useUser, useFirestore } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Store, LogIn, LogOut, ShieldCheck, Loader2, MailCheck, ChevronLeft, KeyRound, AlertCircle, HelpCircle } from 'lucide-react';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { sendWelcomeEmail } from '@/actions/send-welcome-email';
import { sendVerificationCode } from '@/actions/send-verification-code';
import { cn } from '@/lib/utils';

export default function AuthPage() {
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();
  const router = useRouter();
  const auth = getAuth();
  const db = useFirestore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [step, setStep] = useState<'auth' | 'verify'>('auth');
  const [generatedOTP, setGeneratedOTP] = useState('');
  const [enteredOTP, setEnteredOTP] = useState('');

  const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const handleInitialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    
    setLoading(true);
    try {
      if (isRegistering) {
        if (!accessCode) {
          throw new Error("দয়া করে ডেভলপার থেকে পাওয়া এক্সেস কোডটি দিন।");
        }

        const codeRef = doc(db, 'registrationCodes', accessCode.trim().toUpperCase());
        const codeSnap = await getDoc(codeRef);

        if (!codeSnap.exists()) {
          throw new Error("ভুল এক্সেস কোড! সঠিক কোডটি দিন।");
        }

        const codeData = codeSnap.data();
        if (codeData.isUsed) {
          throw new Error("এই কোডটি ইতিমধ্যে অন্য কেউ ব্যবহার করেছে।");
        }

        const otp = generateOTP();
        setGeneratedOTP(otp);
        
        const res = await sendVerificationCode(email, otp);
        if (res.success) {
          setStep('verify');
          toast({ 
            title: "Verification Sent!", 
            description: `A code has been sent to ${email}` 
          });
        } else {
          throw new Error(res.error || "OTP পাঠাতে ব্যর্থ হয়েছে।");
        }
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        toast({ title: "Welcome back", description: "Cloud sync active." });
        router.push('/');
      }
    } catch (error: any) {
      let message = error.message;
      if (error.code === 'auth/invalid-credential') {
        message = "ভুল ইমেইল অথবা পাসওয়ার্ড! দয়া করে সঠিক তথ্য দিন।";
      } else if (error.code === 'auth/user-not-found') {
        message = "এই ইমেইলে কোনো একাউন্ট পাওয়া যায়নি।";
      } else if (error.code === 'auth/wrong-password') {
        message = "ভুল পাসওয়ার্ড! আবার চেষ্টা করুন।";
      }
      
      toast({ 
        variant: "destructive", 
        title: "Authentication Error", 
        description: message 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast({ variant: "destructive", title: "Email Required", description: "পাসওয়ার্ড রিসেট করতে আগে আপনার ইমেইলটি লিখুন।" });
      return;
    }
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      toast({ title: "Reset Email Sent!", description: "আপনার ইমেইল চেক করুন, পাসওয়ার্ড রিসেট করার লিঙ্ক পাঠানো হয়েছে।" });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: "পাসওয়ার্ড রিসেট লিঙ্ক পাঠানো সম্ভব হয়নি।" });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (enteredOTP !== generatedOTP) {
      toast({ variant: "destructive", title: "Invalid Code", description: "The OTP you entered is incorrect." });
      return;
    }

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;
      const cleanCode = accessCode.trim().toUpperCase();
      
      if (db) {
        await setDoc(doc(db, 'users', uid), {
          id: uid,
          email: email,
          username: email.split('@')[0],
          role: 'owner',
          usedCode: cleanCode,
          createdAt: new Date().toISOString()
        });

        await updateDoc(doc(db, 'registrationCodes', cleanCode), {
          isUsed: true,
          userId: uid,
          userEmail: email,
          status: 'active',
          usedAt: serverTimestamp()
        });
      }
      
      sendWelcomeEmail(email).catch(err => console.error("Welcome email failed", err));
      
      toast({ title: "Account Verified!", description: "Welcome to SpecsBiz Cloud." });
      router.push('/');
    } catch (error: any) {
      toast({ variant: "destructive", title: "Registration Failed", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  if (isUserLoading) return (
    <div className="flex h-screen items-center justify-center bg-[#191970]">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-12 h-12 animate-spin text-accent" />
        <span className="text-xs font-black text-white uppercase tracking-[0.3em] opacity-50">Syncing Master Brain...</span>
      </div>
    </div>
  );

  if (user) {
    return (
      <div className="flex h-screen items-center justify-center p-6 bg-background">
        <Card className="w-full max-w-md shadow-2xl border-accent/20 rounded-[2.5rem] overflow-hidden bg-white">
          <CardHeader className="bg-accent/5 pb-8">
            <div className="mx-auto bg-green-100 p-5 rounded-full w-fit mb-4"><ShieldCheck className="w-12 h-12 text-green-600" /></div>
            <CardTitle className="text-3xl font-black text-primary text-center">Cloud Active</CardTitle>
            <CardDescription className="text-center font-bold text-accent text-xs">{user.email}</CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <p className="text-sm font-medium text-muted-foreground bg-muted/30 p-6 rounded-2xl leading-relaxed text-center">
              আপনার সব ডাটা এখন সুরক্ষিতভাবে ক্লাউড সার্ভারে সিঙ্ক হচ্ছে। আপনি যেকোনো ডিভাইস থেকে লগইন করে কাজ করতে পারবেন।
            </p>
          </CardContent>
          <CardFooter className="p-8 pt-0">
            <Button variant="outline" className="w-full h-14 gap-2 border-destructive text-destructive hover:bg-destructive/5 rounded-2xl font-black uppercase" onClick={() => signOut(auth)}>
              <LogOut className="w-5 h-5" /> Disconnect Cloud
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (step === 'verify') {
    return (
      <div className="flex h-screen items-center justify-center p-6 bg-[#191970] animate-in slide-in-from-right duration-500">
        <Card className="w-full max-w-md shadow-2xl border-white/10 rounded-[3rem] overflow-hidden bg-white">
          <CardHeader className="text-center p-8 bg-accent/5">
            <div className="mx-auto bg-primary p-5 rounded-3xl w-fit mb-2"><MailCheck className="w-10 h-10 text-white" /></div>
            <CardTitle className="text-3xl font-black text-primary uppercase">Verify Mail</CardTitle>
            <CardDescription className="text-[10px] font-bold uppercase opacity-60">Enter the 6-digit code sent to your inbox</CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <form onSubmit={handleVerifyAndCreate} className="space-y-6">
              <Input 
                placeholder="000000"
                maxLength={6}
                value={enteredOTP}
                onChange={e => setEnteredOTP(e.target.value)}
                required
                className="h-16 rounded-2xl bg-muted/20 border-none text-4xl text-center font-black tracking-[10px] focus:ring-2 focus:ring-accent"
              />
              <Button className="w-full bg-accent hover:bg-accent/90 h-16 text-lg font-black uppercase rounded-2xl shadow-xl" disabled={loading}>
                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : "Verify & Activate"}
              </Button>
            </form>
            <button onClick={() => setStep('auth')} className="mt-6 w-full text-xs font-black text-muted-foreground hover:text-primary transition-all flex items-center justify-center gap-2 uppercase tracking-widest">
              <ChevronLeft className="w-4 h-4" /> Go Back
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex h-screen items-center justify-center p-6 bg-[#191970] animate-in fade-in duration-700">
      <Card className="w-full max-w-md shadow-[0_30px_80px_rgba(0,0,0,0.3)] border-white/10 rounded-[3rem] overflow-hidden bg-white">
        <CardHeader className="text-center p-8 bg-accent/5">
          <div className="mx-auto bg-accent p-5 rounded-[1.5rem] w-fit mb-2 shadow-xl shadow-accent/20"><Store className="w-10 h-10 text-white" /></div>
          <CardTitle className="text-4xl font-black text-primary uppercase tracking-tighter">SpecsBiz Cloud</CardTitle>
          <CardDescription className="text-xs font-bold uppercase tracking-widest opacity-60">
            {isRegistering ? 'Master Access Required' : 'Access your business space'}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="p-8">
          <form onSubmit={handleInitialSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase ml-1 opacity-60">Email Address</Label>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="h-14 rounded-2xl bg-muted/20 border-none font-bold" />
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between items-center px-1">
                <Label className="text-[10px] font-black uppercase opacity-60">Password</Label>
                {!isRegistering && (
                  <button 
                    type="button" 
                    onClick={handleForgotPassword}
                    className="text-[9px] font-black text-accent uppercase hover:underline"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <Input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="h-14 rounded-2xl bg-muted/20 border-none font-bold" />
            </div>

            {isRegistering && (
              <div className="space-y-1.5 animate-in slide-in-from-top-2">
                <Label className="text-[10px] font-black uppercase ml-1 text-accent flex items-center gap-1.5">
                  <KeyRound className="w-3 h-3" /> Secret Access Code
                </Label>
                <Input 
                  placeholder="Enter Code from Developer" 
                  value={accessCode} 
                  onChange={e => setAccessCode(e.target.value)} 
                  required 
                  className="h-14 rounded-2xl bg-accent/5 border-2 border-accent/20 text-accent font-black uppercase tracking-widest focus:ring-accent"
                />
                <p className="text-[9px] font-bold text-muted-foreground italic px-1">রেজিস্ট্রেশন করতে ডেভলপার থেকে দেওয়া সিক্রেট কোডটি প্রয়োজন।</p>
              </div>
            )}
            
            <Button className={cn("w-full h-16 text-lg font-black uppercase rounded-2xl shadow-xl transition-all active:scale-95", isRegistering ? "bg-primary" : "bg-accent hover:bg-accent/90")} disabled={loading}>
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (isRegistering ? "Verify Access" : "Connect to Cloud")}
            </Button>
          </form>

          <div className="mt-8 text-center flex flex-col gap-4">
            <button onClick={() => setIsRegistering(!isRegistering)} className="text-xs font-black text-accent uppercase tracking-widest hover:underline">
              {isRegistering ? "Already have an account? Login" : "New User? Register with Secret Code"}
            </button>
          </div>
        </CardContent>

        <CardFooter className="p-8 border-t bg-muted/5">
          <Button variant="ghost" className="w-full h-10 text-xs font-black uppercase text-muted-foreground" onClick={() => router.push('/')}>
            Continue Offline
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
