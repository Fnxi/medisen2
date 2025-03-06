const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const bcrypt = require("bcryptjs");

const app = express();
app.use(express.json());
app.use(cors());

const db = mysql.createConnection({
    host: "sql5.freesqldatabase.com",
    user: "sql5766183",
    password: "FkF7jmBren",
    database: "sql5766183",
    port: 3306
});


db.connect(err => {
    if (err) {
        console.error("Error de conexión a MySQL:", err);
    } else {
        console.log("Conectado a MySQL");
    }
});

// Obtener productos
app.get("/productos", (req, res) => {
    db.query("SELECT * FROM productos", (err, result) => {
        if (err) {
            res.status(500).send(err);
        } else {
            res.json(result);
        }
    });
});

// Ruta de registro (con hashing de la contraseña)
app.post("/registrar", (req, res) => {
    const { name, age, email, birthDate, birthPlace, gender, civilStatus, password } = req.body;

    if (!password) {
        return res.status(400).send("La contraseña es requerida");
    }

    // Hashing de la contraseña
    bcrypt.hash(password, 10, (err, hashedPassword) => {
        if (err) {
            console.error("Error al hashear la contraseña:", err);
            return res.status(500).send("Error al registrar usuario (bcrypt)");
        }

        const query = "INSERT INTO usuarios (name, age, email, birthDate, birthPlace, gender, civilStatus, password) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
        const values = [name, age, email, birthDate, birthPlace, gender, civilStatus, hashedPassword];

        db.query(query, values, (err, result) => {
            if (err) {
                console.error("Error al insertar datos:", err);
                return res.status(500).send("Error al insertar datos en la base de datos");
            }
            res.status(201).send("Usuario registrado con éxito");
        });
    });
});

// Ruta de inicio de sesión (comparar contraseñas)
app.post("/login", (req, res) => {
    const { email, password } = req.body;

    const query = "SELECT * FROM usuarios WHERE email = ?";
    db.query(query, [email], (err, result) => {
        if (err) {
            console.error("Error al obtener usuario:", err);
            return res.status(500).json({ success: false, message: "Error al iniciar sesión" });
        }

        if (result.length === 0) {
            console.log("Usuario no encontrado");
            return res.status(400).json({ success: false, message: "Usuario no encontrado" });
        }

        const user = result[0];

        // Comparar la contraseña proporcionada con la almacenada (hasheada)
        bcrypt.compare(password, user.password, (err, isMatch) => {
            if (err) {
                console.error("Error al comparar contraseñas:", err);
                return res.status(500).json({ success: false, message: "Error al iniciar sesión" });
            }

            if (!isMatch) {
                console.log("Contraseña incorrecta");
                return res.status(400).Sjson({ success: false, message: "Contraseña incorrecta" });
            }

            console.log("Inicio de sesión exitoso");
            res.status(200).json({ success: true, message: "Inicio de sesión exitoso", user: user });
        });
    });
});
// Actualizar un producto
app.put("/productos/:id", (req, res) => {
    const { id } = req.params;
    const { nombre, descripcion, precio } = req.body;

    const query = "UPDATE productos SET nombre = ?, descripcion = ?, precio = ? WHERE id = ?";
    const values = [nombre, descripcion, precio, id];

    db.query(query, values, (err, result) => {
        if (err) {
            console.error("Error al actualizar producto:", err);
            return res.status(500).send("Error al actualizar producto");
        }
        res.status(200).send("Producto actualizado con éxito");
    });
});

// Eliminar un producto
app.delete("/productos/:id", (req, res) => {
    const { id } = req.params;

    const query = "DELETE FROM productos WHERE id = ?";
    db.query(query, [id], (err, result) => {
        if (err) {
            console.error("Error al eliminar producto:", err);
            return res.status(500).send("Error al eliminar producto");
        }
        res.status(200).send("Producto eliminado con éxito");
    });
});


app.listen(5000, () => {
    console.log("Servidor corriendo en el puerto 5000");
});
