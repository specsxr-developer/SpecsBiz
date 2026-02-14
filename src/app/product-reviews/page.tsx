
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
  ImageIcon
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

  const selectedProduct = useMemo(() => {
    return products.find(p => p.id === selectedProductId) || null
  }, [products, selectedProductId])

  const handleReviewImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedProduct) return
    const file = e.target.files?.[0]
    if (!file) return

    const currentImages = selectedProduct.reviewImages || []
    if (currentImages.length >= 5) {
      toast({ variant: "destructive", title: t.maxPhotosReached })
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      const base64 = reader.result as string
      actions.updateProduct(selectedProduct.id, {
        reviewImages: [...currentImages, base64]
      })
      toast({ title: t.addReviewPhoto })
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
      <div className="flex items-center gap-3 px-2">
        <div className="p-2.5 bg-primary rounded-2xl shadow-lg">
          <Camera className="w-6 h-6 text-accent" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-primary uppercase tracking-tighter">{t.productReviews}</h2>
          <p className="text-[10px] font-bold text-accent uppercase tracking-[0.3em]">{t.manageReviewPhotos}</p>
        </div>
      </div>

      <Card className="border-accent/10 shadow-xl rounded-[2rem] overflow-hidden bg-white/50 backdrop-blur-sm">
        <CardHeader className="p-6 border-b bg-muted/20">
          <Label className="text-[10px] font-black uppercase mb-2 block">{t.selectProductToManage}</Label>
          <Select value={selectedProductId || ""} onValueChange={setSelectedProductId}>
            <SelectTrigger className="h-14 rounded-2xl border-accent/10 bg-white font-bold">
              <SelectValue placeholder="Pick a product..." />
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
              <Package className="w-16 h-16" />
              <p className="font-black uppercase tracking-widest">{t.noData}</p>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-accent/10 shadow-sm">
                <div className="w-20 h-20 rounded-xl bg-muted overflow-hidden border">
                  {selectedProduct.imageUrl ? (
                    <img src={selectedProduct.imageUrl} alt={selectedProduct.name} className="w-full h-full object-cover" />
                  ) : (
                    <Package className="w-8 h-8 m-auto mt-6 opacity-20" />
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-black text-primary leading-tight">{selectedProduct.name}</h3>
                  <Badge variant="outline" className="mt-1 text-[9px] font-black uppercase border-accent/20 text-accent">
                    {selectedProduct.category || 'N/A'}
                  </Badge>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                    <ImageIcon className="w-3 h-3 text-accent" /> Review Gallery (Max 5)
                  </h4>
                  <p className="text-[10px] font-bold text-accent">
                    {(selectedProduct.reviewImages || []).length} / 5
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                  {(selectedProduct.reviewImages || []).map((img: string, idx: number) => (
                    <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border-2 group shadow-md">
                      <img src={img} alt={`Review ${idx + 1}`} className="w-full h-full object-cover" />
                      <button 
                        onClick={() => removeReviewImage(idx)}
                        className="absolute top-1 right-1 p-1.5 bg-destructive text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}

                  {(selectedProduct.reviewImages || []).length < 5 && (
                    <Label 
                      htmlFor="review-upload" 
                      className="aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-accent/5 hover:border-accent transition-all group"
                    >
                      <PlusCircle className="w-8 h-8 text-accent group-hover:scale-110 transition-transform" />
                      <span className="text-[8px] font-black uppercase">{t.addReviewPhoto}</span>
                      <input 
                        id="review-upload" 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleReviewImageUpload} 
                      />
                    </Label>
                  )}
                </div>

                {(selectedProduct.reviewImages || []).length === 0 && (
                  <div className="bg-muted/30 p-10 rounded-2xl text-center border border-dashed">
                    <p className="text-xs font-bold text-muted-foreground italic">{t.noReviewPhotos}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
