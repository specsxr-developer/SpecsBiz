
"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import { 
  Send, 
  Loader2, 
  Sparkles, 
  Zap, 
  Trash2, 
  ChevronRight, 
  Target, 
  Cpu,
  X,
  AlertCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useBusinessData } from "@/hooks/use-business-data"
import { growthExpertChat } from "@/ai/flows/growth-expert-flow"
import { useToast } from "@/hooks/use-toast"
import { translations } from "@/lib/translations"
import { useUser, useFirestore, useMemoFirebase, useCollection } from "@/firebase"
import { collection, query, orderBy, addDoc, serverTimestamp, getDocs, writeBatch, limit } from "firebase/firestore"
import { cn } from "@/lib/utils"

export default function SpecsAIAdvisorPage() {
  const { toast } = useToast()
  const { user } = useUser()
  const db = useFirestore()
  const { products, sales, customers, currency, language, aiApiKey, aiModel } = useBusinessData()
  const t = translations[language]
  
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isClearDialogOpen, setIsClearDialogOpen] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Real-time Firestore messages
  const messagesQuery = useMemoFirebase(() => {
    if (!user?.uid || !db) return null;
    return query(collection(db, 'users', user.uid, 'advisorMessages'), orderBy('timestamp', 'asc'), limit(50));
  }, [user?.uid, db]);

  const { data: fbMessages } = useCollection(messagesQuery);

  // Local state for offline mode messages
  const [localMessages, setLocalMessages] = useState<any[]>([])

  // Unified messages
  const messages = useMemo(() => {
    const currentMsgs = user ? (fbMessages || []) : localMessages;
    if (currentMsgs.length === 0) {
      return [{ 
        id: 'welcome', 
        role: "assistant" as const, 
        content: language === 'bn' 
          ? "নমস্কার স্যার! আমি আপনার SpecsAI অ্যাডভাইজর। আমি আপনার দোকানের ইনভেন্টরি, সেলস এবং বাকির প্রতিটি তথ্য স্টাডি করেছি। ব্যবসা বড় করার জন্য কোনো বিশেষ পরামর্শ চান?" 
          : "Greetings Sir! I'm your SpecsAI Advisor. I've analyzed your inventory, sales, and debt records. Ready to discuss growth strategies?" 
      }];
    }
    return currentMsgs;
  }, [fbMessages, localMessages, user, language]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  const saveMsg = async (role: 'user' | 'assistant', content: string) => {
    if (user?.uid && db) {
      await addDoc(collection(db, 'users', user.uid, 'advisorMessages'), {
        role, content, timestamp: serverTimestamp()
      });
    } else {
      const newMsg = { id: Date.now().toString(), role, content, timestamp: new Date() };
      setLocalMessages(prev => [...prev, newMsg]);
    }
  }

  const handleSend = async (txt?: string) => {
    const message = txt || input
    if (!message.trim() || isLoading) return
    
    setInput("")
    setIsLoading(true)

    try {
      await saveMsg('user', message);

      const inventorySummary = products.length > 0
        ? products.map(p => `[Product: ${p.name}, Stock: ${p.stock}${p.unit}, Buy: ${p.purchasePrice}, Sell: ${p.sellingPrice}, Cat: ${p.category}]`).join('\n')
        : "Inventory is empty."

      const salesPerformance = sales.length > 0
        ? sales.slice(0, 20).map(s => `Date: ${new Date(s.saleDate).toLocaleDateString()}, Total: ${s.total}, Profit: ${s.profit}, Type: ${s.isBakiPayment ? 'Baki Payment' : 'Regular Sale'}`).join('\n')
        : "No sales records yet."

      const customersSummary = customers.length > 0
        ? customers.map(c => `Customer: ${c.firstName} ${c.lastName}, Owed: ${currency}${c.totalDue}, Phone: ${c.phone}`).join('\n')
        : "No debtors found."

      const financialSummary = `Total Revenue: ${sales.reduce((acc, s) => acc + (s.total || 0), 0)}, Potential Profit in Warehouse: ${products.reduce((acc, p) => acc + (((p.sellingPrice || 0) - (p.purchasePrice || 0)) * (p.stock || 0)), 0)}`

      const history = messages
        .filter(m => m.id !== 'welcome')
        .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }))
        .slice(-8)

      const result = await growthExpertChat({
        message,
        history,
        context: {
          inventorySummary,
          salesPerformance,
          customersSummary,
          financialSummary,
          currentLanguage: language,
          currency,
          aiApiKey: aiApiKey,
          aiModel: aiModel
        }
      })

      await saveMsg('assistant', result.reply);
    } catch (e) {
      toast({ title: language === 'bn' ? "অ্যাডভাইজর অফলাইন" : "Advisor Offline", variant: "destructive" });
    } finally {
      setIsLoading(false)
    }
  }

  const handleClearConfirm = async () => {
    if (user?.uid && db) {
      setIsLoading(true);
      try {
        const snap = await getDocs(collection(db, 'users', user.uid, 'advisorMessages'));
        const batch = writeBatch(db);
        snap.docs.forEach(d => batch.delete(d.ref));
        await batch.commit();
        toast({ title: language === 'bn' ? "মেমোরি পরিষ্কার করা হয়েছে" : "Memory Wiped" });
      } catch (e) {
        toast({ variant: "destructive", title: "Failed to clear cloud memory" });
      } finally {
        setIsLoading(false);
        setIsClearDialogOpen(false);
      }
    } else {
      setLocalMessages([]);
      toast({ title: language === 'bn' ? "মেমোরি পরিষ্কার করা হয়েছে" : "Memory Wiped" });
      setIsClearDialogOpen(false);
    }
  }

  const openClearDialog = () => {
    if (messages.length <= 1 && messages[0]?.id === 'welcome') {
      toast({ title: language === 'bn' ? "মেমোরি অলরেডি খালি স্যার" : "Memory is already empty, Sir" });
      return;
    }
    setIsClearDialogOpen(true);
  }

  return (
    <div className="flex flex-col gap-4 h-[calc(100vh-140px)] w-full max-w-5xl mx-auto">
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-primary rounded-2xl shadow-lg">
            <Sparkles className="w-6 h-6 text-accent animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-black text-primary uppercase tracking-tighter">SpecsAI Advisor</h2>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-bold text-accent uppercase tracking-[0.3em]">{language === 'bn' ? 'গ্রোথ ও স্ট্র্যাটেজি ইঞ্জিন' : 'Growth & Strategy Engine'}</span>
              {aiModel && <Badge variant="outline" className="text-[8px] h-4 py-0 px-1 border-accent/20 text-accent font-black">{aiModel}</Badge>}
            </div>
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={openClearDialog} 
          className="text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors"
          disabled={isLoading}
        >
          <Trash2 className="w-4 h-4 mr-2" />
          <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">{language === 'bn' ? 'মুছে ফেলুন' : 'Clear'}</span>
        </Button>
      </div>

      {!aiApiKey && (
        <Card className="bg-amber-50 border-amber-200 p-4 rounded-2xl mb-2 animate-in slide-in-from-top-4">
          <div className="flex items-center gap-3">
            <Target className="w-5 h-5 text-amber-600" />
            <div className="flex-1">
              <p className="text-xs font-bold text-amber-800">
                AI Is Inactive! Please go to <span className="underline cursor-pointer font-black" onClick={() => window.location.href='/settings'}>Settings</span> and verify your API Key to unlock the brain.
              </p>
            </div>
          </div>
        </Card>
      )}

      <Card className="flex-1 flex flex-col min-h-0 border-none bg-white shadow-2xl rounded-[3rem] overflow-hidden">
        <CardContent className="flex-1 min-h-0 p-0">
          <ScrollArea className="h-full">
            <div className="p-6 md:p-10 space-y-10">
              {messages.map((m, i) => (
                <div key={m.id || i} className={cn("flex w-full animate-in fade-in slide-in-from-bottom-2 duration-500", m.role === 'user' ? 'justify-end' : 'justify-start')}>
                  <div className={cn(
                    "max-w-[85%] md:max-w-[70%] p-6 rounded-[2rem] shadow-sm transition-all",
                    m.role === 'user' 
                      ? 'bg-primary text-white rounded-tr-none' 
                      : 'bg-accent/5 border border-accent/10 rounded-tl-none text-primary'
                  )}>
                    <div className="flex items-center gap-2 mb-2 opacity-40">
                       <span className="text-[8px] font-black uppercase tracking-widest">{m.role === 'user' ? 'Owner' : 'Growth Partner'}</span>
                    </div>
                    <p className="text-sm md:text-base leading-relaxed whitespace-pre-wrap font-medium">
                      {m.content}
                    </p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-accent/5 p-6 rounded-[2rem] rounded-tl-none border border-accent/10 flex items-center gap-3">
                    <Loader2 className="w-4 h-4 animate-spin text-accent" />
                    <span className="text-[10px] font-bold text-accent uppercase tracking-widest">Analyzing your business, Sir...</span>
                  </div>
                </div>
              )}
              <div ref={scrollRef} className="h-2" />
            </div>
          </ScrollArea>
        </CardContent>

        <div className="p-6 md:p-8 bg-muted/20 border-t">
          <div className="flex gap-3 items-center">
            <div className="flex-1 relative">
              <Input 
                placeholder={language === 'bn' ? "ব্যবসা নিয়ে পরামর্শ চান, স্যার..." : "Ask for business advice, Sir..."}
                className="h-14 md:h-16 pl-6 pr-12 rounded-[1.5rem] bg-white border-primary/10 shadow-inner text-base font-medium focus-visible:ring-primary"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                disabled={isLoading}
              />
              <button 
                onClick={() => handleSend()} 
                disabled={isLoading || !input.trim()}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-primary text-white hover:bg-primary/90 transition-all active:scale-90 disabled:opacity-30"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
          </div>
          <div className="flex gap-2 mt-4 overflow-x-auto pb-2 no-scrollbar">
            {["Hidden mistakes?", "Predict next month profit", "Who owes me most?", "Restock advice"].map((tag, i) => (
              <button 
                key={i} 
                onClick={() => handleSend(tag)}
                className="px-4 py-2 rounded-full bg-white border border-primary/10 text-[9px] font-black uppercase tracking-widest text-primary hover:bg-primary hover:text-white transition-all whitespace-nowrap shadow-sm"
              >
                <Zap className="w-3 h-3 inline mr-1 text-amber-500 fill-amber-500" /> {tag}
              </button>
            ))}
          </div>
        </div>
      </Card>

      <AlertDialog open={isClearDialogOpen} onOpenChange={setIsClearDialogOpen}>
        <AlertDialogContent className="rounded-[2rem]">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-destructive" />
              {language === 'bn' ? 'মেমোরি পরিষ্কার করুন' : 'Clear AI Memory'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {language === 'bn' 
                ? 'স্যার, আপনি কি নিশ্চিত যে আপনি এই চ্যাট হিস্ট্রি চিরস্থায়ীভাবে মুছে ফেলতে চান?' 
                : 'Sir, are you sure you want to permanently delete this chat history?'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-3">
            <AlertDialogCancel className="rounded-xl border-accent/20">
              {language === 'bn' ? 'না, থাক' : 'No, Keep it'}
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleClearConfirm}
              className="bg-destructive hover:bg-destructive/90 rounded-xl"
            >
              {language === 'bn' ? 'হ্যাঁ, মুছে ফেলুন' : 'Yes, Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
