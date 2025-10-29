const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

class ImageUploadService {
  constructor() {
    this.apiUrl = 'http://hosting-cpanel-chevereto-965a6d-31-97-133-67.traefik.me/api/1/upload';
    this.apiKey = 'chv_cA_32945a06549e00efa8520ce9494818e3505fb872ed170900d0a0ed454c06850b46547ee85adf247a4caaa9d94e71629d8486511affed647ff64e3d6bbb3fa548';
    this.sessionId = 'abae24ae21a6fe0c806f08827bf09bdb';
  }

  /**
   * Subir imagen desde archivo local
   * @param {string} filePath - Ruta del archivo a subir
   * @returns {Promise<Object>} - Respuesta de la API con datos de la imagen
   */
  async uploadFromFile(filePath) {
    try {
      // Verificar que el archivo existe
      if (!fs.existsSync(filePath)) {
        throw new Error('El archivo no existe');
      }

      // Crear FormData
      const formData = new FormData();
      formData.append('source', fs.createReadStream(filePath));

      // Configurar headers
      const headers = {
        'X-API-Key': this.apiKey,
        'Cookie': `PHPSESSID=${this.sessionId}`,
        ...formData.getHeaders()
      };

      // Realizar la petición
      const response = await axios.post(this.apiUrl, formData, {
        headers,
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      });

      return this.processResponse(response.data);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Subir imagen desde Buffer
   * @param {Buffer} imageBuffer - Buffer de la imagen
   * @param {string} filename - Nombre del archivo (opcional)
   * @returns {Promise<Object>} - Respuesta de la API con datos de la imagen
   */
  async uploadFromBuffer(imageBuffer, filename = 'image.jpg') {
    try {
      // Crear FormData
      const formData = new FormData();
      formData.append('source', imageBuffer, {
        filename,
        contentType: this.getMimeType(filename)
      });

      // Configurar headers
      const headers = {
        'X-API-Key': this.apiKey,
        'Cookie': `PHPSESSID=${this.sessionId}`,
        ...formData.getHeaders()
      };

      // Realizar la petición
      const response = await axios.post(this.apiUrl, formData, {
        headers,
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      });

      return this.processResponse(response.data);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Subir imagen desde Base64
   * @param {string} base64String - String en base64 de la imagen
   * @param {string} filename - Nombre del archivo (opcional)
   * @returns {Promise<Object>} - Respuesta de la API con datos de la imagen
   */
  async uploadFromBase64(base64String, filename = 'image.jpg') {
    try {
      // Limpiar el string base64 (remover prefijo data:image/...)
      const cleanBase64 = base64String.replace(/^data:image\/[a-z]+;base64,/, '');
      
      // Convertir a buffer
      const imageBuffer = Buffer.from(cleanBase64, 'base64');
      
      return await this.uploadFromBuffer(imageBuffer, filename);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Subir imagen desde URL
   * @param {string} imageUrl - URL de la imagen a subir
   * @returns {Promise<Object>} - Respuesta de la API con datos de la imagen
   */
  async uploadFromUrl(imageUrl) {
    try {
      // Crear FormData con la URL
      const formData = new FormData();
      formData.append('source', imageUrl);

      // Configurar headers
      const headers = {
        'X-API-Key': this.apiKey,
        'Cookie': `PHPSESSID=${this.sessionId}`,
        ...formData.getHeaders()
      };

      // Realizar la petición
      const response = await axios.post(this.apiUrl, formData, {
        headers,
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      });

      return this.processResponse(response.data);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Procesar la respuesta de la API
   * @param {Object} responseData - Datos de respuesta de la API
   * @returns {Object} - Datos procesados de la imagen
   */
  processResponse(responseData) {
    if (responseData.status_code !== 200) {
      throw new Error(responseData.error?.message || 'Error en la subida de imagen');
    }

    const imageData = responseData.image;
    
    return {
      success: true,
      id: imageData.id,
      name: imageData.name,
      extension: imageData.extension,
      size: imageData.size,
      width: imageData.width,
      height: imageData.height,
      url: imageData.url,
      display_url: imageData.display_url,
      thumb: {
        url: imageData.thumb?.url,
        filename: imageData.thumb?.filename
      },
      medium: {
        url: imageData.medium?.url,
        filename: imageData.medium?.filename
      },
      delete_url: imageData.delete_url,
      upload_date: new Date(),
      original_filename: imageData.original_filename || imageData.name
    };
  }

  /**
   * Manejar errores de la API
   * @param {Error} error - Error capturado
   * @returns {Error} - Error procesado
   */
  handleError(error) {
    if (error.response) {
      // Error de respuesta HTTP
      const message = error.response.data?.error?.message || 
                    error.response.data?.message || 
                    `Error HTTP ${error.response.status}`;
      
      const customError = new Error(message);
      customError.statusCode = error.response.status;
      customError.originalError = error.response.data;
      return customError;
    } else if (error.request) {
      // Error de red
      const customError = new Error('Error de conexión con el servicio de imágenes');
      customError.statusCode = 503;
      return customError;
    } else {
      // Otros errores
      const customError = new Error(error.message || 'Error desconocido en subida de imagen');
      customError.statusCode = 500;
      return customError;
    }
  }

  /**
   * Obtener el tipo MIME basado en la extensión del archivo
   * @param {string} filename - Nombre del archivo
   * @returns {string} - Tipo MIME
   */
  getMimeType(filename) {
    const extension = path.extname(filename).toLowerCase();
    
    const mimeTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.bmp': 'image/bmp',
      '.svg': 'image/svg+xml'
    };

    return mimeTypes[extension] || 'image/jpeg';
  }

  /**
   * Validar formato de imagen
   * @param {string} filename - Nombre del archivo
   * @returns {boolean} - True si es un formato válido
   */
  isValidImageFormat(filename) {
    const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];
    const extension = path.extname(filename).toLowerCase();
    return validExtensions.includes(extension);
  }

  /**
   * Validar tamaño de archivo (en bytes)
   * @param {number} fileSize - Tamaño del archivo en bytes
   * @param {number} maxSize - Tamaño máximo permitido (default: 10MB)
   * @returns {boolean} - True si el tamaño es válido
   */
  isValidFileSize(fileSize, maxSize = 10 * 1024 * 1024) {
    return fileSize <= maxSize;
  }
}

// Crear instancia singleton
const imageUploadService = new ImageUploadService();

module.exports = imageUploadService;