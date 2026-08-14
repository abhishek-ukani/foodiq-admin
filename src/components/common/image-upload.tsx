import { useRef, useState } from 'react'
import { ImagePlus, Loader2, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

const MAX_SIZE_MB = 5
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif']

interface ImageUploadProps {
  value: string | null
  onChange: (url: string | null) => void
  bucket: 'food-images' | 'banners' | 'branding' | 'upi-qr'
  className?: string
}

/** Uploads directly to Supabase Storage and reports back the public URL — no server round-trip needed. */
export function ImageUpload({ value, onChange, bucket, className }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)

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
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Upload failed. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className={cn('relative', className)}>
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
        <div className="group relative aspect-video w-full overflow-hidden rounded-xl border">
          <img src={value} alt="" className="size-full object-cover" />
          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => inputRef.current?.click()}
              disabled={isUploading}
            >
              Replace
            </Button>
            <Button
              type="button"
              size="icon"
              variant="destructive"
              onClick={() => onChange(null)}
              disabled={isUploading}
              aria-label="Remove image"
            >
              <X className="size-4" aria-hidden />
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
          className="text-muted-foreground hover:border-primary/40 hover:text-foreground flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed transition-colors disabled:opacity-60"
        >
          {isUploading ? (
            <Loader2 className="size-6 animate-spin" aria-hidden />
          ) : (
            <ImagePlus className="size-6" aria-hidden />
          )}
          <span className="text-sm">{isUploading ? 'Uploading…' : 'Click to upload an image'}</span>
        </button>
      )}
    </div>
  )
}
