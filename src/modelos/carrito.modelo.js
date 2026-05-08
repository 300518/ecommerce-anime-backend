import mongoose from 'mongoose';

const esquemaCarrito = new mongoose.Schema({
  productos: [
    {
      producto: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'products'
      },
      cantidad: Number
    }
  ]
});

export const Carrito = mongoose.model('carts', esquemaCarrito);