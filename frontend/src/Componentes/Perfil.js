import React, { useState } from "react";
import axios from "axios";

const Perfil = ({ userData }) => {
    const [editar, setEditar] = useState(false); // Estado para controlar el modo de edición
    const [datosUsuario, setDatosUsuario] = useState(userData); // Estado para los datos editables

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setDatosUsuario({
            ...datosUsuario,
            [name]: value,
        });
    };

    const handleGuardarCambios = async () => {
        try {
            const response = await axios.put(
                `https://medisen2-pj7q.vercel.app/api/usuarios/${datosUsuario.id}`,
                datosUsuario
            );
            if (response.data.success) {
                alert("Datos actualizados correctamente.");
                setEditar(false); // Salir del modo de edición
            } else {
                alert("Error al actualizar los datos.");
            }
        } catch (error) {
            console.error("Error al actualizar los datos:", error);
            alert("Error al actualizar los datos.");
        }
    };

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
                                    value={datosUsuario.name}
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
                                    value={datosUsuario.email}
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
                                    value={datosUsuario.age}
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
                                    value={datosUsuario.birthDate.split('T')[0]} // Formatear la fecha para el input
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
                                    value={datosUsuario.birthPlace}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div className="mb-3">
                                <label htmlFor="gender" className="form-label">Género</label>
                                <select
                                    className="form-control"
                                    id="gender"
                                    name="gender"
                                    value={datosUsuario.gender}
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
                                    value={datosUsuario.civilStatus}
                                    onChange={handleInputChange}
                                >
                                    <option value="Soltero/a">Soltero/a</option>
                                    <option value="Casado/a">Casado/a</option>
                                    <option value="Divorciado/a">Divorciado/a</option>
                                    <option value="Viudo/a">Viudo/a</option>
                                </select>
                            </div>
                            <button className="btn btn-success me-2" onClick={handleGuardarCambios}>Guardar Cambios</button>
                            <button className="btn btn-secondary" onClick={() => setEditar(false)}>Cancelar</button>
                        </>
                    ) : (
                        <>
                            <p className="card-text"><strong>Nombre:</strong> {datosUsuario.name}</p>
                            <p className="card-text"><strong>Email:</strong> {datosUsuario.email}</p>
                            <p className="card-text"><strong>Edad:</strong> {datosUsuario.age}</p>
                            <p className="card-text"><strong>Fecha de Nacimiento:</strong> {new Date(datosUsuario.birthDate).toLocaleDateString()}</p>
                            <p className="card-text"><strong>Lugar de Nacimiento:</strong> {datosUsuario.birthPlace}</p>
                            <p className="card-text"><strong>Género:</strong> {datosUsuario.gender}</p>
                            <p className="card-text"><strong>Estado Civil:</strong> {datosUsuario.civilStatus}</p>
                            <button className="btn btn-primary" onClick={() => setEditar(true)}>Editar Perfil</button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Perfil;
