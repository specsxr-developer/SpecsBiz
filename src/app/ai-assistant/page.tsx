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
  Wifi,
  BrainCircuit,
  Zap
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useBusinessData } from "@/hooks/use-business-data"
import { businessChat } from "@/ai/flows/business-chat-flow"
import { useToast } from "@/hooks/use-toast"
import { translations } from "@/lib/translations"

const QUICK_ACTIONS = [
  "Future profit prediction",
  "Summarize my business health",
  "Which items should I restock?",
  "Who owes me the most money?",
  "Analyze my sales trends",
  "Suggest ways to increase profit"
]

const QUICK_ACTIONS_BN = [
  "ভবিষ্যৎ লাভের সম্ভাবনা কেমন?",
  "আমার ব্যবসার বর্তমান অবস্থা জানাও",
  "কোন কোন মাল কেনা দরকার?",
  "কার কাছে সবচেয়ে বেশি টাকা বাকি?",
  "বিক্রির ট্রেন্ড অ্যানালাইজ করো",
  "লাভ বাড়ানোর বুদ্ধি দাও"
]

export default function AIAssistantPage() {
  const { toast } = useToast()
  const { products, sales, customers, currency, language } = useBusinessData()
  const t = translations[language]
  
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [messages, setMessages] = useState([
    { 
      id: 1, 
      role: "assistant" as const, 
      content: language === 'bn' 
        ? "হ্যালো! আমি SpecsAI। আমি আপনার ব্যবসার প্রতিটি ডেটা জানি—ইনভেন্টরি থেকে শুরু করে কার কাছে কত বাকি সব। আপনার ব্যবসার ভবিষ্যৎ বা বর্তমান নিয়ে যেকোনো কিছু জিজ্ঞেস করুন, আমি আপনার পার্টনার হিসেবে আছি!" 
        : "Hi! I'm SpecsAI. I know your business inside out—from stock levels to every penny of debt. Ask me anything about your business trends, future, or daily ops. I'm here as your smart partner!" 
    }
  ])

  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  // Advanced context calculations
  const businessMetrics = useMemo(() => {
    const totalInvestment = products.reduce((acc, p) => acc + ((p.purchasePrice || 0) * (p.stock || 0)), 0)
    const totalStockValue = products.reduce((acc, p) => acc + ((p.sellingPrice || 0) * (p.stock || 0)), 0)
    const potentialProfit = totalStockValue - totalInvestment
    const totalRevenue = sales.reduce((acc, s) => acc + (s.total || 0), 0)
    
    // Top selling items logic
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

  const handleSend = async (text?: string) => {
    const messageText = text || input
    if (!messageText.trim() || isLoading) return
    
    const userMsg = { id: Date.now(), role: "user" as const, content: messageText }
    setMessages(prev => [...prev, userMsg])
    setInput("")
    setIsLoading(true)

    try {
      // Gather ALL business data for the AI's "A to Z" access
      const inventorySummary = products.length > 0 
        ? products.map(p => `${p.name}: ${p.stock} ${p.unit} (Buy: ${currency}${p.purchasePrice}, Sell: ${currency}${p.sellingPrice}, Cat: ${p.category})`).join(' | ')
        : "Inventory is currently empty."
        
      const salesSummary = sales.length > 0
        ? sales.map(s => `Date: ${new Date(s.saleDate).toLocaleDateString()}, Total: ${currency}${s.total}, Profit: ${currency}${s.profit}, Items: ${s.items?.map((i: any) => i.name).join(';')}`).slice(0, 50).join(' || ')
        : "No sales history yet."
        
      const customersSummary = customers.length > 0
        ? customers.map(c => `${c.firstName} ${c.lastName}: Total Due ${currency}${c.totalDue}, Phone: ${c.phone}`).join(' | ')
        : "No customers recorded."

      const history = messages.map(m => ({ role: m.role, content: m.content })).slice(-20)

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
          language
        }
      })

      const assistantMsg = { 
        id: Date.now() + 1, 
        role: "assistant" as const, 
        content: result.reply 
      }
      setMessages(prev => [...prev, assistantMsg])
    } catch (error) {
      toast({ 
        variant: "destructive", 
        title: language === 'bn' ? "কানেকশন সমস্যা" : "AI Snag", 
        description: language === 'bn' ? "আমি ডেটা এনালাইজ করতে পারছি না, আবার চেষ্টা করুন।" : "I'm having trouble thinking. Try asking again!" 
      })
    } finally {
      setIsLoading(false)
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
          <p className="text-[10px] md:text-xs text-muted-foreground truncate italic">Your personal business partner with full data access.</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 px-3 py-1 flex items-center shrink-0">
            <Zap className="w-3 h-3 mr-1 text-yellow-500" /> {language === 'bn' ? 'ফুল ডাটা সিঙ্ক' : 'Full Data Access'}
          </Badge>
          <Badge variant="outline" className="text-accent border-accent px-3 py-1 flex items-center shrink-0 hidden sm:flex">
            <Sparkles className="w-3 h-3 mr-1" /> {language === 'bn' ? 'অ্যাডভান্সড ব্রেইন' : 'Advanced Brain'}
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
                      <Loader2 className="w-2.5 h-2.5 animate-spin" /> {language === 'bn' ? 'পুরো ডাটাবেস চেক করছি...' : 'Analyzing full database...'}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-green-600 font-bold uppercase tracking-widest">{language === 'bn' ? 'অনলাইন' : 'Live Partner'}</span>
                  )}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="flex-1 min-h-0 p-0 overflow-hidden relative bg-[url('https://picsum.photos/seed/bg/1000/1000')] bg-opacity-5">
            <ScrollArea className="h-full w-full">
              <div className="p-4 space-y-6">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} w-full`}>
                    <div className={`max-w-[85%] md:max-w-[75%] p-4 rounded-2xl break-words shadow-md transition-all ${
                      msg.role === 'user' 
                        ? 'bg-accent text-white rounded-tr-none' 
                        : 'bg-white text-foreground rounded-tl-none border border-accent/10'
                    }`}>
                      <p className="text-xs md:text-sm font-medium leading-relaxed whitespace-pre-wrap">{msg.content}</p>
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
                      <span className="text-[10px] uppercase font-bold tracking-widest text-accent/70">{language === 'bn' ? 'চিন্তা করছি...' : 'Strategizing...'}</span>
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
                  placeholder={language === 'bn' ? "ব্যবসার ভবিষ্যৎ বা ডাটা নিয়ে প্রশ্ন করুন..." : "Ask about future trends or any business data..."}
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
          <Card className="border-accent/10 shadow-lg bg-primary text-white">
            <CardHeader className="p-4">
              <CardTitle className="text-xs uppercase tracking-widest font-black opacity-70 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-accent" /> Live Intelligence
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-4 pt-0">
              <div className="flex flex-col gap-1 border-b border-white/10 pb-2">
                <span className="text-[10px] opacity-60 uppercase font-bold">Invested Capital</span>
                <span className="text-lg font-black text-accent">{currency}{businessMetrics.totalInvestment.toLocaleString()}</span>
              </div>
              <div className="flex flex-col gap-1 border-b border-white/10 pb-2">
                <span className="text-[10px] opacity-60 uppercase font-bold">Potential Profit</span>
                <span className="text-lg font-black text-green-400">{currency}{businessMetrics.potentialProfit.toLocaleString()}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] opacity-60 uppercase font-bold">Top Product</span>
                <span className="text-xs font-bold truncate">{businessMetrics.topItems.split(',')[0] || "None"}</span>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-accent text-white border-none shadow-xl relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 opacity-10 group-hover:scale-125 transition-transform duration-500">
               <BrainCircuit className="w-24 h-24" />
            </div>
            <CardHeader className="p-4 pb-2 relative">
              <CardTitle className="text-xs uppercase tracking-widest font-black opacity-70 flex items-center gap-2">
                <Sparkles className="w-3 h-3" /> AI Roadmap
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 relative">
              <p className="text-[11px] font-medium leading-relaxed italic">
                {language === 'bn' 
                  ? "আমি আপনার ব্যবসার গত কয়েক মাসের ডাটা এনালাইজ করছি। আমার কাছে প্রশ্ন করুন কোন মাসে বিক্রি বেশি হতে পারে বা কাকে বকেয়া দেওয়া ঠিক হবে না।" 
                  : "I'm analyzing your historical trends. Ask me about high-risk debtors or which month expects the highest sales surge."}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
