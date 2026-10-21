import { useRef, useState } from 'react'
import { Check, ImagePlus, Link2, Loader2, UploadCloud, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

const MAX_SIZE_MB = 5
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif']

interface ImageUploadProps {
  value?: string | null
  onChange: (url: string | null) => void
  bucket: 'food-images' | 'banners' | 'branding' | 'upi-qr'
  className?: string
}

/** Uploads directly to Supabase Storage and reports back the public URL — with drag & drop and direct URL fallback. */
export function ImageUpload({ value, onChange, bucket, className }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [showUrlInput, setShowUrlInput] = useState(false)
  const [urlInput, setUrlInput] = useState('')

  const handleFile = async (file: File) => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.error('Please upload a JPEG, PNG, WebP, or AVIF image.')
      return
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      toast.error(`Image must be under ${MAX_SIZE_MB}MB.`)
      return
    }

    setIsUploading(true)
    try {
      const extension = file.name.split('.').pop() ?? 'jpg'
      const path = `${crypto.randomUUID()}.${extension}`
      const { error: uploadError } = await supabase.storage.from(bucket).upload(path, file, {
        cacheControl: '3600',
        upsert: false,
      })
      if (uploadError) throw uploadError

      const { data } = supabase.storage.from(bucket).getPublicUrl(path)
      onChange(data.publicUrl)
      toast.success('Image uploaded successfully!')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Upload failed. Please try again.'
      if (message.toLowerCase().includes('bucket not found')) {
        toast.error(
          `Storage bucket "${bucket}" does not exist in Supabase. Please run the storage migration in Supabase SQL editor.`,
          { duration: 6000 },
        )
      } else {
        toast.error(message)
      }
    } finally {
      setIsUploading(false)
    }
  }

  const handleApplyUrl = () => {
    const trimmed = urlInput.trim()
    if (!trimmed) {
      toast.error('Please enter a valid image URL')
      return
    }
    onChange(trimmed)
    setShowUrlInput(false)
    setUrlInput('')
  }

  return (
    <div className={cn('relative space-y-2', className)}>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(',')}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) void handleFile(file)
          e.target.value = ''
        }}
      />

      {value ? (
        <div className="group relative aspect-video w-full overflow-hidden rounded-xl border bg-muted/30">
          <img
            src={value}
            alt="Uploaded preview"
            className="size-full object-cover transition-transform duration-300 group-hover:scale-102"
            onError={(e) => {
              // Fallback display if URL fails to load
              ;(e.target as HTMLImageElement).src = 'https://placehold.co/600x400?text=Invalid+Image+URL'
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center gap-3 bg-black/50 opacity-0 backdrop-blur-[2px] transition-opacity group-hover:opacity-100">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="min-h-[44px] min-w-[44px] shadow-sm font-medium"
              onClick={() => inputRef.current?.click()}
              disabled={isUploading}
            >
              Replace
            </Button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="min-h-[44px] min-w-[44px] shadow-sm font-medium"
              onClick={() => {
                setUrlInput(value)
                setShowUrlInput(true)
              }}
              disabled={isUploading}
            >
              <Link2 className="size-4 mr-1.5" />
              Edit URL
            </Button>
            <Button
              type="button"
              size="icon"
              variant="destructive"
              className="min-h-[44px] min-w-[44px] shadow-sm"
              onClick={() => onChange(null)}
              disabled={isUploading}
              aria-label="Remove image"
            >
              <X className="size-5" aria-hidden />
            </Button>
          </div>
        </div>
      ) : showUrlInput ? (
        <div className="rounded-xl border border-dashed p-4 bg-muted/20 space-y-3">
          <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
            <span>Enter image web URL or asset path</span>
            <button
              type="button"
              onClick={() => setShowUrlInput(false)}
              className="hover:text-foreground p-1"
            >
              <X className="size-4" />
            </button>
          </div>
          <div className="flex gap-2">
            <Input
              type="url"
              placeholder="https://example.com/dish.jpg or /images/dishes/..."
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleApplyUrl()
                }
              }}
              className="flex-1"
              autoFocus
            />
            <Button
              type="button"
              onClick={handleApplyUrl}
              className="min-h-[44px] px-4 shrink-0"
            >
              <Check className="size-4 mr-1" />
              Apply
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <div
            onDragOver={(e) => {
              e.preventDefault()
              setIsDragging(true)
            }}
            onDragLeave={(e) => {
              e.preventDefault()
              setIsDragging(false)
            }}
            onDrop={(e) => {
              e.preventDefault()
              setIsDragging(false)
              const file = e.dataTransfer.files?.[0]
              if (file) void handleFile(file)
            }}
            onClick={() => inputRef.current?.click()}
            className={cn(
              'group relative flex aspect-video w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed transition-all duration-200',
              isDragging
                ? 'border-primary bg-primary/10 scale-[1.01]'
                : 'border-border/80 bg-muted/10 hover:border-primary/50 hover:bg-muted/30',
              isUploading && 'pointer-events-none opacity-60',
            )}
          >
            {isUploading ? (
              <>
                <Loader2 className="size-8 animate-spin text-primary" aria-hidden />
                <span className="text-sm font-medium text-foreground">Uploading image…</span>
              </>
            ) : (
              <>
                <div className="rounded-full bg-primary/10 p-3 text-primary transition-transform group-hover:scale-110">
                  {isDragging ? <UploadCloud className="size-6" /> : <ImagePlus className="size-6" />}
                </div>
                <div className="text-center px-4">
                  <p className="text-sm font-medium text-foreground">
                    {isDragging ? 'Drop image here' : 'Click or drag image to upload'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    JPEG, PNG, WebP, or AVIF up to {MAX_SIZE_MB}MB
                  </p>
                </div>
              </>
            )}
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setUrlInput('')
                setShowUrlInput(true)
              }}
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors py-1.5 px-2 rounded-md hover:bg-muted/50"
            >
              <Link2 className="size-3.5" />
              <span>Or paste image URL</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
