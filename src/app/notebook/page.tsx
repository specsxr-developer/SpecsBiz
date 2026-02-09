
"use client"

import { useState, useMemo, useEffect } from "react"
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
  Bot
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
  { name: "Yellow", class: "bg-yellow-50 border-yellow-200" },
  { name: "Blue", class: "bg-blue-50 border-blue-200" },
  { name: "Green", class: "bg-green-50 border-green-200" },
  { name: "Red", class: "bg-red-50 border-red-200" },
  { name: "Purple", class: "bg-purple-50 border-purple-200" },
]

export default function NotebookPage() {
  const { user } = useUser()
  const db = useFirestore()
  const { language } = useBusinessData()
  const t = translations[language]

  const [search, setSearch] = useState("")
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null)
  const [localNotes, setLocalNotes] = useState<any[]>([])
  
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
      title: "Untitled Note",
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

  const filteredNotes = useMemo(() => {
    const filtered = notes.filter(n => 
      n.title.toLowerCase().includes(search.toLowerCase()) || 
      n.content.toLowerCase().includes(search.toLowerCase())
    );
    // Move pinned to top
    return [...filtered].sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0));
  }, [notes, search]);

  return (
    <div className="flex h-[calc(100vh-140px)] gap-6 animate-in zoom-in-95 duration-500 overflow-hidden">
      {/* Sidebar List */}
      <div className={cn(
        "flex flex-col gap-4 w-full md:w-80 shrink-0",
        selectedNoteId && "hidden md:flex"
      )}>
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-xl font-bold font-headline text-primary flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-accent" /> {t.notebook}
          </h2>
          <Button size="icon" className="bg-accent hover:bg-accent/90 rounded-full h-10 w-10 shadow-lg" onClick={handleCreateNote}>
            <Plus className="w-5 h-5" />
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder={t.search} 
            className="pl-9 h-11 bg-white/50 backdrop-blur-sm" 
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <ScrollArea className="flex-1 -mx-1 pr-1">
          <div className="space-y-3 pb-4">
            {filteredNotes.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground italic">
                <BookOpen className="w-10 h-10 mx-auto opacity-10 mb-2" />
                <p className="text-xs">{t.noNotes}</p>
              </div>
            ) : (
              filteredNotes.map((note) => {
                const colorClass = NOTE_COLORS.find(c => c.name === note.color)?.class || "bg-white";
                return (
                  <Card 
                    key={note.id} 
                    className={cn(
                      "cursor-pointer transition-all hover:shadow-md border-l-4",
                      colorClass,
                      selectedNoteId === note.id ? "ring-2 ring-accent border-l-accent" : "border-l-transparent"
                    )}
                    onClick={() => setSelectedNoteId(note.id)}
                  >
                    <CardHeader className="p-3 pb-1">
                      <div className="flex items-center justify-between gap-2">
                        <CardTitle className="text-sm font-bold truncate flex-1">{note.title || "Untitled"}</CardTitle>
                        {note.isPinned && <Pin className="w-3 h-3 text-accent fill-accent" />}
                      </div>
                    </CardHeader>
                    <CardContent className="p-3 pt-0">
                      <p className="text-[10px] text-muted-foreground line-clamp-2 leading-relaxed">
                        {note.content || t.notesPlaceholder}
                      </p>
                      <div className="flex items-center gap-1 mt-2 text-[8px] text-muted-foreground opacity-70">
                        <Clock className="w-2.5 h-2.5" />
                        {note.updatedAt ? new Date(note.updatedAt).toLocaleDateString() : "Just now"}
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
        "flex-1 flex flex-col min-w-0 bg-white rounded-2xl shadow-xl border border-accent/10 overflow-hidden",
        !selectedNoteId && "hidden md:flex items-center justify-center bg-accent/5 italic text-muted-foreground"
      )}>
        {!selectedNoteId ? (
          <div className="flex flex-col items-center gap-4">
            <div className="h-20 w-20 rounded-full bg-accent/10 flex items-center justify-center text-accent">
               <BookOpen className="w-10 h-10" />
            </div>
            <p className="text-sm">Select a note to view its content</p>
          </div>
        ) : (
          <>
            {/* Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 border-b bg-accent/5 backdrop-blur-md">
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8 md:hidden" onClick={() => setSelectedNoteId(null)}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <div className="h-4 w-px bg-muted mx-1 hidden md:block" />
                
                <div className="flex bg-white rounded-lg border p-0.5 shadow-sm">
                  <Button variant="ghost" size="icon" className="h-7 w-7"><Bold className="w-3.5 h-3.5" /></Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7"><Italic className="w-3.5 h-3.5" /></Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7"><List className="w-3.5 h-3.5" /></Button>
                </div>

                <div className="flex bg-white rounded-lg border p-0.5 shadow-sm ml-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7"><Palette className="w-3.5 h-3.5 text-accent" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="grid grid-cols-3 gap-1 p-2">
                      {NOTE_COLORS.map(c => (
                        <Button 
                          key={c.name} 
                          className={cn("h-6 w-6 rounded-full border p-0", c.class)} 
                          onClick={() => handleSaveNote({ color: c.name })}
                        />
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className={cn("h-7 w-7", activeNote?.isPinned && "text-accent fill-accent")}
                    onClick={() => handleSaveNote({ isPinned: !activeNote?.isPinned })}
                  >
                    <Pin className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="h-8 text-[10px] gap-2 border-accent text-accent">
                   <Bot className="w-3 h-3" /> Magic Write
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="w-4 h-4" /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem className="text-destructive gap-2 text-xs" onClick={() => handleDeleteNote(activeNote.id)}>
                      <Trash2 className="w-3.5 h-3.5" /> Delete Note
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Note Fields */}
            <div className={cn(
              "flex-1 flex flex-col p-6 md:p-10 space-y-4 transition-colors duration-500",
              NOTE_COLORS.find(c => c.name === activeNote?.color)?.class
            )}>
              <Input 
                className="text-2xl md:text-3xl font-black font-headline border-none bg-transparent focus-visible:ring-0 p-0 h-auto placeholder:opacity-20" 
                placeholder={t.noteTitle}
                value={activeNote?.title || ""}
                onChange={e => handleSaveNote({ title: e.target.value })}
              />
              <div className="flex items-center gap-4 text-[10px] text-muted-foreground font-bold uppercase tracking-widest opacity-50 pb-2 border-b">
                 <span className="flex items-center gap-1"><Save className="w-3 h-3" /> Auto Saved</span>
                 <span>Modified: {activeNote?.updatedAt ? new Date(activeNote.updatedAt).toLocaleString() : "..."}</span>
              </div>
              <Textarea 
                className="flex-1 text-sm md:text-base leading-relaxed border-none bg-transparent focus-visible:ring-0 p-0 resize-none placeholder:opacity-20"
                placeholder={t.notesPlaceholder}
                value={activeNote?.content || ""}
                onChange={e => handleSaveNote({ content: e.target.value })}
              />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
