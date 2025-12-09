import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  getDatabase,
  ref,
  get,
  child,
  update,
  query,
  orderByChild,
  equalTo,
  push, // Função para criar um novo nó com ID único
  set,  // Função para salvar dados em um nó específico
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

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
// Inicializa o Firebase e a referência ao Realtime Database

const addUserForm = document.getElementById("addUserForm");
const modalAlert = document.getElementById("modalAlert");
const addUserModal = document.getElementById("addUserModal");
const addUserBtn = document.getElementById("addUserBtn");
const userTableBody = document.getElementById("userTableBody");

const editUserModal = document.getElementById("editUserModal");
const editUserForm = document.getElementById("editUserForm");
const editModalAlert = document.getElementById("editModalAlert");
const editFullNameInput = document.getElementById("editFullName");
const editUsernameInput = document.getElementById("editUsername");
const editStatusSelect = document.getElementById("editStatus");
const editUserIdInput = document.getElementById("editUserId");

// Referência ao botão de Exportação
const exportBtn = document.querySelector(".export-btn");

// Função para exibir alertas no modal de adição de usuário
const showAlert = (message, isError = true) => {
  modalAlert.textContent = message;
  modalAlert.style.backgroundColor = isError ? '#ffdddd' : '#ddffdd';
  modalAlert.style.color = isError ? '#cc0000' : '#006600';
  modalAlert.style.display = 'block';
};

// Função para exibir alertas no modal de edição de usuário
const showEditAlert = (message, isError = true) => {
    editModalAlert.textContent = message;
    editModalAlert.style.backgroundColor = isError ? '#ffdddd' : '#ddffdd';
    editModalAlert.style.color = isError ? '#cc0000' : '#006600';
    editModalAlert.style.display = 'block';
};

// Obtém informações do administrador da empresa logado
const companyAdmin = JSON.parse(localStorage.getItem("currentUser"));
let COMPANY_ID = "";

// Verifica permissões e define o ID da empresa
if (!companyAdmin || !companyAdmin.isCompanyAdmin) {
    alert("Access denied. Only company administrators can manage users.");
    window.location.href = "../login/login.html";
} else {
    COMPANY_ID = companyAdmin.id_company;
    loadCompanyUsers(COMPANY_ID); // Carrega usuários após autenticação
}

// Abre o modal de adição de usuário
if (addUserBtn) {
    addUserBtn.addEventListener("click", () => {
        addUserModal.style.display = "flex";
        modalAlert.style.display = 'none';
        addUserForm.reset();
    });
}

// Fecha o modal de adição ao clicar fora
if (addUserModal) {
    addUserModal.addEventListener("click", (e) => {
        if (e.target.id === "addUserModal") {
            addUserModal.style.display = "none";
            addUserForm.reset();
        }
    });
}

// Função auxiliar para fechar o modal de edição
const closeEditModal = () => {
    editUserModal.style.display = "none";
    editUserForm.reset();
};

// Fecha o modal de edição ao clicar fora
if (editUserModal) {
    editUserModal.addEventListener("click", (e) => {
        if (e.target.id === "editUserModal") {
            closeEditModal();
        }
    });
}

// Abre o modal de edição com os dados do usuário
async function openEditUserModal(userId) {
    try {
        const userSnapshot = await get(child(ref(database, 'users'), userId)); // Busca o usuário pelo ID
        if (!userSnapshot.exists()) {
            alert("User data not found.");
            return;
        }
        const user = userSnapshot.val();

        editUserIdInput.value = userId;
        editFullNameInput.value = user.name;
        editUsernameInput.value = user.username;
        editStatusSelect.value = user.status;
        
        editModalAlert.style.display = 'none';
        editUserModal.style.display = 'flex';
        
    } catch (error) {
        console.error("Error fetching user data for edit:", error);
        alert("Failed to load user data for editing.");
    }
}

// Carrega e exibe os usuários da empresa na tabela (filtrando por id_company)
async function loadCompanyUsers(companyId) {
    if (!userTableBody) return;

    userTableBody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Loading users...</td></tr>';
    
    try {
        const dbRef = ref(database, 'users');
        const usersQuery = query(
            dbRef,
            orderByChild('id_company'), // Cria uma query para filtrar
            equalTo(companyId)
        );

        const snapshot = await get(usersQuery);

        if (snapshot.exists()) {
            userTableBody.innerHTML = '';

            snapshot.forEach((childSnapshot) => {
                const user = childSnapshot.val();
                const userId = childSnapshot.key;
                
                const row = document.createElement('tr');
                row.dataset.userId = userId;

                // Cria a linha da tabela com os dados do usuário e botões de ação
                row.innerHTML = `
                    <td><input type="checkbox" /></td>
                    <td>${user.name}</td>
                    <td>${user.email_address}</td>
                    <td>${user.username}</td>
                    <td><span class="status ${user.status}">${user.status.charAt(0).toUpperCase() + user.status.slice(1)}</span></td>
                    <td>
                        <div class="actions">
                            <button class="action-btn edit" data-user-id="${userId}" title="Edit User">
                                <i class="fa-solid fa-pen-to-square"></i>
                            </button>
                            <button class="action-btn delete" data-user-id="${userId}" title="Delete User">
                                <i class="fa-solid fa-trash"></i>
                            </button>
                        </div>
                    </td>
                `;
                userTableBody.appendChild(row);
            });
        } else {
            userTableBody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No users are currently assigned to this company.</td></tr>';
        }

    } catch (error) {
        console.error("Error loading company users:", error);
        userTableBody.innerHTML = '<tr><td colspan="6" style="color: red; text-align: center;">Failed to load user data.</td></tr>';
    }
}

// Remove o vínculo do usuário com a empresa (soft delete/unassign)
async function deleteUser(userId) {
    if (!confirm("Are you sure you want to remove this user from the company? This action will set the user's status to 'pending' and clear their email address.")) {
        return;
    }

    try {
        const updates = {};
        // Define os campos para desvincular o usuário e mudar o status
        updates[`/users/${userId}/id_company`] = "";
        updates[`/users/${userId}/email_address`] = "";
        updates[`/users/${userId}/status`] = "pending"; 

        await update(ref(database), updates); // Atualiza os dados no Firebase

        alert("User successfully unassigned from the company and set to 'pending' status.");
        
        loadCompanyUsers(COMPANY_ID); // Recarrega a tabela
        

    } catch (error) {
        console.error("Error deleting user:", error);
        alert("Failed to unassign user. Check the console for details.");
    }
}

// Lida com cliques nos botões de Editar e Deletar na tabela
if (userTableBody) {
    userTableBody.addEventListener('click', (e) => {
        const target = e.target.closest('.action-btn');
        if (!target) return;

        const userId = target.dataset.userId;

        if (target.classList.contains('delete')) {
            deleteUser(userId);
        } else if (target.classList.contains('edit')) {
            openEditUserModal(userId);
        }
    });
}

// NOVO USUARIO
addUserForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  modalAlert.style.display = 'none';

  const userName = addUserForm.querySelector("input[name='name']").value.trim();
  const userUsername = addUserForm.querySelector("input[name='username']").value.trim().toLowerCase();
  const userPassword = addUserForm.querySelector("input[name='password']").value;

  if (!userName || !userUsername || !userPassword) {
    showAlert("Please fill in all fields (Name, Username, and Password).");
    return;
  }
  
  if (userPassword.length < 6) {
    showAlert("Password must be at least 6 characters long.");
    return;
  }

  try {
    const dbRef = ref(database);

    // 1. Verifica se o nome de usuário já existe (em users ou companies)
    const [usersSnap, companiesSnap] = await Promise.all([
      get(child(dbRef, "users")),
      get(child(dbRef, "companies")),
    ]);

    const users = usersSnap.val() || {};
    const companies = companiesSnap.val() || {};

    // Verifica a unicidade do username em ambos os nós
    const usernameExists = Object.values({ ...users, ...companies }).some(
      (u) => u.username === userUsername
    );

    if (usernameExists) {
      showAlert(`The username '${userUsername}' is already taken.`);
      return;
    }

    // 2. Obtém detalhes da empresa para gerar email
    const companySnapshot = await get(child(dbRef, `companies/${COMPANY_ID}`));
    if (!companySnapshot.exists()) {
      showAlert("Error: Could not retrieve current company details from the database.");
      return;
    }
    const company = companySnapshot.val();
    // Limpa o nome da empresa para usar no domínio do email
    const companyDomainName = company.name.replace(/\s/g, "").toLowerCase();

    // 3. Cria uma nova referência de usuário com push() para obter um ID único
    const newUserRef = push(child(dbRef, "users"));
    const newUserId = newUserRef.key;
    const newEmail = `${userUsername.toLowerCase()}@${companyDomainName}.local`; 

    // Salva o novo objeto de usuário
    await set(newUserRef, {
      id_user: newUserId,
      name: userName,
      email_address: newEmail,
      username: userUsername,
      password: userPassword, 
      status: "active",
      creation_date: new Date().toISOString(),
      id_company: COMPANY_ID,
    });

    showAlert(`User "${userName}" created and assigned to the company successfully!`, false);
    
    // 4. Recarrega a tabela e fecha o modal
    loadCompanyUsers(COMPANY_ID);
    
    setTimeout(() => {
        addUserModal.style.display = "none";
        addUserForm.reset();
    }, 1500);


  } catch (error) {
    console.error("Error creating and assigning user:", error);
    showAlert("An unexpected error occurred during user creation. Check the console for details.");
  }
});

// EDITAR USUARIO
editUserForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const userId = editUserIdInput.value;
    const newName = editFullNameInput.value.trim();
    const newStatus = editStatusSelect.value;
    
    if (!userId || !newName) {
        showEditAlert("Missing data to perform update.", true);
        return;
    }

    try {
        const updates = {};
        // Prepara o objeto de updates para atualizar o nome e o status
        updates[`/users/${userId}/name`] = newName;
        updates[`/users/${userId}/status`] = newStatus;
        updates[`/users/${userId}/last_update`] = new Date().toISOString(); 

        await update(ref(database), updates);

        showEditAlert(`User "${newName}" updated successfully!`, false);
        
        // Recarrega a tabela e fecha o modal após o sucesso
        setTimeout(() => {
            loadCompanyUsers(COMPANY_ID);
            closeEditModal();
        }, 1500);

    } catch (error) {
        console.error("Error updating user:", error);
        showEditAlert("Failed to save changes. Check the console for details.", true);
    }
});

// EXPORTAÇÃO
async function exportUsersToJson(companyId) {
    try {
        const dbRef = ref(database, 'users');
        const usersQuery = query(
            dbRef,
            orderByChild('id_company'),
            equalTo(companyId)
        );

        const snapshot = await get(usersQuery);
        const usersData = [];

        if (snapshot.exists()) {
            snapshot.forEach((childSnapshot) => {
                const user = childSnapshot.val();
                // Apenas incluir os dados de usuário relevantes para a exportação
                usersData.push(user);
            });
        }
        
        if (usersData.length === 0) {
            alert("No users found to export for this company.");
            return;
        }

        // Converte os dados para string JSON formatada (com identação)
        const jsonString = JSON.stringify(usersData, null, 2);
        
        // Obtém o nome da empresa para o nome do arquivo
        const companySnapshot = await get(child(ref(database), `companies/${companyId}`));
        const companyName = companySnapshot.exists() ? companySnapshot.val().name : "Export";

        // Cria um Blob e um link temporário para iniciar o download do JSON
        const blob = new Blob([jsonString], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `${companyName.replace(/\s/g, "_")}_Users_Export_${new Date().toISOString().slice(0, 10)}.json`;
        
        // Simula o clique para iniciar o download
        document.body.appendChild(a);
        a.click();
        
        // Limpeza dos elementos temporários e URL
        document.body.removeChild(a);
        URL.revokeObjectURL(a.href);

    } catch (error) {
        console.error("Error during JSON export:", error);
        alert("Failed to export users. Check the console for details.");
    }
}

// Adiciona o listener de evento ao botão de Exportar
if (exportBtn) {
    exportBtn.addEventListener('click', () => {
        exportUsersToJson(COMPANY_ID); // Chama a função de exportação
    });
}

// Nome do User e a sua Inicial no canto superior direito do site

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