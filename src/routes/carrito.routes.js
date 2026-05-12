import { Router } from "express";
import { Carrito } from "../modelos/carrito.modelo.js";

const router = Router();

// Crear carrito
router.post("/", async (req, res) => {
  const carrito = await Carrito.create({ productos: [] });
  res.json(carrito);
});

// Obtener carrito
router.get("/:cid", async (req, res) => {
  const carrito = await Carrito.findById(req.params.cid)
    .populate("productos.producto");

  res.json(carrito);
});

// Agregar producto
router.post("/:cid/products/:pid", async (req, res) => {
  const carrito = await Carrito.findById(req.params.cid);

  const prod = carrito.productos.find(
    p => p.producto.toString() === req.params.pid
  );

  if (prod) {
    prod.cantidad++;
  } else {
    carrito.productos.push({
      producto: req.params.pid,
      cantidad: 1
    });
  }

  await carrito.save();
  res.json(carrito);
});

export default router;