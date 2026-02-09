"use client"

import { useState, useRef, useEffect } from "react"
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
  Wifi
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
  "Summarize last week's sales",
  "Generate low stock report",
  "Find VIP customers",
  "Analyze revenue trends",
  "Who owes the most money?",
  "Suggest restock quantities",
  "Identify slowest moving items"
]

const QUICK_ACTIONS_BN = [
  "গত সপ্তাহের বিক্রয় সারসংক্ষেপ",
  "স্টক কম আছে এমন পণ্যের রিপোর্ট",
  "সেরা কাস্টমারদের তালিকা",
  "আয় বৃদ্ধির প্রবণতা বিশ্লেষণ",
  "কার কাছে বেশি টাকা বকেয়া আছে?",
  "কতটুকু পণ্য কেনা দরকার পরামর্শ দাও",
  "সবচেয়ে কম বিক্রি হওয়া পণ্যগুলো কি?"
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
        ? "হ্যালো! আমি SpecsAI। আমি আপনার ব্যবসার সব ডেটা জানি। আপনার ইনভেন্টরি, সেলস বা বাকি নিয়ে কোনো প্রশ্ন আছে? সরাসরি জিজ্ঞেস করতে পারেন!" 
        : "Hi! I'm SpecsAI. I know your business inside out. Got questions about inventory, sales, or debts? Just ask me!" 
    }
  ])

  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  const handleSend = async (text?: string) => {
    const messageText = text || input
    if (!messageText.trim() || isLoading) return
    
    const userMsg = { id: Date.now(), role: "user" as const, content: messageText }
    setMessages(prev => [...prev, userMsg])
    setInput("")
    setIsLoading(true)

    try {
      // Prepare detailed business context summary
      const inventorySummary = products.length > 0 
        ? products.map(p => `${p.name}: ${p.stock} ${p.unit} (Buy: ${currency}${p.purchasePrice}, Sell: ${currency}${p.sellingPrice})`).join(', ')
        : "No inventory records found."
        
      const salesSummary = sales.length > 0
        ? sales.map(s => `${currency}${s.total} (${s.isBakiPayment ? 'Baki Payment' : 'Direct Sale'}) on ${new Date(s.saleDate).toLocaleDateString()}`).slice(0, 30).join(', ')
        : "No sales recorded yet."
        
      const customersSummary = customers.length > 0
        ? customers.map(c => `${c.firstName}: ${currency}${c.totalDue} total baki`).slice(0, 20).join(', ')
        : "No customer records found."
        
      const totalRevenue = sales.reduce((acc, s) => acc + (s.total || 0), 0)

      const history = messages.map(m => ({ role: m.role, content: m.content })).slice(-15)

      const result = await businessChat({
        message: messageText,
        history,
        businessContext: {
          inventorySummary,
          salesSummary,
          customersSummary,
          totalRevenue,
          currency
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
        title: language === 'bn' ? "কানেকশন সমস্যা" : "AI Connection Error", 
        description: language === 'bn' ? "সার্ভারে সমস্যা হচ্ছে, একটু পরে চেষ্টা করুন।" : "The AI service is currently busy. Please try again in a moment." 
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
            <Bot className="w-5 h-5 md:w-6 md:h-6 text-accent shrink-0" /> SpecsAI
          </h2>
          <p className="text-[10px] md:text-xs text-muted-foreground truncate">Your advanced, informal business buddy.</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 px-3 py-1 flex items-center shrink-0">
            <Wifi className="w-3 h-3 mr-1 animate-pulse" /> {language === 'bn' ? 'সক্রিয়' : 'Always Active'}
          </Badge>
          <Badge variant="outline" className="text-accent border-accent px-3 py-1 flex items-center shrink-0 hidden sm:flex">
            <Sparkles className="w-3 h-3 mr-1" /> {language === 'bn' ? 'অ্যাডভান্সড ব্রেইন' : 'Advanced Brain'}
          </Badge>
        </div>
      </div>

      <div className="flex-1 grid lg:grid-cols-4 gap-6 min-h-0 w-full">
        <Card className="lg:col-span-3 flex flex-col min-h-0 shadow-lg border-accent/20 w-full overflow-hidden bg-white">
          <CardHeader className="border-b bg-accent/5 p-3 md:p-4 py-3 shrink-0">
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8 border-2 border-accent shrink-0 shadow-sm">
                <AvatarFallback className="bg-accent text-white"><Bot className="w-4 h-4" /></AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <CardTitle className="text-sm truncate">SpecsAI</CardTitle>
                <CardDescription className="text-[10px] truncate flex items-center gap-1">
                  {isLoading ? (
                    <span className="flex items-center gap-1 font-bold text-accent">
                      <Loader2 className="w-2 h-2 animate-spin" /> {language === 'bn' ? 'ডেটা এনালাইজ করছি...' : 'Thinking and analyzing...'}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-green-500" /> {language === 'bn' ? 'অনলাইনে আছে' : 'Ready to help'}</span>
                  )}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="flex-1 min-h-0 p-0 overflow-hidden relative">
            <ScrollArea className="h-full w-full">
              <div className="p-4 space-y-6">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} w-full`}>
                    <div className={`max-w-[85%] md:max-w-[75%] p-4 rounded-2xl break-words shadow-sm transition-all ${
                      msg.role === 'user' 
                        ? 'bg-accent text-white rounded-tr-none' 
                        : 'bg-muted/50 text-foreground rounded-tl-none border border-accent/10'
                    }`}>
                      <p className="text-xs md:text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start w-full">
                    <div className="bg-muted/30 text-foreground p-4 rounded-2xl rounded-tl-none border border-accent/5 flex items-center gap-3">
                      <div className="flex gap-1">
                        <div className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce [animation-delay:-0.3s]" />
                        <div className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce [animation-delay:-0.15s]" />
                        <div className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce" />
                      </div>
                      <span className="text-[10px] uppercase font-bold tracking-widest text-accent/70">{language === 'bn' ? 'ভাবছি...' : 'Analyzing...'}</span>
                    </div>
                  </div>
                )}
                <div ref={scrollRef} />
              </div>
            </ScrollArea>
          </CardContent>

          <div className="shrink-0 border-t bg-white/50 w-full">
            <div className="px-3 md:px-4 py-2 bg-muted/20 w-full">
              <ScrollArea className="w-full whitespace-nowrap">
                <div className="flex gap-2 pb-2">
                  {actions.map((action, i) => (
                    <Button 
                      key={i} 
                      variant="outline" 
                      size="sm"
                      className="text-[10px] h-7 rounded-full border-accent/20 bg-white hover:border-accent hover:bg-accent/5 shrink-0 transition-all"
                      onClick={() => handleSend(action)}
                      disabled={isLoading}
                    >
                      {action}
                    </Button>
                  ))}
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </div>
            
            <CardFooter className="p-3 md:p-4 w-full bg-white">
              <div className="flex w-full gap-2">
                <Input 
                  placeholder={language === 'bn' ? "ব্যবসায়িক প্রশ্ন করুন (যেমন: কার কত বাকি?)" : "Ask about inventory, sales, or debts..."}
                  className="flex-1 text-sm h-11 shadow-inner border-accent/10 focus-visible:ring-accent bg-muted/5"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSend()}
                  disabled={isLoading}
                />
                <Button 
                  className="bg-accent hover:bg-accent/90 shrink-0 h-11 w-11 p-0 shadow-lg shadow-accent/20 transition-transform active:scale-95" 
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
          <Card className="border-accent/10">
            <CardHeader className="p-4">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-primary">
                <Wifi className="w-4 h-4 text-green-500" /> {language === 'bn' ? 'অ্যাসিস্ট্যান্ট স্ট্যাটাস' : 'Connection Status'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-4 pt-0">
              <div className="flex items-center justify-between text-[11px] border-b pb-2">
                <span className="text-muted-foreground">Brain Model</span>
                <span className="font-bold text-accent">Gemini Advanced</span>
              </div>
              <div className="flex items-center justify-between text-[11px] border-b pb-2">
                <span className="text-muted-foreground">{language === 'bn' ? 'ডেটা সিঙ্ক' : 'Database Sync'}</span>
                <span className="font-bold text-green-600">{language === 'bn' ? 'লাইভ' : 'Active'}</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-muted-foreground">{language === 'bn' ? 'টোন' : 'Response Mode'}</span>
                <span className="font-bold text-blue-600">{language === 'bn' ? 'অনানুষ্ঠানিক' : 'Informal'}</span>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-primary text-white border-none shadow-xl relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 opacity-10 group-hover:scale-125 transition-transform duration-500">
               <Bot className="w-24 h-24" />
            </div>
            <CardHeader className="p-4 pb-2 relative">
              <CardTitle className="text-xs uppercase tracking-widest font-bold opacity-70 flex items-center gap-2">
                <Sparkles className="w-3 h-3 text-accent" /> {language === 'bn' ? 'স্মার্ট ব্রেইন' : 'Intelligence'}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 relative">
              <p className="text-[11px] leading-relaxed opacity-90">
                {language === 'bn' 
                  ? "আমি আপনার ব্যবসার ট্রেন্ড বুঝতে পারি। কার কাছে কত টাকা আটকে আছে বা কোন মালটা বেশি চলছে—সবই আমি বলে দিতে পারব।" 
                  : "I can spot trends in your business. I'll tell you who owes the most or which items are selling like hotcakes."}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
