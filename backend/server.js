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
    user: "sql3771138",               // Usuario de la base de datos
    password: "Xlt3p3jQ3p",           // Contraseña de la base de datos
    database: "sql3771138",           // Nombre de la base de datos
    port: 3306,                       // Puerto de la base de datos
    waitForConnections: true,         // Esperar por conexiones disponibles
    connectionLimit: 10,              // Límite de conexiones
    queueLimit: 0                     // Límite de solicitudes en cola
});

// En tus imports al inicio del archivo, añade:
const { OAuth2Client } = require('google-auth-library');
const googleClient = new OAuth2Client('326746217948-gtj4m7bbops3nu76ouakb1av8kpn14e1.apps.googleusercontent.com');

// Añade esta ruta junto con las demás rutas GET en tu backend
app.get("/api/vista-usuario/:id", (req, res) => {
    const { id } = req.params;
    
    const query = "SELECT * FROM vista_usuarios WHERE user = ?";
    
    db.query(query, [id], (err, result) => {
        if (err) {
            console.error("Error al consultar la vista:", err);
            return res.status(500).json({ 
                success: false, 
                message: "Error al obtener datos del usuario" 
            });
        }
        
        if (result.length > 0) {
            res.json({ success: true, usuario: result[0] });
        } else {
            res.json({ success: false, message: "Usuario no encontrado" });
        }
    });
});

// Luego, en tus rutas, añade este nuevo endpoint:
app.post("/api/google-login", (req, res) => {
    const { token } = req.body;
    
    googleClient.verifyIdToken({
        idToken: token,
        audience: '326746217948-gtj4m7bbops3nu76ouakb1av8kpn14e1.apps.googleusercontent.com'
    }).then(ticket => {
        const payload = ticket.getPayload();
        const { email, name } = payload;

        // 1. Verificar si el usuario ya existe
        db.query("SELECT * FROM usuarios WHERE email = ?", [email], (err, results) => {
            if (err) return res.status(500).json({ success: false, message: 'Error en base de datos' });

            if (results.length > 0) {
                // Usuario existe - actualizar estado
                const user = results[0];
                db.query("UPDATE usuarios SET status = 1 WHERE id = ?", [user.id], (updateErr) => {
                    if (updateErr) return res.status(500).json({ success: false, message: 'Error al actualizar usuario' });
                    res.json({ success: true, user });
                });
            } else {
                // 2. Crear nuevo usuario con valores por defecto
                // Dentro de /api/google-login, en la parte de crear nuevo usuario:
const newUser = {
    name: name || 'Usuario Google', // Nombre de Google o valor por defecto
    email: email,
    birthDate: '2000-01-01', // Fecha por defecto
    birthPlace: 'Desconocido', // Valor por defecto
    gender: 'Otro', // Valor por defecto para enum
    civilStatus: 'Soltero/a', // Valor por defecto para enum
    password: '', // Contraseña vacía
    user: 1, // Valor por defecto según tu estructura
    token: '0', // Valor por defecto según tu estructura
    status: 1 // Usuario activo
};
                
                db.query("INSERT INTO usuarios SET ?", newUser, (insertErr, result) => {
                    if (insertErr) return res.status(500).json({ success: false, message: 'Error al registrar usuario' });
                    
                    // Devolver datos del nuevo usuario
                    res.json({ 
                        success: true,
                        user: {
                            id: result.insertId,
                            ...newUser
                        }
                    });
                });
            }
        });
    }).catch(error => {
        res.status(401).json({ success: false, message: 'Token de Google inválido' });
    });
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
    const { name, email, birthDate, birthPlace, gender, civilStatus, password } = req.body;

    if (!password) {
        return res.status(400).send("La contraseña es requerida");
    }

    bcrypt.hash(password, 10, (err, hashedPassword) => {
        if (err) {
            console.error("Error al hashear la contraseña:", err);
            return res.status(500).send("Error al registrar usuario (bcrypt)");
        }

        const query = "INSERT INTO usuarios (name, email, birthDate, birthPlace, gender, civilStatus, password) VALUES (?, ?, ?, ?, ?, ?, ?)";
        const values = [name, email, birthDate, birthPlace, gender, civilStatus, hashedPassword];

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
// Ruta de inicio de sesión (modificada)
app.post("/api/login", (req, res) => {
    const { email, password } = req.body;

    const query = "SELECT * FROM usuarios WHERE email = ?";
    db.query(query, [email], async (err, result) => {
        if (err) {
            console.error("Error al obtener usuario:", err);
            return res.status(500).json({ success: false, message: "Error al iniciar sesión" });
        }

        if (result.length === 0) {
            console.log("Usuario no encontrado");
            return res.status(400).json({ success: false, message: "Usuario no encontrado" });
        }

        const user = result[0];

        // Verificar si el usuario ya tiene una sesión activa
        if (user.status === 1) {
            return res.status(400).json({ 
                success: false, 
                message: "Ya existe una sesión activa con este usuario. Cierre la otra sesión primero." 
            });
        }

        bcrypt.compare(password, user.password, (err, isMatch) => {
            if (err) {
                console.error("Error al comparar contraseñas:", err);
                return res.status(500).json({ success: false, message: "Error al iniciar sesión" });
            }

            if (!isMatch) {
                console.log("Contraseña incorrecta");
                return res.status(400).json({ success: false, message: "Contraseña incorrecta" });
            }

            // Actualizar el estado del usuario a "conectado" (1)
            const updateQuery = "UPDATE usuarios SET status = 1 WHERE id = ?";
            db.query(updateQuery, [user.id], (updateErr) => {
                if (updateErr) {
                    console.error("Error al actualizar estado de usuario:", updateErr);
                    return res.status(500).json({ success: false, message: "Error al iniciar sesión" });
                }

                console.log("Inicio de sesión exitoso");
                res.status(200).json({ 
                    success: true, 
                    message: "Inicio de sesión exitoso", 
                    user: user 
                });
            });
        });
    });
});

// Ruta para cerrar sesión
app.post("/api/logout", (req, res) => {
    const { userId } = req.body;

    if (!userId) {
        return res.status(400).json({ success: false, message: "ID de usuario requerido" });
    }

    const query = "UPDATE usuarios SET status = 0 WHERE id = ?";
    db.query(query, [userId], (err, result) => {
        if (err) {
            console.error("Error al cerrar sesión:", err);
            return res.status(500).json({ success: false, message: "Error al cerrar sesión" });
        }

        res.status(200).json({ success: true, message: "Sesión cerrada correctamente" });
    });
});

// Ruta para verificar estado de sesión
app.get("/api/check-session/:userId", (req, res) => {
    const { userId } = req.params;

    const query = "SELECT status FROM usuarios WHERE id = ?";
    db.query(query, [userId], (err, result) => {
        if (err) {
            console.error("Error al verificar sesión:", err);
            return res.status(500).json({ success: false, message: "Error al verificar sesión" });
        }

        if (result.length === 0) {
            return res.status(404).json({ success: false, message: "Usuario no encontrado" });
        }

        res.status(200).json({ 
            success: true, 
            isActive: result[0].status === 1 
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

app.post("/api/guardar-compra", async (req, res) => {
    const { id_usuario, nombre_usuario, total, detalles } = req.body;

    if (!id_usuario || !nombre_usuario || !total || !detalles) {
        return res.status(400).json({ success: false, message: "Faltan datos requeridos" });
    }

    try {
        // 1. Guardar la compra
        const insertQuery = `
            INSERT INTO compras (id_usuario, nombre_usuario, total, detalles)
            VALUES (?, ?, ?, ?)
        `;
        await db.promise().query(insertQuery, [id_usuario, nombre_usuario, total, detalles]);

        // 2. Actualizar cantidades usando el nombre del producto
        const carrito = JSON.parse(detalles);
        for (const item of carrito) {
            await db.promise().query(
                `UPDATE productos SET cantidad = cantidad - ? WHERE nombre = ? AND cantidad >= ?`,
                [item.cantidad, item.nombre, item.cantidad]
            );
            
            // Verificar si se actualizó algún registro
            const [result] = await db.promise().query(
                `SELECT ROW_COUNT() AS affectedRows`
            );
            
            if (result[0].affectedRows === 0) {
                throw new Error(`No hay suficiente stock para ${item.nombre}`);
            }
        }

        // 3. Vaciar carrito (opcional)
        await db.promise().query("DELETE FROM carrito WHERE id_usuario = ?", [id_usuario]);

        res.json({ success: true, message: "Compra registrada y stock actualizado." });
    } catch (error) {
        console.error("Error en guardar-compra:", error);
        res.status(500).json({ 
            success: false, 
            message: error.message || "Error al procesar la compra" 
        });
    }
});
// Ruta para actualizar un usuario
app.put("/api/usuarios/:id", (req, res) => {
    const { id } = req.params;
    const { name, email, birthDate, birthPlace, gender, civilStatus } = req.body;

    // Validar que los datos estén presentes
    if (!name || !email || !birthDate || !birthPlace || !gender || !civilStatus) {
        return res.status(400).json({ success: false, message: "Faltan datos requeridos" });
    }

    const query = `
        UPDATE usuarios
        SET name = ?, email = ?, birthDate = ?, birthPlace = ?, gender = ?, civilStatus = ?
        WHERE id = ?
    `;
    const values = [name, email, birthDate, birthPlace, gender, civilStatus, id];

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
