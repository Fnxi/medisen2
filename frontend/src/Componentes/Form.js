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
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        
        // Limpiar error cuando el usuario escribe
        if (errors[name]) {
            setErrors(prev => {
                const newErrors = {...prev};
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    const validate = () => {
        const newErrors = {};
        
        // Validaciones comunes para login y registro
        if (!formData.email.trim()) {
            newErrors.email = "El email es requerido.";
        } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
            newErrors.email = "El email no es válido.";
        }
        
        if (!formData.password.trim()) {
            newErrors.password = "La contraseña es requerida.";
        } else if (formData.password.length < 6) {
            newErrors.password = "La contraseña debe tener al menos 6 caracteres.";
        }

        // Validaciones específicas para registro
        if (!isLogin) {
            if (!formData.name.trim()) {
                newErrors.name = "El nombre es requerido.";
            } else if (formData.name.length < 3) {
                newErrors.name = "El nombre debe tener al menos 3 caracteres.";
            }
            
            if (!formData.age || formData.age <= 0 || formData.age > 120) {
                newErrors.age = "Edad inválida.";
            }
            
            if (!formData.birthDate.trim()) {
                newErrors.birthDate = "Fecha de nacimiento requerida.";
            } else {
                const birthDate = new Date(formData.birthDate);
                const today = new Date();
                if (birthDate >= today) {
                    newErrors.birthDate = "La fecha debe ser en el pasado.";
                }
            }
            
            if (!formData.birthPlace.trim()) {
                newErrors.birthPlace = "Lugar de nacimiento requerido.";
            }
            
            if (!formData.gender.trim()) {
                newErrors.gender = "Género requerido.";
            }
            
            if (!formData.civilStatus.trim()) {
                newErrors.civilStatus = "Estado civil requerido.";
            }
        }
        
        return newErrors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const newErrors = validate();
        setErrors(newErrors);

        if (Object.keys(newErrors).length > 0) {
            return;
        }

        setIsSubmitting(true);

        try {
            if (isLogin) {
                const response = await axios.post("https://medisen2-pj7q.vercel.app/api/login", {
                    email: formData.email,
                    password: formData.password
                });

                if (response.status === 200 && response.data.success) {
                    onLoginSuccess(response.data.user);
                } else {
                    setErrors({
                        general: response.data.message || "Credenciales incorrectas. Por favor, inténtalo de nuevo."
                    });
                }
            } else {
                await axios.post("https://medisen2-pj7q.vercel.app/api/registrar", formData);
                alert("Registro exitoso. Ahora puedes iniciar sesión.");
                setIsLogin(true);
                // Limpiar formulario después de registro exitoso
                setFormData({
                    name: "",
                    age: "",
                    email: "",
                    birthDate: "",
                    birthPlace: "",
                    gender: "",
                    civilStatus: "",
                    password: ""
                });
            }
        } catch (error) {
            console.error("Error en la autenticación:", error);
            if (error.response) {
                if (error.response.status === 400 || error.response.status === 401) {
                    setErrors({
                        general: error.response.data.message || "Credenciales inválidas. Por favor, verifica tus datos."
                    });
                } else if (error.response.status === 409) {
                    setErrors({
                        email: "Este correo electrónico ya está registrado."
                    });
                } else {
                    setErrors({
                        general: "Ocurrió un error inesperado. Por favor, inténtalo más tarde."
                    });
                }
            } else {
                setErrors({
                    general: "Error de conexión. Por favor, verifica tu conexión a internet."
                });
            }
        } finally {
            setIsSubmitting(false);
        }
    };

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
            marginBottom: "20px"
        },
        form: {
            display: "flex",
            flexDirection: "column",
            gap: "15px"
        },
        error: {
            color: "red",
            fontSize: "12px",
            marginTop: "5px",
            marginBottom: "0"
        },
        toggleButton: {
            marginTop: "10px",
            backgroundColor: "transparent",
            color: "#007bff",
            padding: "5px",
            border: "none",
            cursor: "pointer",
            textAlign: "center",
            width: "100%"
        },
        closeButton: {
            position: "absolute",
            top: "10px",
            right: "10px",
            backgroundColor: "transparent",
            color: "#333",
            border: "none",
            fontSize: "20px",
            cursor: "pointer"
        },
        generalError: {
            color: "red",
            textAlign: "center",
            marginBottom: "15px"
        }
    };

    return (
        <div style={styles.modalOverlay}>
            <div style={styles.modal}>
                <button style={styles.closeButton} onClick={closeModal}>×</button>
                <h2 style={styles.title}>{isLogin ? "Iniciar Sesión" : "Registro"}</h2>
                
                {errors.general && <p style={styles.generalError}>{errors.general}</p>}
                
                <form onSubmit={handleSubmit} style={styles.form}>
                    {!isLogin && (
                        <>
                            <InputField 
                                label="Nombre Completo" 
                                name="name" 
                                type="text" 
                                value={formData.name} 
                                onChange={handleChange} 
                                error={errors.name}
                            />
                            <InputField 
                                label="Edad" 
                                name="age" 
                                type="number" 
                                value={formData.age} 
                                onChange={handleChange} 
                                error={errors.age}
                            />
                            <InputField 
                                label="Fecha de Nacimiento" 
                                name="birthDate" 
                                type="date" 
                                value={formData.birthDate} 
                                onChange={handleChange} 
                                error={errors.birthDate}
                            />
                            <InputField 
                                label="Entidad de Nacimiento" 
                                name="birthPlace" 
                                type="text" 
                                value={formData.birthPlace} 
                                onChange={handleChange} 
                                error={errors.birthPlace}
                            />
                            <SelectField 
                                label="Género" 
                                name="gender" 
                                options={["Masculino", "Femenino", "Otro"]} 
                                value={formData.gender} 
                                onChange={handleChange} 
                                error={errors.gender}
                                placeholder="Selecciona tu género"
                            />
                            <SelectField 
                                label="Estado Civil" 
                                name="civilStatus" 
                                options={["Soltero/a", "Casado/a", "Divorciado/a", "Viudo/a"]} 
                                value={formData.civilStatus} 
                                onChange={handleChange} 
                                error={errors.civilStatus}
                                placeholder="Selecciona tu estado civil"
                            />
                        </>
                    )}

                    <InputField 
                        label="Correo Electrónico" 
                        name="email" 
                        type="email" 
                        value={formData.email} 
                        onChange={handleChange} 
                        error={errors.email}
                    />
                    <InputField 
                        label="Contraseña" 
                        name="password" 
                        type="password" 
                        value={formData.password} 
                        onChange={handleChange} 
                        error={errors.password}
                    />

                    <Submit_Button 
                        text={isLogin ? "Iniciar Sesión" : "Registrarse"} 
                        disabled={isSubmitting}
                    />
                </form>

                <button 
                    onClick={() => setIsLogin(!isLogin)} 
                    style={styles.toggleButton}
                    disabled={isSubmitting}
                >
                    {isLogin ? "¿No tienes cuenta? Regístrate aquí" : "¿Ya tienes cuenta? Inicia sesión aquí"}
                </button>
            </div>
        </div>
    );
}

export default Formulario;
