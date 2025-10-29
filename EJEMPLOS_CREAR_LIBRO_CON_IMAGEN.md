# Ejemplos de Uso - Crear Libros con Imágenes

## 📚 Crear Libro con Imagen - Ejemplos Prácticos

### 1. 🖼️ Usando Multipart/Form-Data (Archivo)

#### Frontend HTML:
```html
<!DOCTYPE html>
<html>
<head>
    <title>Crear Libro con Imagen</title>
</head>
<body>
    <h2>Agregar Nuevo Libro</h2>
    <form id="bookForm" enctype="multipart/form-data">
        <div>
            <label for="title">Título:</label>
            <input type="text" id="title" name="title" required>
        </div>
        
        <div>
            <label for="author">Autor:</label>
            <input type="text" id="author" name="author" required>
        </div>
        
        <div>
            <label for="description">Descripción:</label>
            <textarea id="description" name="description"></textarea>
        </div>
        
        <div>
            <label for="price">Precio:</label>
            <input type="number" id="price" name="price" step="0.01" required>
        </div>
        
        <div>
            <label for="stock">Stock:</label>
            <input type="number" id="stock" name="stock" min="0">
        </div>
        
        <div>
            <label for="image">Imagen de Portada:</label>
            <input type="file" id="image" name="image" accept="image/*">
        </div>
        
        <button type="submit">Crear Libro</button>
    </form>

    <script>
        document.getElementById('bookForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(e.target);
            
            try {
                const response = await fetch('/api/books', {
                    method: 'POST',
                    body: formData
                });
                
                const result = await response.json();
                
                if (result.state === 'success') {
                    alert('Libro creado exitosamente!');
                    console.log('Libro creado:', result.data);
                    e.target.reset();
                } else {
                    alert('Error: ' + result.message);
                }
            } catch (error) {
                alert('Error de conexión: ' + error.message);
            }
        });
    </script>
</body>
</html>
```

#### JavaScript (Node.js/Frontend):
```javascript
// Crear libro con imagen desde archivo
async function crearLibroConArchivo(file) {
    const formData = new FormData();
    formData.append('title', 'El Quijote');
    formData.append('author', 'Miguel de Cervantes');
    formData.append('description', 'La obra más importante de la literatura española');
    formData.append('price', 29.99);
    formData.append('stock', 15);
    formData.append('image', file); // file del input type="file"
    
    const response = await fetch('/api/books', {
        method: 'POST',
        body: formData
    });
    
    return await response.json();
}
```

### 2. 📊 Usando JSON con Base64

```javascript
// Crear libro con imagen Base64
async function crearLibroConBase64(imageBase64) {
    const bookData = {
        title: 'Cien años de soledad',
        author: 'Gabriel García Márquez',
        description: 'Una obra maestra del realismo mágico',
        price: 35.50,
        stock: 8,
        imageBase64: imageBase64 // string base64 de la imagen
    };
    
    const response = await fetch('/api/books', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(bookData)
    });
    
    return await response.json();
}

// Función para convertir archivo a Base64
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

// Uso completo
async function subirLibroConBase64() {
    const fileInput = document.getElementById('imageFile');
    const file = fileInput.files[0];
    
    if (file) {
        try {
            const base64 = await fileToBase64(file);
            const result = await crearLibroConBase64(base64);
            console.log('Libro creado:', result);
        } catch (error) {
            console.error('Error:', error);
        }
    }
}
```

### 3. 🌐 Usando URL de Imagen Externa

```javascript
async function crearLibroConURL() {
    const bookData = {
        title: '1984',
        author: 'George Orwell',
        description: 'Una distopía sobre el totalitarismo',
        price: 22.90,
        stock: 12,
        imageUrl: 'https://images.example.com/1984-cover.jpg'
    };
    
    const response = await fetch('/api/books', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(bookData)
    });
    
    return await response.json();
}
```

### 4. 🔧 Ejemplos con cURL

```bash
# 1. Crear libro con archivo de imagen
curl -X POST "http://localhost:3000/api/books" \
  -H "Content-Type: multipart/form-data" \
  -F "title=El principito" \
  -F "author=Antoine de Saint-Exupéry" \
  -F "description=Un cuento filosófico y poético" \
  -F "price=18.99" \
  -F "stock=20" \
  -F "image=@/ruta/a/portada-principito.jpg"

# 2. Crear libro con Base64 (JSON)
curl -X POST "http://localhost:3000/api/books" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Don Quijote de la Mancha",
    "author": "Miguel de Cervantes",
    "description": "Las aventuras del ingenioso hidalgo",
    "price": 32.50,
    "stock": 10,
    "imageBase64": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD..."
  }'

# 3. Crear libro con URL de imagen
curl -X POST "http://localhost:3000/api/books" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Orgullo y prejuicio",
    "author": "Jane Austen",
    "price": 25.00,
    "stock": 15,
    "imageUrl": "https://covers.example.com/orgullo-prejuicio.jpg"
  }'
```

### 5. 🔄 Gestión de Imágenes Después de Crear el Libro

```javascript
// Actualizar imagen de un libro existente
async function actualizarImagenLibro(bookId, file) {
    const formData = new FormData();
    formData.append('image', file);
    
    const response = await fetch(`/api/books/${bookId}/image`, {
        method: 'PUT',
        body: formData
    });
    
    return await response.json();
}

// Eliminar imagen de un libro
async function eliminarImagenLibro(bookId) {
    const response = await fetch(`/api/books/${bookId}/image`, {
        method: 'DELETE'
    });
    
    return await response.json();
}

// Obtener información de imagen
async function obtenerImagenLibro(bookId) {
    const response = await fetch(`/api/books/${bookId}/image`);
    return await response.json();
}
```

### 6. 📱 Ejemplo Completo - React Component

```jsx
import React, { useState } from 'react';

function CrearLibro() {
    const [formData, setFormData] = useState({
        title: '',
        author: '',
        description: '',
        price: '',
        stock: ''
    });
    const [imageFile, setImageFile] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleFileChange = (e) => {
        setImageFile(e.target.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const data = new FormData();
            Object.keys(formData).forEach(key => {
                data.append(key, formData[key]);
            });
            
            if (imageFile) {
                data.append('image', imageFile);
            }

            const response = await fetch('/api/books', {
                method: 'POST',
                body: data
            });

            const result = await response.json();

            if (result.state === 'success') {
                alert('Libro creado exitosamente!');
                // Reset form
                setFormData({
                    title: '',
                    author: '',
                    description: '',
                    price: '',
                    stock: ''
                });
                setImageFile(null);
            } else {
                alert('Error: ' + result.message);
            }
        } catch (error) {
            alert('Error: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <input
                type="text"
                name="title"
                placeholder="Título"
                value={formData.title}
                onChange={handleInputChange}
                required
            />
            
            <input
                type="text"
                name="author"
                placeholder="Autor"
                value={formData.author}
                onChange={handleInputChange}
                required
            />
            
            <textarea
                name="description"
                placeholder="Descripción"
                value={formData.description}
                onChange={handleInputChange}
            />
            
            <input
                type="number"
                name="price"
                placeholder="Precio"
                value={formData.price}
                onChange={handleInputChange}
                step="0.01"
                required
            />
            
            <input
                type="number"
                name="stock"
                placeholder="Stock"
                value={formData.stock}
                onChange={handleInputChange}
            />
            
            <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
            />
            
            <button type="submit" disabled={loading}>
                {loading ? 'Creando...' : 'Crear Libro'}
            </button>
        </form>
    );
}

export default CrearLibro;
```

### 7. 📋 Respuesta Esperada

```json
{
  "state": "success",
  "data": {
    "_id": "64f123abc456def789012345",
    "title": "Cien años de soledad",
    "author": "Gabriel García Márquez",
    "description": "Una obra maestra del realismo mágico",
    "price": 35.50,
    "stock": 8,
    "image": {
      "id": "img_123456789",
      "url": "http://hosting.../images/cien_anos_soledad.jpg",
      "display_url": "http://hosting.../images/cien_anos_soledad.jpg",
      "thumb_url": "http://hosting.../thumbs/cien_anos_soledad.jpg",
      "medium_url": "http://hosting.../medium/cien_anos_soledad.jpg",
      "original_filename": "portada-cien-anos.jpg",
      "upload_date": "2025-10-29T15:30:00.000Z"
    },
    "createdAt": "2025-10-29T15:30:00.000Z",
    "updatedAt": "2025-10-29T15:30:00.000Z"
  },
  "message": "Libro creado exitosamente",
  "action_code": 201
}
```

## 🚀 ¡Listo para Usar!

La funcionalidad de imagen está completamente integrada. Puedes:

✅ **Crear libros con imagen** usando cualquiera de los 3 métodos
✅ **Validaciones automáticas** de formato y tamaño
✅ **Manejo de errores** robusto
✅ **Documentación Swagger** completa
✅ **Respuestas consistentes** con tu API existente

¡Prueba cualquiera de estos ejemplos! 🎉