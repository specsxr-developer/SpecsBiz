"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import { 
  Bot, 
  Send, 
  Sparkles, 
  MessageSquare,
  Loader2,
  Zap,
  Trash2,
  BrainCircuit,
  Clock,
  ShieldCheck
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useBusinessData } from "@/hooks/use-business-data"
import { businessChat } from "@/ai/flows/business-chat-flow"
import { useToast } from "@/hooks/use-toast"
import { translations } from "@/lib/translations"
import { useUser, useFirestore, useMemoFirebase, useCollection } from "@/firebase"
import { collection, query, orderBy, addDoc, serverTimestamp, getDocs, writeBatch, limit } from "firebase/firestore"
import { cn } from "@/lib/utils"

const QUICK_ACTIONS = [
  "Analyze my overall business",
  "Who owes the most baki?",
  "Predict next month profit",
  "Any items losing money?",
  "Suggest what to restock"
]

const QUICK_ACTIONS_BN = [
  "আমার ব্যবসার পুরো অবস্থা জানাও",
  "কার কাছে সবচেয়ে বেশি বাকি?",
  "পরের মাসের লাভের সম্ভাবনা কত?",
  "কোন পণ্যে আমার লস হচ্ছে?",
  "নতুন করে কি কি মাল কেনা উচিত?"
]

export default function AIAssistantPage() {
  const { toast } = useToast()
  const { user } = useUser()
  const db = useFirestore()
  const { products, sales, customers, currency, language } = useBusinessData()
  const t = translations[language]
  
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [password, setPassword] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)

  // Fetch full chat history for this user
  const aiMessagesQuery = useMemoFirebase(() => {
    if (!user?.uid || !db) return null;
    return query(collection(db, 'users', user.uid, 'aiMessages'), orderBy('timestamp', 'asc'), limit(100));
  }, [user?.uid, db]);

  const { data: allFbMessages } = useCollection(aiMessagesQuery);

  const currentMessages = useMemo(() => {
    if (!allFbMessages || allFbMessages.length === 0) {
      return [{ 
        id: 'welcome', 
        role: "assistant" as const, 
        content: language === 'bn' 
          ? "হ্যালো ভাই! আমি SpecsAI। আপনার ব্যবসার মগজ এখন আমার হাতে। দোকানের প্রতিটি মাল আর কাস্টমারের বকেয়া আমি জানি। ব্যবসার কি অবস্থা জানতে চান? শুরু করুন!" 
          : "Hi Partner! I'm SpecsAI. I have full access to your business brain. I know every product and every customer debt. Ready to analyze your business or predict the future? Let's talk!" 
      }];
    }
    return allFbMessages;
  }, [allFbMessages, language]);

  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [currentMessages, isLoading])

  const saveMessage = async (role: 'user' | 'assistant', content: string) => {
    if (!user?.uid || !db) return;
    await addDoc(collection(db, 'users', user.uid, 'aiMessages'), {
      role,
      content,
      timestamp: serverTimestamp()
    });
  }

  const handleSend = async (text?: string) => {
    const messageText = text || input
    if (!messageText.trim() || isLoading) return
    
    setInput("")
    setIsLoading(true)

    try {
      await saveMessage('user', messageText);

      // Deep data context construction
      const inventorySummary = products.length > 0 
        ? products.map(p => `[${p.name}: stock ${p.stock}${p.unit}, buy ${p.purchasePrice}, sell ${p.sellingPrice}]`).join('\n')
        : "Inventory is empty."
        
      const salesSummary = sales.length > 0
        ? sales.slice(0, 50).map(s => `Date: ${new Date(s.saleDate).toLocaleDateString()}, Total: ${s.total}, Profit: ${s.profit || 0}`).join('\n')
        : "No sales records yet."
        
      const customersSummary = customers.length > 0
        ? customers.map(c => `${c.firstName}: Baki ${currency}${c.totalDue}`).join('\n')
        : "No customers listed."

      const totalInvestment = products.reduce((acc, p) => acc + ((p.purchasePrice || 0) * (p.stock || 0)), 0)
      const totalStockValue = products.reduce((acc, p) => acc + ((p.sellingPrice || 0) * (p.stock || 0)), 0)
      const potentialProfit = totalStockValue - totalInvestment
      const totalRevenue = sales.reduce((acc, s) => acc + (s.total || 0), 0)

      const history = currentMessages
        .filter(m => m.id !== 'welcome')
        .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }))
        .slice(-15) // Keep last 15 messages for memory

      const result = await businessChat({
        message: messageText,
        history,
        businessContext: {
          inventorySummary,
          salesSummary,
          customersSummary,
          totalRevenue,
          totalInvestment,
          potentialProfit,
          currency,
          language,
          currentDate: new Date().toLocaleString()
        }
      })

      await saveMessage('assistant', result.reply);
    } catch (error) {
      console.error("Chat Error:", error);
      await saveMessage('assistant', "maybe AI er limit shes !");
    } finally {
      setIsLoading(false)
    }
  }

  const clearChat = async () => {
    const pass = prompt(language === 'bn' ? "হিস্ট্রি মুছতে সিক্রেট পাসওয়ার্ড দিন:" : "Enter secret password to clear history:");
    if (pass === 'specsxr') {
      if (!user?.uid || !db) return;
      const snap = await getDocs(collection(db, 'users', user.uid, 'aiMessages'));
      const batch = writeBatch(db);
      snap.docs.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
      toast({ title: language === 'bn' ? "মেমোরি মুছে ফেলা হয়েছে" : "Memory Cleared" });
    } else if (pass !== null) {
      toast({ variant: "destructive", title: "Incorrect Password" });
    }
  }

  const actions = language === 'bn' ? QUICK_ACTIONS_BN : QUICK_ACTIONS

  return (
    <div className="flex flex-col gap-4 h-[calc(100vh-140px)] animate-in zoom-in-95 duration-500 w-full max-w-6xl mx-auto">
      <div className="flex items-center justify-between gap-2 shrink-0 px-2">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-accent/10 rounded-xl">
            <BrainCircuit className="w-6 h-6 text-accent animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-black font-headline text-primary">SpecsAI Master Brain</h2>
            <p className="text-[10px] md:text-xs text-muted-foreground uppercase font-bold tracking-widest flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-green-600" /> Human Partner Mode Online
            </p>
          </div>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          className="h-9 gap-2 border-destructive/20 text-destructive hover:bg-destructive/5 font-bold rounded-xl" 
          onClick={clearChat}
        >
          <Trash2 className="w-3.5 h-3.5" /> {t.clearChat}
        </Button>
      </div>

      <Card className="flex-1 flex flex-col min-h-0 shadow-2xl border-accent/10 w-full overflow-hidden bg-white/80 backdrop-blur-sm rounded-[2rem]">
        <CardHeader className="border-b bg-muted/30 p-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar className="h-12 w-12 border-2 border-white shadow-xl">
                <AvatarFallback className="bg-primary text-white font-black text-xl">S</AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white shadow-sm" />
            </div>
            <div>
              <CardTitle className="text-base font-black text-primary">SpecsAI Partner</CardTitle>
              <CardDescription className="text-[10px] font-bold text-accent uppercase tracking-tighter">
                {isLoading ? (
                  <span className="flex items-center gap-1 animate-pulse">
                    <Loader2 className="w-2.5 h-2.5 animate-spin" /> {language === 'bn' ? 'ডাটা এনালাইজ করছি...' : 'Analyzing Data...'}
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <MessageSquare className="w-2.5 h-2.5" /> Ready to Discuss Business
                  </span>
                )}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 min-h-0 p-0 overflow-hidden relative bg-[url('https://picsum.photos/seed/specs/1200/800')] bg-cover bg-fixed">
          <div className="absolute inset-0 bg-white/90 backdrop-blur-[2px]" />
          <ScrollArea className="h-full w-full relative z-10">
            <div className="p-4 md:p-8 space-y-8">
              {currentMessages.map((msg, idx) => (
                <div key={msg.id || idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} w-full animate-in slide-in-from-bottom-2`}>
                  <div className={cn(
                    "max-w-[85%] md:max-w-[70%] p-5 rounded-3xl shadow-lg transition-all",
                    msg.role === 'user' 
                      ? 'bg-accent text-white rounded-tr-none' 
                      : 'bg-white text-foreground rounded-tl-none border border-accent/5'
                  )}>
                    <p className="text-xs md:text-sm font-medium leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    {msg.timestamp && (
                      <div className={cn(
                        "text-[8px] mt-3 opacity-50 flex items-center gap-1 font-bold",
                        msg.role === 'user' ? 'justify-end' : 'justify-start'
                      )}>
                        <Clock className="w-2 h-2" /> 
                        {msg.timestamp?.toDate ? new Date(msg.timestamp.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start w-full">
                  <div className="bg-white/80 backdrop-blur-md p-5 rounded-3xl rounded-tl-none border border-accent/10 flex items-center gap-4 shadow-xl">
                    <div className="flex gap-1.5">
                      <div className="w-2 h-2 bg-accent rounded-full animate-bounce [animation-delay:-0.3s]" />
                      <div className="w-2 h-2 bg-accent rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <div className="w-2 h-2 bg-accent rounded-full animate-bounce" />
                    </div>
                    <span className="text-[10px] uppercase font-black tracking-widest text-accent">{language === 'bn' ? 'ব্রেইন এনালাইজ করছে...' : 'SpecsAI Thinking...'}</span>
                  </div>
                </div>
              )}
              <div ref={scrollRef} />
            </div>
          </ScrollArea>
        </CardContent>

        <div className="shrink-0 border-t bg-white w-full rounded-b-[2rem]">
          <div className="px-4 py-3 bg-muted/20 w-full">
            <ScrollArea className="w-full whitespace-nowrap">
              <div className="flex gap-2.5 pb-2">
                {actions.map((action, i) => (
                  <button 
                    key={i} 
                    className="text-[10px] h-9 px-4 rounded-full border border-accent/20 bg-white hover:border-accent hover:bg-accent/5 shrink-0 transition-all font-bold flex items-center gap-2 shadow-sm"
                    onClick={() => handleSend(action)}
                    disabled={isLoading}
                  >
                    <Zap className="w-3 h-3 text-yellow-500 fill-yellow-500" /> {action}
                  </button>
                ))}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>
          
          <CardFooter className="p-4 md:p-6 w-full bg-white rounded-b-[2rem]">
            <div className="flex w-full gap-3 items-center bg-muted/30 p-1.5 rounded-[1.5rem] border-2 border-accent/10 focus-within:border-accent transition-colors">
              <Input 
                placeholder={language === 'bn' ? "ভাই, ব্যবসা নিয়ে আলোচনা করুন..." : "Discuss business strategy, Partner..."}
                className="flex-1 text-sm h-12 border-none bg-transparent focus-visible:ring-0 shadow-none px-4 font-medium"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                disabled={isLoading}
              />
              <Button 
                className="bg-accent hover:bg-accent/90 shrink-0 h-12 w-12 p-0 rounded-2xl shadow-xl transition-transform active:scale-90" 
                onClick={() => handleSend()}
                disabled={isLoading || !input.trim()}
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              </Button>
            </div>
          </CardFooter>
        </div>
      </Card>
    </div>
  )
}
