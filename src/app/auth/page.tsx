
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
import { Store, LogIn, LogOut, ShieldCheck, Loader2, UserPlus } from 'lucide-react';
import { doc, setDoc } from 'firebase/firestore';
import { sendWelcomeEmail } from '@/actions/send-welcome-email';

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    
    setLoading(true);
    try {
      if (isRegistering) {
        // Registration Flow
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        
        // Initialize User Profile in Firestore
        if (db && userCredential.user) {
          await setDoc(doc(db, 'users', userCredential.user.uid), {
            id: userCredential.user.uid,
            email: email,
            role: 'owner',
            createdAt: new Date().toISOString()
          });
        }
        
        // Send Official Welcome Email (Non-blocking background call)
        sendWelcomeEmail(email).catch(err => console.error("Welcome email failed", err));
        
        toast({ 
          title: "Account Created!", 
          description: "Welcome to SpecsBiz! Your secure cloud space is now active." 
        });
      } else {
        // Login Flow
        await signInWithEmailAndPassword(auth, email, password);
        toast({ 
          title: "Welcome back", 
          description: "Successfully connected to your business cloud." 
        });
      }
      router.push('/');
    } catch (error: any) {
      console.error("Auth Error:", error.code);
      
      let errorMsg = "Authentication failed. Please check your internet.";
      
      if (error.code === 'auth/user-not-found') errorMsg = "Account not found. Please register first.";
      else if (error.code === 'auth/wrong-password') errorMsg = "Incorrect password. Please try again.";
      else if (error.code === 'auth/email-already-in-use') errorMsg = "This email is already registered. Please log in.";
      else if (error.code === 'auth/invalid-email') errorMsg = "Please enter a valid email address.";
      else if (error.code === 'auth/weak-password') errorMsg = "Password should be at least 6 characters.";
      else if (error.code === 'auth/invalid-credential') errorMsg = "Invalid credentials. Check email and password.";

      toast({ 
        variant: "destructive", 
        title: isRegistering ? "Registration Failed" : "Access Denied", 
        description: errorMsg 
      });
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
          <form onSubmit={handleSubmit} className="space-y-6">
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
                isRegistering ? <UserPlus className="w-6 h-6" /> : <LogIn className="w-6 h-6" />
              )}
              {loading ? "Processing..." : (isRegistering ? "Create Account" : "Connect to Cloud")}
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
