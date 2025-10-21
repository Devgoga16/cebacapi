const Book = require('../models/book');
const Sale = require('../models/sale');

// 1) Servicio para agregar un libro
exports.crearLibro = async (data) => {
  const { title, author, description, price, stock } = data;
  
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
  const { buyer, books } = data;

  if (!books || !Array.isArray(books) || books.length === 0) {
    const err = new Error('Debe especificar al menos un libro');
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

  // Crear la venta
  const venta = new Sale({
    buyer,
    books: librosValidados,
    total,
    status: 'reservado'
  });

  // Reducir stock de los libros
  for (const item of books) {
    await Book.findByIdAndUpdate(
      item.book,
      { $inc: { stock: -item.quantity } }
    );
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