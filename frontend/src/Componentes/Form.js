import React, { useState } from "react";
import InputField from "./InputFields";
import SelectField from "./SelectField";
import Submit_Button from "./SubmitButton";
import axios from "axios";

function Formulario({ closeModal, onLoginSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    email: "",
    birthDate: "",
    birthPlace: "",
    gender: "",
    civilStatus: "",
    password: ""
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.email.trim()) {
      newErrors.email = "El email es requerido.";
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = "El email no es válido.";
    }
    if (!formData.password.trim()) {
      newErrors.password = "La contraseña es requerida.";
    }

    if (!isLogin) {
      if (!formData.name.trim()) newErrors.name = "El nombre es requerido.";
      if (!formData.age || formData.age <= 0) newErrors.age = "Edad inválida.";
      if (!formData.birthDate.trim()) newErrors.birthDate = "Fecha requerida.";
      if (!formData.birthPlace.trim()) newErrors.birthPlace = "Lugar requerido.";
      if (!formData.gender.trim()) newErrors.gender = "Género requerido.";
      if (!formData.civilStatus.trim()) newErrors.civilStatus = "Estado civil requerido.";
    }
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validate();
    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
        try {
            if (isLogin) {
                // Enviar datos de inicio de sesión
                const response = await axios.post("https://medisen2-pj7q.vercel.app/api/login", {
                    email: formData.email,
                    password: formData.password
                });

                if (response.status === 200 && response.data.success) {
                    alert(response.data.message || "Credenciales incorrectas");
                    onLoginSuccess(response.data.user); // ✅ Llamada para actualizar el estado en App.js
                } else {
                   alert(response.data.message || "Credenciales incorrectas");
                }
            } else {
                // Enviar datos de registro
                await axios.post("https://medisen2-pj7q.vercel.app/api/registrar", formData);
                alert("Registro exitoso. Ahora puedes iniciar sesión.");
                setIsLogin(true); // Cambiar a formulario de login
            }
        } catch (error) {
            console.error("Error en la autenticación:", error);
            alert("Hubo un error, por favor intenta de nuevo.");
        }
    }
};

  return (
    <div style={styles.modalOverlay}>
      <div style={styles.modal}>
        <h2 style={styles.title}>{isLogin ? "Iniciar Sesión" : "Registro"}</h2>
        <form onSubmit={handleSubmit} style={styles.form}>
          {!isLogin && (
            <>
              <InputField label="Nombre" name="name" type="text" value={formData.name} onChange={handleChange} />
              {errors.name && <p style={styles.error}>{errors.name}</p>}
              <InputField label="Edad" name="age" type="number" value={formData.age} onChange={handleChange} />
              {errors.age && <p style={styles.error}>{errors.age}</p>}
              <InputField label="Fecha de Nacimiento" name="birthDate" type="date" value={formData.birthDate} onChange={handleChange} />
              {errors.birthDate && <p style={styles.error}>{errors.birthDate}</p>}
              <InputField label="Entidad de Nacimiento" name="birthPlace" type="text" value={formData.birthPlace} onChange={handleChange} />
              {errors.birthPlace && <p style={styles.error}>{errors.birthPlace}</p>}
              <SelectField label="Género" name="gender" options={["Masculino", "Femenino", "Otro"]} value={formData.gender} onChange={handleChange} />
              {errors.gender && <p style={styles.error}>{errors.gender}</p>}
              <SelectField label="Estado Civil" name="civilStatus" options={["Soltero/a", "Casado/a", "Divorciado/a", "Viudo/a"]} value={formData.civilStatus} onChange={handleChange} />
              {errors.civilStatus && <p style={styles.error}>{errors.civilStatus}</p>}
            </>
          )}

          <InputField label="Correo Electrónico" name="email" type="email" value={formData.email} onChange={handleChange} />
          {errors.email && <p style={styles.error}>{errors.email}</p>}
          <InputField label="Contraseña" name="password" type="password" value={formData.password} onChange={handleChange} />
          {errors.password && <p style={styles.error}>{errors.password}</p>}

          <Submit_Button text={isLogin ? "Iniciar Sesión" : "Registrarse"} />
        </form>

        <button onClick={() => setIsLogin(!isLogin)} style={styles.toggleButton}>
          {isLogin ? "Crear cuenta" : "Iniciar sesión"}
        </button>
        <button style={styles.closeButton} onClick={closeModal}>X</button> 
      </div>
    </div>
  );
}

const styles = {
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000
  },
  modal: {
    backgroundColor: "white",
    padding: "30px",
    borderRadius: "10px",
    width: "400px",
    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
  },
  title: {
    textAlign: "center",
    color: "#333",
  },
  form: {
    display: "flex",
    flexDirection: "column",
  },
  error: {
    color: "red",
    fontSize: "12px",
    marginTop: "5px",
  },
  toggleButton: {
    marginTop: "10px",
    backgroundColor: "#28a745",
    color: "white",
    padding: "10px",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
  },
  closeButton: {
    marginTop: "10px",
    backgroundColor: "#dc3545",
    color: "white",
    padding: "10px",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
  },
};

export default Formulario;
