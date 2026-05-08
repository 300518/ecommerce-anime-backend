import { Carrito } from '../modelos/carrito.modelo.js';

export class CarritoDAO {

  async crear() {
    return await Carrito.create({ productos: [] });
  }

  async obtenerPorId(id) {
    return await Carrito.findById(id).populate('productos.producto');
  }

  async guardar(carrito) {
    return await carrito.save();
  }
}