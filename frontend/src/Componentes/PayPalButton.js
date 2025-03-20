import React, { useEffect } from "react";
import axios from "axios";

const PayPalButton = ({ total, carrito, userData }) => {
    useEffect(() => {
        // Validar que los datos necesarios estén presentes
        if (!total || !carrito || !userData || !userData.id || !userData.name) {
            console.error("Faltan datos necesarios para procesar el pago.");
            return;
        }

        const script = document.createElement("script");
        script.src = `https://www.paypal.com/sdk/js?client-id=AePHBK6BCla72PG3DFdwTKa7qBNpFm8UwGG6tymRWLlUcShUZmAqpNMeB5S_ejl7HAALojtNHd4U834_&currency=MXN`;
        script.async = true;
        document.body.appendChild(script);

        script.onload = () => {
            window.paypal.Buttons({
                createOrder: function (data, actions) {
                    // Formatear el total a 2 decimales
                    const formattedTotal = parseFloat(total).toFixed(2);

                    return actions.order.create({
                        purchase_units: [{
                            amount: {
                                value: formattedTotal,
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
                            nombre_usuario: userData.name,
                            total: total,
                            detalles: JSON.stringify(carrito)
                        };

                        console.log("Datos enviados al backend:", compraData);

                        // Enviar los datos al backend
                        axios.post("https://medisen2-pj7q.vercel.app/api/guardar-compra", compraData)
                            .then(response => {
                                if (response.data.success) {
                                    alert("Pago completado y compra registrada.");
                                } else {
                                    alert("Error al registrar la compra.");
                                }
                            })
                            .catch(error => {
                                console.error("Error al guardar la compra:", error);
                                alert("Error al registrar la compra.");
                            });
                    });
                },
                onError: function (err) {
                    console.error("Error en el proceso de PayPal:", err);
                    alert("Ocurrió un error durante el proceso de pago. Por favor, intenta nuevamente.");
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
