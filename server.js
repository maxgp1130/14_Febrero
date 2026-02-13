const express = require("express");
const session = require("express-session");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const fs = require("fs");
const path = require("path");

const app = express();
app.use(express.urlencoded({ extended: true }));

// SESIONES
app.use(session({
    secret: "mi_secreto_super_seguro",
    resave: false,
    saveUninitialized: false
}));

// MULTER para subir archivos temporalmente
const upload = multer({ dest: "temp_uploads/" });

// CLOUDINARY CONFIG
cloudinary.config({
    cloud_name: "drme8zjbz", // reemplazá
    api_key: "812814255645984",       // reemplazá
    api_secret: "_wmCRVpdka-kQW-x2B_PPcikuyU"  // reemplazá
});

// "Base de datos" en memoria
const usuarios = [];

/* =========================
   PÁGINA PRINCIPAL
========================= */
app.get("/", (req, res) => {
    if (req.session.usuario) {
        res.send(`
            <h1>Bienvenido ${req.session.usuario} 🔥</h1>
            <a href="/dashboard">Ir al Dashboard</a><br><br>
            <a href="/logout">Cerrar sesión</a>
        `);
    } else {
        res.send(`
            <h1>Mi Galería 🔥</h1>
            <a href="/register">Registrarse</a><br><br>
            <a href="/login">Iniciar sesión</a>
        `);
    }
});

/* =========================
   REGISTRO
========================= */
app.get("/register", (req, res) => {
    res.send(`
        <h1>Registro</h1>
        <form method="POST" action="/register">
            <input name="username" placeholder="Usuario" required />
            <br><br>
            <input type="password" name="password" placeholder="Contraseña" required />
            <br><br>
            <button>Registrarse</button>
        </form>
    `);
});

app.post("/register", (req, res) => {
    const { username, password } = req.body;

    usuarios.push({ username, password, fotos: [] });
    res.redirect("/login");
});

/* =========================
   LOGIN
========================= */
app.get("/login", (req, res) => {
    res.send(`
        <h1>Login</h1>
        <form method="POST" action="/login">
            <input name="username" placeholder="Usuario" required />
            <br><br>
            <input type="password" name="password" placeholder="Contraseña" required />
            <br><br>
            <button>Ingresar</button>
        </form>
    `);
});

app.post("/login", (req, res) => {
    const { username, password } = req.body;
    const usuario = usuarios.find(u => u.username === username);

    if (!usuario || usuario.password !== password) {
        return res.send("Usuario o contraseña incorrectos ❌ <br><a href='/login'>Volver</a>");
    }

    req.session.usuario = username;
    res.redirect("/");
});

/* =========================
   DASHBOARD
========================= */
app.get("/dashboard", (req, res) => {
    if (!req.session.usuario) return res.redirect("/login");

    const usuario = usuarios.find(u => u.username === req.session.usuario);
    const galeria = usuario.fotos.map(url => `<img src="${url}" width="200" style="margin:10px;">`).join("");

    res.send(`
        <h1>Dashboard privado 🔐</h1>

        <form method="POST" action="/upload" enctype="multipart/form-data">
            <input type="file" name="foto" required />
            <button>Subir Foto</button>
        </form>

        <hr>
        <h2>Mis Fotos</h2>
        ${galeria}

        <br><br>
        <a href="/">Volver</a>
    `);
});

/* =========================
   SUBIR FOTO A CLOUDINARY
========================= */
app.post("/upload", upload.single("foto"), async (req, res) => {
    if (!req.session.usuario) return res.redirect("/login");

    const usuario = usuarios.find(u => u.username === req.session.usuario);

    try {
        const result = await cloudinary.uploader.upload(req.file.path, {
            folder: req.session.usuario
        });

        // Guardar URL en "base de datos" en memoria
        usuario.fotos.push(result.secure_url);

        // Borrar archivo temporal
        fs.unlinkSync(req.file.path);

        res.redirect("/dashboard");
    } catch (err) {
        console.error(err);
        res.send("Error subiendo la imagen ❌");
    }
});

/* =========================
   LOGOUT
========================= */
app.get("/logout", (req, res) => {
    req.session.destroy();
    res.redirect("/");
});

/* =========================
   SERVIDOR
========================= */
app.listen(3000, () => {
    console.log("Servidor corriendo en http://localhost:3000");
});
