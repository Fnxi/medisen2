import React, { useState, useEffect } from "react";
import axios from "axios";
// FormProducto.js
const FormProducto = ({ closeModal, productoEditando, setProductos }) => {
    const [nombre, setNombre] = useState(productoEditando ? productoEditando.nombre : "");
    const [descripcion, setDescripcion] = useState(productoEditando ? productoEditando.descripcion : "");
    const [precio, setPrecio] = useState(productoEditando ? productoEditando.precio : "");
    const [cantidad, setCantidad] = useState(productoEditando ? productoEditando.cantidad : "");

    useEffect(() => {
        if (productoEditando) {
            setNombre(productoEditando.nombre);
            setDescripcion(productoEditando.descripcion);
            setPrecio(productoEditando.precio);
            setCantidad(productoEditando.cantidad);
        }
    }, [productoEditando]); // Cada vez que el producto a editar cambie, actualizamos los campos

    const handleSubmit = (e) => {
        e.preventDefault();
        const data = { nombre, descripcion, precio, cantidad };

        const url = productoEditando 
            ? `https://medisen2-pj7q.vercel.app/api/productos/${productoEditando.id}`
            : 'https://medisen2-pj7q.vercel.app/api/productos';

        const method = productoEditando ? 'put' : 'post';

        axios[method](url, data)
            .then((response) => {
                if (productoEditando) {
                    setProductos(prevProductos => 
                        prevProductos.map(producto =>
                            producto.id === productoEditando.id ? { ...producto, ...data } : producto
                        )
                    );
                } else {
                    setProductos(prevProductos => [...prevProductos, response.data]);
                }
                closeModal();
            })
            .catch(error => {
                console.error("Error:", error);
                alert("Hubo un error al guardar el producto.");
            });
    };

    return (
        <form onSubmit={handleSubmit}>
            <div className="form-group">
                <label>Nombre</label>
                <input 
                    type="text" 
                    className="form-control" 
                    value={nombre} 
                    onChange={(e) => setNombre(e.target.value)} 
                />
            </div>
            <div className="form-group">
                <label>Descripción</label>
                <input 
                    type="text" 
                    className="form-control" 
                    value={descripcion} 
                    onChange={(e) => setDescripcion(e.target.value)} 
                />
            </div>
            <div className="form-group">
                <label>Precio</label>
                <input 
                    type="number" 
                    className="form-control" 
                    value={precio} 
                    onChange={(e) => setPrecio(e.target.value)} 
                />
            </div>
            
            <div className="form-group">
                <label>Cantidad</label>
                <input 
                    type="number" 
                    className="form-control" 
                    value={cantidad} 
                    onChange={(e) => setCantidad(e.target.value)} 
                />
            </div>
            <button type="submit" className="btn btn-primary">Guardar</button>
        </form>
    );
};

export default FormProducto;
