import React, { useState, useEffect } from "react";
import axios from "axios";
import Formulario from "./Componentes/Form"; 
import FormProducto from "./Componentes/FormProducto"; 
import { PieChart } from 'react-minimal-pie-chart'; 
import "bootstrap/dist/css/bootstrap.min.css";
import "@fortawesome/fontawesome-free/css/all.min.css";

function App() {
    const [productos, setProductos] = useState([]);
    const [mostrarFormulario, setMostrarFormulario] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [productoEditando, setProductoEditando] = useState(null);
    const [userData, setUserData] = useState(null); 
    const [userType, setUserType] = useState(null); 

    const colores = ["#FF5733", "#33FF57", "#3357FF", "#FF33A1", "#FF5733", "#33F0FF", "#F0FF33"];

    useEffect(() => {
        if (isAuthenticated && userData) {
            axios.get("https://medisen2-pj7q.vercel.app/api/productos")
                .then(response => setProductos(response.data.filter(producto => producto.estado === 1)))
                .catch(error => console.error("Error obteniendo productos:", error));
        }
    }, [isAuthenticated, userData]);

    const abrirFormulario = () => setMostrarFormulario(true);
    const cerrarFormulario = () => setMostrarFormulario(false);

    const handleLoginSuccess = (userDataFromResponse) => {
        setUserData(userDataFromResponse);
        setUserType(userDataFromResponse.user);
        setIsAuthenticated(true);
        cerrarFormulario();
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

    const generarDatosGrafico = () => {
        return productos.map((producto, index) => ({
            title: producto.nombre,
            value: producto.cantidad,
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
                            <li className="nav-item"><a className="nav-link text-white" href="#">Inicio</a></li>
                            <li className="nav-item"><a className="nav-link text-white" href="#">Tienda</a></li>
                        </ul>
                        {!isAuthenticated ? (
                            <button className="btn btn-primary" onClick={abrirFormulario}>Iniciar Sesión</button>
                        ) : (
                            <ul className="navbar-nav">
                                <li className="nav-item"><a className="nav-link" href="#">Perfil</a></li>
                                <li className="nav-item"><button className="btn btn-danger" onClick={() => setIsAuthenticated(false)}>Cerrar Sesión</button></li>
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
                    </>
                )}
            </div>
            {mostrarFormulario && <FormProducto closeModal={cerrarFormulario} productoEditando={productoEditando} setProductos={setProductos} />}
            {!isAuthenticated && <Formulario onLoginSuccess={handleLoginSuccess} />}
            {userType === 1 && (
                <div>
                    <h3 className="text-center">Bienvenido Usuario</h3>
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
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            {userType === 3 && (
                <div>
                    <h3 className="text-center">Bienvenido Medico</h3>
                    <h3 className="text-center">Formulario de receta medica</h3>
                    <div className="container mt-4">
                        <div className="row">
                            <div className="col-md-6">
                                <div className="card">
                                    <div className="card-body">
                                        <h5 className="card-title">Receta Medica</h5>
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
                                                <textarea className="form-control" id="indicaciones"></textarea>
                                            </div>
                                            <button type="submit" className="btn btn-primary">Enviar</button>
                                        </form>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default App;
