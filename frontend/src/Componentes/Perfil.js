import React from "react";

const Perfil = ({ userData }) => {
    return (
        <div className="container mt-4">
            <h3 className="text-center">Perfil de Usuario</h3>
            <div className="card">
                <div className="card-body">
                    <h5 className="card-title">Información Personal</h5>
                    <p className="card-text"><strong>Nombre:</strong> {userData.name}</p>
                    <p className="card-text"><strong>Email:</strong> {userData.email}</p>
                    <p className="card-text"><strong>Edad:</strong> {userData.age}</p>
                    <p className="card-text"><strong>Género:</strong> {userData.gender}</p>
                    <p className="card-text">
                        <strong>Fecha de Nacimiento:</strong> {new Date(userData.birthDate).toLocaleDateString()}
                    </p>
                    <p className="card-text"><strong>Lugar de Nacimiento:</strong> {userData.birthPlace}</p>
                    <p className="card-text"><strong>Estado Civil:</strong> {userData.civilStatus}</p>
                </div>
            </div>
        </div>
    );
};

export default Perfil;
