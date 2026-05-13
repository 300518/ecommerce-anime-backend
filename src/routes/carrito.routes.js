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
  const carrito = await Carrito.findById(req.params.cid).populate(
    "productos.producto"
  );

  res.json(carrito);
});

// Agregar producto
router.post("/:cid/products/:pid", async (req, res) => {
  const carrito = await Carrito.findById(req.params.cid);

  const prod = carrito.productos.find(
    (p) => p.producto.toString() === req.params.pid
  );

  if (prod) {
    prod.cantidad++;
  } else {
    carrito.productos.push({
      producto: req.params.pid,
      cantidad: 1,
    });
  }

  await carrito.save();
  res.json(carrito);
});

// Eliminar producto del carrito
router.delete("/:cid/products/:pid", async (req, res) => {
  try {
    const carrito = await Carrito.findById(req.params.cid);

    carrito.productos = carrito.productos.filter(
      (p) => p.producto.toString() !== req.params.pid
    );

    await carrito.save();

    res.json(carrito);
  } catch (error) {
    res.status(500).json({
      error: "Error al eliminar producto",
    });
  }
});

// Actualizar carrito completo
router.put("/:cid", async (req, res) => {
  try {
    const carrito = await Carrito.findByIdAndUpdate(
      req.params.cid,
      { productos: req.body },
      { new: true }
    );

    res.json(carrito);
  } catch (error) {
    res.status(500).json({
      error: "Error al actualizar carrito",
    });
  }
});

// Actualizar cantidad producto
router.put("/:cid/products/:pid", async (req, res) => {
  try {
    const { cantidad } = req.body;

    if (!cantidad || cantidad < 1) {

      return res.status(400).json({
        error: "Cantidad inválida"
      });
    
    }

    const carrito = await Carrito.findById(req.params.cid);
    if (!carrito) {

      return res.status(404).json({
        error: "Carrito no encontrado"
      });
    
    }ƒƒ

    const producto = carrito.productos.find(
      (p) => p.producto.toString() === req.params.pid
    );

    if (producto) {
      producto.cantidad = cantidad;
    }

    await carrito.save();

    res.json(carrito);
  } catch (error) {
    res.status(500).json({
      error: "Error al actualizar cantidad",
    });
  }
});

// Vaciar carrito
router.delete("/:cid", async (req, res) => {
  try {
    const carrito = await Carrito.findById(req.params.cid);

    carrito.productos = [];

    await carrito.save();

    res.json({
      mensaje: "Carrito vaciado",
    });
  } catch (error) {
    res.status(500).json({
      error: "Error al vaciar carrito",
    });
  }
});

export default router;
