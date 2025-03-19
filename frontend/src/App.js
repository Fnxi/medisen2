import React, { useState, useEffect } from "react";
import axios from "axios";
import Formulario from "./Componentes/Form";
import FormProducto from "./Componentes/FormProducto";
import PayPalButton from "./Componentes/PayPalButton";
import { PieChart } from 'react-minimal-pie-chart';
import "bootstrap/dist/css/bootstrap.min.css";
import "@fortawesome/fontawesome-free/css/all.min.css";

// Importa Firebase y Realtime Database
import { database, ref, onValue } from './firebase';

function App() {
    const [productos, setProductos] = useState([]);
    const [mostrarFormulario, setMostrarFormulario] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [productoEditando, setProductoEditando] = useState(null);
    const [userData, setUserData] = useState(null);
    const [userType, setUserType] = useState(null);
    const [mostrarTienda, setMostrarTienda] = useState(false);
    const [mostrarBienvenida, setMostrarBienvenida] = useState(false);
    const [cantidadSeleccionada, setCantidadSeleccionada] = useState({});
    const [datosMedico, setDatosMedico] = useState([]);
    const [carrito, setCarrito] = useState([]);
    const [mostrarCarrito, setMostrarCarrito] = useState(false); // Estado para mostrar/ocultar el carrito

    const colores = ["#FF5733", "#33FF57", "#3357FF", "#FF33A1", "#FF5733", "#33F0FF", "#F0FF33"];

    // Recuperar los datos de la sesión desde localStorage al cargar la página
    useEffect(() => {
        const storedUserData = localStorage.getItem("userData");
        if (storedUserData) {
            const parsedUserData = JSON.parse(storedUserData);
            setUserData(parsedUserData);
            setUserType(parsedUserData.user);
            setIsAuthenticated(true);
        }
    }, []);

    useEffect(() => {
        if (isAuthenticated && userData) {
            axios.get("https://medisen2-pj7q.vercel.app/api/productos")
                .then(response => setProductos(response.data.filter(producto => producto.estado === 1)))
                .catch(error => console.error("Error obteniendo productos:", error));
        }
    }, [isAuthenticated, userData]);

    // Obtener datos de Firebase para el médico (usuario tipo 3)
    useEffect(() => {
        if (isAuthenticated && userData) {
            if (userType === 3) {
                const medicionesRef = ref(database, 'Mediciones/');
                onValue(medicionesRef, (snapshot) => {
                    const data = snapshot.val();
                    const datos = [];
                    for (let id in data) {
                        datos.push(data[id]);
                    }
                    setDatosMedico(datos);
                });
            }
        }
    }, [isAuthenticated, userData, userType]);

    // Obtener el carrito del usuario
    useEffect(() => {
        if (isAuthenticated && userData) {
            obtenerCarrito();
        }
    }, [isAuthenticated, userData]);

    const obtenerCarrito = async () => {
        try {
            const response = await axios.get(`https://medisen2-pj7q.vercel.app/api/carrito/${userData.id}`);
            if (response.data.success) {
                setCarrito(response.data.carrito);
            } else {
                console.error("Error al obtener el carrito:", response.data.message);
            }
        } catch (error) {
            console.error("Error al obtener el carrito:", error);
        }
    };

    const abrirFormulario = () => setMostrarFormulario(true);
    const cerrarFormulario = () => setMostrarFormulario(false);

    const handleLoginSuccess = (userDataFromResponse) => {
        setUserData(userDataFromResponse);
        setUserType(userDataFromResponse.user);
        setIsAuthenticated(true);
        cerrarFormulario();
        localStorage.setItem("userData", JSON.stringify(userDataFromResponse));
        if (userDataFromResponse.user === 1) {
            setMostrarBienvenida(true);
        }
    };

    const handleEditar = (producto) => {
        setProductoEditando(producto);
        setMostrarFormulario(true);
    };

    const handleEliminar = (id) => {
        axios.put(`https://medisen2-pj7q.vercel.app/api/productos/${id}`, { estado: 0 })
            .then(() => {
                setProductos(productos.filter(producto => producto.id !== id));
            })
            .catch(error => console.error("Error dando de baja el producto:", error));
    };

    const handleEliminarDelCarrito = async (id) => {
    try {
        const response = await axios.delete(`https://medisen2-pj7q.vercel.app/api/carrito/${id}`);
        if (response.data.success) {
            alert("Producto eliminado del carrito");
            obtenerCarrito(); // Actualizar el carrito
        } else {
            alert("Error al eliminar el producto del carrito");
        }
    } catch (error) {
        console.error("Error al eliminar producto del carrito:", error);
        alert("Error al eliminar el producto del carrito");
    }
};

    const generarDatosGrafico = () => {
        return productos.map((producto, index) => ({
            title: producto.nombre,
            value: producto.cantidad,
            color: colores[index % colores.length]
        }));
    };

    const handleIrATienda = () => {
        setMostrarBienvenida(false);
        setMostrarTienda(true);
        setMostrarCarrito(false);
    };

    const handleCantidadChange = (id, cantidad) => {
        if (cantidad <= productos.find(producto => producto.id === id).cantidad) {
            setCantidadSeleccionada(prevState => ({
                ...prevState,
                [id]: cantidad
            }));
        }
    };

    const handleLogout = () => {
        setIsAuthenticated(false);
        setUserData(null);
        setUserType(null);
        localStorage.removeItem("userData");
    };

    const handleComprar = async (productoId) => {
        const cantidad = cantidadSeleccionada[productoId] || 1;

        try {
            const response = await axios.post("https://medisen2-pj7q.vercel.app/api/carrito", {
                id_usuario: userData.id,
                id_producto: productoId,
                cantidad: cantidad,
            });

            if (response.data.success) {
                alert("Producto añadido al carrito");
                obtenerCarrito(); // Actualizar el carrito
                setProductos(prevProductos =>
                    prevProductos.map(producto =>
                        producto.id === productoId
                            ? { ...producto, cantidad: producto.cantidad - cantidad }
                            : producto
                    )
                );
            } else {
                alert("Error al añadir el producto al carrito");
            }
        } catch (error) {
            console.error("Error al añadir producto al carrito:", error);
            alert("Error al añadir el producto al carrito");
        }
    };

    const generarDatosGraficoMedico = () => {
        return datosMedico.map((medicion, index) => ({
            title: `Medición ${index + 1}`,
            value: medicion.Promedio_Salud,
            color: colores[index % colores.length]
        }));
    };

    return (
        <div className="container-fluid">
            <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
                <div className="container-fluid">
                    <img src="assets/images/logozephyr.png" alt="Logo" style={{ height: "50px" }} />
                    <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                        <span className="navbar-toggler-icon"></span>
                    </button>
                    <div className="collapse navbar-collapse" id="navbarNav">
                        <ul className="navbar-nav me-auto">
                            <li className="nav-item">
                                <a className="nav-link text-white" href="#" onClick={() => { setMostrarBienvenida(true); setMostrarTienda(false); setMostrarCarrito(false); }}>Inicio</a>
                            </li>
                            {userType === 1 && (
                                <>
                                    <li className="nav-item">
                                        <a className="nav-link text-white" href="#" onClick={handleIrATienda}>Tienda</a>
                                    </li>
                                    <li className="nav-item">
                                        <a className="nav-link text-white" href="#" onClick={() => { setMostrarCarrito(true); setMostrarTienda(false); setMostrarBienvenida(false); }}>Carrito</a>
                                    </li>
                                </>
                            )}
                        </ul>
                        {!isAuthenticated ? (
                            <button className="btn btn-primary" onClick={abrirFormulario}>Iniciar Sesión</button>
                        ) : (
                            <ul className="navbar-nav">
                                <li className="nav-item"><a className="nav-link" href="#">Perfil</a></li>
                                <li className="nav-item"><button className="btn btn-danger" onClick={handleLogout}>Cerrar Sesión</button></li>
                            </ul>
                        )}
                    </div>
                </div>
            </nav>
            <div className="container mt-4">
                {isAuthenticated && userData && (
                    <>
                        {userType === 2 ? (
                            <>
                                <h3 className="text-center">Bienvenido Administrador</h3>
                                <h3 className="text-center">Productos Disponibles</h3>
                                <table className="table table-dark table-hover">
                                    <thead>
                                        <tr>
                                            <th>Nombre</th>
                                            <th>Descripción</th>
                                            <th>Precio</th>
                                            <th>Cantidad</th>
                                            <th>Editar</th>
                                            <th>Eliminar</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {productos.map(producto => (
                                            <tr key={producto.id}>
                                                <td>{producto.nombre}</td>
                                                <td>{producto.descripcion}</td>
                                                <td>{producto.precio}</td>
                                                <td>{producto.cantidad}</td>
                                                <td><button className="btn btn-warning" onClick={() => handleEditar(producto)}>Editar</button></td>
                                                <td><button className="btn btn-danger" onClick={() => handleEliminar(producto.id)}>Dar de baja</button></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                <h3 className="text-center">Gráfico de Productos</h3>
                                <div className="d-flex justify-content-center">
                                    <PieChart data={generarDatosGrafico()} style={{ height: '300px' }} />
                                </div>
                            </>
                        ) : null}

                        {userType === 1 && mostrarBienvenida && (
                            <div>
                                <h3 className="text-center">Bienvenido Usuario</h3>
                                <p className="text-center">Gracias por iniciar sesión. Haz clic en "Tienda" para ver nuestros productos.</p>
                            </div>
                        )}

                        {userType === 1 && mostrarTienda && (
                            <div>
                                <h3 className="text-center">Productos Disponibles</h3>
                                <div className="row">
                                    {productos.map(producto => (
                                        <div className="col-md-4 mb-4" key={producto.id}>
                                            <div className="card h-100">
                                                <img src={producto.imagen} className="card-img-top" alt={producto.nombre} />
                                                <div className="card-body">
                                                    <h5 className="card-title">{producto.nombre}</h5>
                                                    <p className="card-text">{producto.descripcion}</p>
                                                    <p className="card-text"><strong>Precio:</strong> ${producto.precio}</p>
                                                    <p className="card-text"><strong>Cantidad:</strong> {producto.cantidad}</p>
                                                    <div className="mb-3">
                                                        <label htmlFor={`cantidad_${producto.id}`} className="form-label">Cantidad</label>
                                                        <input
                                                            type="number"
                                                            className="form-control"
                                                            id={`cantidad_${producto.id}`}
                                                            min="1"
                                                            max={producto.cantidad}
                                                            value={cantidadSeleccionada[producto.id] || 1}
                                                            onChange={(e) => handleCantidadChange(producto.id, e.target.value)}
                                                        />
                                                    </div>
                                                    <button className="btn btn-success" onClick={() => handleComprar(producto.id)}>Comprar</button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                       {userType === 1 && mostrarCarrito && (
    <div>
        <h3 className="text-center">Carrito de Compras</h3>
        {carrito.length > 0 ? (
            <>
                <table className="table table-dark table-hover">
                    <thead>
                        <tr>
                            <th>Producto</th>
                            <th>Cantidad</th>
                            <th>Precio Unitario</th>
                            <th>Subtotal</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {carrito.map(item => (
                            <tr key={item.id}>
                                <td>{item.nombre}</td>
                                <td>{item.cantidad}</td>
                                <td>${item.precio}</td>
                                <td>${item.cantidad * item.precio}</td>
                                <td>
                                    <button
                                        className="btn btn-danger"
                                        onClick={() => handleEliminarDelCarrito(item.id)}
                                    >
                                        Eliminar
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <h4 className="text-end">Total: ${carrito.reduce((total, item) => total + item.cantidad * item.precio, 0)}</h4>
                         <PayPalButton
                    total={carrito.reduce((total, item) => total + item.cantidad * item.precio, 0)}
                    carrito={carrito}
                    userData={userData}
                />
            </>
        ) : (
            <p className="text-center">No hay productos en el carrito.</p>
        )}
    </div>
)}
                        {userType === 3 && datosMedico.length > 0 && (
                            <div>
                                <h3 className="text-center">Datos del Médico</h3>
                                <table className="table table-striped">
                                    <thead>
                                        <tr>
                                            <th>Fecha</th>
                                            <th>Hora</th>
                                            <th>Frecuencia Cardíaca</th>
                                            <th>Humedad</th>
                                            <th>Presión</th>
                                            <th>Promedio Salud</th>
                                            <th>SpO2</th>
                                            <th>Temperatura Ambiente</th>
                                            <th>Temperatura Objeto</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {datosMedico.map((medicion, index) => (
                                            <tr key={index}>
                                                <td>{medicion.Fecha}</td>
                                                <td>{medicion.Hora}</td>
                                                <td>{medicion.Frecuencia_Cardiaca}</td>
                                                <td>{medicion.Humedad}</td>
                                                <td>{medicion.Presion}</td>
                                                <td>{medicion.Promedio_Salud}</td>
                                                <td>{medicion.SpO2}</td>
                                                <td>{medicion.Temperatura_Ambiente}</td>
                                                <td>{medicion.Temperatura_Objeto}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                <h3 className="text-center">Formulario de Recetario</h3>
                                <form>
                                    <div className="mb-3">
                                        <label htmlFor="medicamento" className="form-label">Medicamento</label>
                                        <input type="text" className="form-control" id="medicamento" />
                                    </div>
                                    <div className="mb-3">
                                        <label htmlFor="dosis" className="form-label">Dosis</label>
                                        <input type="text" className="form-control" id="dosis" />
                                    </div>
                                    <div className="mb-3">
                                        <label htmlFor="indicaciones" className="form-label">Indicaciones</label>
                                        <textarea className="form-control" id="indicaciones" rows="3"></textarea>
                                    </div>
                                    <button type="submit" className="btn btn-primary">Enviar</button>
                                </form>
                            </div>
                        )}
                    </>
                )}

                {!isAuthenticated && mostrarFormulario && (
                    <Formulario onLoginSuccess={handleLoginSuccess} />
                )}

                {!isAuthenticated && !mostrarFormulario && (
                    <div className="text-center">
                        <p>Por favor, inicia sesión para acceder al contenido.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default App;
