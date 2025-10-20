const booksService = require('../services/booksService');
const { sendResponse } = require('../utils/helpers');

// 1) Controlador para agregar un libro
exports.crearLibro = async (req, res, next) => {
  try {
    const libro = await booksService.crearLibro(req.body);
    sendResponse(res, { 
      data: libro, 
      message: 'Libro creado exitosamente', 
      action_code: 201 
    });
  } catch (err) {
    next(err);
  }
};

// 2) Controlador para agregar stock
exports.agregarStock = async (req, res, next) => {
  try {
    const { cantidad } = req.body;
    const libro = await booksService.agregarStock(req.params.id, cantidad);
    sendResponse(res, { 
      data: libro, 
      message: 'Stock agregado exitosamente' 
    });
  } catch (err) {
    next(err);
  }
};

// 3) Controlador para listar libros con stock
exports.listarLibrosConStock = async (req, res, next) => {
  try {
    const libros = await booksService.listarLibrosConStock();
    sendResponse(res, { 
      data: libros, 
      message: 'Libros con stock obtenidos exitosamente' 
    });
  } catch (err) {
    next(err);
  }
};

// Controlador para listar todos los libros
exports.listarTodosLibros = async (req, res, next) => {
  try {
    const libros = await booksService.listarTodosLibros();
    sendResponse(res, { 
      data: libros, 
      message: 'Todos los libros obtenidos exitosamente' 
    });
  } catch (err) {
    next(err);
  }
};

// 4) Controlador para comprar libros
exports.comprarLibros = async (req, res, next) => {
  try {
    const venta = await booksService.comprarLibros(req.body);
    sendResponse(res, { 
      data: venta, 
      message: 'Compra realizada exitosamente', 
      action_code: 201 
    });
  } catch (err) {
    next(err);
  }
};

// 5) Controlador para entregar libros
exports.entregarLibros = async (req, res, next) => {
  try {
    const { deliveredBy } = req.body;
    const venta = await booksService.entregarLibros(req.params.id, deliveredBy);
    sendResponse(res, { 
      data: venta, 
      message: 'Libros entregados exitosamente' 
    });
  } catch (err) {
    next(err);
  }
};

// Controladores adicionales
exports.obtenerVenta = async (req, res, next) => {
  try {
    const venta = await booksService.obtenerVenta(req.params.id);
    if (!venta) {
      return sendResponse(res, { 
        state: 'failed', 
        data: null, 
        message: 'Venta no encontrada', 
        action_code: 404 
      });
    }
    sendResponse(res, { 
      data: venta, 
      message: 'Venta obtenida exitosamente' 
    });
  } catch (err) {
    next(err);
  }
};

exports.listarVentas = async (req, res, next) => {
  try {
    const { status, buyer } = req.query;
    const ventas = await booksService.listarVentas({ status, buyer });
    sendResponse(res, { 
      data: ventas, 
      message: 'Ventas obtenidas exitosamente' 
    });
  } catch (err) {
    next(err);
  }
};

exports.cambiarEstadoVenta = async (req, res, next) => {
  try {
    const { status } = req.body;
    const venta = await booksService.cambiarEstadoVenta(req.params.id, status);
    sendResponse(res, { 
      data: venta, 
      message: 'Estado de venta actualizado exitosamente' 
    });
  } catch (err) {
    next(err);
  }
};