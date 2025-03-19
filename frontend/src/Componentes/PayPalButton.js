import React, { useEffect } from "react";

const PayPalButton = ({ total }) => {
    useEffect(() => {
        const script = document.createElement("script");
        script.src = `https://www.paypal.com/sdk/js?client-id=AePHBK6BCla72PG3DFdwTKa7qBNpFm8UwGG6tymRWLlUcShUZmAqpNMeB5S_ejl7HAALojtNHd4U834_&currency=USD`;
        script.async = true;
        document.body.appendChild(script);

        script.onload = () => {
            window.paypal.Buttons({
                createOrder: function (data, actions) {
                    return actions.order.create({
                        purchase_units: [{
                            amount: {
                                value: total
                            }
                        }]
                    });
                },
                onApprove: function (data, actions) {
                    return actions.order.capture().then(function (details) {
                        alert("Pago completado por " + details.payer.name.given_name);
                        // Aquí puedes manejar la lógica después de un pago exitoso
                    });
                }
            }).render("#paypal-button-container");
        };

        return () => {
            document.body.removeChild(script);
        };
    }, [total]);

    return <div id="paypal-button-container"></div>;
};

export default PayPalButton;
