
// ================================================================================
//  Para aparecer o nome do User e a sua inicial no canto superior direito do site
// ================================================================================

document.addEventListener("DOMContentLoaded", () => {
  // Verifica se existe sessão ativa
  const currentUserJSON = localStorage.getItem("currentUser");
  if (!currentUserJSON) {
    alert("Sessão expirada.");
    window.location.href = "../../login/login.html";
    return;
  }

  let user;
  try {
    user = JSON.parse(currentUserJSON);
  } catch (e) {
    console.error("Erro ao ler dados do utilizador", e);
    localStorage.removeItem("currentUser");
    window.location.href = "../../login/login.html";
    return;
  }

  // Nome real do utilizador (pode vir de user.name ou user.username)
  const realName = user.name || user.username || "Utilizador";
  const firstLetter = realName.charAt(0).toUpperCase();

  // Atualiza o nome ao lado do avatar
  const nameSpan = document.querySelector(".user-profile > span");
  // pode ser span ou outro elemento
  if (nameSpan) {
    nameSpan.textContent = realName;
  }

  // Atualiza a inicial dentro do círculo do avatar
  const avatarInitials = document.querySelector(".avatar-initials");
  if (avatarInitials) {
    avatarInitials.textContent = firstLetter;
  }
});

// ==========================
//  Adicionar novo computador
// ==========================

const addPcBtn = document.getElementById("openAddModal");
const overlay = document.getElementById("addPcOverlay");
const cancelBtn = document.getElementById("cancelAdd");
const confirmBtn = document.getElementById("confirmAdd");
const pcIdInput = overlay.querySelector("input");

// Abrir o modal
addPcBtn.addEventListener("click", () => {
  overlay.classList.add("active");
  pcIdInput.value = "";
  pcIdInput.focus();
});

// Fechar com o botão Cancelar
cancelBtn.addEventListener("click", () => {
  overlay.classList.remove("active");
});

// Fechar clicando fora do modal
overlay.addEventListener("click", (e) => {
  if (e.target === overlay) {
    overlay.classList.remove("active");
  }
});

// Fechar com tecla ESC
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && overlay.classList.contains("active")) {
    overlay.classList.remove("active");
  }
});

// Quando clicar em "Yes, Confirm" (podes depois ligar isto ao Firebase)
confirmBtn.addEventListener("click", () => {
  const code = pcIdInput.value.trim();

  if (code === "") {
    alert("Por favor insere o código do PC.");
    return;
  }

  if (code.length < 4) {
    alert("O código parece demasiado curto. Verifica o código exibido no PC.");
    return;
  }

  // Aqui irás mais tarde validar o código no Firebase
  // Por agora mostramos apenas uma mensagem de sucesso e fechamos
  alert(`PC com o código "${code}" adicionado com sucesso!`);
  overlay.classList.remove("active");
});

// ========================
//  Disconectar PC
// ========================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  getDatabase,
  ref,
  remove,
  get,
  child
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-database.js";

// Configuração Firebase 
const firebaseConfig = {
  apiKey: "AIzaSyClXPE1w54-mnCJHmXMfE_bQ1b2XuMaYts",
  authDomain: "pcdoc-a5dc6.firebaseapp.com",
  databaseURL: "https://pcdoc-a5dc6-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "pcdoc-a5dc6",
  storageBucket: "pcdoc-a5dc6.firebasestorage.app",
  messagingSenderId: "179935901081",
  appId: "1:179935901081:web:54cf4a7b0d52f3a1410f08",
};

const app = initializeApp(firebaseConfig, "manage-menu"); 
const database = getDatabase(app);

// Função para desconectar um PC
async function disconnectPC(pcName, disconnectBtn) {
  if (!confirm(`Tem a certeza que quer desconectar o PC "${pcName}"?\nEsta ação não pode ser desfeita.`)) {
    return;
  }

  // Mudar botão para loading
  const originalText = disconnectBtn.innerHTML;
  disconnectBtn.disabled = true;
  disconnectBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> A desconectar...`;

  try {
    const userJSON = localStorage.getItem("currentUser");
    const user = JSON.parse(userJSON);
    const isCompanyAdmin = user.isCompanyAdmin === true;

    const basePath = isCompanyAdmin ? `companies/${user.uid}/pcs` : `users/${user.uid}/pcs`;

    // Procurar o PC pelo nome 
    const pcsSnapshot = await get(ref(database, basePath));
    let pcKeyToDelete = null;

    if (pcsSnapshot.exists()) {
      pcsSnapshot.forEach((childSnapshot) => {
        const pcData = childSnapshot.val();
        if (pcData.name === pcName || pcData.pcName === pcName) {
          pcKeyToDelete = childSnapshot.key;
        }
      });
    }

    if (!pcKeyToDelete) {
      alert("PC não encontrado na base de dados.");
      return;
    }

    // Remover da base de dados
    await remove(ref(database, `${basePath}/${pcKeyToDelete}`));

    // Remover também da tabela global de PCs conectados
    await remove(ref(database, `connected_pcs/${pcKeyToDelete}`));

    // Remover o cartão da interface
    const pcCard = disconnectBtn.closest(".pc-card");
    if (pcCard) {
      pcCard.style.transition = "all 0.4s ease";
      pcCard.style.opacity = "0";
      pcCard.style.transform = "translateY(20px)";
      setTimeout(() => pcCard.remove(), 400);
    }

    alert(`PC "${pcName}" foi desconectado com sucesso.`);

  } catch (error) {
    console.error("Erro ao desconectar PC:", error);
    alert("Erro ao desconectar o PC. Tenta novamente.");
  } finally {
    // Restaurar botão apenas se o elemento ainda existir
    if (disconnectBtn.isConnected) {
      disconnectBtn.disabled = false;
      disconnectBtn.innerHTML = originalText;
    }
  }
}

// Adicionar evento a TODOS os botões "Disconnect PC"
document.querySelectorAll(".disconnect-btn").forEach(btn => {
  btn.addEventListener("click", function () {
    const pcCard = this.closest(".pc-card");
    const pcNameElement = pcCard.querySelector(".pc-name");
    const pcName = pcNameElement ? pcNameElement.textContent.trim() : "PC Desconhecido";

    disconnectPC(pcName, this);
  });
});