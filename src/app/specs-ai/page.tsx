
"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import { 
  Send, 
  Loader2,
  Sparkles,
  Zap,
  TrendingUp,
  BarChart2,
  Trash2,
  ChevronRight,
  Target
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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
  const { products, sales, currency, language } = useBusinessData()
  const t = translations[language]
  
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const messagesQuery = useMemoFirebase(() => {
    if (!user?.uid || !db) return null;
    return query(collection(db, 'users', user.uid, 'advisorMessages'), orderBy('timestamp', 'asc'), limit(50));
  }, [user?.uid, db]);

  const { data: fbMessages } = useCollection(messagesQuery);

  const messages = useMemo(() => {
    if (!fbMessages || fbMessages.length === 0) {
      return [{ 
        id: 'welcome', 
        role: "assistant" as const, 
        content: language === 'bn' 
          ? "নমস্কার ভাই! আমি আপনার SpecsAI অ্যাডভাইজর। আমি আপনার দোকানের প্রতিটি ট্রানজ্যাকশন স্টাডি করেছি। ব্যবসা বড় করার জন্য কোনো বিশেষ পরামর্শ চান?" 
          : "Greetings Partner! I'm your SpecsAI Advisor. I've analyzed every transaction in your shop. Ready to discuss growth strategies?" 
      }];
    }
    return fbMessages;
  }, [fbMessages, language]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  const saveMsg = async (role: 'user' | 'assistant', content: string) => {
    if (!user?.uid || !db) return;
    await addDoc(collection(db, 'users', user.uid, 'advisorMessages'), {
      role, content, timestamp: serverTimestamp()
    });
  }

  const handleSend = async (txt?: string) => {
    const message = txt || input
    if (!message.trim() || isLoading) return
    
    setInput("")
    setIsLoading(true)

    try {
      await saveMsg('user', message);

      const inventorySummary = products.map(p => `${p.name}: ${p.stock}${p.unit}`).join(', ')
      const salesPerformance = `Total Sales: ${sales.length}, Last Revenue: ${sales[0]?.total || 0}`
      const topProducts = sales.slice(0, 5).map(s => s.items?.map((i: any) => i.name).join(',')).join('; ')

      const history = messages
        .filter(m => m.id !== 'welcome')
        .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }))
        .slice(-6)

      const result = await growthExpertChat({
        message,
        history,
        context: {
          inventorySummary,
          salesPerformance,
          topProducts,
          currentLanguage: language,
          currency
        }
      })

      await saveMsg('assistant', result.reply);
    } catch (e) {
      toast({ title: "Advisor Offline", variant: "destructive" });
    } finally {
      setIsLoading(false)
    }
  }

  const clearMemory = async () => {
    const ok = confirm("Clear Advisor Memory?");
    if (ok) {
      if (!user?.uid || !db) return;
      const snap = await getDocs(collection(db, 'users', user.uid, 'advisorMessages'));
      const batch = writeBatch(db);
      snap.docs.forEach(d => batch.delete(doc(db, 'users', user.uid, 'advisorMessages', d.id)));
      await batch.commit();
      toast({ title: "Memory Wiped" });
    }
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
            <p className="text-[9px] font-bold text-accent uppercase tracking-[0.3em]">Growth & Strategy Engine</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={clearMemory} className="text-muted-foreground hover:text-destructive">
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      <Card className="flex-1 flex flex-col min-h-0 border-none bg-white shadow-2xl rounded-[3rem] overflow-hidden">
        <CardContent className="flex-1 min-h-0 p-0">
          <ScrollArea className="h-full">
            <div className="p-6 md:p-10 space-y-10">
              {messages.map((m, i) => (
                <div key={i} className={cn("flex w-full", m.role === 'user' ? 'justify-end' : 'justify-start')}>
                  <div className={cn(
                    "max-w-[85%] md:max-w-[70%] p-6 rounded-[2rem] shadow-sm",
                    m.role === 'user' 
                      ? 'bg-primary text-white rounded-tr-none' 
                      : 'bg-accent/5 border border-accent/10 rounded-tl-none text-primary'
                  )}>
                    <div className="flex items-center gap-2 mb-2 opacity-40">
                       <span className="text-[8px] font-black uppercase tracking-widest">{m.role === 'user' ? 'Owner' : 'Growth Expert'}</span>
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
                    <span className="text-[10px] font-bold text-accent uppercase tracking-widest">Studying Trends...</span>
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
                placeholder={language === 'bn' ? "ব্যবসা নিয়ে পরামর্শ চান..." : "Ask for growth advice..."}
                className="h-14 md:h-16 pl-6 pr-12 rounded-[1.5rem] bg-white border-primary/10 shadow-inner text-base font-medium focus-visible:ring-primary"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                disabled={isLoading}
              />
              <button 
                onClick={() => handleSend()} 
                disabled={isLoading || !input.trim()}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-primary text-white hover:bg-primary/90 transition-all active:scale-90"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
          </div>
          <div className="flex gap-2 mt-4 overflow-x-auto pb-2 no-scrollbar">
            {["Analyze last month", "Predict next week", "Slow items", "Profit tips"].map((tag, i) => (
              <button 
                key={i} 
                onClick={() => handleSend(tag)}
                className="px-4 py-2 rounded-full bg-white border border-primary/10 text-[9px] font-black uppercase tracking-widest text-primary hover:bg-primary hover:text-white transition-all whitespace-nowrap"
              >
                <Zap className="w-3 h-3 inline mr-1 text-amber-500 fill-amber-500" /> {tag}
              </button>
            ))}
          </div>
        </div>
      </Card>
    </div>
  )
}
