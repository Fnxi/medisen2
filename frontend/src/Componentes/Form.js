import React, { useState } from "react";
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import InputField from "./InputFields";
import SelectField from "./SelectField";
import Submit_Button from "./SubmitButton";
import axios from "axios";

function Formulario({ closeModal, onLoginSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    birthDate: "",
    birthPlace: "",
    gender: "",
    civilStatus: "",
    password: ""
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

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
        setIsLoading(true);
        try {
            if (isLogin) {
                const response = await axios.post("https://medisen2-pj7q.vercel.app/api/login", {
                    email: formData.email,
                    password: formData.password
                });

                if (response.data.success) {
                    onLoginSuccess(response.data.user);
                    closeModal();
                } else {
                   alert(response.data.message || "Credenciales incorrectas");
                }
            } else {
                await axios.post("https://medisen2-pj7q.vercel.app/api/registrar", formData);
                alert("Registro exitoso. Ahora puedes iniciar sesión.");
                setIsLogin(true);
            }
        } catch (error) {
            console.error("Error en la autenticación:", error);
            alert(error.response?.data?.message || "Hubo un error, por favor intenta de nuevo.");
        } finally {
            setIsLoading(false);
        }
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setIsLoading(true);
    try {
      const response = await axios.post(
        "https://medisen2-pj7q.vercel.app/api/google-login", 
        { token: credentialResponse.credential }
      );

      if (response.data.success) {
        onLoginSuccess(response.data.user);
        closeModal();
      } else {
        alert(response.data.message || "Error en autenticación con Google");
      }
    } catch (error) {
      console.error("Error Google Login:", error);
      alert("Error al iniciar sesión con Google");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={styles.modalOverlay}>
      <div style={styles.modal}>
        <h2 style={styles.title}>{isLogin ? "Iniciar Sesión" : "Registro"}</h2>
        
        {/* Añadido: Botón de Google */}
        <GoogleOAuthProvider clientId="326746217948-gtj4m7bbops3nu76ouakb1av8kpn14e1.apps.googleusercontent.com">
          <div style={styles.googleButtonContainer}>
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => alert('Error al iniciar con Google')}
              text="continue_with"
              shape="pill"
              size="large"
              width="350"
            />
          </div>
        </GoogleOAuthProvider>

        <div style={styles.divider}>o</div>

        <form onSubmit={handleSubmit} style={styles.form}>
          {!isLogin && (
            <>
              <InputField label="Nombre" name="name" type="text" value={formData.name} onChange={handleChange} />
              {errors.name && <p style={styles.error}>{errors.name}</p>}
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

          <Submit_Button 
            text={isLoading ? (isLogin ? "Iniciando sesión..." : "Registrando...") : (isLogin ? "Iniciar Sesión" : "Registrarse")} 
            disabled={isLoading}
          />
        </form>

        <button 
          onClick={() => setIsLogin(!isLogin)} 
          style={styles.toggleButton}
          disabled={isLoading}
        >
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
    position: "relative"
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
    position: "absolute",
    top: "10px",
    right: "10px",
    backgroundColor: "#dc3545",
    color: "white",
    padding: "10px",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
  },
  googleButtonContainer: {
    display: "flex",
    justifyContent: "center",
    margin: "15px 0"
  },
  divider: {
    textAlign: "center",
    margin: "15px 0",
    color: "#666",
    position: "relative",
    "&::before, &::after": {
      content: '""',
      position: "absolute",
      top: "50%",
      width: "45%",
      height: "1px",
      backgroundColor: "#ddd"
    },
    "&::before": {
      left: 0
    },
    "&::after": {
      right: 0
    }
  }
};

export default Formulario;
