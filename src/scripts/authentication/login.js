// Inicio da config da firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  getDatabase,
  ref,
  child,
  get,
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyClXPE1w54-mnCJHmXMfE_bQ1b2XuMaYts",
  authDomain: "pcdoc-a5dc6.firebaseapp.com",
  databaseURL:
    "https://pcdoc-a5dc6-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "pcdoc-a5dc6",
  storageBucket: "pcdoc-a5dc6.firebasestorage.app",
  messagingSenderId: "179935901081",
  appId: "1:179935901081:web:54cf4a7b0d52f3a1410f08",
  measurementId: "G-Y2NXBRFNP7",
};

// Inicializar firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// Fim da config da firebase

// Elementos
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const loginButton = document.querySelector("button[type='submit']");
const togglePassword = document.querySelector(".toggle-password");
const form = document.querySelector("form");

// Esconder / Mostrar password
togglePassword.addEventListener("click", () => {
  const type = passwordInput.type === "password" ? "text" : "password";
  passwordInput.type = type;
  togglePassword.textContent = type === "password" ? "Show" : "Hide";
});

// Ativar botao quando os campos estiverem validos
const updateButtonState = () => {
  if (usernameInput.value.trim() && passwordInput.value.trim()) {
    loginButton.className = "login-btn-enabled";
    loginButton.disabled = false;
  } else {
    loginButton.className = "login-btn-disabled";
    loginButton.disabled = true;
  }
};

usernameInput.addEventListener("input", updateButtonState);
passwordInput.addEventListener("input", updateButtonState);

// Submit ao form
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const username = usernameInput.value.trim();
  const password = passwordInput.value;

  loginButton.textContent = "Logging in...";
  loginButton.disabled = true;

  try {
    const dbRef = ref(database);

    // Users normais
    const usersSnapshot = await get(child(dbRef, "users"));
    let foundUser = null;
    let userKey = null;
    let isCompanyAdmin = false;

    if (usersSnapshot.exists()) {
      const users = usersSnapshot.val();
      for (const key in users) {
        if (users[key].username === username) {
          foundUser = users[key];
          userKey = key;
          break;
        }
      }
    }

    // 2Companies
    if (!foundUser) {
      const companiesSnapshot = await get(child(dbRef, "companies"));
      if (companiesSnapshot.exists()) {
        const companies = companiesSnapshot.val();
        for (const companyId in companies) {
          const company = companies[companyId];
          if (company.username === username && company.password === password) {
            foundUser = {
              id_user: company.id_company,
              name: company.name,
              username: company.username,
              id_company: company.id_company,
              isCompanyAdmin: true,
            };
            isCompanyAdmin = true;
            break;
          }
        }
      }
    }

    // Validação final
    if (!foundUser) {
      alert("Username or password incorrect.");
      resetButton();
      return;
    }

    if (foundUser.status && foundUser.status !== "active") {
      alert("Your account is deactivated.");
      resetButton();
      return;
    }

    // Successo -> Guardar sessão
    localStorage.setItem(
      "currentUser",
      JSON.stringify({
        uid: userKey || foundUser.id_company,
        id_user: foundUser.id_user || foundUser.id_company,
        name: foundUser.name,
        username: foundUser.username,
        id_company: foundUser.id_company || foundUser.id_company,
        isCompanyAdmin: isCompanyAdmin,
      })
    );

    alert(`Welcome, ${foundUser.name}!`);
    window.location.href = "../dashboard/dashboard.html";
  } catch (err) {
    console.error("Login error:", err);
    alert("Connection error. Check your internet or database rules.");
    resetButton();
  }
});

function resetButton() {
  loginButton.textContent = "Log in";
  updateButtonState();
}

// Estado inicial
updateButtonState();
