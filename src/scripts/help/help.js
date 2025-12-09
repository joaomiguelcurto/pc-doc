// Help.js

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