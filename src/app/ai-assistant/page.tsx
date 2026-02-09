
"use client"

import { useState } from "react"
import { 
  Bot, 
  Send, 
  Sparkles, 
  Settings, 
  History, 
  User, 
  Store,
  MessageSquare
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default function AIAssistantPage() {
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState([
    { id: 1, role: "assistant", content: "Hello! I'm your SpecsBiz Smart Assistant. How can I help you manage your business today? I can help with inventory updates, sales summaries, or customer segmentation." }
  ])

  const handleSend = () => {
    if (!input.trim()) return
    
    const userMsg = { id: Date.now(), role: "user", content: input }
    setMessages(prev => [...prev, userMsg])
    setInput("")

    // Mock AI response
    setTimeout(() => {
      const assistantMsg = { 
        id: Date.now() + 1, 
        role: "assistant", 
        content: "I've analyzed your request. Based on current sales data, your top performing category is Eyewear. Would you like me to generate a restock list for your low-stock aviator frames?" 
      }
      setMessages(prev => [...prev, assistantMsg])
    }, 1000)
  }

  return (
    <div className="flex flex-col gap-4 md:gap-6 h-full animate-in zoom-in-95 duration-500">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold font-headline text-primary flex items-center gap-2">
            <Bot className="w-5 h-5 md:w-6 md:h-6 text-accent" /> AI Business Assistant
          </h2>
          <p className="text-sm text-muted-foreground">Your intelligent companion for business insights.</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Badge variant="outline" className="text-accent border-accent px-3 py-1 flex-1 sm:flex-none justify-center">
            <Sparkles className="w-3 h-3 mr-1" /> Powered by Gemini
          </Badge>
          <Button variant="ghost" size="icon" className="shrink-0"><Settings className="w-4 h-4" /></Button>
        </div>
      </div>

      <div className="flex-1 grid lg:grid-cols-4 gap-6 min-h-0">
        <Card className="lg:col-span-3 flex flex-col min-h-[500px] lg:min-h-0 shadow-lg border-accent/20">
          <CardHeader className="border-b bg-accent/5 p-4 md:p-6">
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8 md:h-9 md:w-9 border-2 border-accent">
                <AvatarFallback className="bg-accent text-white"><Bot className="w-4 h-4 md:w-5 md:h-5" /></AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-sm md:text-base">SpecsBiz Chat</CardTitle>
                <CardDescription className="text-[10px] md:text-xs">Active and ready to assist</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 min-h-0 p-0 overflow-hidden">
            <ScrollArea className="h-full p-4">
              <div className="space-y-4">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] md:max-w-[80%] p-3 rounded-2xl ${
                      msg.role === 'user' 
                        ? 'bg-accent text-white rounded-tr-none' 
                        : 'bg-muted text-foreground rounded-tl-none'
                    }`}>
                      <p className="text-xs md:text-sm leading-relaxed">{msg.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
          <CardFooter className="p-3 md:p-4 border-t bg-white/50">
            <div className="flex w-full gap-2">
              <Input 
                placeholder="Ask something..." 
                className="flex-1 text-sm h-10"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
              />
              <Button className="bg-accent hover:bg-accent/90 shrink-0 h-10 w-10 p-0" onClick={handleSend}>
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </CardFooter>
        </Card>

        <div className="hidden lg:flex flex-col gap-6">
          <Card>
            <CardHeader className="p-4">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-accent" /> Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 p-4 pt-0">
              {[
                "Summarize last week's sales",
                "Generate low stock report",
                "Find VIP customers",
                "Add new product from photo"
              ].map((action, i) => (
                <Button 
                  key={i} 
                  variant="outline" 
                  className="w-full justify-start text-[10px] text-left h-auto py-2 px-3 border-muted-foreground/20 hover:border-accent hover:bg-accent/5"
                  onClick={() => setInput(action)}
                >
                  {action}
                </Button>
              ))}
            </CardContent>
          </Card>

          <Card className="flex-1">
            <CardHeader className="p-4">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <History className="w-4 h-4 text-accent" /> Recent Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-4 pt-0">
              <div className="flex items-start gap-3">
                <div className="p-1.5 rounded bg-blue-100 text-blue-600 shrink-0"><Store className="w-3.5 h-3.5" /></div>
                <div>
                  <p className="text-[10px] md:text-xs font-medium">Inventory Shift</p>
                  <p className="text-[9px] md:text-[10px] text-muted-foreground">High demand for clear frames detected.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
