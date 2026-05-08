import express from "express";
import dotenv from "dotenv";
import { conectarDB } from "./config/db.js";
import { Producto } from "./modelos/producto.modelo.js";
import { Carrito } from "./modelos/carrito.modelo.js";
import { ProductoDAO } from "./dao/producto.dao.js";
import { CarritoDAO } from "./dao/carrito.dao.js";
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
const productoDAO = new ProductoDAO();
const carritoDAO = new CarritoDAO();

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

    //const resultado = await Producto.paginate(filtro, opciones);
    const resultado = await productoDAO.obtenerProductos(filtro, opciones);

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

    if (!pid) {
      return res.status(400).json({ error: "ID inválido" });
    }

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
    const { titulo, precio, stock } = req.body;

    if (!titulo || !precio || stock === undefined) {
      return res.status(400).json({ error: "Faltan campos obligatorios" });
    }

    //const nuevoProducto = await Producto.create(req.body);
    const nuevoProducto = await productoDAO.crear(req.body);

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

    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({ error: "No hay datos para actualizar" });
    }

    const productoActualizado = await Producto.findByIdAndUpdate(
      pid,
      req.body,
      { new: true } // devuelve el actualizado
    );

    if (!productoActualizado) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

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
    //const nuevoCarrito = await Carrito.create({ productos: [] });
    const nuevoCarrito = await carritoDAO.crear();
    res.json(nuevoCarrito);
  } catch (error) {
    res.status(500).json({ error: "Error al crear carrito" });
  }
});

app.get("/api/carts/:cid", async (req, res) => {
  try {
    const { cid } = req.params;

    if (!cid) {
      return res.status(400).json({ error: "ID carrito inválido" });
    }

    //const carrito = await Carrito.findById(cid).populate("productos.producto");
    const carrito = await carritoDAO.obtenerPorId(cid);
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

    if (!cid || !pid) {
      return res.status(400).json({ error: "IDs inválidos" });
    }

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

    //await carrito.save();
    await carritoDAO.guardar(carrito);

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

    if (!cantidad || cantidad < 1) {
      return res.status(400).json({ error: "Cantidad inválida" });
    }
    const carrito = await Carrito.findById(cid);

    if (!carrito) {
      return res.status(404).json({ error: "Carrito no encontrado" });
    }

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

    if (!req.body || !Array.isArray(req.body)) {
      return res.status(400).json({ error: "Formato inválido de carrito" });
    }

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

    if (!carrito) {
      return res.status(404).json({ error: "Carrito no encontrado" });
    }

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

app.get("/products", (req, res) => {
  res.sendFile(path.join(__dirname, "vista/productos.html"));
});

app.get("/products/:pid", (req, res) => {
  res.sendFile(path.join(__dirname, "vista/producto-detalle.html"));
});

app.get("/carts/:cid", (req, res) => {
  res.sendFile(path.join(__dirname, "vista/carrito.html"));
});

app.use(express.static(path.join(__dirname, "vista")));
