import React from "react";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from "chart.js";

// Registra los componentes necesarios de Chart.js
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const BarChart = ({ data }) => {
    const chartData = {
        labels: data.map((item) => item.title),
        datasets: [
            {
                label: "Ventas",
                data: data.map((item) => item.value),
                backgroundColor: data.map((item) => item.color),
            },
        ],
    };

    const options = {
        responsive: true,
        plugins: {
            legend: {
                position: "top",
            },
            title: {
                display: true,
                text: "Gráfico de Ventas",
            },
        },
    };

    return <Bar data={chartData} options={options} />;
};

export default BarChart;
