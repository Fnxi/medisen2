const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const bcrypt = require("bcryptjs");

const app = express();
app.use(express.json());
app.use(cors());

// Conexión con MySQL (sin `db.connect()`)
const db = mysql.createPool({
    host: "sql3.freesqldatabase.com", // Host de la base de datos
    user: "sql3768729",               // Usuario de la base de datos
    password: "CMszWrHdmU",           // Contraseña de la base de datos
    database: "sql3768729",           // Nombre de la base de datos
    port: 3306,                       // Puerto de la base de datos
    waitForConnections: true,         // Esperar por conexiones disponibles
    connectionLimit: 10,              // Límite de conexiones
    queueLimit: 0                     // Límite de solicitudes en cola
});

// Obtener productos
app.get("/api/productos", (req, res) => {
    db.query("SELECT * FROM productos", (err, result) => {
        if (err) {
            res.status(500).send(err);
        } else {
            res.json(result);
        }
    });
});

// Ruta de registro
app.post("/api/registrar", (req, res) => {
    const { name, age, email, birthDate, birthPlace, gender, civilStatus, password } = req.body;

    if (!password) {
        return res.status(400).send("La contraseña es requerida");
    }

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

// Ruta de inicio de sesión
app.post("/api/login", (req, res) => {
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

        bcrypt.compare(password, user.password, (err, isMatch) => {
            if (err) {
                console.error("Error al comparar contraseñas:", err);
                return res.status(500).json({ success: false, message: "Error al iniciar sesión" });
            }

            if (!isMatch) {
                console.log("Contraseña incorrecta");
                return res.status(400).json({ success: false, message: "Contraseña incorrecta" });
            }

            console.log("Inicio de sesión exitoso");
            res.status(200).json({ success: true, message: "Inicio de sesión exitoso", user: user });
        });
    });
});

// Actualizar un producto
app.put("/api/productos/:id", (req, res) => {
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
app.delete("/api/productos/:id", (req, res) => {
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

// Ruta para añadir un producto al carrito
app.post("/api/carrito", (req, res) => {
    const { id_usuario, id_producto, cantidad } = req.body;

    // Validar que los datos estén presentes
    if (!id_usuario || !id_producto || !cantidad) {
        return res.status(400).json({ success: false, message: "Faltan datos requeridos" });
    }

    // Insertar en la tabla del carrito
    const query = "INSERT INTO carrito (id_usuario, id_producto, cantidad) VALUES (?, ?, ?)";
    const values = [id_usuario, id_producto, cantidad];

    db.query(query, values, (err, result) => {
        if (err) {
            console.error("Error al añadir producto al carrito:", err);
            return res.status(500).json({ success: false, message: "Error al añadir producto al carrito" });
        }
        res.status(201).json({ success: true, message: "Producto añadido al carrito" });
    });
});

// Ruta para obtener los productos del carrito de un usuario
app.get("/api/carrito/:id_usuario", (req, res) => {
    const { id_usuario } = req.params;

    // Consulta para obtener los productos del carrito con detalles del producto
    const query = `
        SELECT carrito.id, carrito.cantidad, productos.nombre, productos.precio
        FROM carrito
        JOIN productos ON carrito.id_producto = productos.id
        WHERE carrito.id_usuario = ?
    `;

    db.query(query, [id_usuario], (err, result) => {
        if (err) {
            console.error("Error al obtener el carrito:", err);
            return res.status(500).json({ success: false, message: "Error al obtener el carrito" });
        }
        res.status(200).json({ success: true, carrito: result });
    });
});

// Ruta para eliminar un producto del carro
app.delete("/api/carrito/:id", (req, res) => {
    const { id } = req.params;

    const query = "DELETE FROM carrito WHERE id = ?";
    db.query(query, [id], (err, result) => {
        if (err) {
            console.error("Error al eliminar producto del carrito:", err);
            return res.status(500).json({ success: false, message: "Error al eliminar producto del carrito" });
        }
        res.status(200).json({ success: true, message: "Producto eliminado del carrito" });
    });
});

app.post("/api/guardar-compra", (req, res) => {
    const { id_usuario, nombre_usuario, total, detalles } = req.body;

    // Validar que los datos estén presentes
    if (!id_usuario || !nombre_usuario || !total || !detalles) {
        return res.status(400).json({ success: false, message: "Faltan datos requeridos" });
    }

    // Convertir detalles de string JSON a objeto JavaScript
    let carrito;
    try {
        carrito = JSON.parse(detalles);
    } catch (error) {
        console.error("Error al parsear detalles del carrito:", error);
        return res.status(400).json({ success: false, message: "Formato de carrito inválido" });
    }

    // Iniciar una transacción para asegurar la integridad de los datos
    db.getConnection((err, connection) => {
        if (err) {
            console.error("Error al obtener conexión:", err);
            return res.status(500).json({ success: false, message: "Error en el servidor" });
        }

        connection.beginTransaction(async (err) => {
            if (err) {
                connection.release();
                console.error("Error al iniciar transacción:", err);
                return res.status(500).json({ success: false, message: "Error en el servidor" });
            }

            try {
                // 1. Insertar la compra en la tabla compras
                const insertQuery = `
                    INSERT INTO compras (id_usuario, nombre_usuario, total, detalles)
                    VALUES (?, ?, ?, ?)
                `;
                const insertValues = [id_usuario, nombre_usuario, total, detalles];

                await new Promise((resolve, reject) => {
                    connection.query(insertQuery, insertValues, (err, result) => {
                        if (err) return reject(err);
                        resolve(result);
                    });
                });

                // 2. Actualizar las cantidades de cada producto en el carrito
                for (const item of carrito) {
                    const updateQuery = `
                        UPDATE productos 
                        SET cantidad = cantidad - ? 
                        WHERE id = ? AND cantidad >= ?
                    `;
                    const updateValues = [item.cantidad, item.id, item.cantidad];

                    await new Promise((resolve, reject) => {
                        connection.query(updateQuery, updateValues, (err, result) => {
                            if (err) return reject(err);
                            if (result.affectedRows === 0) {
                                return reject(new Error(`No hay suficiente stock para el producto ${item.id}`));
                            }
                            resolve(result);
                        });
                    });
                }

                // 3. Limpiar el carrito del usuario
                const deleteQuery = "DELETE FROM carrito WHERE id_usuario = ?";
                await new Promise((resolve, reject) => {
                    connection.query(deleteQuery, [id_usuario], (err, result) => {
                        if (err) return reject(err);
                        resolve(result);
                    });
                });

                // Si todo salió bien, confirmar la transacción
                connection.commit((err) => {
                    if (err) {
                        return connection.rollback(() => {
                            connection.release();
                            console.error("Error al confirmar transacción:", err);
                            res.status(500).json({ success: false, message: "Error al registrar la compra" });
                        });
                    }
                    connection.release();
                    res.json({ success: true, message: "Compra registrada correctamente." });
                });
            } catch (error) {
                // Si hay algún error, hacer rollback
                connection.rollback(() => {
                    connection.release();
                    console.error("Error en la transacción:", error);
                    res.status(500).json({ 
                        success: false, 
                        message: error.message || "Error al registrar la compra" 
                    });
                });
            }
        });
    });
});
// Ruta para actualizar un usuario
app.put("/api/usuarios/:id", (req, res) => {
    const { id } = req.params;
    const { name, age, email, birthDate, birthPlace, gender, civilStatus } = req.body;

    // Validar que los datos estén presentes
    if (!name || !age || !email || !birthDate || !birthPlace || !gender || !civilStatus) {
        return res.status(400).json({ success: false, message: "Faltan datos requeridos" });
    }

    const query = `
        UPDATE usuarios
        SET name = ?, age = ?, email = ?, birthDate = ?, birthPlace = ?, gender = ?, civilStatus = ?
        WHERE id = ?
    `;
    const values = [name, age, email, birthDate, birthPlace, gender, civilStatus, id];

    db.query(query, values, (err, result) => {
        if (err) {
            console.error("Error al actualizar el usuario:", err);
            return res.status(500).json({ success: false, message: "Error al actualizar el usuario" });
        }

        res.json({ success: true, message: "Usuario actualizado correctamente." });
    });
});

// Ruta para obtener las compras de un usuario
app.get("/api/compras/:id_usuario", (req, res) => {
    const { id_usuario } = req.params;

    const query = "SELECT * FROM compras WHERE id_usuario = ?";
    db.query(query, [id_usuario], (err, result) => {
        if (err) {
            console.error("Error al obtener las compras:", err);
            return res.status(500).json({ success: false, message: "Error al obtener las compras" });
        }

        res.status(200).json({ success: true, compras: result });
    });
});

// Obtener todos los usuarios
app.get("/api/usuarios", (req, res) => {
    const query = "SELECT * FROM usuarios";
    db.query(query, (err, result) => {
        if (err) {
            console.error("Error al obtener usuarios:", err);
            return res.status(500).json({ success: false, message: "Error al obtener usuarios" });
        }
        res.status(200).json(result);
    });
});

// Obtener todas las compras
app.get("/api/compras", (req, res) => {
    const query = "SELECT * FROM compras";
    db.query(query, (err, result) => {
        if (err) {
            console.error("Error al obtener compras:", err);
            return res.status(500).json({ success: false, message: "Error al obtener compras" });
        }
        res.status(200).json(result);
    });
});

// Exportar la app para Vercel
module.exports = app;
