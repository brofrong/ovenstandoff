import { useState } from 'react'
import ImageCropper from './components/ImageCropper'
import ImageUploader from './components/ImageUploader'
import './App.css'

export interface CropArea {
  x: number
  y: number
  width: number
  height: number
}

function App() {
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [cropArea, setCropArea] = useState<CropArea | null>(null)
  const [anchorName, setAnchorName] = useState<string>('')

  const handleImageLoad = (src: string) => {
    setImageSrc(src)
    setCropArea(null)
    setAnchorName('')
  }

  const handleReset = () => {
    setImageSrc(null)
    setCropArea(null)
    setAnchorName('')
  }

  return (
    <div className="app">
      <div className="container">
        <h1 className="title">Anchor Editor</h1>
        {!imageSrc ? (
          <ImageUploader onImageLoad={handleImageLoad} />
        ) : (
          <ImageCropper
            imageSrc={imageSrc}
            cropArea={cropArea}
            onCropAreaChange={setCropArea}
            anchorName={anchorName}
            onAnchorNameChange={setAnchorName}
            onSave={(crop, name) => {
              console.log('Saving:', crop, name)
              // Handle save logic here
            }}
            onReset={handleReset}
          />
        )}
      </div>
    </div>
  )
}

export default App
