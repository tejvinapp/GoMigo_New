'use client'

import { useState } from 'react'
import Image from 'next/image'
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useSupabase } from '@/components/providers'
import { toast } from 'sonner'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Photo = any

export default function PhotosClient({ initialPhotos }: { initialPhotos: Photo[] }) {
  const { supabase } = useSupabase()
  const [photos, setPhotos] = useState<Photo[]>(initialPhotos)

  async function approvePhoto(photoId: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('property_images') as any)
      .update({ disputed: false })
      .eq('id', photoId)
    if (error) { toast.error('Failed'); return }
    toast.success('Photo approved')
    setPhotos(prev => prev.map(p => p.id === photoId ? { ...p, disputed: false } : p))
  }

  async function deletePhoto(photoId: string) {
    if (!confirm('Delete this photo permanently?')) return
    const { error } = await supabase.from('property_images').delete().eq('id', photoId)
    if (error) { toast.error('Failed to delete'); return }
    toast.success('Photo deleted')
    setPhotos(prev => prev.filter(p => p.id !== photoId))
  }

  const disputed = photos.filter(p => p.disputed)
  const recent = photos.filter(p => !p.disputed).slice(0, 30)

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <h1 className="font-serif font-bold text-2xl mb-4">Photo Moderation</h1>

      <Tabs defaultValue="disputed">
        <TabsList className="mb-4">
          <TabsTrigger value="disputed">
            <AlertTriangle className="w-3.5 h-3.5 mr-1.5" />
            Flagged ({disputed.length})
          </TabsTrigger>
          <TabsTrigger value="recent">Recent Uploads ({recent.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="disputed">
          {disputed.length === 0 ? (
            <Card className="text-center py-12">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <h3 className="font-semibold">No flagged photos</h3>
              <p className="text-sm text-muted-foreground">All photos are clear</p>
            </Card>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {disputed.map(photo => (
                <PhotoCard key={photo.id} photo={photo} onApprove={approvePhoto} onDelete={deletePhoto} showFlag />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="recent">
          {recent.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">No photos yet</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {recent.map(photo => (
                <PhotoCard key={photo.id} photo={photo} onApprove={approvePhoto} onDelete={deletePhoto} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

function PhotoCard({ photo, onApprove, onDelete, showFlag }: {
  photo: Photo
  onApprove: (id: string) => void
  onDelete: (id: string) => void
  showFlag?: boolean
}) {
  return (
    <Card className="overflow-hidden">
      <div className="relative h-40 bg-muted">
        <Image src={photo.url} alt="Property photo" fill className="object-cover" sizes="(max-width: 768px) 50vw, 25vw" />
        {showFlag && (
          <div className="absolute top-2 left-2 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded font-medium">Flagged</div>
        )}
        {!photo.is_official && (
          <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded font-medium">Review</div>
        )}
      </div>
      <CardContent className="p-2">
        <div className="text-xs font-medium truncate mb-1">{photo.property?.title}</div>
        <div className="text-xs text-muted-foreground mb-2">{photo.property?.city}</div>
        <div className="flex gap-1">
          <Button size="sm" variant="outline" className="h-6 text-xs flex-1 text-green-600 border-green-300"
            onClick={() => onApprove(photo.id)}>
            <CheckCircle className="w-3 h-3 mr-0.5" />OK
          </Button>
          <Button size="sm" variant="outline" className="h-6 text-xs flex-1 text-red-600 border-red-300"
            onClick={() => onDelete(photo.id)}>
            <XCircle className="w-3 h-3 mr-0.5" />Del
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
