import React, { useState, useEffect } from "react";
import axios from "axios";
import Formulario from "./Componentes/Form";
import FormProducto from "./Componentes/FormProducto";
import PayPalButton from "./Componentes/PayPalButton";
import Perfil from "./Componentes/Perfil";
// Asegúrate de que la ruta sea correcta
import { PieChart } from 'react-minimal-pie-chart';
import "bootstrap/dist/css/bootstrap.min.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { jsPDF } from 'jspdf';

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
    const [mostrarCarrito, setMostrarCarrito] = useState(false);
    const [mostrarPerfil, setMostrarPerfil] = useState(false);
    const [mostrarDashboard, setMostrarDashboard] = useState(true);
    const [mostrarProductos, setMostrarProductos] = useState(false);
    const [mostrarModalEditar, setMostrarModalEditar] = useState(false);
    const [usuarios, setUsuarios] = useState([]);
    const [ventas, setVentas] = useState([]);
    const [sessionCheckIntervalId, setSessionCheckIntervalId] = useState(null);

    const colores = ["#FF5733", "#33FF57", "#3357FF", "#FF33A1", "#FF5733", "#33F0FF", "#F0FF33"];

    const checkSessionStatus = async () => {
        if (isAuthenticated && userData && userData.id) {
            try {
                const response = await axios.get(`https://medisen2-pj7q.vercel.app/api/check-session/${userData.id}`);
                if (!response.data.success || !response.data.isActive) {
                    console.log("Sesión inválida detectada por verificación periódica.");
                    handleLogout();
                    alert("Tu sesión ha expirado o ha sido invalidada. Por favor, inicia sesión de nuevo.");
                }
            } catch (error) {
                console.error("Error al verificar el estado de la sesión:", error);
                // Considerar si se debe cerrar sesión aquí o intentar de nuevo
            }
        }
    };

    useEffect(() => {
        const storedUserData = localStorage.getItem("userData");
        if (storedUserData) {
            const parsedUserData = JSON.parse(storedUserData);
            setUserData(parsedUserData);
            setUserType(parsedUserData.user);
            // No establecer isAuthenticated directamente aquí, llamaremos a verifySession
            verifySession(parsedUserData);
        }
    }, []);



// Función para generar el PDF de ventas
const generarPDFVentas = () => {
  const doc = new jsPDF();
  
  // Título del documento
  doc.setFontSize(18);
  doc.text('Reporte de Ventas', 105, 20, { align: 'center' });
  
  // Información de resumen
  doc.setFontSize(12);
  doc.text(`Total de ventas: ${ventas.length}`, 14, 30);
  doc.text(`Ingresos totales: $${ventas.reduce((total, venta) => total + venta.total, 0)}`, 14, 40);
  
  // Encabezados de la tabla
  doc.setFontSize(14);
  doc.text('ID', 14, 55);
  doc.text('Usuario', 30, 55);
  doc.text('Total', 100, 55);
  doc.text('Fecha', 140, 55);
  
  // Datos de las ventas
  doc.setFontSize(10);
  let y = 65;
  ventas.forEach((venta, index) => {
    if (y > 280) { // Si llega al final de la página, añade una nueva
      doc.addPage();
      y = 20;
      // Volver a poner encabezados en nueva página
      doc.setFontSize(14);
      doc.text('ID', 14, y);
      doc.text('Usuario', 30, y);
      doc.text('Total', 100, y);
      doc.text('Fecha', 140, y);
      y = 30;
    }
    
    doc.text(venta.id.toString(), 14, y);
    doc.text(venta.nombre_usuario, 30, y);
    doc.text(`$${venta.total.toFixed(2)}`, 100, y);
    doc.text(new Date(venta.created_at).toLocaleDateString(), 140, y);
    y += 10;
    
    // Línea separadora
    doc.line(14, y, 190, y);
    y += 5;
  });
  
  // Guardar el PDF
  doc.save(`reporte_ventas_${new Date().toISOString().split('T')[0]}.pdf`);
};

    const verifySession = async (storedUserData) => {
        if (storedUserData && storedUserData.id) {
            try {
                const response = await axios.get(`https://medisen2-pj7q.vercel.app/api/check-session/${storedUserData.id}`);
                if (response.data.success && response.data.isActive) {
                    setIsAuthenticated(true);
                    // Iniciar la verificación periódica de la sesión
                    const intervalId = setInterval(checkSessionStatus, 60000); // Cada 60 segundos
                    setSessionCheckIntervalId(intervalId);
                } else {
                    console.log("La sesión almacenada en localStorage no es válida.");
                    handleLogout();
                }
            } catch (error) {
                console.error("Error al verificar la sesión:", error);
                handleLogout();
            }
        }
    };

    useEffect(() => {
        if (isAuthenticated && userData) {
            axios.get("https://medisen2-pj7q.vercel.app/api/productos")
                .then(response => setProductos(response.data.filter(producto => producto.estado === 1)))
                .catch(error => console.error("Error obteniendo productos:", error));

            if (userType === 2) {
                // Obtener usuarios
                axios.get("https://medisen2-pj7q.vercel.app/api/usuarios")
                    .then(response => setUsuarios(response.data))
                    .catch(error => console.error("Error obteniendo usuarios:", error));

                // Obtener ventas
                axios.get("https://medisen2-pj7q.vercel.app/api/compras")
                    .then(response => setVentas(response.data))
                    .catch(error => console.error("Error obteniendo ventas:", error));
            }
        }
    }, [isAuthenticated, userData, userType]);

    // Obtener datos de Firebase para el médico (usuario tipo 3)
    useEffect(() => {
        if (isAuthenticated && userData) {
            if (userType === 3) {
                // Solo cambia esta línea con la nueva ruta
                const medicionesRef = ref(database, 'Clientes/cliente_123/Mediciones/');
                onValue(medicionesRef, (snapshot) => {
                    const data = snapshot.val();
                    console.log("Datos crudos de Firebase:", data);
                    const datos = [];
                    for (let id in data) {
                        datos.push(data[id]);
                    }
                    console.log("Datos procesados (datosMedico):", datos); 
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
        // Iniciar la verificación periódica de la sesión después del inicio de sesión
        const intervalId = setInterval(checkSessionStatus, 60000); // Cada 60 segundos
        setSessionCheckIntervalId(intervalId);
        if (userDataFromResponse.user === 1) {
            setMostrarBienvenida(true);
        }
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
                // Actualizar la lista de productos
                const updatedProductos = productos.map(producto =>
                    producto.id === productoEditando.id ? productoEditando : producto
                );
                setProductos(updatedProductos);
            } else {
                alert("Error al actualizar el producto");
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





    const handleLogout = async () => {
    try {
        // Solo intentar cerrar sesión en el backend si tenemos userData
        if (userData && userData.id) {
            const response = await axios.post(
                "https://medisen2-pj7q.vercel.app/api/logout",
                { userId: userData.id },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        // Si usas autenticación por token, incluye esta línea:
                        // 'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );

            if (!response.data.success) {
                console.warn("El backend no confirmó el cierre de sesión:", response.data.message);
                // Podrías mostrar un mensaje al usuario aquí si lo deseas
                // alert("Hubo un problema al cerrar sesión en el servidor");
            }
        }

        // Limpieza del frontend (se ejecuta siempre, independientemente del backend)
        setIsAuthenticated(false);
        setUserData(null);
        setUserType(null);
        localStorage.removeItem("userData");
        
        // Limpiar tokens si los tienes
        // localStorage.removeItem("token");
        // localStorage.removeItem("refreshToken");
        
        // Limpiar el intervalo de verificación de sesión
        if (sessionCheckIntervalId) {
            clearInterval(sessionCheckIntervalId);
            setSessionCheckIntervalId(null);
        }
        
        // Resetear todos los estados de la UI
        setMostrarBienvenida(false);
        setMostrarTienda(false);
        setMostrarCarrito(false);
        setMostrarPerfil(false);
        setMostrarDashboard(true);
        setMostrarProductos(false);

        // Opcional: Redirigir a la página de login
        // window.location.href = '/login';
        
        // Opcional: Mostrar mensaje de éxito
        // alert("Sesión cerrada correctamente");

    } catch (error) {
        console.error("Error al cerrar sesión:", error);
        
        // Aún así limpiamos el frontend para no dejar al usuario atascado
        setIsAuthenticated(false);
        setUserData(null);
        setUserType(null);
        localStorage.removeItem("userData");
        
        if (sessionCheckIntervalId) {
            clearInterval(sessionCheckIntervalId);
            setSessionCheckIntervalId(null);
        }
        
        // Mostrar mensaje de error al usuario
        alert("Ocurrió un error al cerrar sesión, pero se limpiaron los datos locales");
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
  if (!datosMedico || !Array.isArray(datosMedico)) return [];
  
  // Usamos solo las últimas 5 mediciones para no saturar el gráfico
  const ultimasMediciones = datosMedico.slice(-5);
  
  return ultimasMediciones.map((medicion, index) => {
    // Calculamos un promedio simple si no existe el campo
    const promedio = (
      (Number(medicion.Frecuencia_Cardiaca || 0) + 
       Number(medicion.Humedad || 0) + 
       Number(medicion.Presion || 0)) / 3
    ).toFixed(1);

    return {
      title: `Med ${index + 1}`,
      value: promedio,
      color: colores[index % colores.length],
      fecha: medicion.Fecha || 'Sin fecha'
    };
  });
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
                                <a className="nav-link text-white" href="#" onClick={() => { setMostrarDashboard(true); setMostrarTienda(false); setMostrarCarrito(false); setMostrarPerfil(false); setMostrarProductos(false); }}>Dashboard</a>
                            </li>
                            {userType === 2 && (
                                <li className="nav-item">
                                    <a className="nav-link text-white" href="#" onClick={() => { setMostrarProductos(true); setMostrarDashboard(false); setMostrarTienda(false); setMostrarCarrito(false); setMostrarPerfil(false); }}>Productos</a>
                                </li>
                            )}
                            {userType === 1 && (
                                <>
                                    <li className="nav-item">
                                        <a className="nav-link text-white" href="#" onClick={() => { setMostrarTienda(true); setMostrarCarrito(false); setMostrarBienvenida(false); setMostrarPerfil(false); setMostrarProductos(false); }}>Tienda</a>
                                    </li>
                                    <li className="nav-item">
                                        <a className="nav-link text-white" href="#" onClick={() => { setMostrarCarrito(true); setMostrarTienda(false); setMostrarBienvenida(false); setMostrarPerfil(false); setMostrarProductos(false); }}>Carrito</a>
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
                                        <a className="nav-link" href="#" onClick={() => { setMostrarPerfil(true); setMostrarTienda(false); setMostrarCarrito(false); setMostrarBienvenida(false); setMostrarProductos(false); }}>Perfil</a>
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
                        <button 
                            className="btn btn-primary mt-3"
                            onClick={generarPDFVentas}
                        >
                            Generar Reporte PDF
                        </button>
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
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {usuarios.map((usuario) => (
                            <tr key={usuario.id}>
                                <td>{usuario.name}</td>
                                <td>{usuario.email}</td>
                                <td>{usuario.user === 1 ? "Usuario" : "Administrador"}</td>
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

                        {userType === 1 && mostrarPerfil && (
                            <Perfil userData={userData} />
                        )}

{userType === 3 && (
  <div>
    <h3 className="text-center">Datos del Paciente</h3>
        {console.log("Datos médicos en render:", datosMedico)}
    
    {datosMedico.length === 0 ? (
      <div className="alert alert-info text-center">
        No hay datos médicos disponibles para mostrar.
      </div>
    ) : (
      <>
        <div className="row mt-4">
          <div className="col-md-6 mx-auto">
            <div className="card">
              <div className="card-body">
                <h4 className="card-title text-center">Distribución de Mediciones</h4>
                <div style={{ height: '300px' }}>
                  <PieChart
                    data={[
                      {
                        title: 'Frecuencia Cardíaca',
                        value: datosMedico[0]?.Frecuencia_Cardiaca || 0,
                        color: '#FF6384'
                      },
                      {
                        title: 'Humedad',
                        value: datosMedico[0]?.Humedad || 0,
                        color: '#36A2EB'
                      },
                      {
                        title: 'Presión',
                        value: datosMedico[0]?.Presion || 0,
                        color: '#FFCE56'
                      }
                    ]}
                    label={({ dataEntry }) => `${dataEntry.title}: ${dataEntry.value}`}
                    labelStyle={{
                      fontSize: '7px',
                      fontFamily: 'sans-serif',
                    }}
                    animate
                  />
                </div>
                <p className="text-muted text-center mt-2">
                  Última medición: {datosMedico[0]?.Fecha || 'Fecha no disponible'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabla de datos completa */}
        <h4 className="mt-4 text-center">Historial de Mediciones</h4>
        <div className="table-responsive">
          <table className="table table-striped table-hover">
            <thead className="table-dark">
              <tr>
                <th>Fecha</th>
                <th>Hora</th>
                <th>Frec. Cardíaca</th>
                <th>Humedad</th>
                <th>Presión</th>
              </tr>
            </thead>
            <tbody>
              {datosMedico.map((medicion, index) => (
                <tr key={index}>
                  <td>{medicion.Fecha || 'N/D'}</td>
                  <td>{medicion.Hora || 'N/D'}</td>
                  <td>{medicion.Frecuencia_Cardiaca || 'N/D'}</td>
                  <td>{medicion.Humedad || 'N/D'}</td>
                  <td>{medicion.Presion || 'N/D'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    )}

    {/* Formulario de Recetario simplificado */}
    <div className="card mt-4">
      <div className="card-body">
        <h3 className="card-title text-center">Recetario Médico</h3>
        <form>
          <div className="row">
            <div className="col-md-6">
              <div className="mb-3">
                <label className="form-label">Medicamento</label>
                <input type="text" className="form-control" required />
              </div>
            </div>
            <div className="col-md-6">
              <div className="mb-3">
                <label className="form-label">Dosis</label>
                <input type="text" className="form-control" required />
              </div>
            </div>
          </div>
          <div className="mb-3">
            <label className="form-label">Indicaciones</label>
            <textarea className="form-control" rows="3" required></textarea>
          </div>
          <div className="text-center">
            <button type="submit" className="btn btn-primary">
              <i className="fas fa-paper-plane me-2"></i>Enviar Receta
            </button>
          </div>
        </form>
      </div>
    </div>
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
