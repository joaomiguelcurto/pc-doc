// Inicio da config da firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  getDatabase,
  ref,
  push,
  set,
  get,
  child,
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
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
// Fim da config da firebase

// DOM
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const confirmPasswordInput = document.getElementById("confirm-password");
const companyNameInput = document.getElementById("company-name");
const registerButton = document.querySelector("button[type='submit']");
const roleButtons = document.querySelectorAll(".role-btn");
const companyField = document.querySelector(".company-field");
const form = document.querySelector("form");
let selectedRole = "user"; // default

// Alterar categoria da conta
roleButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    roleButtons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    selectedRole = btn.dataset.role;

    // Mostrar / Esconder caixa de texto para nome da empresa
    if (selectedRole === "company") {
      companyField.style.display = "block";
    } else {
      companyField.style.display = "none";
      companyNameInput.value = "";
    }
    updateButtonState();
  });
});

// Esconder / Mostrar password
document.querySelectorAll(".toggle-password").forEach((toggle) => {
  toggle.addEventListener("click", () => {
    const input = toggle.parentElement.querySelector("input");
    const type = input.type === "password" ? "text" : "password";
    input.type = type;
    toggle.textContent = type === "password" ? "Hide" : "Show";
  });
});

// Estado do botao
const updateButtonState = () => {
  const username = usernameInput.value.trim();
  const password = passwordInput.value;
  const confirm = confirmPasswordInput.value;

  // Apenas se empresa estiver selecionada
  const companyName =
    selectedRole === "company" ? companyNameInput?.value.trim() || "" : "test"; // Ter algum valor

  const isValid =
    username.length >= 3 &&
    password.length >= 6 &&
    password === confirm &&
    companyName.length >= 2;

  registerButton.className = isValid
    ? "register-btn-enabled"
    : "register-btn-disabled";
  registerButton.disabled = !isValid;
};

[usernameInput, passwordInput, confirmPasswordInput, companyNameInput].forEach(
  (input) => input?.addEventListener("input", updateButtonState)
);

// Submit
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  registerButton.textContent = "Creating...";
  registerButton.disabled = true;

  const username = usernameInput.value.trim();
  const password = passwordInput.value;
  const companyName = companyNameInput?.value.trim() || "";

  try {
    const dbRef = ref(database);

    // Ve se o username já existe
    const [usersSnap, companiesSnap] = await Promise.all([
      get(child(dbRef, "users")),
      get(child(dbRef, "companies")),
    ]);

    const users = usersSnap.val() || {};
    const companies = companiesSnap.val() || {};

    const usernameExists = Object.values({ ...users, ...companies }).some(
      (u) => u.username === username
    );

    if (usernameExists) {
      alert("This username is already taken.");
      resetButton();
      return;
    }

    if (selectedRole === "company") {
      const newCompanyRef = push(child(dbRef, "companies"));
      const companyId = newCompanyRef.key;

      await set(newCompanyRef, {
        id_company: companyId,
        name: companyName,
        username: username,
        password: password,
        creation_date: new Date().toISOString(),
        confirm_connect: false,
        connection_code: Math.random()
          .toString(36)
          .substring(2, 8)
          .toUpperCase(),
        last_update: new Date().toISOString(),
      });

      alert(`Company "${companyName}" created successfully!`);
      localStorage.setItem(
        "currentUser",
        JSON.stringify({
          uid: companyId,
          id_user: companyId,
          name: companyName,
          username: username,
          id_company: companyId,
          isCompanyAdmin: true,
        })
      );
    } else {
      // Precisa de pelo menos 1 empresa
      if (Object.keys(companies).length === 0) {
        alert("No company exists yet. Please register a company first.");
        resetButton();
        return;
      }

      const companyId = Object.keys(companies)[0]; // Primeira empresa

      const newUserRef = push(child(dbRef, "users"));
      await set(newUserRef, {
        id_user: newUserRef.key,
        name: username.charAt(0).toUpperCase() + username.slice(1),
        email_address: `${username}@${companies[companyId].name
          .toLowerCase()
          .replace(/\s+/g, "")}.local`,
        username: username,
        password: password,
        status: "active",
        creation_date: new Date().toISOString(),
        id_company: companyId,
      });

      alert("User account created successfully!");
      localStorage.setItem(
        "currentUser",
        JSON.stringify({
          uid: newUserRef.key,
          id_user: newUserRef.key,
          name: username.charAt(0).toUpperCase() + username.slice(1),
          username: username,
          id_company: companyId,
          isCompanyAdmin: false,
        })
      );
    }

    window.location.href = "../dashboard/dashboard.html";
  } catch (err) {
    console.error(err);
    alert("Error creating account. Check console.");
    resetButton();
  }
});

function resetButton() {
  registerButton.textContent = "Create account";
  updateButtonState();
}

updateButtonState();
