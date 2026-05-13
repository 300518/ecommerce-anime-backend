import { Router } from "express";
import { Producto } from "../modelos/producto.modelo.js";
import { getSocket } from "../socket.js";

const router = Router();

// GET productos
router.get("/", async (req, res) => {
  try {
    const { limit = 10, page = 1, query, sort } = req.query;

    let filtro = {};
    if (query) {
      filtro = { categoria: query };
    }

    const opciones = {
      limit: parseInt(limit),
      page: parseInt(page),
      sort: sort ? { precio: sort === "asc" ? 1 : -1 } : {},
    };

    const resultado = await Producto.paginate(filtro, opciones);

    res.json({
      status: "success",
      payload: resultado.docs,
      totalPages: resultado.totalPages,
      prevPage: resultado.prevPage,
      nextPage: resultado.nextPage,
      page: resultado.page,
      hasPrevPage: resultado.hasPrevPage,
      hasNextPage: resultado.hasNextPage,
      prevLink: resultado.hasPrevPage
        ? `/api/products?page=${resultado.prevPage}`
        : null,
      nextLink: resultado.hasNextPage
        ? `/api/products?page=${resultado.nextPage}`
        : null,
    });
  } catch (error) {
    res.status(500).json({ error: "Error al obtener productos" });
  }
});

// GET por ID
router.get("/:pid", async (req, res) => {
  const producto = await Producto.findById(req.params.pid);

  if (!producto) {
    return res.status(404).json({ error: "Producto no encontrado" });
  }

  res.json(producto);
});

// POST
router.post("/", async (req, res) => {
  try {
    const { titulo, precio, stock } = req.body;

    if (!titulo || !precio || stock === undefined) {
      return res.status(400).json({
        error: "Faltan campos obligatorios",
      });
    }

    const nuevoProducto = await Producto.create(req.body);
    const io = getSocket();

    const productosActualizados = await Producto.find();

    io.emit("productos", productosActualizados);

    res.json(nuevoProducto);
  } catch (error) {
    res.status(500).json({
      error: "Error al crear producto",
    });
  }
});

// PUT
router.put("/:pid", async (req, res) => {
  try {
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        error: "No hay datos para actualizar",
      });
    }

    const producto = await Producto.findByIdAndUpdate(
      req.params.pid,
      req.body,
      { new: true }
    );

    if (!producto) {
      return res.status(404).json({
        error: "Producto no encontrado",
      });
    }

    res.json(producto);
  } catch (error) {
    res.status(500).json({
      error: "Error al actualizar producto",
    });
  }
});

// DELETE
router.delete("/:pid", async (req, res) => {
  await Producto.findByIdAndDelete(req.params.pid);
  res.json({ mensaje: "Producto eliminado" });
});

export default router;
