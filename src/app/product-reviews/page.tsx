
"use client"

import { useState, useMemo } from "react"
import { 
  Camera, 
  Upload, 
  Trash2, 
  Plus, 
  CheckCircle2, 
  Package, 
  AlertTriangle,
  X,
  PlusCircle,
  ImageIcon,
  Loader2,
  RefreshCw
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useBusinessData } from "@/hooks/use-business-data"
import { useToast } from "@/hooks/use-toast"
import { translations } from "@/lib/translations"
import { cn } from "@/lib/utils"

export default function ProductReviewsPage() {
  const { products, actions, language, isLoading, currency } = useBusinessData()
  const { toast } = useToast()
  const t = translations[language]

  const [selectedProductId, setSelectedProductId] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const selectedProduct = useMemo(() => {
    return products.find(p => p.id === selectedProductId) || null
  }, [products, selectedProductId])

  const handleReviewImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedProduct) return
    const file = e.target.files?.[0]
    if (!file) return

    // Limit file size to ~500kb for Firestore safety
    if (file.size > 600 * 1024) {
      toast({ variant: "destructive", title: "Image too large", description: "Please upload image under 600KB for faster loading." })
      return
    }

    const currentImages = selectedProduct.reviewImages || []
    if (currentImages.length >= 5) {
      toast({ variant: "destructive", title: t.maxPhotosReached })
      return
    }

    setIsUploading(true)
    const reader = new FileReader()
    reader.onloadend = () => {
      const base64 = reader.result as string
      try {
        actions.updateProduct(selectedProduct.id, {
          reviewImages: [...currentImages, base64]
        })
        toast({ title: t.addReviewPhoto })
      } catch (err) {
        toast({ variant: "destructive", title: "Upload Failed", description: "Please check your internet and try again." })
      } finally {
        setIsUploading(false)
      }
    }
    reader.onerror = () => {
      setIsUploading(false)
      toast({ variant: "destructive", title: "Read Error" })
    }
    reader.readAsDataURL(file)
  }

  const removeReviewImage = (index: number) => {
    if (!selectedProduct) return
    const currentImages = [...(selectedProduct.reviewImages || [])]
    currentImages.splice(index, 1)
    actions.updateProduct(selectedProduct.id, {
      reviewImages: currentImages
    })
    toast({ title: t.delete })
  }

  if (isLoading) return <div className="p-10 text-center animate-pulse text-accent font-bold">{t.loading}</div>

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20 max-w-4xl mx-auto">
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-primary rounded-2xl shadow-lg">
            <Camera className="w-6 h-6 text-accent" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-primary uppercase tracking-tighter">{t.productReviews}</h2>
            <p className="text-[10px] font-bold text-accent uppercase tracking-[0.3em]">{t.manageReviewPhotos}</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={() => window.location.reload()} className="h-10 w-10 text-accent hover:bg-accent/10">
          <RefreshCw className="w-5 h-5" />
        </Button>
      </div>

      <Card className="border-accent/10 shadow-xl rounded-[2rem] overflow-hidden bg-white/50 backdrop-blur-sm">
        <CardHeader className="p-6 border-b bg-muted/20">
          <Label className="text-[10px] font-black uppercase mb-2 block">{t.selectProductToManage}</Label>
          <Select value={selectedProductId || ""} onValueChange={setSelectedProductId}>
            <SelectTrigger className="h-14 rounded-2xl border-accent/10 bg-white font-bold text-primary">
              <SelectValue placeholder="Pick a product from your inventory..." />
            </SelectTrigger>
            <SelectContent>
              {products.map(p => (
                <SelectItem key={p.id} value={p.id} className="font-bold">
                  {p.name} ({p.category || 'General'})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>
        
        <CardContent className="p-6">
          {!selectedProduct ? (
            <div className="py-24 text-center text-muted-foreground italic flex flex-col items-center gap-4 opacity-30">
              <div className="h-20 w-20 rounded-full bg-accent/5 flex items-center justify-center">
                <Package className="w-10 h-10" />
              </div>
              <p className="font-black uppercase tracking-widest text-xs">Select a product to start syncing photos</p>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-accent/10 shadow-sm relative group">
                <div className="w-24 h-24 rounded-xl bg-muted overflow-hidden border-2 border-accent/10 shadow-inner shrink-0">
                  {selectedProduct.imageUrl ? (
                    <img src={selectedProduct.imageUrl} alt={selectedProduct.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-accent/20">
                      <ImageIcon className="w-10 h-10" />
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="text-xl font-black text-primary leading-tight truncate">{selectedProduct.name}</h3>
                  <div className="flex items-center gap-2 mt-1.5">
                    <Badge variant="outline" className="text-[9px] font-black uppercase border-accent/20 text-accent bg-accent/5">
                      {selectedProduct.category || 'N/A'}
                    </Badge>
                    <span className="text-[9px] font-bold text-muted-foreground uppercase opacity-50">ID: {selectedProduct.id.slice(-6)}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-accent/5 pb-2">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                    <ImageIcon className="w-3 h-3 text-accent" /> Review Photo Gallery
                  </h4>
                  <Badge className="bg-primary text-white border-none text-[10px] font-black h-6">
                    {(selectedProduct.reviewImages || []).length} / 5
                  </Badge>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                  {(selectedProduct.reviewImages || []).map((img: string, idx: number) => (
                    <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden border-2 border-accent/10 group shadow-md bg-white">
                      <img src={img} alt={`Review ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      <button 
                        onClick={() => removeReviewImage(idx)}
                        className="absolute top-2 right-2 p-2 bg-destructive/90 text-white rounded-xl opacity-0 group-hover:opacity-100 transition-all shadow-xl hover:bg-destructive active:scale-90"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}

                  {(selectedProduct.reviewImages || []).length < 5 && (
                    <div className="relative">
                      <Label 
                        htmlFor="review-upload" 
                        className={cn(
                          "aspect-square rounded-2xl border-4 border-dashed flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-accent/5 hover:border-accent transition-all group overflow-hidden relative shadow-inner",
                          isUploading && "pointer-events-none opacity-50"
                        )}
                      >
                        {isUploading ? (
                          <>
                            <Loader2 className="w-8 h-8 text-accent animate-spin" />
                            <span className="text-[8px] font-black uppercase text-accent">Syncing...</span>
                          </>
                        ) : (
                          <>
                            <div className="p-3 bg-accent/10 rounded-2xl group-hover:bg-accent group-hover:text-white transition-colors">
                              <PlusCircle className="w-8 h-8" />
                            </div>
                            <span className="text-[8px] font-black uppercase text-muted-foreground group-hover:text-accent">Add New</span>
                          </>
                        )}
                        <input 
                          id="review-upload" 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={handleReviewImageUpload} 
                          disabled={isUploading}
                        />
                      </Label>
                    </div>
                  )}
                </div>

                {(selectedProduct.reviewImages || []).length === 0 && !isUploading && (
                  <div className="bg-accent/5 p-12 rounded-[2rem] text-center border-2 border-dashed border-accent/10 flex flex-col items-center gap-3">
                    <ImageIcon className="w-12 h-12 text-accent/20" />
                    <p className="text-xs font-bold text-accent/40 italic">Your review gallery is empty. Upload up to 5 photos.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      <div className="px-4 py-2 bg-blue-50 border border-blue-100 rounded-xl flex items-start gap-3">
        <AlertTriangle className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
        <p className="text-[10px] text-blue-800 leading-relaxed">
          <b>Note:</b> Review photos are stored directly in your cloud database. For best performance, use clear but small images (under 500KB).
        </p>
      </div>
    </div>
  )
}
