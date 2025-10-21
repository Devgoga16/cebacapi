const analyticsService = require('../services/analyticsService');
const { sendResponse } = require('../utils/helpers');

const analyticsController = {
  // GET /api/analytics/books/top-selling
  async getTopSellingBooks(req, res) {
    try {
      const { period = 'month', limit = 10 } = req.query;
      
      // Validar parámetros
      const validPeriods = ['day', 'week', 'month', 'year'];
      if (!validPeriods.includes(period)) {
        return sendResponse(res, {
          state: 'error',
          message: `Período inválido. Debe ser uno de: ${validPeriods.join(', ')}`,
          action_code: 400
        });
      }

      const limitNum = parseInt(limit);
      if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
        return sendResponse(res, {
          state: 'error',
          message: 'El límite debe ser un número entre 1 y 100',
          action_code: 400
        });
      }

      const topBooks = await analyticsService.getTopSellingBooks(period, limitNum);
      
      sendResponse(res, {
        state: 'success',
        data: {
          period,
          limit: limitNum,
          books: topBooks
        },
        message: 'Libros más vendidos obtenidos exitosamente'
      });
    } catch (error) {
      console.error('Error al obtener libros más vendidos:', error);
      sendResponse(res, {
        state: 'error',
        message: 'Error interno del servidor',
        action_code: 500
      });
    }
  },

  // GET /api/analytics/sales/trends
  async getSalesTrends(req, res) {
    try {
      const { period = 'month', months = 12 } = req.query;
      
      // Validar parámetros
      const validPeriods = ['week', 'month', 'year'];
      if (!validPeriods.includes(period)) {
        return sendResponse(res, {
          state: 'error',
          message: `Período inválido. Debe ser uno de: ${validPeriods.join(', ')}`,
          action_code: 400
        });
      }

      const monthsNum = parseInt(months);
      if (isNaN(monthsNum) || monthsNum < 1 || monthsNum > 24) {
        return sendResponse(res, {
          state: 'error',
          message: 'Los meses deben ser un número entre 1 y 24',
          action_code: 400
        });
      }

      const trends = await analyticsService.getSalesTrends(period, monthsNum);
      
      sendResponse(res, {
        state: 'success',
        data: {
          period,
          months: monthsNum,
          trends
        },
        message: 'Tendencias de ventas obtenidas exitosamente'
      });
    } catch (error) {
      console.error('Error al obtener tendencias de ventas:', error);
      sendResponse(res, {
        state: 'error',
        message: 'Error interno del servidor',
        action_code: 500
      });
    }
  },

  // GET /api/analytics/revenue/summary
  async getRevenueSummary(req, res) {
    try {
      const { startDate, endDate } = req.query;
      
      // Validar fechas si se proporcionan
      if (startDate && isNaN(Date.parse(startDate))) {
        return sendResponse(res, {
          state: 'error',
          message: 'Fecha de inicio inválida. Use formato YYYY-MM-DD',
          action_code: 400
        });
      }

      if (endDate && isNaN(Date.parse(endDate))) {
        return sendResponse(res, {
          state: 'error',
          message: 'Fecha de fin inválida. Use formato YYYY-MM-DD',
          action_code: 400
        });
      }

      if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
        return sendResponse(res, {
          state: 'error',
          message: 'La fecha de inicio debe ser anterior a la fecha de fin',
          action_code: 400
        });
      }

      const summary = await analyticsService.getRevenueSummary(startDate, endDate);
      
      sendResponse(res, {
        state: 'success',
        data: summary,
        message: 'Resumen de ingresos obtenido exitosamente'
      });
    } catch (error) {
      console.error('Error al obtener resumen de ingresos:', error);
      sendResponse(res, {
        state: 'error',
        message: 'Error interno del servidor',
        action_code: 500
      });
    }
  },

  // GET /api/analytics/books/performance
  async getBookPerformance(req, res) {
    try {
      const { bookId } = req.query;
      
      if (!bookId) {
        return sendResponse(res, {
          state: 'error',
          message: 'El ID del libro es requerido',
          action_code: 400
        });
      }

      // Validar formato de ObjectId
      if (!bookId.match(/^[0-9a-fA-F]{24}$/)) {
        return sendResponse(res, {
          state: 'error',
          message: 'ID del libro inválido',
          action_code: 400
        });
      }

      const performance = await analyticsService.getBookPerformance(bookId);
      
      sendResponse(res, {
        state: 'success',
        data: performance,
        message: 'Rendimiento del libro obtenido exitosamente'
      });
    } catch (error) {
      console.error('Error al obtener rendimiento del libro:', error);
      
      if (error.message === 'Libro no encontrado') {
        return sendResponse(res, {
          state: 'error',
          message: 'Libro no encontrado',
          action_code: 404
        });
      }

      sendResponse(res, {
        state: 'error',
        message: 'Error interno del servidor',
        action_code: 500
      });
    }
  }
};

module.exports = analyticsController;