"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import { 
  Send, 
  Loader2,
  Trash2,
  BrainCircuit,
  Zap,
  MessageSquare,
  Sparkles,
  Bot
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
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
  "Analyze my business",
  "Who owes most baki?",
  "Suggest what to restock",
  "Predict future profit"
]

const QUICK_ACTIONS_BN = [
  "আমার ব্যবসার অবস্থা জানাও",
  "কার কাছে সবচেয়ে বেশি বাকি?",
  "কি কি মাল কেনা উচিত?",
  "ভবিষ্যতে কেমন লাভ হবে?"
]

export default function AIAssistantPage() {
  const { toast } = useToast()
  const { user } = useUser()
  const db = useFirestore()
  const { products, sales, customers, currency, language } = useBusinessData()
  const t = translations[language]
  
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Real-time chat messages from Firestore
  const aiMessagesQuery = useMemoFirebase(() => {
    if (!user?.uid || !db) return null;
    return query(collection(db, 'users', user.uid, 'aiMessages'), orderBy('timestamp', 'asc'), limit(50));
  }, [user?.uid, db]);

  const { data: allFbMessages } = useCollection(aiMessagesQuery);

  const currentMessages = useMemo(() => {
    if (!allFbMessages || allFbMessages.length === 0) {
      return [{ 
        id: 'welcome', 
        role: "assistant" as const, 
        content: language === 'bn' 
          ? "হ্যালো ভাই! আমি SpecsAI। আপনার ব্যবসার মগজ এখন আমার হাতে। দোকানের প্রতিটি মাল আর কাস্টমারের বকেয়া আমি জানি। কি নিয়ে আলোচনা করতে চান? শুরু করুন!" 
          : "Hi Partner! I'm SpecsAI. I have full access to your business brain. Ready to analyze your business or predict the future? Let's talk!" 
      }];
    }
    return allFbMessages;
  }, [allFbMessages, language]);

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

      // Construct powerful business context for the AI
      const inventorySummary = products.length > 0 
        ? products.map(p => `[Name: ${p.name}, Stock: ${p.stock}${p.unit}, Cost: ${p.purchasePrice}, Price: ${p.sellingPrice}, Category: ${p.category}]`).join('\n')
        : "No products in inventory."
        
      const salesSummary = sales.length > 0
        ? sales.slice(0, 30).map(s => `Date: ${new Date(s.saleDate).toLocaleDateString()}, Total: ${s.total}, Profit: ${s.profit}, Items: ${s.items?.map((i: any) => i.name).join(', ')}`).join('\n')
        : "No sales records found."
        
      const customersSummary = customers.length > 0
        ? customers.map(c => `${c.firstName} ${c.lastName}: Owed ${currency}${c.totalDue}, Phone: ${c.phone}`).join('\n')
        : "No customer debt records."

      const history = currentMessages
        .filter(m => m.id !== 'welcome')
        .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }))
        .slice(-10)

      const result = await businessChat({
        message: messageText,
        history,
        businessContext: {
          inventorySummary,
          salesSummary,
          customersSummary,
          totalRevenue: sales.reduce((acc, s) => acc + (s.total || 0), 0),
          totalInvestment: products.reduce((acc, p) => acc + ((p.purchasePrice || 0) * (p.stock || 0)), 0),
          potentialProfit: products.reduce((acc, p) => acc + (((p.sellingPrice || 0) - (p.purchasePrice || 0)) * (p.stock || 0)), 0),
          currency,
          language,
          currentDate: new Date().toLocaleString()
        }
      })

      await saveMessage('assistant', result.reply);
    } catch (error) {
      await saveMessage('assistant', language === 'bn' ? "দুঃখিত ভাই, সার্ভারে একটু সমস্যা হচ্ছে। দয়া করে আবার চেষ্টা করুন।" : "Sorry Partner, I'm having trouble connecting to my brain. Please try again.");
    } finally {
      setIsLoading(false)
    }
  }

  const clearChat = async () => {
    const pass = prompt("Enter 'specsxr' to clear memory:");
    if (pass === 'specsxr') {
      if (!user?.uid || !db) return;
      const snap = await getDocs(collection(db, 'users', user.uid, 'aiMessages'));
      const batch = writeBatch(db);
      snap.docs.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
      toast({ title: "Memory Cleared" });
    }
  }

  return (
    <div className="flex flex-col gap-4 h-[calc(100vh-140px)] w-full max-w-6xl mx-auto">
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-accent/10 rounded-xl">
            <BrainCircuit className="w-6 h-6 text-accent animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-black text-primary leading-tight">SpecsAI Master Brain</h2>
            <p className="text-[10px] font-bold text-accent uppercase tracking-widest">A to Z Business Partner</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={clearChat} className="text-destructive font-bold hover:bg-destructive/5">
          <Trash2 className="w-4 h-4 mr-2" /> {t.clearChat}
        </Button>
      </div>

      <Card className="flex-1 flex flex-col min-h-0 shadow-2xl border-accent/10 bg-white/80 backdrop-blur-md rounded-[2.5rem] overflow-hidden">
        <CardHeader className="border-b bg-muted/30 p-4 md:p-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-12 w-12 border-2 border-white shadow-xl">
              <AvatarFallback className="bg-primary text-white font-black text-xl">S</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-base font-black text-primary">SpecsAI Intelligence</CardTitle>
              <div className="flex items-center gap-2 mt-0.5">
                <div className={cn("w-2 h-2 rounded-full", isLoading ? "bg-amber-500 animate-pulse" : "bg-green-500")} />
                <CardDescription className="text-[10px] font-bold text-accent uppercase">
                  {isLoading ? "Analyzing Shop Data..." : "Partner is Online"}
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 min-h-0 p-0 relative">
          <ScrollArea className="h-full w-full">
            <div className="p-4 md:p-8 space-y-8">
              {currentMessages.map((msg, idx) => (
                <div key={msg.id || idx} className={cn("flex w-full animate-in fade-in slide-in-from-bottom-2 duration-500", msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                  <div className={cn(
                    "max-w-[85%] md:max-w-[75%] p-5 rounded-3xl shadow-md transition-all",
                    msg.role === 'user' 
                      ? 'bg-primary text-white rounded-tr-none' 
                      : 'bg-white border border-accent/5 rounded-tl-none'
                  )}>
                    <div className="flex items-center gap-2 mb-2 opacity-50">
                       {msg.role === 'user' ? <MessageSquare className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
                       <span className="text-[9px] font-black uppercase tracking-widest">{msg.role === 'user' ? 'Shop Owner' : 'SpecsAI Partner'}</span>
                    </div>
                    <p className="text-sm md:text-base leading-relaxed whitespace-pre-wrap font-medium">
                      {msg.content}
                    </p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-accent/10 p-5 rounded-3xl rounded-tl-none shadow-sm flex items-center gap-3">
                    <Sparkles className="w-4 h-4 text-accent animate-spin" />
                    <div className="flex gap-1.5">
                      <div className="w-2 h-2 bg-accent/40 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-accent/40 rounded-full animate-bounce [animation-delay:0.2s]" />
                      <div className="w-2 h-2 bg-accent/40 rounded-full animate-bounce [animation-delay:0.4s]" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={scrollRef} className="h-4" />
            </div>
          </ScrollArea>
        </CardContent>

        <div className="border-t bg-white/50 backdrop-blur-sm p-4 md:p-6">
          <ScrollArea className="w-full whitespace-nowrap mb-4">
            <div className="flex gap-2 pb-2">
              {(language === 'bn' ? QUICK_ACTIONS_BN : QUICK_ACTIONS).map((action, i) => (
                <button 
                  key={i} 
                  onClick={() => handleSend(action)} 
                  className="text-[10px] px-4 py-2 rounded-full border border-accent/20 bg-white hover:bg-accent hover:text-white transition-all font-black uppercase tracking-tighter shadow-sm shrink-0"
                >
                  <Zap className="w-3 h-3 inline mr-1.5 text-amber-500 fill-amber-500" /> {action}
                </button>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
          
          <div className="flex gap-3">
            <Input 
              placeholder={language === 'bn' ? "ভাই, ব্যবসা নিয়ে কোনো পরামর্শ চান?" : "Partner, ask me anything about the shop..."}
              className="flex-1 h-14 md:h-16 rounded-2xl bg-white border-accent/10 text-base shadow-inner focus-visible:ring-accent"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              disabled={isLoading}
            />
            <Button 
              className="bg-accent hover:bg-accent/90 h-14 md:h-16 w-14 md:w-16 rounded-2xl shadow-xl transition-all active:scale-95 shrink-0" 
              onClick={() => handleSend()} 
              disabled={isLoading || !input.trim()}
            >
              {isLoading ? <Loader2 className="w-6 h-6 animate-spin text-white" /> : <Send className="w-6 h-6 text-white" />}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
