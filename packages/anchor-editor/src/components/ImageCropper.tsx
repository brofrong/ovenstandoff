import { useCallback, useEffect, useRef, useState } from 'react'
import type { CropArea } from '../App'
import './ImageCropper.css'

interface ImageCropperProps {
  imageSrc: string
  cropArea: CropArea | null
  onCropAreaChange: (area: CropArea | null) => void
  anchorName: string
  onAnchorNameChange: (name: string) => void
  onSave: (crop: CropArea, name: string) => void
  onReset: () => void
  fileName?: string
}

function ImageCropper({
  imageSrc,
  cropArea,
  onCropAreaChange,
  anchorName,
  onAnchorNameChange,
  onSave,
  onReset,
  fileName,
}: ImageCropperProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragHandle, setDragHandle] = useState<string | null>(null)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 })
  const [isImageLoaded, setIsImageLoaded] = useState(false)
  const [zoom, setZoom] = useState(1)

  useEffect(() => {
    const img = imageRef.current
    if (img?.complete) {
      setImageSize({ width: img.naturalWidth, height: img.naturalHeight })
      setIsImageLoaded(true)
      if (!cropArea) {
        const initialSize = 200
        onCropAreaChange({
          x: (img.naturalWidth - initialSize) / 2,
          y: (img.naturalHeight - initialSize) / 2,
          width: initialSize,
          height: initialSize,
        })
      }
    }
  }, [cropArea, onCropAreaChange])

  const handleImageLoad = () => {
    if (imageRef.current) {
      setImageSize({
        width: imageRef.current.naturalWidth,
        height: imageRef.current.naturalHeight,
      })
      setIsImageLoaded(true)
      if (!cropArea) {
        const initialSize = 200
        onCropAreaChange({
          x: (imageRef.current.naturalWidth - initialSize) / 2,
          y: (imageRef.current.naturalHeight - initialSize) / 2,
          width: initialSize,
          height: initialSize,
        })
      }
    }
  }

  const getDisplayCropArea = () => {
    if (!cropArea || !imageRef.current) return null
    const img = imageRef.current
    const scaleX = img.clientWidth / img.naturalWidth
    const scaleY = img.clientHeight / img.naturalHeight
    return {
      x: cropArea.x * scaleX * zoom,
      y: cropArea.y * scaleY * zoom,
      width: cropArea.width * scaleX * zoom,
      height: cropArea.height * scaleY * zoom,
    }
  }

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault()
      const delta = e.deltaY > 0 ? -0.1 : 0.1
      setZoom((prev) => Math.max(0.5, Math.min(3, prev + delta)))
    }
  }

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(3, prev + 0.1))
  }

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(0.5, prev - 0.1))
  }

  const handleZoomReset = () => {
    setZoom(1)
  }

  const handleMouseDown = (e: React.MouseEvent, handle: string) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
    setDragHandle(handle)
    setDragStart({ x: e.clientX, y: e.clientY })
  }

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !cropArea || !imageRef.current) return

      const img = imageRef.current
      const scaleX = img.naturalWidth / img.clientWidth
      const scaleY = img.naturalHeight / img.clientHeight

      const deltaX = (e.clientX - dragStart.x) * scaleX
      const deltaY = (e.clientY - dragStart.y) * scaleY

      let newArea = { ...cropArea }

      if (dragHandle === 'move') {
        newArea.x = cropArea.x + deltaX
        newArea.y = cropArea.y + deltaY
      } else if (dragHandle === 'nw') {
        newArea.x = cropArea.x + deltaX
        newArea.y = cropArea.y + deltaY
        newArea.width = cropArea.width - deltaX
        newArea.height = cropArea.height - deltaY
      } else if (dragHandle === 'ne') {
        newArea.y = cropArea.y + deltaY
        newArea.width = cropArea.width + deltaX
        newArea.height = cropArea.height - deltaY
      } else if (dragHandle === 'sw') {
        newArea.x = cropArea.x + deltaX
        newArea.width = cropArea.width - deltaX
        newArea.height = cropArea.height + deltaY
      } else if (dragHandle === 'se') {
        newArea.width = cropArea.width + deltaX
        newArea.height = cropArea.height + deltaY
      } else if (dragHandle === 'n') {
        newArea.y = cropArea.y + deltaY
        newArea.height = cropArea.height - deltaY
      } else if (dragHandle === 's') {
        newArea.height = cropArea.height + deltaY
      } else if (dragHandle === 'w') {
        newArea.x = cropArea.x + deltaX
        newArea.width = cropArea.width - deltaX
      } else if (dragHandle === 'e') {
        newArea.width = cropArea.width + deltaX
      }

      // Ensure minimum size
      if (newArea.width < 10) {
        newArea.width = 10
        if (dragHandle?.includes('w')) newArea.x = cropArea.x + cropArea.width - 10
      }
      if (newArea.height < 10) {
        newArea.height = 10
        if (dragHandle?.includes('n')) newArea.y = cropArea.y + cropArea.height - 10
      }

      // Constrain crop area
      const maxWidth = imageSize.width - newArea.x
      const maxHeight = imageSize.height - newArea.y
      newArea = {
        x: Math.max(0, newArea.x),
        y: Math.max(0, newArea.y),
        width: Math.min(newArea.width, maxWidth),
        height: Math.min(newArea.height, maxHeight),
      }

      onCropAreaChange(newArea)
      setDragStart({ x: e.clientX, y: e.clientY })
    },
    [isDragging, cropArea, dragHandle, dragStart, imageSize, onCropAreaChange]
  )

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
    setDragHandle(null)
  }, [])

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
      return () => {
        window.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  const handleSave = async () => {
    if (!cropArea || !anchorName.trim() || !imageRef.current) return

    const img = imageRef.current
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = cropArea.width
    canvas.height = cropArea.height

    ctx.drawImage(
      img,
      cropArea.x,
      cropArea.y,
      cropArea.width,
      cropArea.height,
      0,
      0,
      cropArea.width,
      cropArea.height
    )

    // Save PNG
    canvas.toBlob((blob) => {
      if (!blob) return
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${anchorName}.png`
      link.click()
      URL.revokeObjectURL(url)
    })

    // Save JSON
    const roundedCrop = {
      x: Math.round(cropArea.x),
      y: Math.round(cropArea.y),
      width: Math.round(cropArea.width),
      height: Math.round(cropArea.height),
    }
    const jsonData = JSON.stringify(roundedCrop, null, 2)
    const jsonBlob = new Blob([jsonData], { type: 'application/json' })
    const jsonUrl = URL.createObjectURL(jsonBlob)
    const jsonLink = document.createElement('a')
    jsonLink.href = jsonUrl
    jsonLink.download = `${anchorName}.json`
    jsonLink.click()
    URL.revokeObjectURL(jsonUrl)

    onSave(cropArea, anchorName)
  }

  const displayArea = getDisplayCropArea()

  return (
    <div className="crop-wrapper">
      <div className="image-wrapper">
        <div ref={containerRef} className="image-container" onWheel={handleWheel}>
          {isImageLoaded && displayArea && (
            <div
              className="crop-overlay"
              style={{
                left: `${displayArea.x}px`,
                top: `${displayArea.y}px`,
                width: `${displayArea.width}px`,
                height: `${displayArea.height}px`,
              }}
            >
              <div
                className="crop-handle move"
                onMouseDown={(e) => handleMouseDown(e, 'move')}
                role="button"
                aria-label="Move crop area"
              />
              <div
                className="crop-handle corner nw"
                onMouseDown={(e) => handleMouseDown(e, 'nw')}
                role="button"
                aria-label="Resize crop area northwest"
              />
              <div
                className="crop-handle corner ne"
                onMouseDown={(e) => handleMouseDown(e, 'ne')}
                role="button"
                aria-label="Resize crop area northeast"
              />
              <div
                className="crop-handle corner sw"
                onMouseDown={(e) => handleMouseDown(e, 'sw')}
                role="button"
                aria-label="Resize crop area southwest"
              />
              <div
                className="crop-handle corner se"
                onMouseDown={(e) => handleMouseDown(e, 'se')}
                role="button"
                aria-label="Resize crop area southeast"
              />
              <div
                className="crop-handle edge n"
                onMouseDown={(e) => handleMouseDown(e, 'n')}
                role="button"
                aria-label="Resize crop area north"
              />
              <div
                className="crop-handle edge s"
                onMouseDown={(e) => handleMouseDown(e, 's')}
                role="button"
                aria-label="Resize crop area south"
              />
              <div
                className="crop-handle edge w"
                onMouseDown={(e) => handleMouseDown(e, 'w')}
                role="button"
                aria-label="Resize crop area west"
              />
              <div
                className="crop-handle edge e"
                onMouseDown={(e) => handleMouseDown(e, 'e')}
                role="button"
                aria-label="Resize crop area east"
              />
            </div>
          )}
          <div style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}>
            <img ref={imageRef} src={imageSrc} onLoad={handleImageLoad} alt="Crop source" />
          </div>
        </div>
      </div>

      <div className="crop-sidebar">
        <div className="sidebar-content">
          <h1 className="sidebar-title">Anchor Editor</h1>

          <div className="input-group">
            <label htmlFor="anchor-name">Anchor Name:</label>
            <input
              id="anchor-name"
              type="text"
              value={anchorName}
              onChange={(e) => onAnchorNameChange(e.target.value)}
              placeholder="Enter anchor name..."
              className="name-input"
            />
          </div>

          <div className="crop-controls">
            {cropArea && (
              <>
                <div className="crop-input-column">
                  <div className="crop-input-group">
                    <label htmlFor="crop-x">X:</label>
                    <input
                      id="crop-x"
                      type="number"
                      value={Math.round(cropArea.x)}
                      onChange={(e) => {
                        const value = parseInt(e.target.value, 10)
                        if (!Number.isNaN(value)) {
                          const newX = Math.max(
                            0,
                            Math.min(value, imageSize.width - cropArea.width)
                          )
                          onCropAreaChange({ ...cropArea, x: newX })
                        }
                      }}
                      className="crop-input"
                    />
                  </div>
                  <div className="crop-input-group">
                    <label htmlFor="crop-y">Y:</label>
                    <input
                      id="crop-y"
                      type="number"
                      value={Math.round(cropArea.y)}
                      onChange={(e) => {
                        const value = parseInt(e.target.value, 10)
                        if (!Number.isNaN(value)) {
                          const newY = Math.max(
                            0,
                            Math.min(value, imageSize.height - cropArea.height)
                          )
                          onCropAreaChange({ ...cropArea, y: newY })
                        }
                      }}
                      className="crop-input"
                    />
                  </div>
                </div>
                <div className="crop-input-column">
                  <div className="crop-input-group">
                    <label htmlFor="crop-width">Width:</label>
                    <input
                      id="crop-width"
                      type="number"
                      value={Math.round(cropArea.width)}
                      onChange={(e) => {
                        const value = parseInt(e.target.value, 10)
                        if (!Number.isNaN(value) && value > 0) {
                          const maxWidth = imageSize.width - cropArea.x
                          const newWidth = Math.min(value, maxWidth)
                          onCropAreaChange({ ...cropArea, width: newWidth })
                        }
                      }}
                      className="crop-input"
                    />
                  </div>
                  <div className="crop-input-group">
                    <label htmlFor="crop-height">Height:</label>
                    <input
                      id="crop-height"
                      type="number"
                      value={Math.round(cropArea.height)}
                      onChange={(e) => {
                        const value = parseInt(e.target.value, 10)
                        if (!Number.isNaN(value) && value > 0) {
                          const maxHeight = imageSize.height - cropArea.y
                          const newHeight = Math.min(value, maxHeight)
                          onCropAreaChange({ ...cropArea, height: newHeight })
                        }
                      }}
                      className="crop-input"
                    />
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="zoom-controls">
            <button
              className="btn btn-zoom"
              onClick={handleZoomOut}
              type="button"
              title="Zoom Out (Ctrl+Scroll)"
            >
              −
            </button>
            <span className="zoom-indicator">{Math.round(zoom * 100)}%</span>
            <button
              className="btn btn-zoom"
              onClick={handleZoomIn}
              type="button"
              title="Zoom In (Ctrl+Scroll)"
            >
              +
            </button>
            <button
              className="btn btn-zoom-reset"
              onClick={handleZoomReset}
              type="button"
              title="Reset Zoom"
            >
              Reset
            </button>
          </div>

          {imageSize.width > 0 && (
            <div className="image-info">
              <div className="info-label">Source Image:</div>
              <div className="info-item">
                <strong>File:</strong> {fileName || 'image.png'}
              </div>
              <div className="info-item">
                <strong>Resolution:</strong> {imageSize.width} × {imageSize.height} px
              </div>
            </div>
          )}
        </div>

        <div className="sidebar-footer">
          <button className="btn btn-reset" onClick={onReset} type="button">
            Upload New
          </button>
          <button
            className="btn btn-save"
            onClick={handleSave}
            disabled={!cropArea || !anchorName.trim() || !isImageLoaded}
            type="button"
          >
            Save Anchor
          </button>
        </div>
      </div>
    </div>
  )
}

export default ImageCropper
