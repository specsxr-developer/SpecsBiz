
"use client"

import { useState } from "react"
import { 
  Bot, 
  Send, 
  Sparkles, 
  Settings, 
  History, 
  Store,
  MessageSquare,
  TrendingUp,
  Package,
  Users,
  AlertCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

const QUICK_ACTIONS = [
  "Summarize last week's sales",
  "Generate low stock report",
  "Find VIP customers",
  "Analyze revenue trends",
  "Suggest restock quantities",
  "Compare sales with last month",
  "Identify slowest moving items",
  "Segment customers by spending",
  "Forecast next month's sales",
  "Check high-margin products",
  "List inactive customers",
  "Show sales by category",
  "Identify peak sales hours",
  "Recommend pricing adjustments",
  "Add new product from description"
]

export default function AIAssistantPage() {
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState([
    { id: 1, role: "assistant", content: "Hello! I'm your SpecsBiz Smart Assistant. How can I help you manage your business today? I can help with inventory updates, sales summaries, or customer segmentation." }
  ])

  const handleSend = (text?: string) => {
    const messageText = text || input
    if (!messageText.trim()) return
    
    const userMsg = { id: Date.now(), role: "user", content: messageText }
    setMessages(prev => [...prev, userMsg])
    setInput("")

    // Mock AI response
    setTimeout(() => {
      const assistantMsg = { 
        id: Date.now() + 1, 
        role: "assistant", 
        content: "I've analyzed your request. Based on current sales data, I've identified several trends and potential actions. Would you like a detailed report on this?" 
      }
      setMessages(prev => [...prev, assistantMsg])
    }, 1000)
  }

  return (
    <div className="flex flex-col gap-4 h-[calc(100vh-120px)] animate-in zoom-in-95 duration-500">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 shrink-0">
        <div>
          <h2 className="text-xl md:text-2xl font-bold font-headline text-primary flex items-center gap-2">
            <Bot className="w-5 h-5 md:w-6 md:h-6 text-accent" /> AI Business Assistant
          </h2>
          <p className="text-xs text-muted-foreground">Your intelligent companion for business insights.</p>
        </div>
        <Badge variant="outline" className="text-accent border-accent px-3 py-1 flex justify-center">
          <Sparkles className="w-3 h-3 mr-1" /> Powered by Gemini
        </Badge>
      </div>

      <div className="flex-1 grid lg:grid-cols-4 gap-6 min-h-0">
        <Card className="lg:col-span-3 flex flex-col min-h-0 shadow-lg border-accent/20">
          <CardHeader className="border-b bg-accent/5 p-4 py-3 shrink-0">
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8 border-2 border-accent">
                <AvatarFallback className="bg-accent text-white"><Bot className="w-4 h-4" /></AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-sm">SpecsBiz Chat</CardTitle>
                <CardDescription className="text-[10px]">Active and ready to assist</CardDescription>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="flex-1 min-h-0 p-0 overflow-hidden">
            <ScrollArea className="h-full p-4">
              <div className="space-y-4">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] p-3 rounded-2xl ${
                      msg.role === 'user' 
                        ? 'bg-accent text-white rounded-tr-none shadow-md' 
                        : 'bg-muted text-foreground rounded-tl-none border'
                    }`}>
                      <p className="text-xs md:text-sm leading-relaxed">{msg.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>

          <div className="shrink-0 border-t bg-white/50">
            <div className="px-4 py-2 bg-muted/30">
              <p className="text-[10px] font-bold text-muted-foreground uppercase mb-2 flex items-center gap-1">
                <MessageSquare className="w-3 h-3" /> Suggestions
              </p>
              <ScrollArea className="w-full whitespace-nowrap">
                <div className="flex gap-2 pb-2">
                  {QUICK_ACTIONS.map((action, i) => (
                    <Button 
                      key={i} 
                      variant="outline" 
                      size="sm"
                      className="text-[10px] h-7 rounded-full border-accent/20 hover:border-accent hover:bg-accent/5"
                      onClick={() => handleSend(action)}
                    >
                      {action}
                    </Button>
                  ))}
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </div>
            
            <CardFooter className="p-3 md:p-4">
              <div className="flex w-full gap-2">
                <Input 
                  placeholder="Ask your business assistant..." 
                  className="flex-1 text-sm h-10 shadow-inner"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSend()}
                />
                <Button className="bg-accent hover:bg-accent/90 shrink-0 h-10 w-10 p-0 shadow-lg" onClick={() => handleSend()}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </CardFooter>
          </div>
        </Card>

        {/* Sidebar only visible on Desktop, but content is now available on mobile via suggestions list */}
        <div className="hidden lg:flex flex-col gap-6 overflow-y-auto pr-1">
          <Card>
            <CardHeader className="p-4">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <History className="w-4 h-4 text-accent" /> Recent Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-4 pt-0">
              <div className="flex items-start gap-3 p-2 rounded-lg bg-blue-50/50 border border-blue-100">
                <div className="p-1.5 rounded bg-blue-100 text-blue-600 shrink-0"><Store className="w-3.5 h-3.5" /></div>
                <div>
                  <p className="text-xs font-bold">Inventory Shift</p>
                  <p className="text-[10px] text-muted-foreground">High demand for clear frames detected.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-2 rounded-lg bg-green-50/50 border border-green-100">
                <div className="p-1.5 rounded bg-green-100 text-green-600 shrink-0"><TrendingUp className="w-3.5 h-3.5" /></div>
                <div>
                  <p className="text-xs font-bold">Sales Growth</p>
                  <p className="text-[10px] text-muted-foreground">Lenses category up 15% this week.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-2 rounded-lg bg-red-50/50 border border-red-100">
                <div className="p-1.5 rounded bg-red-100 text-red-600 shrink-0"><AlertCircle className="w-3.5 h-3.5" /></div>
                <div>
                  <p className="text-xs font-bold">Low Stock Alert</p>
                  <p className="text-[10px] text-muted-foreground">3 items are below threshold.</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-primary text-white border-none shadow-xl">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-xs uppercase tracking-widest font-bold opacity-70">Pro Tip</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <p className="text-[11px] leading-relaxed">
                Try asking "What was my most profitable sale today?" to get a quick summary of your high-margin transactions.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
