import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

const esquemaProducto = new mongoose.Schema({
  titulo: String,
  descripcion: String,
  codigo: String,
  precio: Number,
  estado: Boolean,
  stock: Number,
  categoria: String,
  imagenes: [String]
});

esquemaProducto.plugin(mongoosePaginate);

export const Producto = mongoose.model('products', esquemaProducto);