import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getDatabase, ref, get, update } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyClXPE1w54-mnCJHmXMfE_bQ1b2XuMaYts",
  authDomain: "pcdoc-a5dc6.firebaseapp.com",
  databaseURL: "https://pcdoc-a5dc6-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "pcdoc-a5dc6",
  messagingSenderId: "179935901081",
  appId: "1:179935901081:web:54cf4a7b0d52f3a1410f08"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

document.addEventListener("DOMContentLoaded", async () => {
  const userData = localStorage.getItem("currentUser");
  if (!userData) return location.href = "../login/login.html";

  const user = JSON.parse(userData);
  const username = user.username; // ← este é o que usas para entrar

  const nameInput = document.getElementById("display-name");
  const passInput = document.getElementById("display-password");

  nameInput.value = username;
  passInput.value = "carregando...";

  // Atualiza tudo na página
  document.body.innerHTML = document.body.innerHTML.replace(/Utilizador|Renova|Lourenço/g, username);
  document.querySelector(".avatar-initials").textContent = username[0].toUpperCase();

  // Vai buscar a password real
  let caminho = null;
  const companiesSnap = await get(ref(db, "companies"));
  const usersSnap = await get(ref(db, "users"));

  // Procura em companies
  if (companiesSnap.exists()) {
    companiesSnap.forEach(child => {
      if (child.val().username === username) caminho = `companies/${child.key}`;
    });
  }
  // Procura em users
  if (!caminho && usersSnap.exists()) {
    usersSnap.forEach(child => {
      if (child.val().username === username) caminho = `users/${child.key}`;
    });
  }

  if (!caminho) {
    alert("Erro: conta não encontrada.");
    return;
  }

  const passReal = await get(ref(db, caminho + "/password"));
  passInput.value = passReal.val() || "";

  // Função que grava e manda embora
  async function salvarECair(campo, valor) {
    const dados = campo === "name" ? { name: valor, username: valor } : { password: valor };
    await update(ref(db, caminho), dados);
    localStorage.removeItem("currentUser");
    alert("Guardado. Faz login de novo.");
    setTimeout(() => location.href = "../login/login.html", 1500);
  }

  // Botões de editar
  document.getElementById("edit-name-btn").onclick = async () => {
    if (nameInput.readOnly) {
      nameInput.readOnly = false;
      nameInput.focus();
      document.getElementById("edit-name-btn").innerHTML = '<i class="fa-solid fa-check" style="color:green"></i>';
    } else {
      const novo = nameInput.value.trim();
      if (novo && novo !== username && novo.length >= 3) {
        if (confirm("Vais mudar o nome e o username. Tens de fazer login depois. OK?")) {
          await salvarECair("name", novo);
        }
      }
      nameInput.readOnly = true;
      document.getElementById("edit-name-btn").innerHTML = '<i class="fa-regular fa-pen-to-square"></i>';
    }
  };

  document.getElementById("edit-password-btn").onclick = async () => {
    if (passInput.readOnly) {
      passInput.readOnly = false;
      passInput.focus();
      document.getElementById("edit-password-btn").innerHTML = '<i class="fa-solid fa-check" style="color:green"></i>';
    } else {
      const novo = passInput.value;
      if (novo && novo.length >= 4) {
        if (confirm("Vais mudar a password. Tens de fazer login depois. OK?")) {
          await salvarECair("password", novo);
        }
      }
      passInput.readOnly = true;
      document.getElementById("edit-password-btn").innerHTML = '<i class="fa-regular fa-pen-to-square"></i>';
    }
  };
});