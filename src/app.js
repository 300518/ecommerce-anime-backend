import dotenv from "dotenv";
import express from "express";
import { conectarDB } from "./config/db.js";
import { Producto } from "./modelos/producto.modelo.js";
import { Carrito } from "./modelos/carrito.modelo.js";
import { ProductoDAO } from "./dao/producto.dao.js";
import { CarritoDAO } from "./dao/carrito.dao.js";
import http from "http";
import { Server } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";
import routerProductos from "./routes/producto.routes.js";
import routerCarts from "./routes/carrito.routes.js";
import { setSocket } from "./socket.js";

dotenv.config();
conectarDB();

const app = express();
const servidorHttp = http.createServer(app);
const io = new Server(servidorHttp);
setSocket(io);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const productoDAO = new ProductoDAO();
const carritoDAO = new CarritoDAO();

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Servidor UP");
});

app.use("/api/products", routerProductos);
app.use("/api/carts", routerCarts);

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
