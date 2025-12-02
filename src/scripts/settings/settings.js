// ../scripts/settings/settings.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  getDatabase,
  ref,
  update,
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyClXPE1w54-mnCJHmXMfE_bQ1b2XuMaYts",
  authDomain: "pcdoc-a5dc6.firebaseapp.com",
  databaseURL: "https://pcdoc-a5dc6-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "pcdoc-a5dc6",
  storageBucket: "pcdoc-a5dc6.firebasestorage.app",
  messagingSenderId: "179935901081",
  appId: "1:179935901081:web:54cf4a7b0d52f3a1410f08",
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

document.addEventListener("DOMContentLoaded", async () => {
  const currentUserJSON = localStorage.getItem("currentUser");
  if (!currentUserJSON) {
    alert("Sessão expirada.");
    window.location.href = "../../login/login.html";
    return;
  }

  let user = JSON.parse(currentUserJSON);
  const isCompanyAdmin = user.isCompanyAdmin === true;

  const realName = user.name || user.username || "User";
  const firstLetter = realName.charAt(0).toUpperCase();

  // 1. Atualizar interface com o nome real
  document.querySelector(".user-profile > span")?.setAttribute("data-original", realName);
  document.querySelector(".user-profile > span").textContent = realName;
  document.querySelector(".avatar-initials").textContent = firstLetter;

  const nameInput = document.getElementById("display-name");
  const passInput = document.getElementById("display-password");

  nameInput.value = realName;                     // ← Nome aparece aqui
  passInput.value = "••••••••••";                 // ← Password escondida

  document.querySelector(".settings-header p").textContent = 
    `Manage computers and users for ${realName}`;

  // Atualizar secção de delete
  document.querySelectorAll(".delete-account-section strong, .delete-account-section p")
    .forEach(el => el.innerHTML = el.innerHTML.replace(/Teste|Utilizador/g, realName));

  // 2. Função de edição (nome ou password)
  async function toggleEdit(field) {
    const input = field === "name" ? nameInput : passInput;
    const btn = document.getElementById(field === "name" ? "edit-name-btn" : "edit-password-btn");

    if (input.readOnly) {
      // === MODO EDIÇÃO ===
      input.readOnly = false;
      input.focus();
      btn.innerHTML = '<i class="fa-solid fa-check"></i>';
      btn.style.color = "#4CAF50";

      if (field === "password") {
        input.type = "text";
        input.value = "";
        input.placeholder = "Nova password (mín. 6 caracteres)";
      }
    } else {
      // === GUARDAR ===
      let value = input.value.trim();

      // Validações
      if (field === "name" && value.length < 2) {
        alert("O nome deve ter pelo menos 2 caracteres.");
        return;
      }
      if (field === "password" && value.length < 6) {
        alert("A password deve ter pelo menos 6 caracteres.");
        return;
      }

      btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
      btn.disabled = true;

      try {
        const path = isCompanyAdmin ? `companies/${user.uid}` : `users/${user.uid}`;
        let updates = {};

        if (field === "name") {
          updates.name = value;
          // Atualiza também o campo "username" (o login) se for conta normal
          if (!isCompanyAdmin) updates.username = value.toLowerCase();
        } else {
          updates.password = value;
        }

        await update(ref(database, path), updates);

        // Atualizar localStorage
        if (field === "name") {
          user.name = value;
          if (!isCompanyAdmin) user.username = value.toLowerCase();
        }
        localStorage.setItem("currentUser", JSON.stringify(user));

        // Atualizar interface
        if (field === "name") {
          document.querySelector(".user-profile > span").textContent = value;
          document.querySelector(".avatar-initials").textContent = value.charAt(0).toUpperCase();
          document.querySelector(".settings-header p").textContent = 
            `Manage computers and users for ${value}`;
          nameInput.value = value;
        } else {
          passInput.value = "••••••••••";
          passInput.type = "password";
          alert("Password alterada com sucesso!");
        }

      } catch (err) {
        console.error("Erro ao atualizar:", err);
        alert("Erro ao guardar. Tenta novamente.");
      } finally {
        input.readOnly = true;
        btn.innerHTML = '<i class="fa-regular fa-pen-to-square"></i>';
        btn.style.color = "";
        btn.disabled = false;
      }
    }
  }

  document.getElementById("edit-name-btn").addEventListener("click", () => toggleEdit("name"));
  document.getElementById("edit-password-btn").addEventListener("click", () => toggleEdit("password"));

  async function deleteAccount() {
    if (!confirm("Tem a certeza que quer apagar a conta? Esta ação é irreversível e irá remover todos os seus dados e conexões de PCs.")) {
      return;
    }

    const deleteLink = document.querySelector(".delete-link");
    deleteLink.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> A Apagar...';
    deleteLink.style.pointerEvents = "none";

    try {
      const userPath = isCompanyAdmin ? `companies/${user.uid}` : `users/${user.uid}`;
      const userRef = ref(database, userPath);
      const userPermissionsRef = ref(database, 'user_permissions');

      
      await update(ref(database), { [userPath]: null });

      localStorage.removeItem("currentUser");
      alert("Conta apagada com sucesso.");
      window.location.href = "../authentication/login.html";

    } catch (error) {
      console.error("Erro ao apagar a conta:", error);
      alert("Ocorreu um erro ao tentar apagar a conta. Tente novamente.");
      deleteLink.innerHTML = 'I want to delete my account';
      deleteLink.style.pointerEvents = "auto";
    }
  }

  document.querySelector(".delete-link").addEventListener("click", (e) => {
    e.preventDefault(); 
    deleteAccount();
  });

});
  
