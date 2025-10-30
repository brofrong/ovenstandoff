# Anchor Editor

A React-based tool for creating anchor points by cropping images.

## Features

- Upload images
- Interactive crop area selection with resize handles
- Real-time crop preview and information display
- Save cropped images as PNG
- Save crop coordinates as JSON

## Development

```bash
# Install dependencies
bun install

# Start development server
bun run dev

# Build for production
bun run build

# Preview production build
bun run preview

# Lint code
bun run lint

# Fix linting issues
bun run lint:fix
```

## Usage

1. Upload an image by clicking the upload area
2. The crop area will appear centered on the image
3. Drag the crop area to move it around
4. Drag the corners or edges to resize
5. Enter a name for your anchor
6. Click "Save Anchor" to download the cropped PNG and JSON files

