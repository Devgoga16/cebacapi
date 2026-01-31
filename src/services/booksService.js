const Book = require('../models/book');
const Sale = require('../models/sale');
const imageUploadService = require('./imageUploadService');

// 1) Servicio para agregar un libro
exports.crearLibro = async (data) => {
  const { title, author, description, price, stock, imageFile, imageBase64, imageUrl } = data;
  
  // Verificar si el libro ya existe (mismo título y autor)
  const libroExistente = await Book.findOne({ title, author });
  if (libroExistente) {
    const err = new Error('El libro ya existe con el mismo título y autor');
    err.statusCode = 400;
    throw err;
  }

  const libro = new Book({
    title,
    author,
    description: description || '',
    price,
    stock: stock || 0
  });

  // Manejar subida de imagen si se proporciona
  if (imageFile || imageBase64 || imageUrl) {
    try {
      let imageResult;
      
      if (imageFile) {
        // Subir desde archivo (multer)
        imageResult = await imageUploadService.uploadFromBuffer(
          imageFile.buffer, 
          imageFile.originalname
        );
      } else if (imageBase64) {
        // Subir desde base64
        imageResult = await imageUploadService.uploadFromBase64(
          imageBase64, 
          `${title.replace(/[^a-zA-Z0-9]/g, '_')}.jpg`
        );
      } else if (imageUrl) {
        // Subir desde URL
        imageResult = await imageUploadService.uploadFromUrl(imageUrl);
      }

      if (imageResult && imageResult.success) {
        libro.image = {
          id: imageResult.id,
          url: imageResult.url,
          display_url: imageResult.display_url,
          thumb_url: imageResult.thumb?.url,
          medium_url: imageResult.medium?.url,
          original_filename: imageResult.original_filename,
          upload_date: imageResult.upload_date
        };
      }
    } catch (imageError) {
      console.warn('Error al subir imagen del libro:', imageError.message);
      // No fallar la creación del libro por error de imagen
    }
  }

  return await libro.save();
};

// 2) Servicio para ingreso de stock nuevo al libro
exports.agregarStock = async (id_libro, cantidad) => {
  if (!cantidad || cantidad <= 0) {
    const err = new Error('La cantidad debe ser mayor a 0');
    err.statusCode = 400;
    throw err;
  }

  const libro = await Book.findById(id_libro);
  if (!libro) {
    const err = new Error('Libro no encontrado');
    err.statusCode = 404;
    throw err;
  }

  libro.stock += cantidad;
  return await libro.save();
};

// 3) Servicio para listar los libros con stock
exports.listarLibrosConStock = async () => {
  return await Book.find({ stock: { $gt: 0 } }).sort({ title: 1 });
};

// Servicio adicional: listar todos los libros
exports.listarTodosLibros = async () => {
  return await Book.find().sort({ title: 1 });
};

// 4) Servicio para comprar uno o más libros
exports.comprarLibros = async (data) => {
  const { buyer, books, paymentMethod, voucherFile, voucherBase64, voucherUrl } = data;

  if (!books || !Array.isArray(books) || books.length === 0) {
    const err = new Error('Debe especificar al menos un libro');
    err.statusCode = 400;
    throw err;
  }

  const validMethods = ['efectivo', 'transferencia', 'yape'];
  if (!paymentMethod || !validMethods.includes(paymentMethod)) {
    const err = new Error('paymentMethod debe ser: efectivo, transferencia o yape');
    err.statusCode = 400;
    throw err;
  }

  const requiereVoucher = paymentMethod === 'transferencia' || paymentMethod === 'yape';
  const tieneVoucher = Boolean(voucherFile || voucherBase64 || voucherUrl);
  if (requiereVoucher && !tieneVoucher) {
    const err = new Error('Debe adjuntar voucher cuando el pago es transferencia o yape');
    err.statusCode = 400;
    throw err;
  }

  let total = 0;
  const librosValidados = [];

  // Validar disponibilidad y calcular total
  for (const item of books) {
    const libro = await Book.findById(item.book);
    if (!libro) {
      const err = new Error(`Libro con ID ${item.book} no encontrado`);
      err.statusCode = 404;
      throw err;
    }

    if (libro.stock < item.quantity) {
      const err = new Error(`Stock insuficiente para "${libro.title}". Disponible: ${libro.stock}, Solicitado: ${item.quantity}`);
      err.statusCode = 400;
      throw err;
    }

    const subtotal = libro.price * item.quantity;
    total += subtotal;

    librosValidados.push({
      book: libro._id,
      quantity: item.quantity,
      unitPrice: libro.price
    });
  }

  let voucherData = null;
  if (tieneVoucher) {
    try {
      let imageResult;

      if (voucherFile) {
        if (!imageUploadService.isValidImageFormat(voucherFile.originalname)) {
          const err = new Error('Formato de voucher no válido. Use JPG, PNG, GIF, WEBP o BMP');
          err.statusCode = 400;
          throw err;
        }
        if (!imageUploadService.isValidFileSize(voucherFile.size)) {
          const err = new Error('El voucher es demasiado grande. Máximo 10MB');
          err.statusCode = 400;
          throw err;
        }
        imageResult = await imageUploadService.uploadFromBuffer(
          voucherFile.buffer,
          voucherFile.originalname
        );
      } else if (voucherBase64) {
        imageResult = await imageUploadService.uploadFromBase64(
          voucherBase64,
          `voucher_${Date.now()}.jpg`
        );
      } else if (voucherUrl) {
        imageResult = await imageUploadService.uploadFromUrl(voucherUrl);
      }

      if (imageResult && imageResult.success) {
        voucherData = {
          id: imageResult.id,
          url: imageResult.url,
          display_url: imageResult.display_url,
          thumb_url: imageResult.thumb?.url,
          medium_url: imageResult.medium?.url,
          original_filename: imageResult.original_filename,
          upload_date: imageResult.upload_date
        };
      }
    } catch (imageError) {
      const err = new Error(imageError.message || 'Error al subir voucher');
      err.statusCode = imageError.statusCode || 500;
      throw err;
    }
  }

  // Crear la venta (siempre como reservado, sin bajar stock aún)
  const venta = new Sale({
    buyer,
    books: librosValidados,
    total,
    paymentMethod,
    voucher: voucherData || undefined,
    status: 'reservado'
  });

  return await venta.save();
};

// Servicio para aprobar o rechazar voucher
exports.validarVoucher = async (id_venta, { action, validated_by, rejection_reason }) => {
  const validActions = ['aprobar', 'rechazar'];
  if (!action || !validActions.includes(action)) {
    const err = new Error('action debe ser: aprobar o rechazar');
    err.statusCode = 400;
    throw err;
  }

  if (!validated_by) {
    const err = new Error('validated_by es requerido');
    err.statusCode = 400;
    throw err;
  }

  if (action === 'rechazar' && !rejection_reason) {
    const err = new Error('rejection_reason es requerido al rechazar');
    err.statusCode = 400;
    throw err;
  }

  const venta = await Sale.findById(id_venta)
    .populate('buyer', 'nombres apellido_paterno apellido_materno')
    .populate('books.book');

  if (!venta) {
    const err = new Error('Venta no encontrada');
    err.statusCode = 404;
    throw err;
  }

  const paymentMethod = venta.paymentMethod;
  if (paymentMethod === 'efectivo') {
    const err = new Error('Las ventas en efectivo no requieren validación de voucher');
    err.statusCode = 400;
    throw err;
  }

  if (!venta.voucher || !venta.voucher.url) {
    const err = new Error('Esta venta no tiene voucher adjunto');
    err.statusCode = 400;
    throw err;
  }

  const currentStatus = venta.voucher.validation_status || 'pendiente';
  if (currentStatus !== 'pendiente') {
    const err = new Error(`El voucher ya fue ${currentStatus}`);
    err.statusCode = 400;
    throw err;
  }

  venta.voucher.validation_status = action === 'aprobar' ? 'aprobado' : 'rechazado';
  venta.voucher.validated_by = validated_by;
  venta.voucher.validated_at = new Date();
  
  if (action === 'rechazar') {
    venta.voucher.rejection_reason = rejection_reason;
    // Si se rechaza, cambiar estado de venta a reservado
    venta.status = 'reservado';
  } else {
    // Si se aprueba, cambiar estado a pagado y bajar stock (transferencia/yape)
    venta.status = 'pagado';
    
    // Bajar stock para pagos no efectivo
    for (const item of venta.books) {
      const libro = await Book.findById(item.book);
      if (!libro) {
        const err = new Error(`Libro con ID ${item.book} no encontrado`);
        err.statusCode = 404;
        throw err;
      }
      
      if (libro.stock < item.quantity) {
        const err = new Error(`Stock insuficiente para "${libro.title}". Disponible: ${libro.stock}, Requerido: ${item.quantity}`);
        err.statusCode = 400;
        throw err;
      }
      
      await Book.findByIdAndUpdate(
        item.book,
        { $inc: { stock: -item.quantity } }
      );
    }
  }

  return await venta.save();
};

// 5) Servicio para entregar los libros comprados
exports.entregarLibros = async (id_venta, deliveredBy) => {
  const venta = await Sale.findById(id_venta).populate('buyer books.book');
  
  if (!venta) {
    const err = new Error('Venta no encontrada');
    err.statusCode = 404;
    throw err;
  }

  if (venta.status === 'entregado') {
    const err = new Error('Esta venta ya fue entregada');
    err.statusCode = 400;
    throw err;
  }

  // Si es pago en efectivo, bajar stock al momento de entregar
  if (venta.paymentMethod === 'efectivo') {
    for (const item of venta.books) {
      const libro = await Book.findById(item.book);
      if (!libro) {
        const err = new Error(`Libro con ID ${item.book} no encontrado`);
        err.statusCode = 404;
        throw err;
      }
      
      if (libro.stock < item.quantity) {
        const err = new Error(`Stock insuficiente para "${libro.title}". Disponible: ${libro.stock}, Requerido: ${item.quantity}`);
        err.statusCode = 400;
        throw err;
      }
      
      await Book.findByIdAndUpdate(
        item.book,
        { $inc: { stock: -item.quantity } }
      );
    }
    // Marcar como pagado al entregar en efectivo
    venta.status = 'pagado';
  }

  venta.status = 'entregado';
  venta.deliveredBy = deliveredBy;
  
  return await venta.save();
};

// Servicios adicionales útiles
exports.obtenerVenta = async (id_venta) => {
  return await Sale.findById(id_venta)
    .populate('buyer', 'nombres apellido_paterno apellido_materno')
    .populate('deliveredBy', 'nombres apellido_paterno apellido_materno')
    .populate('books.book');
};

exports.listarVentas = async (filtros = {}) => {
  const { status, buyer } = filtros;
  const query = {};
  
  if (status) query.status = status;
  if (buyer) query.buyer = buyer;

  return await Sale.find(query)
    .populate('buyer', 'nombres apellido_paterno apellido_materno')
    .populate('deliveredBy', 'nombres apellido_paterno apellido_materno')
    .populate('books.book')
    .sort({ saleDate: -1 });
};

exports.cambiarEstadoVenta = async (id_venta, nuevoEstado) => {
  const estadosValidos = ['reservado', 'pagado', 'entregado'];
  
  if (!estadosValidos.includes(nuevoEstado)) {
    const err = new Error('Estado no válido');
    err.statusCode = 400;
    throw err;
  }

  const venta = await Sale.findByIdAndUpdate(
    id_venta,
    { status: nuevoEstado },
    { new: true }
  ).populate('buyer books.book');

  if (!venta) {
    const err = new Error('Venta no encontrada');
    err.statusCode = 404;
    throw err;
  }

  return venta;
};

// Servicio para ver mis compras por persona
exports.verMisCompras = async (id_persona) => {
  return await Sale.find({ buyer: id_persona })
    .populate('buyer', 'nombres apellido_paterno apellido_materno')
    .populate('deliveredBy', 'nombres apellido_paterno apellido_materno')
    .populate('books.book')
    .sort({ saleDate: -1 });
};

// Servicios para manejo de imágenes de libros

// Actualizar imagen de un libro
exports.actualizarImagenLibro = async (id_libro, imageData) => {
  const { imageFile, imageBase64, imageUrl } = imageData;
  
  const libro = await Book.findById(id_libro);
  if (!libro) {
    const err = new Error('Libro no encontrado');
    err.statusCode = 404;
    throw err;
  }

  try {
    let imageResult;
    
    if (imageFile) {
      // Validar formato y tamaño
      if (!imageUploadService.isValidImageFormat(imageFile.originalname)) {
        const err = new Error('Formato de imagen no válido. Use JPG, PNG, GIF, WEBP o BMP');
        err.statusCode = 400;
        throw err;
      }
      
      if (!imageUploadService.isValidFileSize(imageFile.size)) {
        const err = new Error('El archivo es demasiado grande. Máximo 10MB');
        err.statusCode = 400;
        throw err;
      }
      
      imageResult = await imageUploadService.uploadFromBuffer(
        imageFile.buffer, 
        imageFile.originalname
      );
    } else if (imageBase64) {
      imageResult = await imageUploadService.uploadFromBase64(
        imageBase64, 
        `${libro.title.replace(/[^a-zA-Z0-9]/g, '_')}.jpg`
      );
    } else if (imageUrl) {
      imageResult = await imageUploadService.uploadFromUrl(imageUrl);
    } else {
      const err = new Error('Debe proporcionar una imagen (archivo, base64 o URL)');
      err.statusCode = 400;
      throw err;
    }

    if (imageResult && imageResult.success) {
      libro.image = {
        id: imageResult.id,
        url: imageResult.url,
        display_url: imageResult.display_url,
        thumb_url: imageResult.thumb?.url,
        medium_url: imageResult.medium?.url,
        original_filename: imageResult.original_filename,
        upload_date: imageResult.upload_date
      };
      
      return await libro.save();
    } else {
      const err = new Error('Error al procesar la imagen');
      err.statusCode = 500;
      throw err;
    }
  } catch (error) {
    if (error.statusCode) {
      throw error;
    }
    const err = new Error(`Error al subir imagen: ${error.message}`);
    err.statusCode = 500;
    throw err;
  }
};

// Eliminar imagen de un libro
exports.eliminarImagenLibro = async (id_libro) => {
  const libro = await Book.findById(id_libro);
  if (!libro) {
    const err = new Error('Libro no encontrado');
    err.statusCode = 404;
    throw err;
  }

  if (!libro.image || !libro.image.id) {
    const err = new Error('El libro no tiene imagen asignada');
    err.statusCode = 400;
    throw err;
  }

  // Limpiar el campo image
  libro.image = undefined;
  return await libro.save();
};

// Obtener información de imagen de un libro
exports.obtenerImagenLibro = async (id_libro) => {
  const libro = await Book.findById(id_libro).select('title author image');
  if (!libro) {
    const err = new Error('Libro no encontrado');
    err.statusCode = 404;
    throw err;
  }

  return {
    libro: {
      id: libro._id,
      title: libro.title,
      author: libro.author
    },
    image: libro.image || null
  };
};