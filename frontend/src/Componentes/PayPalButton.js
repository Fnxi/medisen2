import React, { useEffect } from "react";
import axios from "axios";

const PayPalButton = ({ total, carrito, userData }) => {
    useEffect(() => {
        const script = document.createElement("script");
        script.src = `https://www.paypal.com/sdk/js?client-id=AePHBK6BCla72PG3DFdwTKa7qBNpFm8UwGG6tymRWLlUcShUZmAqpNMeB5S_ejl7HAALojtNHd4U834_&currency=MXN`;
        script.async = true;
        document.body.appendChild(script);

        script.onload = () => {
            window.paypal.Buttons({
                createOrder: function (data, actions) {
                    return actions.order.create({
                        purchase_units: [{
                            amount: {
                                value: total,
                                currency_code: "MXN"
                            }
                        }]
                    });
                },
                onApprove: function (data, actions) {
                    return actions.order.capture().then(function (details) {
                        // Datos que queremos guardar en la base de datos
                        const compraData = {
                            id_usuario: userData.id,
                            nombre_usuario: userData.nombre, // Asegúrate de que userData tenga este campo
                            total: total,
                            detalles: JSON.stringify(carrito) // Guardamos los detalles del carrito como JSON
                        };

                        // Enviar los datos al backend para guardar en la base de datos
                        axios.post("https://medisen2-pj7q.vercel.app/api/guardar-compra", compraData)
                            .then(response => {
                                if (response.data.success) {
                                    alert("Pago completado y compra registrada.");
                                    // Aquí puedes redirigir al usuario o mostrar un mensaje de éxito
                                } else {
                                    alert("Error al registrar la compra.");
                                }
                            })
                            .catch(error => {
                                console.error("Error al guardar la compra:", error);
                                alert("Error al registrar la compra.");
                            });
                    });
                }
            }).render("#paypal-button-container");
        };

        return () => {
            document.body.removeChild(script);
        };
    }, [total, carrito, userData]);

    return <div id="paypal-button-container"></div>;
};

export default PayPalButton;
