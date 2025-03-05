import React from "react"; 

//Se declara la funcion que es un componente funcional de react 
//Tiene props desestructuradas
//label: texto que mostrara como etiqueta encima del input
//name: nombre del campo 
//value: valor actual del campo (vilculado al estado)
//onChange: funcion que se ejecutara cada vez que el valor del input cambie
function InputField({label, name, type, value, placeHolder,onChange}){
    return (//retorno del componente
        //contenedor
        //el style utiliza un ,marginbottom para darle un margen inferior al contenedor
        <div style={{marginBottom:"15px"}}>
            <label 
                style={{
                display:"block",
                fontWeight:"bold"}}
            >
                {label} 
            </label>
            <input 
                type={type} //Define el tipo de input 
                name={name} //Asocia el input a un nombre en el estado del formulario
                value={value} //valor controlado que proviene de formData o similar
                placeholder={placeHolder}
                onChange={onChange} // Evento onChange para manejar cambios
                style={{
                    padding:"10px",
                    width:"100%",
                    border:"1px solid #ccc",
                    borderRadius:"5px"
                }}
            >
            
            </input>
        </div>
    )

};

export default InputField;//exportacion del componente para poder ser utilizado en otros archivos