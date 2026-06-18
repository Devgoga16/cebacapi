const booksService = require('../services/booksService');
const { sendResponse } = require('../utils/helpers');
const audit = require('../services/auditService');

// 1) Controlador para agregar un libro
exports.crearLibro = async (req, res, next) => {
  try {
    // Combinar datos del body con el archivo de imagen si existe
    const data = {
      ...req.body,
      imageFile: req.file // Si se usa multer
    };

    const libro = await booksService.crearLibro(data);
    audit.registrar({
      accion: 'LIBRO_CREADO',
      entidad: 'Book',
      id_entidad: libro._id?.toString(),
      actor: req.actor,
      descripcion: `Libro "${req.body.title || req.body.titulo || ''}" creado`,
      payload: { ...req.body, imageFile: undefined },
      request_body: req.body,
      ip: req.ip,
      user_agent: req.headers['user-agent'],
    });
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
    audit.registrar({
      accion: 'LIBRO_STOCK_AGREGADO',
      entidad: 'Book',
      id_entidad: req.params.id,
      actor: req.actor,
      descripcion: `Stock de ${cantidad} unidades agregado al libro ${req.params.id}`,
      payload: { cantidad },
      request_body: req.body,
      ip: req.ip,
      user_agent: req.headers['user-agent'],
    });
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
    const body = { ...req.body };

    if (typeof body.books === 'string') {
      try {
        body.books = JSON.parse(body.books);
      } catch (parseErr) {
        const err = new Error('El campo books debe ser un JSON válido');
        err.statusCode = 400;
        throw err;
      }
    }

    const data = {
      ...body,
      voucherFile: req.file
    };

    const venta = await booksService.comprarLibros(data);
    audit.registrar({
      accion: 'LIBROS_COMPRADOS',
      entidad: 'Sale',
      id_entidad: venta._id?.toString(),
      actor: req.actor,
      descripcion: `Compra de libros registrada — comprador: ${body.buyer || body.comprador || 'desconocido'}`,
      payload: { ...body, voucherFile: undefined },
      request_body: req.body,
      ip: req.ip,
      user_agent: req.headers['user-agent'],
    });
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
    audit.registrar({
      accion: 'LIBROS_ENTREGADOS',
      entidad: 'Sale',
      id_entidad: req.params.id,
      actor: req.actor,
      descripcion: `Venta ${req.params.id} marcada como entregada por ${deliveredBy || 'desconocido'}`,
      payload: { deliveredBy },
      request_body: req.body,
      ip: req.ip,
      user_agent: req.headers['user-agent'],
    });
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
    audit.registrar({
      accion: 'VENTA_ESTADO_CAMBIADO',
      entidad: 'Sale',
      id_entidad: req.params.id,
      actor: req.actor,
      descripcion: `Estado de venta ${req.params.id} cambiado a "${status}"`,
      payload: { status },
      request_body: req.body,
      ip: req.ip,
      user_agent: req.headers['user-agent'],
    });
    sendResponse(res, {
      data: venta,
      message: 'Estado de venta actualizado exitosamente'
    });
  } catch (err) {
    next(err);
  }
};

// Controlador para ver mis compras
exports.verMisCompras = async (req, res, next) => {
  try {
    const { id_persona } = req.params;
    const compras = await booksService.verMisCompras(id_persona);
    sendResponse(res, {
      data: compras,
      message: 'Mis compras obtenidas exitosamente'
    });
  } catch (err) {
    next(err);
  }
};

// Controlador para validar voucher
exports.validarVoucher = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { action, validated_by, rejection_reason } = req.body;

    const venta = await booksService.validarVoucher(id, {
      action,
      validated_by,
      rejection_reason
    });

    const message = action === 'aprobar'
      ? 'Voucher aprobado exitosamente'
      : 'Voucher rechazado exitosamente';

    audit.registrar({
      accion: action === 'aprobar' ? 'VOUCHER_APROBADO' : 'VOUCHER_RECHAZADO',
      entidad: 'Sale',
      id_entidad: id,
      actor: req.actor,
      descripcion: `Voucher de venta ${id} ${action === 'aprobar' ? 'aprobado' : 'rechazado'} por ${validated_by || 'desconocido'}`,
      payload: { validated_by, rejection_reason },
      request_body: req.body,
      ip: req.ip,
      user_agent: req.headers['user-agent'],
    });

    sendResponse(res, {
      data: venta,
      message
    });
  } catch (err) {
    next(err);
  }
};

// Controladores para manejo de imágenes de libros

// Actualizar imagen de un libro
exports.actualizarImagenLibro = async (req, res, next) => {
  try {
    const { id } = req.params;
    const imageData = {
      imageFile: req.file,
      imageBase64: req.body.imageBase64,
      imageUrl: req.body.imageUrl
    };

    const libro = await booksService.actualizarImagenLibro(id, imageData);
    audit.registrar({
      accion: 'LIBRO_IMAGEN_ACTUALIZADA',
      entidad: 'Book',
      id_entidad: id,
      actor: req.actor,
      descripcion: `Imagen del libro ${id} actualizada`,
      request_body: req.body,
      ip: req.ip,
      user_agent: req.headers['user-agent'],
    });
    sendResponse(res, {
      data: libro,
      message: 'Imagen del libro actualizada exitosamente'
    });
  } catch (err) {
    next(err);
  }
};

// Eliminar imagen de un libro
exports.eliminarImagenLibro = async (req, res, next) => {
  try {
    const { id } = req.params;
    const libro = await booksService.eliminarImagenLibro(id);
    audit.registrar({
      accion: 'LIBRO_IMAGEN_ELIMINADA',
      entidad: 'Book',
      id_entidad: id,
      actor: req.actor,
      descripcion: `Imagen del libro ${id} eliminada`,
      request_body: req.body,
      ip: req.ip,
      user_agent: req.headers['user-agent'],
    });
    sendResponse(res, {
      data: libro,
      message: 'Imagen del libro eliminada exitosamente'
    });
  } catch (err) {
    next(err);
  }
};

// Obtener información de imagen de un libro
exports.obtenerImagenLibro = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await booksService.obtenerImagenLibro(id);
    sendResponse(res, {
      data: result,
      message: 'Información de imagen obtenida exitosamente'
    });
  } catch (err) {
    next(err);
  }
};
