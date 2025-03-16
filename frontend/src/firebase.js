// Importa Firebase y Realtime Database
import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue } from "firebase/database";

// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAaraOj2Pnz4GvW-2jO-llT6JI-WB_ZBOk",
  authDomain: "iotprueba-fc74f.firebaseapp.com",
  databaseURL: "https://iotprueba-fc74f-default-rtdb.firebaseio.com",
  projectId: "iotprueba-fc74f",
  storageBucket: "iotprueba-fc74f.appspot.com", // Corregido
  messagingSenderId: "439114214471",
  appId: "1:439114214471:web:1023a7acb97860d7b35562",
  measurementId: "G-8Z57SW38EQ"
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app); // Agregado para usar Realtime Database

// Exporta la base de datos y métodos para leer datos
export { database, ref, onValue };
