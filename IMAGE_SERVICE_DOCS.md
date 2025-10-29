# Servicio de Subida de Imágenes - Documentación

## 📸 Sistema de Gestión de Imágenes

Este servicio integra la funcionalidad de subida de imágenes usando la API de Chevereto con tu sistema de gestión de libros.

## 🚀 Configuración

### Credenciales de la API
- **URL**: `http://hosting-cpanel-chevereto-965a6d-31-97-133-67.traefik.me/api/1/upload`
- **API Key**: `chv_cA_32945a06549e00efa8520ce9494818e3505fb872ed170900d0a0ed454c06850b46547ee85adf247a4caaa9d94e71629d8486511affed647ff64e3d6bbb3fa548`
- **Session ID**: `abae24ae21a6fe0c806f08827bf09bdb`

### Dependencias Instaladas
```bash
npm install axios form-data multer
```

## 📋 Endpoints Disponibles

### 🖼️ Gestión General de Imágenes

#### 1. Subir imagen desde archivo
```http
POST /api/images/upload/file
Content-Type: multipart/form-data

FormData:
- image: archivo_imagen.jpg
```

#### 2. Subir imagen desde Base64
```http
POST /api/images/upload/base64
Content-Type: application/json

{
  "base64": "data:image/jpeg;base64,/9j/4AAQSkZJRgABA...",
  "filename": "mi-imagen.jpg" // opcional
}
```

#### 3. Subir imagen desde URL
```http
POST /api/images/upload/url
Content-Type: application/json

{
  "url": "https://example.com/imagen.jpg"
}
```

#### 4. Subir múltiples imágenes
```http
POST /api/images/upload/multiple
Content-Type: multipart/form-data

FormData:
- images: archivo1.jpg
- images: archivo2.png
- images: archivo3.gif
```

### 📚 Gestión de Imágenes de Libros

#### 1. Crear libro con imagen
```http
POST /api/books
Content-Type: multipart/form-data

FormData:
- title: "Título del libro"
- author: "Autor"
- description: "Descripción"
- price: 25.99
- stock: 10
- image: portada.jpg
```

O con Base64:
```http
POST /api/books
Content-Type: application/json

{
  "title": "Título del libro",
  "author": "Autor",
  "description": "Descripción",
  "price": 25.99,
  "stock": 10,
  "imageBase64": "data:image/jpeg;base64,/9j/4AAQSkZJRgABA..."
}
```

#### 2. Actualizar imagen de libro
```http
PUT /api/books/{id}/image
Content-Type: multipart/form-data

FormData:
- image: nueva_portada.jpg
```

#### 3. Eliminar imagen de libro
```http
DELETE /api/books/{id}/image
```

#### 4. Obtener información de imagen
```http
GET /api/books/{id}/image
```

## 🔧 Características del Servicio

### Validaciones
- **Formatos permitidos**: JPG, JPEG, PNG, GIF, WEBP, BMP
- **Tamaño máximo**: 10MB por archivo
- **Múltiples archivos**: Máximo 10 archivos por request

### Respuesta de Éxito
```json
{
  "state": "success",
  "data": {
    "success": true,
    "id": "imagen_id_unico",
    "name": "imagen.jpg",
    "extension": "jpg",
    "size": 245760,
    "width": 1024,
    "height": 768,
    "url": "http://hosting.../images/imagen.jpg",
    "display_url": "http://hosting.../images/imagen.jpg",
    "thumb": {
      "url": "http://hosting.../thumbs/imagen.jpg"
    },
    "medium": {
      "url": "http://hosting.../medium/imagen.jpg"
    },
    "delete_url": "http://hosting.../delete/token",
    "upload_date": "2025-10-29T...",
    "original_filename": "mi_imagen_original.jpg"
  },
  "message": "Imagen subida exitosamente",
  "action_code": 200
}
```

### Modelo de Libro Actualizado
```javascript
{
  title: "Título del libro",
  author: "Autor",
  description: "Descripción",
  price: 25.99,
  stock: 10,
  image: {
    id: "imagen_id_unico",
    url: "http://hosting.../images/imagen.jpg",
    display_url: "http://hosting.../images/imagen.jpg",
    thumb_url: "http://hosting.../thumbs/imagen.jpg",
    medium_url: "http://hosting.../medium/imagen.jpg",
    original_filename: "portada_libro.jpg",
    upload_date: "2025-10-29T..."
  }
}
```

## 💡 Ejemplos de Uso

### Frontend JavaScript
```javascript
// Subir imagen de libro con archivo
const formData = new FormData();
formData.append('title', 'Mi Libro');
formData.append('author', 'Autor');
formData.append('price', 29.99);
formData.append('stock', 5);
formData.append('image', file); // file del input type="file"

fetch('/api/books', {
  method: 'POST',
  body: formData
});

// Subir imagen con Base64
const canvas = document.getElementById('canvas');
const base64 = canvas.toDataURL('image/jpeg');

fetch('/api/books', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    title: 'Mi Libro',
    author: 'Autor',
    price: 29.99,
    stock: 5,
    imageBase64: base64
  })
});
```

### cURL Examples
```bash
# Subir imagen general desde archivo
curl -X POST "http://localhost:3000/api/images/upload/file" \
  -H "Content-Type: multipart/form-data" \
  -F "image=@/path/to/image.jpg"

# Crear libro con imagen
curl -X POST "http://localhost:3000/api/books" \
  -H "Content-Type: multipart/form-data" \
  -F "title=Mi Libro" \
  -F "author=Autor" \
  -F "price=25.99" \
  -F "stock=10" \
  -F "image=@/path/to/portada.jpg"

# Actualizar imagen de libro
curl -X PUT "http://localhost:3000/api/books/64f123abc456def789/image" \
  -H "Content-Type: multipart/form-data" \
  -F "image=@/path/to/nueva_portada.jpg"
```

## 🛠️ Archivos Creados/Modificados

### Nuevos Archivos
- `src/services/imageUploadService.js` - Servicio principal de subida de imágenes
- `src/controllers/imageController.js` - Controladores para endpoints de imágenes
- `src/routes/imageRoutes.js` - Rutas de gestión de imágenes

### Archivos Modificados
- `src/models/book.js` - Agregado campo `image` con información completa
- `src/services/booksService.js` - Integración de imágenes en servicios de libros
- `src/controllers/booksController.js` - Manejo de imágenes en controladores
- `src/routes/booksRoutes.js` - Rutas actualizadas con soporte para imágenes
- `src/app.js` - Registro de nuevas rutas
- `package.json` - Dependencias agregadas

## 🔍 Debugging y Logs

El servicio incluye logging detallado para debugging:
- Errores de subida se loguean en consola
- Validaciones de formato y tamaño
- Información de respuesta de la API de Chevereto

## 🚨 Manejo de Errores

- **400**: Formato inválido, archivo muy grande, datos faltantes
- **404**: Libro no encontrado (para endpoints específicos de libros)
- **500**: Error interno del servidor o de la API de Chevereto
- **503**: Error de conexión con el servicio de imágenes

## 📖 Documentación Swagger

Toda la funcionalidad está documentada en Swagger y estará disponible en:
- `/api-docs` - Documentación completa de la API

¡El sistema de imágenes está listo para usar! 🎉