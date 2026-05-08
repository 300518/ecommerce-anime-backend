import express from "express";
import dotenv from "dotenv";
import { conectarDB } from "./config/db.js";
import { Producto } from "./modelos/producto.modelo.js";
import { Carrito } from "./modelos/carrito.modelo.js";
import http from "http";
import { Server } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();
conectarDB();

const app = express();
const servidorHttp = http.createServer(app);
const io = new Server(servidorHttp);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Servidor UP");
});

// Se agrega el Get para obtener producto segun filtro
app.get("/api/products", async (req, res) => {
  try {
    const { limit = 10, page = 1, query, sort } = req.query;

    // filtro
    let filtro = {};
    if (query) {
      filtro = { categoria: query };
    }

    // opciones
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

// se agrega get por producto
app.get("/api/products/:pid", async (req, res) => {
  try {
    const { pid } = req.params;

    const producto = await Producto.findById(pid);

    if (!producto) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    res.json(producto);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener producto" });
  }
});

// se agrega post de productos
app.post("/api/products", async (req, res) => {
  try {
    const nuevoProducto = await Producto.create(req.body);

    // 🔥 emitir actualización
    const productosActualizados = await Producto.find();
    io.emit("productos", productosActualizados);

    res.json(nuevoProducto);
  } catch (error) {
    res.status(500).json({ error: "Error al crear producto" });
  }
});

//genero un put
app.put("/api/products/:pid", async (req, res) => {
  try {
    const { pid } = req.params;

    const productoActualizado = await Producto.findByIdAndUpdate(
      pid,
      req.body,
      { new: true } // devuelve el actualizado
    );

    res.json(productoActualizado);
  } catch (error) {
    res.status(500).json({ error: "Error al actualizar producto" });
  }
});
// Se agrega Delete
app.delete("/api/products/:pid", async (req, res) => {
  try {
    const { pid } = req.params;

    const eliminado = await Producto.findByIdAndDelete(pid);

    if (!eliminado) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    res.json({ mensaje: "Producto eliminado correctamente" });
  } catch (error) {
    res.status(500).json({ error: "Error al eliminar producto" });
  }
});
//Se agrega crear carro
app.post("/api/carts", async (req, res) => {
  try {
    const nuevoCarrito = await Carrito.create({ productos: [] });
    res.json(nuevoCarrito);
  } catch (error) {
    res.status(500).json({ error: "Error al crear carrito" });
  }
});

app.get("/api/carts/:cid", async (req, res) => {
  try {
    const { cid } = req.params;

    const carrito = await Carrito.findById(cid).populate("productos.producto");

    if (!carrito) {
      return res.status(404).json({ error: "Carrito no encontrado" });
    }

    res.json(carrito);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener carrito" });
  }
});

// Se agrega post por ID para carro
app.post("/api/carts/:cid/products/:pid", async (req, res) => {
  try {
    const { cid, pid } = req.params;

    const carrito = await Carrito.findById(cid);

    if (!carrito) {
      return res.status(404).json({ error: "Carrito no encontrado" });
    }

    const productoEnCarrito = carrito.productos.find(
      (p) => p.producto.toString() === pid
    );

    if (productoEnCarrito) {
      productoEnCarrito.cantidad += 1;
    } else {
      carrito.productos.push({ producto: pid, cantidad: 1 });
    }

    await carrito.save();

    res.json(carrito);
  } catch (error) {
    res.status(500).json({ error: "Error al agregar producto" });
  }
});

// Se agrega Eliminar producto de un carro de compra
app.delete("/api/carts/:cid/products/:pid", async (req, res) => {
  try {
    const { cid, pid } = req.params;

    const carrito = await Carrito.findById(cid);

    if (!carrito) {
      return res.status(404).json({ error: "Carrito no encontrado" });
    }

    carrito.productos = carrito.productos.filter(
      (p) => p.producto.toString() !== pid
    );

    await carrito.save();

    res.json(carrito);
  } catch (error) {
    res.status(500).json({ error: "Error al eliminar producto del carrito" });
  }
});

// Se agrega actualizar la cantidad de un carro de compra.
app.put("/api/carts/:cid/products/:pid", async (req, res) => {
  try {
    const { cid, pid } = req.params;
    const { cantidad } = req.body;

    const carrito = await Carrito.findById(cid);

    const producto = carrito.productos.find(
      (p) => p.producto.toString() === pid
    );

    if (!producto) {
      return res.status(404).json({ error: "Producto no existe en carrito" });
    }

    producto.cantidad = cantidad;

    await carrito.save();

    res.json(carrito);
  } catch (error) {
    res.status(500).json({ error: "Error al actualizar cantidad" });
  }
});
// Se reemplaza todo el carro
app.put("/api/carts/:cid", async (req, res) => {
  try {
    const { cid } = req.params;

    const carrito = await Carrito.findByIdAndUpdate(
      cid,
      { productos: req.body },
      { new: true }
    );

    res.json(carrito);
  } catch (error) {
    res.status(500).json({ error: "Error al actualizar carrito" });
  }
});
// Se agrega Vaciar carro de compras
app.delete("/api/carts/:cid", async (req, res) => {
  try {
    const { cid } = req.params;

    const carrito = await Carrito.findById(cid);

    carrito.productos = [];

    await carrito.save();

    res.json({ mensaje: "Carrito vaciado" });
  } catch (error) {
    res.status(500).json({ error: "Error al vaciar carrito" });
  }
});

servidorHttp.listen(8080, () => {
  console.log("Servidor corriendo en puerto 8080");
});

io.on("connection", async (socket) => {
  console.log("Cliente conectado");

  // enviar productos actuales al conectar
  const productos = await Producto.find();
  socket.emit("productos", productos);
});

app.use(express.static(path.join(__dirname, "vista")));
