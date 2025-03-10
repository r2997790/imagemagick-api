# ImageMagick API

A simple RESTful API for ImageMagick operations, designed to be deployed on free hosting platforms and used with n8n workflows.

## Features

- Resize images
- Convert between formats
- Apply filters and effects
- Crop images
- Add text/watermarks
- Rotate images

## API Endpoints

### Upload an Image
- **URL**: `/upload`
- **Method**: `POST`
- **Form Data**: `file` (image file)
- **Response**: File ID and original filename

### Resize an Image
- **URL**: `/resize`
- **Method**: `POST`
- **Form Data**: `file` (image file)
- **Query Parameters**: 
  - `width` (default: 800)
  - `height` (default: 600)
  - `maintain` (default: true) - maintain aspect ratio
- **Response**: Download URL for the resized image

### Convert Format
- **URL**: `/convert`
- **Method**: `POST`
- **Form Data**: `file` (image file)
- **Query Parameters**: 
  - `format` (default: png) - target format (jpg, png, gif, etc.)
- **Response**: Download URL for the converted image

### Apply Filter
- **URL**: `/filter`
- **Method**: `POST`
- **Form Data**: `file` (image file)
- **Query Parameters**: 
  - `filter` (default: grayscale) - options: grayscale, sepia, blur, sharpen, edge, negate, charcoal
  - `amount` (for blur filter, default: 5)
- **Response**: Download URL for the filtered image

### Crop Image
- **URL**: `/crop`
- **Method**: `POST`
- **Form Data**: `file` (image file)
- **Query Parameters**: 
  - `width` (default: 300)
  - `height` (default: 300)
  - `x` (default: 0) - starting x position
  - `y` (default: 0) - starting y position
- **Response**: Download URL for the cropped image

### Add Text
- **URL**: `/text`
- **Method**: `POST`
- **Form Data**: `file` (image file)
- **Query Parameters**: 
  - `text` (default: "Watermark") - text to add
  - `color` (default: white) - text color
  - `size` (default: 24) - font size
  - `x` (default: center) - horizontal position (center, west, east)
  - `y` (default: center) - vertical position (center, north, south)
- **Response**: Download URL for the image with text

### Rotate Image
- **URL**: `/rotate`
- **Method**: `POST`
- **Form Data**: `file` (image file)
- **Query Parameters**: 
  - `degrees` (default: 90) - rotation angle
- **Response**: Download URL for the rotated image

### Download Processed Image
- **URL**: `/download/:fileId`
- **Method**: `GET`
- **Response**: Processed image file

## Deployment

### Prerequisites
- Node.js 14 or higher
- ImageMagick installed on the server

### Local Development
1. Clone the repository
2. Install dependencies: `npm install`
3. Run the server: `npm start`
4. API will be available at http://localhost:3000

### Deploy to Render.com
1. Connect your GitHub repository
2. Configure as a Web Service
3. Set build command: `apt-get update && apt-get install -y imagemagick && npm install`
4. Set start command: `npm start`
5. Add environment variable: `PORT=3000`

## Using with n8n

Example n8n workflow:

1. Use a trigger node (Webhook, Manual, etc.)
2. Add an HTTP Request node:
   - Method: POST
   - URL: https://your-api-url.render.com/resize?width=800&height=600
   - Binary Data: Enable
   - Send Binary Data: Yes
   - Binary Property: data (or your source property name)
3. Add another HTTP Request node to download the processed file:
   - Method: GET
   - URL: Result from previous node (download URL)
4. Save the processed image to your destination

## License

MIT
