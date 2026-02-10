
"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import { 
  Bot, 
  Send, 
  Sparkles, 
  History, 
  Store,
  MessageSquare,
  TrendingUp,
  AlertCircle,
  Loader2,
  Zap,
  Trash2,
  Lock,
  ChevronRight,
  BrainCircuit,
  Clock
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useBusinessData } from "@/hooks/use-business-data"
import { businessChat } from "@/ai/flows/business-chat-flow"
import { useToast } from "@/hooks/use-toast"
import { translations } from "@/lib/translations"
import { useUser, useFirestore, useMemoFirebase, useCollection } from "@/firebase"
import { collection, query, orderBy, addDoc, serverTimestamp, deleteDoc, getDocs, writeBatch } from "firebase/firestore"
import { cn } from "@/lib/utils"

const QUICK_ACTIONS = [
  "Who took credit today?",
  "Future profit prediction",
  "Summarize my business health",
  "Which items should I restock?",
  "Suggest ways to increase profit"
]

const QUICK_ACTIONS_BN = [
  "আজকে কে কে বাকিতে নিসে?",
  "ভবিষ্যৎ লাভের সম্ভাবনা কেমন?",
  "আমার ব্যবসার বর্তমান অবস্থা জানাও",
  "কোন কোন মাল কেনা দরকার?",
  "লাভ বাড়ানোর বুদ্ধি দাও"
]

const LOCAL_STORAGE_KEY = "specsbiz_ai_chat_v2"

export default function AIAssistantPage() {
  const { toast } = useToast()
  const { user } = useUser()
  const db = useFirestore()
  const { products, sales, customers, currency, language } = useBusinessData()
  const t = translations[language]
  
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [localMessages, setLocalMessages] = useState<any[]>([])
  
  // Clear Memory Dialog State
  const [isClearOpen, setIsClearOpen] = useState(false)
  const [password, setPassword] = useState("")

  // Real-time Firestore History
  const aiMessagesQuery = useMemoFirebase(() => {
    if (!user?.uid || !db) return null;
    return query(collection(db, 'users', user.uid, 'aiMessages'), orderBy('timestamp', 'asc'));
  }, [user?.uid, db]);

  const { data: fbMessages, isLoading: isHistoryLoading } = useCollection(aiMessagesQuery);

  // Sync Local Storage on mount
  useEffect(() => {
    if (!user && typeof window !== 'undefined') {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY)
      if (saved) setLocalMessages(JSON.parse(saved))
    }
  }, [user])

  // Unified persistent messages
  const messages = useMemo(() => {
    const list = user ? (fbMessages || []) : localMessages;
    if (list.length === 0) {
      return [{ 
        id: 'welcome', 
        role: "assistant" as const, 
        content: language === 'bn' 
          ? "হ্যালো! আমি SpecsAI। আমি আপনার ব্যবসার প্রতিটি ডেটা জানি—ইনভেন্টরি থেকে শুরু করে কার কাছে কত বাকি সব। আপনার ব্যবসার ভবিষ্যৎ বা বর্তমান নিয়ে যেকোনো কিছু জিজ্ঞেস করুন, আমি আপনার পার্টনার হিসেবে আছি!" 
          : "Hi! I'm SpecsAI. I know your business inside out—from stock levels to every penny of debt. Ask me anything about your business trends, future, or daily ops. I'm here as your smart partner!" 
      }];
    }
    return list;
  }, [user, fbMessages, localMessages, language]);

  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isLoading])

  // Context calculations
  const businessMetrics = useMemo(() => {
    const totalInvestment = products.reduce((acc, p) => acc + ((p.purchasePrice || 0) * (p.stock || 0)), 0)
    const totalStockValue = products.reduce((acc, p) => acc + ((p.sellingPrice || 0) * (p.stock || 0)), 0)
    const potentialProfit = totalStockValue - totalInvestment
    const totalRevenue = sales.reduce((acc, s) => acc + (s.total || 0), 0)
    
    const soldStats: Record<string, number> = {}
    sales.forEach(s => {
      if (s.items) s.items.forEach((i: any) => {
        soldStats[i.name] = (soldStats[i.name] || 0) + (i.quantity || 0)
      })
    })
    const topItems = Object.entries(soldStats)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, qty]) => `${name} (${qty} sold)`)
      .join(', ')

    return { totalInvestment, potentialProfit, totalRevenue, topItems }
  }, [products, sales])

  const saveMessage = async (role: 'user' | 'assistant', content: string) => {
    const msg = { role, content, timestamp: new Date().toISOString(), id: Date.now().toString() };
    
    if (user?.uid && db) {
      await addDoc(collection(db, 'users', user.uid, 'aiMessages'), {
        ...msg,
        timestamp: serverTimestamp()
      });
    } else {
      const updated = [...localMessages, msg];
      setLocalMessages(updated);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    }
  }

  const handleSend = async (text?: string) => {
    const messageText = text || input
    if (!messageText.trim() || isLoading) return
    
    setInput("")
    setIsLoading(true)

    try {
      // 1. Save User Message
      await saveMessage('user', messageText);

      // 2. Gather LIVE Context
      const inventorySummary = products.length > 0 
        ? products.map(p => `${p.name}: ${p.stock} ${p.unit} (Buy: ${currency}${p.purchasePrice}, Sell: ${currency}${p.sellingPrice})`).join(' | ')
        : "Inventory is currently empty."
        
      const salesSummary = sales.length > 0
        ? sales.map(s => `Date: ${new Date(s.saleDate).toLocaleDateString()}, Total: ${currency}${s.total}, Profit: ${currency}${s.profit}, Items: ${s.items?.map((i: any) => i.name).join(';')}`).slice(0, 100).join(' || ')
        : "No sales history yet."
        
      const customersSummary = customers.length > 0
        ? customers.map(c => `${c.firstName} ${c.lastName}: Total Due ${currency}${c.totalDue}`).join(' | ')
        : "No customers recorded."

      const history = messages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })).slice(-20)

      // 3. Call AI
      const result = await businessChat({
        message: messageText,
        history,
        businessContext: {
          inventorySummary,
          salesSummary,
          customersSummary,
          totalRevenue: businessMetrics.totalRevenue,
          totalInvestment: businessMetrics.totalInvestment,
          potentialProfit: businessMetrics.potentialProfit,
          topSellingItems: businessMetrics.topItems || "None yet",
          currency,
          language,
          currentDate: new Date().toLocaleString()
        }
      })

      // 4. Save Assistant Message
      await saveMessage('assistant', result.reply);
    } catch (error) {
      toast({ 
        variant: "destructive", 
        title: language === 'bn' ? "কানেকশন সমস্যা" : "AI Snag", 
        description: language === 'bn' ? "আমি ডেটা এনালাইজ করতে পারছি না।" : "Memory error or connection lost." 
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleClearHistory = async () => {
    if (password === "specsxr") {
      if (user?.uid && db) {
        const snap = await getDocs(collection(db, 'users', user.uid, 'aiMessages'));
        const batch = writeBatch(db);
        snap.docs.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
      } else {
        setLocalMessages([]);
        localStorage.removeItem(LOCAL_STORAGE_KEY);
      }
      setIsClearOpen(false);
      setPassword("");
      toast({ title: language === 'en' ? "Memory Wiped" : "মেমোরি মুছে ফেলা হয়েছে" });
    } else {
      toast({ variant: "destructive", title: "Wrong Password" });
    }
  }

  const actions = language === 'bn' ? QUICK_ACTIONS_BN : QUICK_ACTIONS

  return (
    <div className="flex flex-col gap-4 h-[calc(100vh-140px)] animate-in zoom-in-95 duration-500 w-full max-w-full">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 shrink-0">
        <div className="min-w-0">
          <h2 className="text-xl md:text-2xl font-bold font-headline text-primary flex items-center gap-2 truncate">
            <BrainCircuit className="w-5 h-5 md:w-6 md:h-6 text-accent shrink-0 animate-pulse" /> SpecsAI Intelligence
          </h2>
          <p className="text-[10px] md:text-xs text-muted-foreground truncate italic">Real-time business memory activated.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 text-[10px] gap-2 border-destructive text-destructive hover:bg-destructive/5 font-bold" onClick={() => setIsClearOpen(true)}>
            <Trash2 className="w-3 h-3" /> {t.clearChat}
          </Button>
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 px-3 py-1 flex items-center shrink-0">
            <Zap className="w-3 h-3 mr-1 text-yellow-500" /> {language === 'bn' ? 'ফুল ডাটা কানেক্টেড' : 'Full Sync'}
          </Badge>
        </div>
      </div>

      <div className="flex-1 grid lg:grid-cols-4 gap-6 min-h-0 w-full">
        <Card className="lg:col-span-3 flex flex-col min-h-0 shadow-2xl border-accent/20 w-full overflow-hidden bg-white rounded-3xl">
          <CardHeader className="border-b bg-accent/5 p-3 md:p-4 py-3 shrink-0">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Avatar className="h-10 w-10 border-2 border-accent shrink-0 shadow-md">
                  <AvatarFallback className="bg-primary text-white"><Bot className="w-5 h-5" /></AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
              </div>
              <div className="min-w-0">
                <CardTitle className="text-base font-black text-primary">SpecsAI</CardTitle>
                <CardDescription className="text-[10px] truncate flex items-center gap-1">
                  {isLoading ? (
                    <span className="flex items-center gap-1 font-bold text-accent animate-pulse">
                      <Loader2 className="w-2.5 h-2.5 animate-spin" /> {language === 'bn' ? 'ডাটা এনালাইজ করছি...' : 'Thinking...'}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-green-600 font-bold uppercase tracking-widest">
                      <MessageSquare className="w-2.5 h-2.5" /> {messages.length} Memory Fragments
                    </span>
                  )}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="flex-1 min-h-0 p-0 overflow-hidden relative bg-[url('https://picsum.photos/seed/bg/1000/1000')] bg-opacity-5">
            <ScrollArea className="h-full w-full">
              <div className="p-4 space-y-6">
                {messages.map((msg, idx) => (
                  <div key={msg.id || idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} w-full`}>
                    <div className={`max-w-[85%] md:max-w-[75%] p-4 rounded-2xl break-words shadow-md transition-all ${
                      msg.role === 'user' 
                        ? 'bg-accent text-white rounded-tr-none' 
                        : 'bg-white text-foreground rounded-tl-none border border-accent/10'
                    }`}>
                      <p className="text-xs md:text-sm font-medium leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                      {msg.timestamp && (
                        <div className={`text-[8px] mt-2 opacity-50 flex items-center gap-1 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <Clock className="w-2 h-2" /> {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start w-full">
                    <div className="bg-white text-foreground p-4 rounded-2xl rounded-tl-none border border-accent/5 flex items-center gap-3 shadow-sm">
                      <div className="flex gap-1">
                        <div className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce [animation-delay:-0.3s]" />
                        <div className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce [animation-delay:-0.15s]" />
                        <div className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce" />
                      </div>
                      <span className="text-[10px] uppercase font-bold tracking-widest text-accent/70">{language === 'bn' ? 'চিন্তা করছি...' : 'Processing Live Data...'}</span>
                    </div>
                  </div>
                )}
                <div ref={scrollRef} />
              </div>
            </ScrollArea>
          </CardContent>

          <div className="shrink-0 border-t bg-white w-full">
            <div className="px-3 md:px-4 py-2 bg-muted/30 w-full">
              <ScrollArea className="w-full whitespace-nowrap">
                <div className="flex gap-2 pb-2">
                  {actions.map((action, i) => (
                    <Button 
                      key={i} 
                      variant="outline" 
                      size="sm"
                      className="text-[10px] h-8 rounded-full border-accent/20 bg-white hover:border-accent hover:bg-accent/5 shrink-0 transition-all font-bold"
                      onClick={() => handleSend(action)}
                      disabled={isLoading}
                    >
                      <Zap className="w-3 h-3 mr-1 text-yellow-500" /> {action}
                    </Button>
                  ))}
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </div>
            
            <CardFooter className="p-3 md:p-4 w-full bg-white">
              <div className="flex w-full gap-2 items-center bg-muted/10 p-1 rounded-2xl border">
                <Input 
                  placeholder={language === 'bn' ? "যেকোনো কিছু জিজ্ঞেস করুন, আমি মনে রাখব..." : "Ask me anything, I'll remember..."}
                  className="flex-1 text-sm h-12 border-none bg-transparent focus-visible:ring-0 shadow-none"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSend()}
                  disabled={isLoading}
                />
                <Button 
                  className="bg-accent hover:bg-accent/90 shrink-0 h-10 w-10 p-0 rounded-xl shadow-lg transition-transform active:scale-95" 
                  onClick={() => handleSend()}
                  disabled={isLoading || !input.trim()}
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </div>
            </CardFooter>
          </div>
        </Card>

        <div className="hidden lg:flex flex-col gap-6 overflow-y-auto pr-1">
          <Card className="border-accent/10 shadow-lg bg-primary text-white overflow-hidden">
            <CardHeader className="p-4 bg-white/5 border-b border-white/5">
              <CardTitle className="text-xs uppercase tracking-widest font-black flex items-center gap-2">
                <History className="w-4 h-4 text-accent" /> {t.chatHistory}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[250px]">
                {messages.filter(m => m.id !== 'welcome').length === 0 ? (
                  <div className="p-8 text-center text-[10px] opacity-40 italic">No previous chats.</div>
                ) : (
                  <div className="divide-y divide-white/5">
                    {messages.filter(m => m.id !== 'welcome').slice().reverse().map((msg, i) => (
                      <div key={i} className="p-3 hover:bg-white/5 transition-colors cursor-default">
                        <div className="flex items-center justify-between mb-1">
                          <Badge variant="ghost" className={cn("h-4 px-1 text-[8px] uppercase", msg.role === 'user' ? "text-accent" : "text-white")}>{msg.role}</Badge>
                          <span className="text-[8px] opacity-40">{msg.timestamp ? new Date(msg.timestamp).toLocaleDateString() : 'Now'}</span>
                        </div>
                        <p className="text-[10px] line-clamp-2 opacity-80">{msg.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
          
          <Card className="bg-accent text-white border-none shadow-xl relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 opacity-10 group-hover:scale-125 transition-transform duration-500">
               <BrainCircuit className="w-24 h-24" />
            </div>
            <CardHeader className="p-4 pb-2 relative">
              <CardTitle className="text-xs uppercase tracking-widest font-black opacity-70 flex items-center gap-2">
                <Sparkles className="w-3 h-3" /> Live Memory
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 relative">
              <p className="text-[11px] font-medium leading-relaxed italic">
                {language === 'bn' 
                  ? "আমি আপনার ব্যবসার গত কয়েক মাসের ডাটা এবং আমাদের চ্যাট হিস্ট্রি এক করে এনালাইজ করছি। আপনি চ্যাট বন্ধ করলেও আমার কাছে সব তথ্য নিরাপদ থাকবে।" 
                  : "I'm merging your business data with our conversation history. Your context is preserved even if you close the app."}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Clear Memory Dialog */}
      <Dialog open={isClearOpen} onOpenChange={setIsClearOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Lock className="w-5 h-5" /> {t.clearChat}
            </DialogTitle>
            <DialogDescription>{t.clearHistoryDesc}</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-2">
            <Label className="text-xs font-bold uppercase opacity-70">{t.secretKey}</Label>
            <Input type="password" placeholder="••••••••" className="h-12 text-lg font-bold" value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="destructive" className="w-full h-12 text-base font-bold shadow-lg" onClick={handleClearHistory}>
              {language === 'en' ? 'Authorize & Wipe Memory' : 'অথোরাইজ ও মেমোরি মুছুন'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
