import { useRef } from 'react'
import './ImageUploader.css'

interface ImageUploaderProps {
  onImageLoad: (src: string) => void
}

function ImageUploader({ onImageLoad }: ImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file?.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const src = event.target?.result as string
        onImageLoad(src)
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <div className="image-uploader">
      <button type="button" className="upload-area" onClick={() => fileInputRef.current?.click()}>
        <div className="upload-icon">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            role="img"
            aria-label="Upload icon"
          >
            <title>Upload icon</title>
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
        </div>
        <p className="upload-text">Click to upload an image</p>
        <p className="upload-hint">or drag and drop</p>
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
    </div>
  )
}

export default ImageUploader
