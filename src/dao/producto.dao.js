import { Producto } from "../modelos/producto.modelo.js";

export class ProductoDAO {
  async obtenerProductos(filtro, opciones) {
    return await Producto.paginate(filtro, opciones);
  }

  async obtenerPorId(id) {
    return await Producto.findById(id);
  }

  async crear(producto) {
    return await Producto.create(producto);
  }

  async actualizar(id, data) {
    return await Producto.findByIdAndUpdate(id, data, { new: true });
  }

  async eliminar(id) {
    return await Producto.findByIdAndDelete(id);
  }
}
