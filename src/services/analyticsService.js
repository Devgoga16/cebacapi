const Sale = require('../models/sale');
const Book = require('../models/book');

const analyticsService = {
  // Obtener libros más vendidos
  async getTopSellingBooks(period = 'month', limit = 10) {
    const dateFilter = this.getDateFilter(period);
    
    const pipeline = [
      // Filtrar por período
      { $match: { createdAt: dateFilter } },
      
      // Desenrollar el array de libros
      { $unwind: '$books' },
      
      // Agrupar por libro y calcular estadísticas
      {
        $group: {
          _id: '$books.book',
          totalQuantity: { $sum: '$books.quantity' },
          totalRevenue: { $sum: { $multiply: ['$books.quantity', '$books.price'] } },
          salesCount: { $sum: 1 },
          avgPrice: { $avg: '$books.price' }
        }
      },
      
      // Lookup para obtener información del libro
      {
        $lookup: {
          from: 'books',
          localField: '_id',
          foreignField: '_id',
          as: 'bookInfo'
        }
      },
      
      // Desenrollar la información del libro
      { $unwind: '$bookInfo' },
      
      // Proyectar los campos finales
      {
        $project: {
          bookId: '$_id',
          title: '$bookInfo.title',
          author: '$bookInfo.author',
          totalSold: '$totalQuantity',
          totalRevenue: { $round: ['$totalRevenue', 2] },
          salesCount: 1,
          avgPrice: { $round: ['$avgPrice', 2] }
        }
      },
      
      // Ordenar por cantidad vendida descendente
      { $sort: { totalSold: -1 } },
      
      // Limitar resultados
      { $limit: parseInt(limit) }
    ];

    return await Sale.aggregate(pipeline);
  },

  // Obtener tendencias de ventas
  async getSalesTrends(period = 'month', months = 12) {
    const endDate = new Date();
    const startDate = new Date();
    
    if (period === 'month') {
      startDate.setMonth(endDate.getMonth() - months);
    } else if (period === 'week') {
      startDate.setDate(endDate.getDate() - (months * 7));
    } else if (period === 'year') {
      startDate.setFullYear(endDate.getFullYear() - months);
    }

    const pipeline = [
      // Filtrar por rango de fechas
      {
        $match: {
          createdAt: {
            $gte: startDate,
            $lte: endDate
          }
        }
      },
      
      // Agrupar por período
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            ...(period === 'week' && { 
              week: { $week: '$createdAt' } 
            })
          },
          totalSales: { $sum: 1 },
          totalRevenue: { $sum: '$total' },
          totalBooks: {
            $sum: {
              $reduce: {
                input: '$books',
                initialValue: 0,
                in: { $add: ['$$value', '$$this.quantity'] }
              }
            }
          }
        }
      },
      
      // Proyectar formato de fecha
      {
        $project: {
          period: {
            $concat: [
              { $toString: '$_id.year' },
              '-',
              {
                $cond: {
                  if: { $lt: ['$_id.month', 10] },
                  then: { $concat: ['0', { $toString: '$_id.month' }] },
                  else: { $toString: '$_id.month' }
                }
              },
              ...(period === 'week' ? [
                '-W',
                { $toString: '$_id.week' }
              ] : [])
            ]
          },
          totalSales: 1,
          totalRevenue: { $round: ['$totalRevenue', 2] },
          totalBooks: 1
        }
      },
      
      // Ordenar por período
      { $sort: { '_id.year': 1, '_id.month': 1, ...(period === 'week' && { '_id.week': 1 }) } }
    ];

    return await Sale.aggregate(pipeline);
  },

  // Obtener resumen de ingresos
  async getRevenueSummary(startDate, endDate) {
    if (!startDate || !endDate) {
      // Por defecto, último mes
      endDate = new Date();
      startDate = new Date();
      startDate.setMonth(endDate.getMonth() - 1);
    } else {
      startDate = new Date(startDate);
      endDate = new Date(endDate);
    }

    const pipeline = [
      // Filtrar por rango de fechas
      {
        $match: {
          createdAt: {
            $gte: startDate,
            $lte: endDate
          }
        }
      },
      
      // Agrupar por status y calcular totales
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          revenue: { $sum: '$total' },
          totalBooks: {
            $sum: {
              $reduce: {
                input: '$books',
                initialValue: 0,
                in: { $add: ['$$value', '$$this.quantity'] }
              }
            }
          }
        }
      }
    ];

    const statusSummary = await Sale.aggregate(pipeline);
    
    // Calcular totales generales
    const totalPipeline = [
      {
        $match: {
          createdAt: {
            $gte: startDate,
            $lte: endDate
          }
        }
      },
      {
        $group: {
          _id: null,
          totalSales: { $sum: 1 },
          totalRevenue: { $sum: '$total' },
          totalBooks: {
            $sum: {
              $reduce: {
                input: '$books',
                initialValue: 0,
                in: { $add: ['$$value', '$$this.quantity'] }
              }
            }
          },
          avgSaleValue: { $avg: '$total' }
        }
      }
    ];

    const [totals] = await Sale.aggregate(totalPipeline);

    return {
      period: {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
      },
      summary: {
        totalSales: totals?.totalSales || 0,
        totalRevenue: Math.round((totals?.totalRevenue || 0) * 100) / 100,
        totalBooks: totals?.totalBooks || 0,
        avgSaleValue: Math.round((totals?.avgSaleValue || 0) * 100) / 100
      },
      byStatus: statusSummary.map(item => ({
        status: item._id,
        count: item.count,
        revenue: Math.round(item.revenue * 100) / 100,
        totalBooks: item.totalBooks
      }))
    };
  },

  // Obtener rendimiento de un libro específico
  async getBookPerformance(bookId) {
    if (!bookId) {
      throw new Error('ID del libro es requerido');
    }

    // Información básica del libro
    const book = await Book.findById(bookId);
    if (!book) {
      throw new Error('Libro no encontrado');
    }

    // Estadísticas de ventas del libro
    const pipeline = [
      // Filtrar ventas que contengan este libro
      { $match: { 'books.book': bookId } },
      
      // Desenrollar libros para trabajar solo con el libro específico
      { $unwind: '$books' },
      
      // Filtrar solo el libro específico
      { $match: { 'books.book': bookId } },
      
      // Agrupar para obtener estadísticas generales
      {
        $group: {
          _id: null,
          totalSold: { $sum: '$books.quantity' },
          totalRevenue: { $sum: { $multiply: ['$books.quantity', '$books.price'] } },
          salesCount: { $sum: 1 },
          avgPrice: { $avg: '$books.price' },
          minPrice: { $min: '$books.price' },
          maxPrice: { $max: '$books.price' }
        }
      }
    ];

    const [stats] = await Sale.aggregate(pipeline);

    // Tendencia mensual del libro
    const trendPipeline = [
      { $match: { 'books.book': bookId } },
      { $unwind: '$books' },
      { $match: { 'books.book': bookId } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          quantity: { $sum: '$books.quantity' },
          revenue: { $sum: { $multiply: ['$books.quantity', '$books.price'] } },
          sales: { $sum: 1 }
        }
      },
      {
        $project: {
          month: {
            $concat: [
              { $toString: '$_id.year' },
              '-',
              {
                $cond: {
                  if: { $lt: ['$_id.month', 10] },
                  then: { $concat: ['0', { $toString: '$_id.month' }] },
                  else: { $toString: '$_id.month' }
                }
              }
            ]
          },
          quantity: 1,
          revenue: { $round: ['$revenue', 2] },
          sales: 1
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ];

    const trendData = await Sale.aggregate(trendPipeline);

    return {
      bookId: book._id,
      title: book.title,
      author: book.author,
      currentStock: book.stock,
      currentPrice: book.price,
      totalSold: stats?.totalSold || 0,
      totalRevenue: Math.round((stats?.totalRevenue || 0) * 100) / 100,
      salesCount: stats?.salesCount || 0,
      avgPrice: Math.round((stats?.avgPrice || 0) * 100) / 100,
      priceRange: {
        min: stats?.minPrice || 0,
        max: stats?.maxPrice || 0
      },
      trendData: trendData.map(item => ({
        month: item.month,
        quantity: item.quantity,
        revenue: item.revenue,
        sales: item.sales
      }))
    };
  },

  // Función auxiliar para obtener filtro de fecha
  getDateFilter(period) {
    const now = new Date();
    const filter = {};

    switch (period) {
      case 'day':
        filter.$gte = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        filter.$gte = weekStart;
        break;
      case 'month':
        filter.$gte = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        filter.$gte = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        filter.$gte = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    return filter;
  }
};

module.exports = analyticsService;