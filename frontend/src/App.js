import React, { useState, useEffect } from "react";
import axios from "axios";
import Formulario from "./Componentes/Form";
import FormProducto from "./Componentes/FormProducto";
import PayPalButton from "./Componentes/PayPalButton";
import Perfil from "./Componentes/Perfil";
import BarChart from "./Componentes/BarChart";
import { PieChart } from 'react-minimal-pie-chart';
import "bootstrap/dist/css/bootstrap.min.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
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
    const [mostrarCarrito, setMostrarCarrito] = useState(false);
    const [mostrarPerfil, setMostrarPerfil] = useState(false);
    const [mostrarDashboard, setMostrarDashboard] = useState(true);
    const [mostrarProductos, setMostrarProductos] = useState(false);
    const [mostrarModalEditar, setMostrarModalEditar] = useState(false);
    const [usuarios, setUsuarios] = useState([]);
    const [ventas, setVentas] = useState([]);
    const [sessionCheckInterval, setSessionCheckInterval] = useState(null);

    const colores = ["#FF5733", "#33FF57", "#3357FF", "#FF33A1", "#FF5733", "#33F0FF", "#F0FF33"];

    // Verificar sesión al cargar la aplicación
   useEffect(() => {
    const storedUserData = localStorage.getItem("userData");
    const storedInterval = localStorage.getItem("sessionCheckInterval");
    
    if (storedUserData) {
        const parsedUserData = JSON.parse(storedUserData);
        verifySession(parsedUserData.id);

        // Cargar datos médicos si el usuario es médico (tipo 3)
        if (parsedUserData.user === 3) {
            const medicalRef = ref(database, 'medicalData');
            onValue(medicalRef, (snapshot) => {
                const data = snapshot.val();
                if (data) {
                    const medicalDataArray = Object.keys(data).map(key => ({
                        id: key,
                        ...data[key]
                    }));
                    setDatosMedico(medicalDataArray);
                }
            });
        }
    }

    return () => {
        if (sessionCheckInterval) {
            clearInterval(sessionCheckInterval);
        }
        // Limpiar suscripción a Firebase
        const medicalRef = ref(database, 'medicalData');
        off(medicalRef);
    };
}, []);

    const verifySession = async (userId) => {
        try {
            const response = await axios.get(`https://medisen2-pj7q.vercel.app/api/check-session/${userId}`);
            
            if (response.data.success && response.data.isActive) {
                const storedUserData = localStorage.getItem("userData");
                if (storedUserData) {
                    const parsedUserData = JSON.parse(storedUserData);
                    setUserData(parsedUserData);
                    setUserType(parsedUserData.user);
                    setIsAuthenticated(true);
                    
                    // Iniciar verificación periódica de sesión
                    const interval = setInterval(() => checkSessionStatus(parsedUserData.id), 60000);
                    setSessionCheckInterval(interval);
                    localStorage.setItem("sessionCheckInterval", interval.toString());
                    
                    // Cargar datos iniciales
                    loadInitialData();
                }
            } else {
                handleLogout();
            }
        } catch (error) {
            console.error("Error al verificar sesión:", error);
            handleLogout();
        }
    };

    const loadInitialData = async () => {
        try {
            const productosResponse = await axios.get("https://medisen2-pj7q.vercel.app/api/productos");
            setProductos(productosResponse.data.filter(producto => producto.estado === 1));

            if (userType === 2) {
                const [usuariosResponse, ventasResponse] = await Promise.all([
                    axios.get("https://medisen2-pj7q.vercel.app/api/usuarios"),
                    axios.get("https://medisen2-pj7q.vercel.app/api/compras")
                ]);
                setUsuarios(usuariosResponse.data);
                setVentas(ventasResponse.data);
            }

            if (userType === 1 || userType === 3) {
                obtenerCarrito();
            }
        } catch (error) {
            console.error("Error cargando datos iniciales:", error);
        }
    };

    const checkSessionStatus = async (userId) => {
        try {
            const response = await axios.get(`https://medisen2-pj7q.vercel.app/api/check-session/${userId}`);
            
            if (!response.data.isActive) {
                handleLogout();
                alert("Tu sesión ha sido cerrada porque iniciaron sesión desde otro dispositivo.");
            }
        } catch (error) {
            console.error("Error al verificar estado de sesión:", error);
        }
    };

    const obtenerCarrito = async () => {
        try {
            const response = await axios.get(`https://medisen2-pj7q.vercel.app/api/carrito/${userData.id}`);
            if (response.data.success) {
                setCarrito(response.data.carrito);
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
        
        const interval = setInterval(() => checkSessionStatus(userDataFromResponse.id), 60000);
        setSessionCheckInterval(interval);
        localStorage.setItem("sessionCheckInterval", interval.toString());
        
        if (userDataFromResponse.user === 1) {
            setMostrarBienvenida(true);
        }
        
        loadInitialData();
    };

    const handleLogout = async () => {
        if (userData && userData.id) {
            try {
                await axios.post("https://medisen2-pj7q.vercel.app/api/logout", {
                    userId: userData.id
                });
            } catch (error) {
                console.error("Error al cerrar sesión en el servidor:", error);
            }
        }
        
        // Limpiar estado local
        setIsAuthenticated(false);
        setUserData(null);
        setUserType(null);
        localStorage.removeItem("userData");
        
        // Limpiar intervalo de verificación
        if (sessionCheckInterval) {
            clearInterval(sessionCheckInterval);
        }
        localStorage.removeItem("sessionCheckInterval");
        setSessionCheckInterval(null);
        
        // Resetear estados de la aplicación
        setMostrarDashboard(true);
        setMostrarTienda(false);
        setMostrarCarrito(false);
        setMostrarPerfil(false);
        setMostrarProductos(false);
        setMostrarBienvenida(false);
    };

    const handleEditar = (producto) => {
        setProductoEditando(producto);
        setMostrarModalEditar(true);
    };

    const handleActualizarProducto = async () => {
        try {
            const response = await axios.put(`https://medisen2-pj7q.vercel.app/api/productos/${productoEditando.id}`, {
                nombre: productoEditando.nombre,
                descripcion: productoEditando.descripcion,
                precio: productoEditando.precio,
            });

            if (response.status === 200) {
                alert("Producto actualizado con éxito");
                setMostrarModalEditar(false);
                setProductos(productos.map(producto =>
                    producto.id === productoEditando.id ? productoEditando : producto
                ));
            }
        } catch (error) {
            console.error("Error al actualizar el producto:", error);
            alert("Error al actualizar el producto");
        }
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
                obtenerCarrito();
            }
        } catch (error) {
            console.error("Error al eliminar producto del carrito:", error);
        }
    };

    const generarDatosGrafico = () => {
        return productos.map((producto, index) => ({
            title: producto.nombre,
            value: producto.cantidad,
            color: colores[index % colores.length]
        }));
    };

    const generarDatosGraficoMedico = () => {
        return datosMedico.map((medicion, index) => ({
            title: `Medición ${index + 1}`,
            value: medicion.Promedio_Salud,
            color: colores[index % colores.length]
        }));
    };

    const handleIrATienda = () => {
        setMostrarBienvenida(false);
        setMostrarTienda(true);
        setMostrarCarrito(false);
    };

    const handleCantidadChange = (id, cantidad) => {
        const producto = productos.find(p => p.id === id);
        if (producto && cantidad <= producto.cantidad && cantidad > 0) {
            setCantidadSeleccionada(prev => ({
                ...prev,
                [id]: cantidad
            }));
        }
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
                obtenerCarrito();
                setProductos(prevProductos =>
                    prevProductos.map(producto =>
                        producto.id === productoId
                            ? { ...producto, cantidad: producto.cantidad - cantidad }
                            : producto
                    )
                );
            }
        } catch (error) {
            console.error("Error al añadir producto al carrito:", error);
        }
    };

    const handlePaymentSuccess = async (paymentDetails) => {
        try {
            const detallesCarrito = JSON.stringify(carrito.map(item => ({
                nombre: item.nombre,
                cantidad: item.cantidad,
                precio: item.precio
            })));

            const total = carrito.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);

            const response = await axios.post("https://medisen2-pj7q.vercel.app/api/guardar-compra", {
                id_usuario: userData.id,
                nombre_usuario: userData.name,
                total: total,
                detalles: detallesCarrito
            });

            if (response.data.success) {
                alert("Compra realizada con éxito");
                setCarrito([]);
                loadInitialData();
            }
        } catch (error) {
            console.error("Error al procesar la compra:", error);
        }
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
                                <a className="nav-link text-white" href="#" onClick={() => { 
                                    setMostrarDashboard(true); 
                                    setMostrarTienda(false); 
                                    setMostrarCarrito(false); 
                                    setMostrarPerfil(false); 
                                    setMostrarProductos(false); 
                                }}>Dashboard</a>
                            </li>
                            {userType === 2 && (
                                <li className="nav-item">
                                    <a className="nav-link text-white" href="#" onClick={() => { 
                                        setMostrarProductos(true); 
                                        setMostrarDashboard(false); 
                                        setMostrarTienda(false); 
                                        setMostrarCarrito(false); 
                                        setMostrarPerfil(false); 
                                    }}>Productos</a>
                                </li>
                            )}
                            {userType === 1 && (
                                <>
                                    <li className="nav-item">
                                        <a className="nav-link text-white" href="#" onClick={() => { 
                                            setMostrarTienda(true); 
                                            setMostrarCarrito(false); 
                                            setMostrarBienvenida(false); 
                                            setMostrarPerfil(false); 
                                            setMostrarProductos(false); 
                                        }}>Tienda</a>
                                    </li>
                                    <li className="nav-item">
                                        <a className="nav-link text-white" href="#" onClick={() => { 
                                            setMostrarCarrito(true); 
                                            setMostrarTienda(false); 
                                            setMostrarBienvenida(false); 
                                            setMostrarPerfil(false); 
                                            setMostrarProductos(false); 
                                        }}>Carrito</a>
                                    </li>
                                </>
                            )}
                        </ul>
                        {!isAuthenticated ? (
                            <button className="btn btn-primary" onClick={abrirFormulario}>Iniciar Sesión</button>
                        ) : (
                            <ul className="navbar-nav">
                                {userType === 1 && (
                                    <li className="nav-item">
                                        <a className="nav-link" href="#" onClick={() => { 
                                            setMostrarPerfil(true); 
                                            setMostrarTienda(false); 
                                            setMostrarCarrito(false); 
                                            setMostrarBienvenida(false); 
                                            setMostrarProductos(false); 
                                        }}>Perfil</a>
                                    </li>
                                )}
                                <li className="nav-item">
                                    <button className="btn btn-danger" onClick={handleLogout}>Cerrar Sesión</button>
                                </li>
                            </ul>
                        )}
                    </div>
                </div>
            </nav>
            <div className="container mt-4">
                {isAuthenticated && userData && (
                    <>
                        {userType === 2 && mostrarDashboard && (
                            <>
                                <h3 className="text-center">Dashboard del Administrador</h3>
                                <div className="row">
                                    <div className="col-md-4">
                                        <div className="card">
                                            <div className="card-body">
                                                <h5 className="card-title">Productos Disponibles</h5>
                                                <p className="card-text">{productos.length}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-md-4">
                                        <div className="card">
                                            <div className="card-body">
                                                <h5 className="card-title">Usuarios Registrados</h5>
                                                <p className="card-text">{usuarios.length}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-md-4">
                                        <div className="card">
                                            <div className="card-body">
                                                <h5 className="card-title">Ventas Totales</h5>
                                                <p className="card-text">{ventas.length}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="row mt-4">
                                    <div className="col-md-6">
                                        <h4>Gráfico de Productos</h4>
                                        <PieChart
                                            data={generarDatosGrafico()}
                                            style={{ height: "300px" }}
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <h4>Resumen de Ventas</h4>
                                        <div className="card">
                                            <div className="card-body">
                                                <p className="card-text">
                                                    Total de ventas realizadas: {ventas.length}
                                                </p>
                                                <p className="card-text">
                                                    Ingresos totales: $
                                                    {ventas.reduce((total, venta) => total + venta.total, 0)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="row mt-4">
                                    <div className="col-md-12">
                                        <h4>Lista de Usuarios</h4>
                                        <table className="table table-dark table-hover">
                                            <thead>
                                                <tr>
                                                    <th>Nombre</th>
                                                    <th>Email</th>
                                                    <th>Tipo</th>
                                                    <th>Estado</th>
                                                    <th>Acciones</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {usuarios.map((usuario) => (
                                                    <tr key={usuario.id}>
                                                        <td>{usuario.name}</td>
                                                        <td>{usuario.email}</td>
                                                        <td>{usuario.user === 1 ? "Usuario" : "Administrador"}</td>
                                                        <td>{usuario.status === 1 ? "Conectado" : "Desconectado"}</td>
                                                        <td>
                                                            <button className="btn btn-warning">Editar</button>
                                                            <button className="btn btn-danger">Eliminar</button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </>
                        )}

                        {userType === 2 && mostrarProductos && (
                            <>
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
                        )}

                        {mostrarModalEditar && (
                            <div className="modal" style={{ display: 'block', backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
                                <div className="modal-dialog">
                                    <div className="modal-content">
                                        <div className="modal-header">
                                            <h5 className="modal-title">Editar Producto</h5>
                                            <button type="button" className="btn-close" onClick={() => setMostrarModalEditar(false)}></button>
                                        </div>
                                        <div className="modal-body">
                                            <form onSubmit={(e) => {
                                                e.preventDefault();
                                                handleActualizarProducto();
                                            }}>
                                                <div className="mb-3">
                                                    <label htmlFor="nombre" className="form-label">Nombre</label>
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        id="nombre"
                                                        value={productoEditando?.nombre || ''}
                                                        onChange={(e) => setProductoEditando({ ...productoEditando, nombre: e.target.value })}
                                                    />
                                                </div>
                                                <div className="mb-3">
                                                    <label htmlFor="descripcion" className="form-label">Descripción</label>
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        id="descripcion"
                                                        value={productoEditando?.descripcion || ''}
                                                        onChange={(e) => setProductoEditando({ ...productoEditando, descripcion: e.target.value })}
                                                    />
                                                </div>
                                                <div className="mb-3">
                                                    <label htmlFor="precio" className="form-label">Precio</label>
                                                    <input
                                                        type="number"
                                                        className="form-control"
                                                        id="precio"
                                                        value={productoEditando?.precio || ''}
                                                        onChange={(e) => setProductoEditando({ ...productoEditando, precio: e.target.value })}
                                                    />
                                                </div>
                                                <div className="modal-footer">
                                                    <button type="button" className="btn btn-secondary" onClick={() => setMostrarModalEditar(false)}>Cancelar</button>
                                                    <button type="submit" className="btn btn-primary">Guardar Cambios</button>
                                                </div>
                                            </form>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {userType === 1 && mostrarBienvenida && (
                            <div>
                                <h3 className="text-center">Bienvenido {userData.name}</h3>
                                <p className="text-center">Gracias por iniciar sesión. Haz clic en "Tienda" para ver nuestros productos.</p>
                                <div className="text-center">
                                    <button className="btn btn-primary" onClick={handleIrATienda}>Ir a Tienda</button>
                                </div>
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
                                                    <p className="card-text"><strong>Disponibles:</strong> {producto.cantidad}</p>
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
                                                    <button 
                                                        className="btn btn-success" 
                                                        onClick={() => handleComprar(producto.id)}
                                                        disabled={producto.cantidad <= 0}
                                                    >
                                                        {producto.cantidad <= 0 ? "Agotado" : "Añadir al carrito"}
                                                    </button>
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
                                        <div className="d-flex justify-content-end">
                                            <PayPalButton
                                                total={carrito.reduce((total, item) => total + item.cantidad * item.precio, 0)}
                                                carrito={carrito}
                                                userData={userData}
                                                onPaymentSuccess={handlePaymentSuccess}
                                            />
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-center">
                                        <p>No hay productos en el carrito.</p>
                                        <button className="btn btn-primary" onClick={() => {
                                            setMostrarTienda(true);
                                            setMostrarCarrito(false);
                                        }}>
                                            Ir a Tienda
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {userType === 1 && mostrarPerfil && (
                            <Perfil userData={userData} onLogout={handleLogout} />
                        )}

                        {userType === 3 && (
                            <div>
                                <h3 className="text-center">Datos del Paciente</h3>
                                {datosMedico.length > 0 ? (
                                    <>
                                        <table className="table table-striped">
                                            <thead>
                                                <tr>
                                                    <th>Fecha</th>
                                                    <th>Hora</th>
                                                    <th>Frecuencia Cardíaca</th>
                                                    <th>Humedad</th>
                                                    <th>Presión</th>
                                                    <th>Promedio Salud</th>
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
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        <div className="row mt-4">
                                            <div className="col-md-6">
                                                <h4>Resumen de Salud</h4>
                                                <PieChart
                                                    data={generarDatosGraficoMedico()}
                                                    style={{ height: "300px" }}
                                                />
                                            </div>
                                            <div className="col-md-6">
                                                <h4>Gráfico de Frecuencia Cardíaca</h4>
                                                <BarChart datos={datosMedico} />
                                            </div>
                                        </div>
                                        <h3 className="text-center mt-4">Formulario de Recetario</h3>
                                        <form className="mt-3">
                                            <div className="row">
                                                <div className="col-md-6">
                                                    <div className="mb-3">
                                                        <label htmlFor="medicamento" className="form-label">Medicamento</label>
                                                        <input type="text" className="form-control" id="medicamento" />
                                                    </div>
                                                    <div className="mb-3">
                                                        <label htmlFor="dosis" className="form-label">Dosis</label>
                                                        <input type="text" className="form-control" id="dosis" />
                                                    </div>
                                                </div>
                                                <div className="col-md-6">
                                                    <div className="mb-3">
                                                        <label htmlFor="indicaciones" className="form-label">Indicaciones</label>
                                                        <textarea className="form-control" id="indicaciones" rows="3"></textarea>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-center">
                                                <button type="submit" className="btn btn-primary">Enviar Receta</button>
                                            </div>
                                        </form>
                                    </>
                                ) : (
                                    <p className="text-center">No hay datos médicos disponibles.</p>
                                )}
                            </div>
                        )}
                    </>
                )}

                {!isAuthenticated && mostrarFormulario && (
                    <Formulario 
                        onLoginSuccess={handleLoginSuccess} 
                        closeModal={cerrarFormulario}
                    />
                )}

                {!isAuthenticated && !mostrarFormulario && (
                    <div className="text-center">
                        <h2>Bienvenido a Zephyr Medical</h2>
                        <p>Por favor, inicia sesión para acceder al sistema.</p>
                        <button className="btn btn-primary" onClick={abrirFormulario}>Iniciar Sesión</button>
                        <div className="mt-4">
                            <img src="assets/images/medical-banner.jpg" alt="Banner Médico" className="img-fluid rounded" />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default App;
