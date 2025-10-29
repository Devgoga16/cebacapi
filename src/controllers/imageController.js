const imageUploadService = require('../services/imageUploadService');
const { sendResponse } = require('../utils/helpers');

const imageController = {
  // Subir imagen desde archivo
  async uploadFromFile(req, res) {
    try {
      if (!req.file) {
        return sendResponse(res, {
          state: 'error',
          message: 'No se proporcionó ningún archivo',
          action_code: 400
        });
      }

      // Validar formato
      if (!imageUploadService.isValidImageFormat(req.file.originalname)) {
        return sendResponse(res, {
          state: 'error',
          message: 'Formato de imagen no válido. Use JPG, PNG, GIF, WEBP o BMP',
          action_code: 400
        });
      }

      // Validar tamaño
      if (!imageUploadService.isValidFileSize(req.file.size)) {
        return sendResponse(res, {
          state: 'error',
          message: 'El archivo es demasiado grande. Máximo 10MB',
          action_code: 400
        });
      }

      const result = await imageUploadService.uploadFromBuffer(
        req.file.buffer,
        req.file.originalname
      );

      sendResponse(res, {
        state: 'success',
        data: result,
        message: 'Imagen subida exitosamente'
      });
    } catch (error) {
      console.error('Error al subir imagen desde archivo:', error);
      sendResponse(res, {
        state: 'error',
        message: error.message || 'Error interno del servidor',
        action_code: error.statusCode || 500
      });
    }
  },

  // Subir imagen desde Base64
  async uploadFromBase64(req, res) {
    try {
      const { base64, filename } = req.body;

      if (!base64) {
        return sendResponse(res, {
          state: 'error',
          message: 'Debe proporcionar el string base64 de la imagen',
          action_code: 400
        });
      }

      const result = await imageUploadService.uploadFromBase64(
        base64,
        filename || 'image.jpg'
      );

      sendResponse(res, {
        state: 'success',
        data: result,
        message: 'Imagen subida exitosamente desde base64'
      });
    } catch (error) {
      console.error('Error al subir imagen desde base64:', error);
      sendResponse(res, {
        state: 'error',
        message: error.message || 'Error interno del servidor',
        action_code: error.statusCode || 500
      });
    }
  },

  // Subir imagen desde URL
  async uploadFromUrl(req, res) {
    try {
      const { url } = req.body;

      if (!url) {
        return sendResponse(res, {
          state: 'error',
          message: 'Debe proporcionar la URL de la imagen',
          action_code: 400
        });
      }

      // Validar formato de URL
      const urlPattern = /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp|bmp)$/i;
      if (!urlPattern.test(url)) {
        return sendResponse(res, {
          state: 'error',
          message: 'URL de imagen no válida',
          action_code: 400
        });
      }

      const result = await imageUploadService.uploadFromUrl(url);

      sendResponse(res, {
        state: 'success',
        data: result,
        message: 'Imagen subida exitosamente desde URL'
      });
    } catch (error) {
      console.error('Error al subir imagen desde URL:', error);
      sendResponse(res, {
        state: 'error',
        message: error.message || 'Error interno del servidor',
        action_code: error.statusCode || 500
      });
    }
  },

  // Subir múltiples imágenes
  async uploadMultiple(req, res) {
    try {
      if (!req.files || req.files.length === 0) {
        return sendResponse(res, {
          state: 'error',
          message: 'No se proporcionaron archivos',
          action_code: 400
        });
      }

      const results = [];
      const errors = [];

      for (const file of req.files) {
        try {
          // Validar cada archivo
          if (!imageUploadService.isValidImageFormat(file.originalname)) {
            errors.push({
              filename: file.originalname,
              error: 'Formato no válido'
            });
            continue;
          }

          if (!imageUploadService.isValidFileSize(file.size)) {
            errors.push({
              filename: file.originalname,
              error: 'Archivo demasiado grande'
            });
            continue;
          }

          const result = await imageUploadService.uploadFromBuffer(
            file.buffer,
            file.originalname
          );

          results.push({
            filename: file.originalname,
            success: true,
            data: result
          });
        } catch (error) {
          errors.push({
            filename: file.originalname,
            error: error.message
          });
        }
      }

      sendResponse(res, {
        state: errors.length === 0 ? 'success' : 'partial',
        data: {
          successful: results,
          failed: errors,
          summary: {
            total: req.files.length,
            successful: results.length,
            failed: errors.length
          }
        },
        message: `Subida completada: ${results.length} exitosas, ${errors.length} fallidas`
      });
    } catch (error) {
      console.error('Error al subir múltiples imágenes:', error);
      sendResponse(res, {
        state: 'error',
        message: error.message || 'Error interno del servidor',
        action_code: error.statusCode || 500
      });
    }
  }
};

module.exports = imageController;