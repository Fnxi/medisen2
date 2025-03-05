import React from 'react';
 
    function SelectField({ label, name, options, value, onChange }) {
    return (
        <div style={{ marginBottom: '15px' }}>
        <label
            style={{
            display: 'block',
            fontWeight: 'bold',
            }}
        >
            {label}
        </label>
        <select
            name={name}
            value={value}
            onChange={onChange}
            style={{
            padding: '10px',
            width: '100%',
            border: '1px solid #ccc',
            borderRadius: '5px',
            }}
        >
            <option value="">Selecciona una opción</option>
            {options.map((option, index) => (
            <option key={index} value={option}>
                {option}
            </option>
            ))}
        </select>
        </div>
    );
    }

export default SelectField;
