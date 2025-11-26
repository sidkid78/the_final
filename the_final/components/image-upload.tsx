"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Upload, X, ImageIcon } from "lucide-react"
import type { RoomType, AssessmentUpload } from "@/lib/assessment"
import Image from "next/image"

const roomTypes: { value: RoomType; label: string }[] = [
  { value: "bathroom", label: "Bathroom" },
  { value: "bedroom", label: "Bedroom" },
  { value: "kitchen", label: "Kitchen" },
  { value: "stairs", label: "Stairs" },
  { value: "entrance", label: "Entrance/Doorway" },
  { value: "hallway", label: "Hallway" },
  { value: "living_room", label: "Living Room" },
  { value: "other", label: "Other" },
]

interface ImageUploadProps {
  onUpload: (upload: AssessmentUpload) => void
  disabled?: boolean
}

export function ImageUpload({ onUpload, disabled }: ImageUploadProps) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [roomType, setRoomType] = useState<RoomType>("bathroom")
  const [notes, setNotes] = useState("")

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const selectedFile = acceptedFiles[0]
    if (selectedFile) {
      setFile(selectedFile)
      const reader = new FileReader()
      reader.onload = () => {
        setPreview(reader.result as string)
      }
      reader.readAsDataURL(selectedFile)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".webp", ".heic"],
    },
    maxFiles: 1,
    disabled,
  })

  const handleSubmit = () => {
    if (file) {
      onUpload({ file, roomType, notes: notes || undefined })
      // Reset form
      setFile(null)
      setPreview(null)
      setNotes("")
    }
  }

  const handleRemove = () => {
    setFile(null)
    setPreview(null)
  }

  return (
    <div className="space-y-4">
      {!preview ? (
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors
            ${isDragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}
            ${disabled ? "opacity-50 cursor-not-allowed" : ""}
          `}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-3">
            <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center">
              <Upload className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium">{isDragActive ? "Drop the image here" : "Drag & drop a room photo"}</p>
              <p className="text-sm text-muted-foreground mt-1">or click to select a file (JPEG, PNG, WebP, HEIC)</p>
            </div>
          </div>
        </div>
      ) : (
        <Card className="relative overflow-hidden">
          <Button
            variant="secondary"
            size="icon"
            className="absolute top-2 right-2 z-10 h-8 w-8"
            onClick={handleRemove}
            disabled={disabled}
          >
            <X className="h-4 w-4" />
          </Button>
          <div className="relative aspect-video">
            <Image src={preview || "/placeholder.svg"} alt="Room preview" fill className="object-cover" />
          </div>
        </Card>
      )}

      {preview && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="roomType">Room Type</Label>
            <Select value={roomType} onValueChange={(v) => setRoomType(v as RoomType)} disabled={disabled}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {roomTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="Any specific concerns or areas you'd like us to focus on..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="resize-none"
              rows={3}
              disabled={disabled}
            />
          </div>

          <Button onClick={handleSubmit} className="w-full" disabled={disabled}>
            <ImageIcon className="mr-2 h-4 w-4" />
            Add Room to Assessment
          </Button>
        </div>
      )}
    </div>
  )
}
