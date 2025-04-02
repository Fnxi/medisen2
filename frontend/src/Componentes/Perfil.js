import React, { useState, useEffect } from "react";
import axios from "axios";
import jsPDF from "jspdf";

const Perfil = ({ userData }) => {
    const [editar, setEditar] = useState(false);
    const [datosUsuario, setDatosUsuario] = useState(null); // Cambiado a null inicial
    const [compras, setCompras] = useState([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [datosFiscales, setDatosFiscales] = useState({
        nombreFiscal: "",
        rfc: "",
        direccionFiscal: "",
    });
    const [compraSeleccionada, setCompraSeleccionada] = useState(null);
    const [cargando, setCargando] = useState({
        perfil: true,
        compras: true
    });

    // Obtener datos del perfil (incluyendo edad calculada)
    useEffect(() => {
        const obtenerDatosPerfil = async () => {
            try {
                // Obtener datos básicos del usuario
                const [datosUsuarioRes, vistaUsuarioRes] = await Promise.all([
                    axios.get(`https://medisen2-pj7q.vercel.app/api/usuarios/${userData.id}`),
                    axios.get(`https://medisen2-pj7q.vercel.app/api/vista-usuario/${userData.id}`)
                ]);

                if (datosUsuarioRes.data.success && vistaUsuarioRes.data.success) {
                    setDatosUsuario({
                        ...datosUsuarioRes.data.usuario,
                        age: vistaUsuarioRes.data.usuario.edad
                    });
                } else {
                    // Si falla la API, usar los datos del login como respaldo
                    setDatosUsuario({
                        ...userData,
                        age: calcularEdad(userData.birthDate) // Función para calcular edad si es necesario
                    });
                }
            } catch (error) {
                console.error("Error al obtener datos del perfil:", error);
                // Usar datos del login como respaldo
                setDatosUsuario({
                    ...userData,
                    age: calcularEdad(userData.birthDate)
                });
            } finally {
                setCargando(prev => ({ ...prev, perfil: false }));
            }
        };

        obtenerDatosPerfil();
    }, [userData.id]);

    // Función para calcular edad si es necesario
    const calcularEdad = (fechaNacimiento) => {
        if (!fechaNacimiento) return null;
        const nacimiento = new Date(fechaNacimiento);
        const hoy = new Date();
        let edad = hoy.getFullYear() - nacimiento.getFullYear();
        const mes = hoy.getMonth() - nacimiento.getMonth();
        if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
            edad--;
        }
        return edad;
    };

    // Obtener las compras del usuario
    useEffect(() => {
        const obtenerCompras = async () => {
            try {
                const response = await axios.get(
                    `https://medisen2-pj7q.vercel.app/api/compras/${userData.id}`
                );
                if (response.data.success) {
                    setCompras(response.data.compras);
                } else {
                    console.error("Error al obtener las compras:", response.data.message);
                }
            } catch (error) {
                console.error("Error al obtener las compras:", error);
            } finally {
                setCargando(prev => ({ ...prev, compras: false }));
            }
        };

        obtenerCompras();
    }, [userData.id]);

    // Manejar cambios en los inputs del formulario de edición
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setDatosUsuario({
            ...datosUsuario,
            [name]: value,
        });
    };

    // Guardar los cambios en el perfil del usuario
    const handleGuardarCambios = async () => {
        try {
            const response = await axios.put(
                `https://medisen2-pj7q.vercel.app/api/usuarios/${datosUsuario.id}`,
                datosUsuario
            );
            if (response.data.success) {
                alert("Datos actualizados correctamente.");
                setEditar(false);
                
                // Actualizar la edad desde la vista después de guardar cambios
                const vistaResponse = await axios.get(
                    `https://medisen2-pj7q.vercel.app/api/vista-usuario/${userData.id}`
                );
                if (vistaResponse.data.success) {
                    setDatosUsuario(prev => ({
                        ...prev,
                        age: vistaResponse.data.usuario.edad
                    }));
                }
            } else {
                alert("Error al actualizar los datos.");
            }
        } catch (error) {
            console.error("Error al actualizar los datos:", error);
            alert("Error al actualizar los datos.");
        }
    };

    // Generar la factura en PDF
    const handleGenerarFactura = (compra) => {
        if (!compra) {
            alert("No se ha seleccionado ninguna compra.");
            return;
        }

        const doc = new jsPDF();

        // Encabezado de la factura
        doc.setFontSize(18);
        doc.text("Factura", 10, 10);
        doc.setFontSize(12);
        doc.text(`Número de compra: ${compra.id}`, 10, 20);
        doc.text(`Fecha: ${new Date(compra.fecha_compra).toLocaleDateString()}`, 10, 30);

        // Datos fiscales
        doc.text("Datos Fiscales:", 10, 40);
        doc.text(`Nombre: ${datosFiscales.nombreFiscal}`, 10, 50);
        doc.text(`RFC: ${datosFiscales.rfc}`, 10, 60);
        doc.text(`Dirección: ${datosFiscales.direccionFiscal}`, 10, 70);

        // Detalles de la compra
        doc.text("Detalles de la compra:", 10, 80);

        // Crear la tabla manualmente
        const detalles = JSON.parse(compra.detalles);
        let y = 90;

        // Encabezados de la tabla
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text("Cantidad", 10, y);
        doc.text("Descripción", 40, y);
        doc.text("Precio Unitario", 100, y);
        doc.text("Total", 150, y);

        y += 10;

        // Datos de la tabla
        doc.setFont("helvetica", "normal");
        detalles.forEach((item) => {
            const precio = parseFloat(item.precio);
            const total = item.cantidad * precio;

            doc.text(item.cantidad.toString(), 10, y);
            doc.text(item.nombre, 40, y);
            doc.text(`$${precio.toFixed(2)}`, 100, y);
            doc.text(`$${total.toFixed(2)}`, 150, y);
            y += 10;
        });

        // Totales
        const total = parseFloat(compra.total);
        const subtotal = total / 1.16;
        const iva = total - subtotal;

        doc.setFontSize(12);
        doc.text(`Subtotal: $${subtotal.toFixed(2)}`, 10, y + 10);
        doc.text(`IVA (16%): $${iva.toFixed(2)}`, 10, y + 20);
        doc.text(`Total: $${total.toFixed(2)}`, 10, y + 30);

        doc.output("dataurlnewwindow");
    };

    if (cargando.perfil) {
        return <div className="container mt-4 text-center">Cargando perfil...</div>;
    }

    return (
        <div className="container mt-4">
            <h3 className="text-center">Perfil de Usuario</h3>
            <div className="card">
                <div className="card-body">
                    <h5 className="card-title">Información Personal</h5>
                    {editar ? (
                        <>
                            <div className="mb-3">
                                <label htmlFor="name" className="form-label">Nombre</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    id="name"
                                    name="name"
                                    value={datosUsuario.name || ''}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div className="mb-3">
                                <label htmlFor="email" className="form-label">Email</label>
                                <input
                                    type="email"
                                    className="form-control"
                                    id="email"
                                    name="email"
                                    value={datosUsuario.email || ''}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div className="mb-3">
                                <label htmlFor="age" className="form-label">Edad</label>
                                <input
                                    type="number"
                                    className="form-control"
                                    id="age"
                                    name="age"
                                    value={datosUsuario.age || ''}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div className="mb-3">
                                <label htmlFor="birthDate" className="form-label">Fecha de Nacimiento</label>
                                <input
                                    type="date"
                                    className="form-control"
                                    id="birthDate"
                                    name="birthDate"
                                    value={datosUsuario.birthDate ? datosUsuario.birthDate.split('T')[0] : ''}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div className="mb-3">
                                <label htmlFor="birthPlace" className="form-label">Lugar de Nacimiento</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    id="birthPlace"
                                    name="birthPlace"
                                    value={datosUsuario.birthPlace || ''}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div className="mb-3">
                                <label htmlFor="gender" className="form-label">Género</label>
                                <select
                                    className="form-control"
                                    id="gender"
                                    name="gender"
                                    value={datosUsuario.gender || 'Otro'}
                                    onChange={handleInputChange}
                                >
                                    <option value="Masculino">Masculino</option>
                                    <option value="Femenino">Femenino</option>
                                    <option value="Otro">Otro</option>
                                </select>
                            </div>
                            <div className="mb-3">
                                <label htmlFor="civilStatus" className="form-label">Estado Civil</label>
                                <select
                                    className="form-control"
                                    id="civilStatus"
                                    name="civilStatus"
                                    value={datosUsuario.civilStatus || 'Soltero/a'}
                                    onChange={handleInputChange}
                                >
                                    <option value="Soltero/a">Soltero/a</option>
                                    <option value="Casado/a">Casado/a</option>
                                    <option value="Divorciado/a">Divorciado/a</option>
                                    <option value="Viudo/a">Viudo/a</option>
                                </select>
                            </div>
                            <button className="btn btn-success me-2" onClick={handleGuardarCambios}>
                                Guardar Cambios
                            </button>
                            <button className="btn btn-secondary" onClick={() => setEditar(false)}>
                                Cancelar
                            </button>
                        </>
                    ) : (
                        <>
                            <p className="card-text"><strong>Nombre:</strong> {datosUsuario.name}</p>
                            <p className="card-text"><strong>Email:</strong> {datosUsuario.email}</p>
                            <p className="card-text"><strong>Edad:</strong> {datosUsuario.age}</p>
                            <p className="card-text">
                                <strong>Fecha de Nacimiento:</strong>{" "}
                                {datosUsuario.birthDate ? new Date(datosUsuario.birthDate).toLocaleDateString() : "N/A"}
                            </p>
                            <p className="card-text"><strong>Lugar de Nacimiento:</strong> {datosUsuario.birthPlace || "N/A"}</p>
                            <p className="card-text"><strong>Género:</strong> {datosUsuario.gender}</p>
                            <p className="card-text"><strong>Estado Civil:</strong> {datosUsuario.civilStatus}</p>
                            <button className="btn btn-primary" onClick={() => setEditar(true)}>
                                Editar Perfil
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div className="mt-4">
                <h4 className="text-center">Mis Compras</h4>
                {cargando.compras ? (
                    <p className="text-center">Cargando compras...</p>
                ) : compras.length > 0 ? (
                    <table className="table table-striped">
                        <thead>
                            <tr>
                                <th>ID Compra</th>
                                <th>Total</th>
                                <th>Fecha</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {compras.map((compra) => (
                                <tr key={compra.id}>
                                    <td>{compra.id}</td>
                                    <td>${compra.total}</td>
                                    <td>{new Date(compra.fecha_compra).toLocaleDateString()}</td>
                                    <td>
                                        <button
                                            className="btn btn-primary"
                                            onClick={() => {
                                                setCompraSeleccionada(compra);
                                                setModalVisible(true);
                                            }}
                                        >
                                            Generar Factura
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <p className="text-center">No hay compras registradas</p>
                )}
            </div>

            {modalVisible && (
                <div className="modal" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Datos Fiscales</h5>
                                <button type="button" className="btn-close" onClick={() => setModalVisible(false)}></button>
                            </div>
                            <div className="modal-body">
                                <div className="mb-3">
                                    <label htmlFor="nombreFiscal" className="form-label">Nombre Fiscal</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        id="nombreFiscal"
                                        value={datosFiscales.nombreFiscal}
                                        onChange={(e) => setDatosFiscales({ ...datosFiscales, nombreFiscal: e.target.value })}
                                    />
                                </div>
                                <div className="mb-3">
                                    <label htmlFor="rfc" className="form-label">RFC</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        id="rfc"
                                        value={datosFiscales.rfc}
                                        onChange={(e) => setDatosFiscales({ ...datosFiscales, rfc: e.target.value })}
                                    />
                                </div>
                                <div className="mb-3">
                                    <label htmlFor="direccionFiscal" className="form-label">Dirección Fiscal</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        id="direccionFiscal"
                                        value={datosFiscales.direccionFiscal}
                                        onChange={(e) => setDatosFiscales({ ...datosFiscales, direccionFiscal: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setModalVisible(false)}>
                                    Cerrar
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-primary"
                                    onClick={() => {
                                        if (!datosFiscales.nombreFiscal || !datosFiscales.rfc || !datosFiscales.direccionFiscal) {
                                            alert("Todos los datos fiscales son requeridos.");
                                            return;
                                        }
                                        setModalVisible(false);
                                        handleGenerarFactura(compraSeleccionada);
                                    }}
                                >
                                    Generar Factura
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Perfil;
