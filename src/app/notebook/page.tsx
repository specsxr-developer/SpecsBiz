
"use client"

import { useState, useMemo, useEffect, useRef } from "react"
import { 
  BookOpen, 
  Plus, 
  Search, 
  Trash2, 
  Pin, 
  Sparkles, 
  MoreVertical,
  Type,
  List,
  Bold,
  Italic,
  Palette,
  Clock,
  Save,
  ChevronLeft,
  Bot,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Highlighter
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { useUser, useFirestore, useMemoFirebase, useCollection } from "@/firebase"
import { collection, query, orderBy, doc, deleteDoc, updateDoc, setDoc, serverTimestamp } from "firebase/firestore"
import { useBusinessData } from "@/hooks/use-business-data"
import { translations } from "@/lib/translations"
import { cn } from "@/lib/utils"

const NOTE_COLORS = [
  { name: "White", class: "bg-white border-muted" },
  { name: "Yellow", class: "bg-amber-50 border-amber-200" },
  { name: "Blue", class: "bg-blue-50 border-blue-200" },
  { name: "Green", class: "bg-emerald-50 border-emerald-200" },
  { name: "Red", class: "bg-rose-50 border-rose-200" },
  { name: "Purple", class: "bg-purple-50 border-purple-200" },
  { name: "Teal", class: "bg-teal-50 border-teal-200" },
]

export default function NotebookPage() {
  const { user } = useUser()
  const db = useFirestore()
  const { language } = useBusinessData()
  const t = translations[language]

  const [search, setSearch] = useState("")
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null)
  const [localNotes, setLocalNotes] = useState<any[]>([])
  
  // Toolbar State
  const [activeFormats, setActiveFormats] = useState({
    bold: false,
    italic: false,
    underline: false,
    align: 'left'
  })

  // Real-time Firestore notes
  const notesQuery = useMemoFirebase(() => {
    if (!user?.uid || !db) return null;
    return query(collection(db, 'users', user.uid, 'notes'), orderBy('updatedAt', 'desc'));
  }, [user?.uid, db]);

  const { data: fbNotes, isLoading } = useCollection(notesQuery);
  const notes = user ? (fbNotes || []) : localNotes;

  // Selected note detail
  const activeNote = useMemo(() => notes.find(n => n.id === selectedNoteId), [notes, selectedNoteId]);

  // Load local notes if offline
  useEffect(() => {
    if (!user && typeof window !== 'undefined') {
      const saved = localStorage.getItem('specsbiz_local_notes');
      if (saved) setLocalNotes(JSON.parse(saved));
    }
  }, [user]);

  const handleSaveNote = (updates: any) => {
    if (!selectedNoteId) return;
    const newUpdatedAt = new Date().toISOString();
    
    if (user?.uid && db) {
      const noteRef = doc(db, 'users', user.uid, 'notes', selectedNoteId);
      updateDoc(noteRef, { ...updates, updatedAt: serverTimestamp() });
    } else {
      const updated = localNotes.map(n => n.id === selectedNoteId ? { ...n, ...updates, updatedAt: newUpdatedAt } : n);
      setLocalNotes(updated);
      localStorage.setItem('specsbiz_local_notes', JSON.stringify(updated));
    }
  }

  const handleCreateNote = () => {
    const id = Date.now().toString();
    const newNote = {
      id,
      title: "",
      content: "",
      color: "White",
      isPinned: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (user?.uid && db) {
      const noteRef = doc(db, 'users', user.uid, 'notes', id);
      setDoc(noteRef, { ...newNote, updatedAt: serverTimestamp(), createdAt: serverTimestamp() });
    } else {
      const updated = [newNote, ...localNotes];
      setLocalNotes(updated);
      localStorage.setItem('specsbiz_local_notes', JSON.stringify(updated));
    }
    setSelectedNoteId(id);
  }

  const handleDeleteNote = (id: string) => {
    if (user?.uid && db) {
      deleteDoc(doc(db, 'users', user.uid, 'notes', id));
    } else {
      const updated = localNotes.filter(n => n.id !== id);
      setLocalNotes(updated);
      localStorage.setItem('specsbiz_local_notes', JSON.stringify(updated));
    }
    if (selectedNoteId === id) setSelectedNoteId(null);
  }

  const toggleFormat = (format: keyof typeof activeFormats) => {
    if (format === 'align') return; // Handled separately
    setActiveFormats(prev => ({ ...prev, [format]: !prev[format] }));
  }

  const setAlign = (align: string) => {
    setActiveFormats(prev => ({ ...prev, align }));
  }

  const filteredNotes = useMemo(() => {
    const filtered = notes.filter(n => 
      n.title.toLowerCase().includes(search.toLowerCase()) || 
      n.content.toLowerCase().includes(search.toLowerCase())
    );
    // Move pinned to top
    return [...filtered].sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0));
  }, [notes, search]);

  return (
    <div className="flex h-[calc(100vh-140px)] gap-6 animate-in zoom-in-95 duration-500 overflow-hidden relative">
      {/* Sidebar List */}
      <div className={cn(
        "flex flex-col gap-4 w-full md:w-80 shrink-0 h-full",
        selectedNoteId && "hidden md:flex"
      )}>
        <div className="flex items-center justify-between gap-2 shrink-0">
          <h2 className="text-xl font-bold font-headline text-primary flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-accent" /> {t.notebook}
          </h2>
          <Button size="icon" className="bg-accent hover:bg-accent/90 rounded-full h-10 w-10 shadow-lg" onClick={handleCreateNote}>
            <Plus className="w-5 h-5" />
          </Button>
        </div>

        <div className="relative shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder={t.search} 
            className="pl-9 h-11 bg-white/50 backdrop-blur-sm shadow-sm" 
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <ScrollArea className="flex-1 -mx-1 pr-1">
          <div className="space-y-3 pb-6 px-1">
            {filteredNotes.length === 0 ? (
              <div className="text-center py-24 text-muted-foreground italic flex flex-col items-center gap-3">
                <BookOpen className="w-12 h-12 opacity-10" />
                <p className="text-xs">{t.noNotes}</p>
              </div>
            ) : (
              filteredNotes.map((note) => {
                const colorClass = NOTE_COLORS.find(c => c.name === note.color)?.class || "bg-white";
                return (
                  <Card 
                    key={note.id} 
                    className={cn(
                      "cursor-pointer transition-all hover:scale-[1.02] border-l-4 shadow-sm",
                      colorClass,
                      selectedNoteId === note.id ? "ring-2 ring-accent border-l-accent" : "border-l-transparent"
                    )}
                    onClick={() => setSelectedNoteId(note.id)}
                  >
                    <CardHeader className="p-4 pb-1">
                      <div className="flex items-center justify-between gap-2">
                        <CardTitle className="text-sm font-bold truncate flex-1 text-primary">
                          {note.title || (language === 'en' ? "Untitled Note" : "শিরোনামহীন নোট")}
                        </CardTitle>
                        {note.isPinned && <Pin className="w-3 h-3 text-accent fill-accent shrink-0" />}
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed h-8">
                        {note.content || t.notesPlaceholder}
                      </p>
                      <div className="flex items-center justify-between mt-3 text-[9px] text-muted-foreground font-medium opacity-70">
                        <div className="flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          {note.updatedAt ? new Date(note.updatedAt).toLocaleDateString() : "Just now"}
                        </div>
                        <Badge variant="ghost" className="h-4 px-1 text-[8px] uppercase">{note.color}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Editor Area */}
      <div className={cn(
        "flex-1 flex flex-col min-w-0 bg-white rounded-3xl shadow-2xl border border-accent/10 overflow-hidden h-full",
        !selectedNoteId && "hidden md:flex items-center justify-center bg-accent/5"
      )}>
        {!selectedNoteId ? (
          <div className="flex flex-col items-center gap-6 animate-in fade-in zoom-in-95 duration-700">
            <div className="h-28 w-28 rounded-full bg-accent/10 flex items-center justify-center text-accent shadow-inner">
               <BookOpen className="w-14 h-14" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-primary">SpecsBiz Smart Editor</h3>
              <p className="text-sm text-muted-foreground italic">Select or create a note to begin customizing.</p>
            </div>
          </div>
        ) : (
          <div className={cn(
            "flex flex-col h-full transition-colors duration-500",
            NOTE_COLORS.find(c => c.name === activeNote?.color)?.class
          )}>
            {/* Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b bg-white/40 backdrop-blur-md sticky top-0 z-20">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="h-9 w-9 md:hidden" onClick={() => setSelectedNoteId(null)}>
                  <ChevronLeft className="w-5 h-5" />
                </Button>
                
                <div className="flex items-center bg-white/80 rounded-xl border shadow-sm p-1">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className={cn("h-8 w-8 transition-colors", activeFormats.bold ? "bg-accent/20 text-accent font-bold" : "hover:bg-accent/10 hover:text-accent")}
                    onClick={() => toggleFormat('bold')}
                  >
                    <Bold className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className={cn("h-8 w-8 transition-colors", activeFormats.italic ? "bg-accent/20 text-accent" : "hover:bg-accent/10 hover:text-accent")}
                    onClick={() => toggleFormat('italic')}
                  >
                    <Italic className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className={cn("h-8 w-8 transition-colors", activeFormats.underline ? "bg-accent/20 text-accent" : "hover:bg-accent/10 hover:text-accent")}
                    onClick={() => toggleFormat('underline')}
                  >
                    <Underline className="w-4 h-4" />
                  </Button>
                  <div className="h-4 w-px bg-muted mx-1" />
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className={cn("h-8 w-8 transition-colors", activeFormats.align === 'left' ? "bg-accent/20 text-accent" : "hover:bg-accent/10 hover:text-accent")}
                    onClick={() => setAlign('left')}
                  >
                    <AlignLeft className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className={cn("h-8 w-8 transition-colors", activeFormats.align === 'center' ? "bg-accent/20 text-accent" : "hover:bg-accent/10 hover:text-accent")}
                    onClick={() => setAlign('center')}
                  >
                    <AlignCenter className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className={cn("h-8 w-8 transition-colors", activeFormats.align === 'right' ? "bg-accent/20 text-accent" : "hover:bg-accent/10 hover:text-accent")}
                    onClick={() => setAlign('right')}
                  >
                    <AlignRight className="w-4 h-4" />
                  </Button>
                </div>

                <div className="flex items-center bg-white/80 rounded-xl border shadow-sm p-1 gap-1">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-accent"><Palette className="w-4 h-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="grid grid-cols-4 gap-2 p-3 w-40">
                      {NOTE_COLORS.map(c => (
                        <Button 
                          key={c.name} 
                          title={c.name}
                          className={cn("h-7 w-7 rounded-full border-2 p-0 transition-transform hover:scale-110", c.class, activeNote?.color === c.name ? "border-accent" : "border-transparent")} 
                          onClick={() => handleSaveNote({ color: c.name })}
                        />
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className={cn("h-8 w-8 transition-colors", activeNote?.isPinned ? "bg-accent/20 text-accent" : "text-muted-foreground")}
                    onClick={() => handleSaveNote({ isPinned: !activeNote?.isPinned })}
                  >
                    <Pin className={cn("w-4 h-4", activeNote?.isPinned && "fill-accent")} />
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" className="hidden sm:flex h-9 text-xs gap-2 border-accent text-accent bg-white/50 hover:bg-accent hover:text-white transition-all shadow-sm">
                   <Bot className="w-4 h-4" /> {t.aiNoteAssistant}
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-9 w-9 bg-white/80 border shadow-sm"><MoreVertical className="w-4 h-4" /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem className="text-destructive gap-2 text-xs font-bold" onClick={() => handleDeleteNote(activeNote.id)}>
                      <Trash2 className="w-4 h-4" /> {t.delete}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Note Editor Area */}
            <ScrollArea className="flex-1">
              <div className="max-w-4xl mx-auto p-8 md:p-12 space-y-6">
                <div className="space-y-4">
                  <Input 
                    className="text-3xl md:text-5xl font-black font-headline border-none bg-transparent focus-visible:ring-0 p-0 h-auto placeholder:opacity-10 text-primary" 
                    placeholder={language === 'en' ? "Note Title" : "নোটের শিরোনাম"}
                    value={activeNote?.title || ""}
                    onChange={e => handleSaveNote({ title: e.target.value })}
                  />
                  
                  <div className="flex flex-wrap items-center gap-4 text-[11px] text-muted-foreground font-bold uppercase tracking-widest opacity-60 pb-4 border-b border-black/5">
                    <span className="flex items-center gap-1.5 bg-white/40 px-2 py-1 rounded-md">
                      <Save className="w-3.5 h-3.5 text-accent" /> {language === 'en' ? "Live Cloud Sync" : "ক্লাউড সিঙ্ক চালু"}
                    </span>
                    <span className="flex items-center gap-1.5 bg-white/40 px-2 py-1 rounded-md">
                      <Clock className="w-3.5 h-3.5" /> 
                      {language === 'en' ? "Last Modified:" : "শেষ পরিবর্তন:"} {activeNote?.updatedAt ? new Date(activeNote.updatedAt).toLocaleString() : "..."}
                    </span>
                  </div>
                </div>

                <Textarea 
                  className={cn(
                    "w-full text-base md:text-xl leading-loose border-none bg-transparent focus-visible:ring-0 p-0 resize-none placeholder:opacity-20 min-h-[60vh] font-body",
                    activeFormats.bold && "font-bold",
                    activeFormats.italic && "italic",
                    activeFormats.underline && "underline",
                    activeFormats.align === 'center' && "text-center",
                    activeFormats.align === 'right' && "text-right"
                  )}
                  placeholder={t.notesPlaceholder}
                  value={activeNote?.content || ""}
                  onChange={e => handleSaveNote({ content: e.target.value })}
                />
              </div>
            </ScrollArea>
            
            {/* Quick Stats Footer */}
            <div className="px-6 py-3 border-t bg-white/20 backdrop-blur-sm flex justify-between items-center text-[10px] font-bold text-muted-foreground uppercase">
               <div className="flex items-center gap-3">
                 <span>{activeNote?.content?.length || 0} characters</span>
                 <span>{activeNote?.content?.split(/\s+/).filter(Boolean).length || 0} words</span>
               </div>
               <div className="flex items-center gap-1">
                 <Bot className="w-3 h-3 text-accent" /> SpecsBiz Smart Notes
               </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
