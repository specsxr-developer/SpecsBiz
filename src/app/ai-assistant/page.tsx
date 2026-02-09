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
  "Compare sales with last month",
  "Identify slowest moving items"
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
        ? "হ্যালো! আমি আপনার SpecsBiz স্মার্ট অ্যাসিস্ট্যান্ট। আমি আপনার ইনভেন্টরি, সেলস এবং কাস্টমার ডাটা বিশ্লেষণে সাহায্য করতে পারি। আমি এখন অনলাইনে এবং আপনার ডাটার সাথে কানেক্টেড আছি।" 
        : "Hello! I'm your SpecsBiz Smart Assistant. I am online and synced with your real-time business data. How can I help you today?" 
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
      // Prepare business context summary with more detail
      const inventorySummary = products.length > 0 
        ? products.map(p => `${p.name}: ${p.stock} ${p.unit} (Price: ${currency}${p.sellingPrice})`).slice(0, 30).join(', ')
        : "No inventory records found."
        
      const salesSummary = sales.length > 0
        ? sales.map(s => `${currency}${s.total} on ${new Date(s.saleDate).toLocaleDateString()}`).slice(0, 20).join(', ')
        : "No sales recorded yet."
        
      const customersSummary = customers.length > 0
        ? customers.map(c => `${c.firstName}: ${currency}${c.totalDue} baki`).slice(0, 20).join(', ')
        : "No customer records found."
        
      const totalRevenue = sales.reduce((acc, s) => acc + (s.total || 0), 0)

      const history = messages.map(m => ({ role: m.role, content: m.content })).slice(-10)

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
        title: "AI Connection Error", 
        description: "The AI service is currently busy. Please try again in a moment." 
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-4 h-[calc(100vh-140px)] animate-in zoom-in-95 duration-500 w-full max-w-full">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 shrink-0">
        <div className="min-w-0">
          <h2 className="text-xl md:text-2xl font-bold font-headline text-primary flex items-center gap-2 truncate">
            <Bot className="w-5 h-5 md:w-6 md:h-6 text-accent shrink-0" /> {t.aiAssistant}
          </h2>
          <p className="text-[10px] md:text-xs text-muted-foreground truncate">Your intelligent companion for business insights.</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 px-3 py-1 flex items-center shrink-0">
            <Wifi className="w-3 h-3 mr-1 animate-pulse" /> Always Active
          </Badge>
          <Badge variant="outline" className="text-accent border-accent px-3 py-1 flex items-center shrink-0 hidden sm:flex">
            <Sparkles className="w-3 h-3 mr-1" /> Gemini Pro
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
                <CardTitle className="text-sm truncate">SpecsBiz Smart Brain</CardTitle>
                <CardDescription className="text-[10px] truncate flex items-center gap-1">
                  {isLoading ? (
                    <span className="flex items-center gap-1"><Loader2 className="w-2 h-2 animate-spin" /> Analyzing your business data...</span>
                  ) : (
                    <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-green-500" /> Synced with your store</span>
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
                      <span className="text-[10px] uppercase font-bold tracking-widest text-accent/70">Thinking...</span>
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
                  {QUICK_ACTIONS.map((action, i) => (
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
                  placeholder="Ask me about your inventory, sales, or debtors..." 
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
                <Wifi className="w-4 h-4 text-green-500" /> Connection Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-4 pt-0">
              <div className="flex items-center justify-between text-[11px] border-b pb-2">
                <span className="text-muted-foreground">AI Model</span>
                <span className="font-bold text-accent">Gemini 2.5 Flash</span>
              </div>
              <div className="flex items-center justify-between text-[11px] border-b pb-2">
                <span className="text-muted-foreground">Database Sync</span>
                <span className="font-bold text-green-600">Active</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-muted-foreground">Response Mode</span>
                <span className="font-bold text-blue-600">Smart Analysis</span>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-primary text-white border-none shadow-xl relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 opacity-10 group-hover:scale-125 transition-transform duration-500">
               <Bot className="w-24 h-24" />
            </div>
            <CardHeader className="p-4 pb-2 relative">
              <CardTitle className="text-xs uppercase tracking-widest font-bold opacity-70 flex items-center gap-2">
                <Sparkles className="w-3 h-3 text-accent" /> Intelligence
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 relative">
              <p className="text-[11px] leading-relaxed opacity-90">
                I can help you forecast trends, detect VIP customers, and suggest restock quantities based on your real sales history.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
