import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyClXPE1w54-mnCJHmXMfE_bQ1b2XuMaYts",
  authDomain: "pcdoc-a5dc6.firebaseapp.com",
  databaseURL: "https://pcdoc-a5dc6-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "pcdoc-a5dc6",
  storageBucket: "pcdoc-a5dc6.firebasestorage.app",
  messagingSenderId: "179935901081",
  appId: "1:179935901081:web:54cf4a7b0d52f3a1410f08"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

let allComputers = {};
let currentPC = null;
let currentCompanyId = null;
let originalTopRowHTML = "";
let originalLowerRowHTML = "";

document.addEventListener("DOMContentLoaded", () => {
  const currentUserJSON = localStorage.getItem("currentUser");
  if (!currentUserJSON) {
    alert("Sessão expirada.");
    window.location.href = "../../login/login.html";
    return;
  }

  let currentUser;
  try {
    currentUser = JSON.parse(currentUserJSON);
  } catch (e) {
    localStorage.removeItem("currentUser");
    window.location.href = "../../login/login.html";
    return;
  }

  const nameSpan = document.querySelector(".user-profile > span");
  const avatarInitials = document.querySelector(".avatar-initials");
  const realName = currentUser.name || currentUser.username || "Utilizador";
  if (nameSpan) nameSpan.textContent = realName;
  if (avatarInitials) avatarInitials.textContent = realName.charAt(0).toUpperCase();

  currentCompanyId = currentUser.id_company;
  const companyRef = ref(db, `companies/${currentCompanyId}`);

  onValue(companyRef, (snapshot) => {
    const company = snapshot.val();
    if (!company || !company.computers || Object.keys(company.computers).length === 0) {
      document.querySelector(".dashboard").innerHTML = "<h2 style='text-align:center;padding:60px;color:#6b7280;'>Nenhum PC conectado à empresa.</h2>";
      return;
    }

    allComputers = company.computers;

    if (!originalTopRowHTML) {
      originalTopRowHTML = document.querySelector(".top-row-grid").innerHTML;
      originalLowerRowHTML = document.querySelector(".lower-row").innerHTML;
    }

    setupSearchBar();
    showDefaultPC();
  });
});

// Search bar
function setupSearchBar() {
  const searchInput = document.querySelector(".search-bar input");
  if (!searchInput) return;

  searchInput.placeholder = "Procurar PC por nome ou ID...";
  searchInput.value = "";

  searchInput.addEventListener("input", () => {
    const query = searchInput.value.trim().toLowerCase();

    if (query === "") {
      showDefaultPC();
      return;
    }

    const foundPC = Object.values(allComputers).find(pc => {
      const name = (pc.name || "").toLowerCase();
      const id = (pc.id_computer || "").toLowerCase();
      return name.includes(query) || id.includes(query);
    });

    if (foundPC) {
      currentPC = foundPC;
      renderDashboard(foundPC);
    } else {
      showNotFoundMessage();
    }
  });
}

function showDefaultPC() {
  const pcIds = Object.keys(allComputers);
  const defaultPC = allComputers[pcIds[0]];
  currentPC = defaultPC;
  renderDashboard(defaultPC);
}

function showNotFoundMessage() {
  document.querySelector(".dashboard-title").textContent = "PC não encontrado";

  // Atualiza device-name e status
  const deviceNameEl = document.querySelector(".memory-chart .device-name");
  if (deviceNameEl) deviceNameEl.textContent = "—";
  document.querySelector(".status-online").textContent = "—";
  document.querySelector(".plug-icon").style.borderColor = "#9ca3af";

  document.querySelector(".top-row-grid").innerHTML = `
    <div style="grid-column:1/-1;text-align:center;padding:80px 20px;color:#6b7280;">
      <p style="font-size:1.3rem;margin-bottom:12px;font-weight:500;">Nenhum PC encontrado</p>
      <p style="font-size:0.95rem;color:#9ca3af;">Tenta procurar por nome ou ID</p>
    </div>
  `;
  document.querySelector(".lower-row").innerHTML = "";
}

// Render Dashboard
function renderDashboard(pc) {
  currentPC = pc;

  const displayName = pc.name || pc.id_computer || "PC Desconhecido";

  // Titulo
  document.querySelector(".dashboard-title").textContent = `Dashboard - ${displayName}`;

  // Substitui o HTML
  document.querySelector(".top-row-grid").innerHTML = originalTopRowHTML;
  document.querySelector(".lower-row").innerHTML = originalLowerRowHTML;

  // Nome do PC
  const deviceNameEl = document.querySelector(".memory-chart .device-name");
  if (deviceNameEl) {
    deviceNameEl.textContent = displayName;
  }

  // Status
  const isOnline = pc.status === "online";
  document.querySelector(".status-online").textContent = isOnline ? "Online • Em tempo real" : "Offline";
  document.querySelector(".plug-icon").style.borderColor = isOnline ? "#10b981" : "#ef4444";

  // Gráficos
  if (pc.ram) renderDualBarChart(".memory-chart .dual-bar-chart", pc.ram.data || {}, pc.ram.usage || 0, 12);
  if (pc.cpu) renderDualBarChart(".cpu-chart .dual-bar-chart", pc.cpu.data || {}, pc.cpu.usage || 0, 9);
  if (pc.gpus && pc.gpus[0]) renderLineChart(".gpu-chart .line-chart svg", pc.gpus[0].data || {});
  renderDisks(pc.disks || []);

  // Reports
  setupReportButtons(pc, displayName);
}

// Reports
function setupReportButtons(pc, displayName) {
  const downloadJSON = (data, filename) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Memory
  document.querySelector(".memory-chart .btn-outline")?.replaceWith(document.querySelector(".memory-chart .btn-outline").cloneNode(true));
  document.querySelector(".memory-chart .btn-outline")?.addEventListener("click", () => {
    const report = {
      device: displayName,
      component: "RAM",
      capacity_GB: pc.ram?.capacity,
      current_usage_percent: pc.ram?.usage,
      current_usage_GB: pc.ram ? ((pc.ram.usage / 100) * pc.ram.capacity).toFixed(2) : null,
      historical_data: pc.ram?.data || {}
    };
    downloadJSON(report, `${displayName}-RAM-Report.json`);
  });

  // CPU
  document.querySelector(".cpu-chart .btn-outline")?.replaceWith(document.querySelector(".cpu-chart .btn-outline").cloneNode(true));
  document.querySelector(".cpu-chart .btn-outline")?.addEventListener("click", () => {
    const report = { device: displayName, component: "CPU", model: pc.cpu?.model || "Desconhecido", current_usage_percent: pc.cpu?.usage, historical_data: pc.cpu?.data || {} };
    downloadJSON(report, `${displayName}-CPU-Report.json`);
  });

  // GPU
  document.querySelector(".gpu-chart .btn-outline")?.replaceWith(document.querySelector(".gpu-chart .btn-outline").cloneNode(true));
  document.querySelector(".gpu-chart .btn-outline")?.addEventListener("click", () => {
    const gpu = pc.gpus?.[0] || {};
    const report = { device: displayName, component: "GPU", model: gpu.model || "Desconhecido", current_usage_percent: gpu.usage, historical_data: gpu.data || {} };
    downloadJSON(report, `${displayName}-GPU-Report.json`);
  });

  // Discos
  document.querySelector(".disks-card .btn-outline")?.replaceWith(document.querySelector(".disks-card .btn-outline").cloneNode(true));
  document.querySelector(".disks-card .btn-outline")?.addEventListener("click", () => {
    const disksReport = (pc.disks || []).map(d => ({
      name: d.name || "Disco",
      capacity_GB: d.capacity,
      used_GB: ((d.usage / 100) * d.capacity).toFixed(2),
      usage_percent: d.usage,
      historical_data: d.data || {}
    }));
    const report = { device: displayName, component: "Discos", total_disks: disksReport.length, disks: disksReport };
    downloadJSON(report, `${displayName}-Discos-Report.json`);
  });
}

// Graficos
function renderDualBarChart(containerSelector, dataObj, currentUsage, maxBars = 12) {
  const container = document.querySelector(containerSelector);
  if (!container) return;

  const entries = Object.entries(dataObj || {}).sort(([a], [b]) => a.localeCompare(b)).slice(-maxBars);
  let values = entries.length > 0 ? entries.map(([, v]) => parseFloat(v) || 0) : Array(maxBars).fill(50);
  while (values.length < maxBars) values.unshift(values[0] || 50);

  container.innerHTML = "";
  values.forEach((value, i) => {
    const prev = i > 0 ? values[i - 1] : value;
    const group = document.createElement("div");
    group.className = "bar-group";
    group.innerHTML = `
      <div class="bar light" style="height: ${prev}%"></div>
      <div class="bar dark" style="height: ${value}%"></div>
    `;
    container.appendChild(group);
  });
}

function renderLineChart(svgSelector, dataObj) {
  const svg = document.querySelector(svgSelector);
  if (!svg) return;

  const entries = Object.entries(dataObj || {}).sort(([a], [b]) => a.localeCompare(b)).slice(-6);
  const values = entries.length > 0 ? entries.map(([, v]) => parseFloat(v) || 0) : [30, 45, 60, 40, 75, 55];

  const points = values.map((v, i) => {
    const x = (300 / (values.length - 1)) * i;
    const y = 120 - (v / 100) * 120;
    return `${x},${y}`;
  }).join(" ");

  let polyline = svg.querySelector("polyline");
  if (!polyline) {
    polyline = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
    polyline.setAttribute("fill", "none");
    polyline.setAttribute("stroke", "#4f46e5");
    polyline.setAttribute("stroke-width", "3");
    polyline.setAttribute("stroke-linecap", "round");
    polyline.setAttribute("stroke-linejoin", "round");
    svg.appendChild(polyline);
  }
  polyline.setAttribute("points", points);
}

function renderDisks(disks) {
  const container = document.querySelector(".disks-card");
  container.innerHTML = `
    <div class="card-header-info" style="margin-bottom:12px;justify-content:space-between;align-items:center;">
      <h3 class="chart-title">Discos</h3>
      <button class="btn-outline">View Report</button>
    </div>
    <p class="chart-desc">Armazenamento disponível por unidade.</p>
  `;

  disks.forEach(disk => {
    const usedGB = ((disk.usage / 100) * disk.capacity).toFixed(1);
    const percent = Math.round(disk.usage || 0);

    const div = document.createElement("div");
    div.className = "disk-item-compact";
    div.innerHTML = `
      <div class="disk-info">
        <span class="disk-name">${disk.name || "Disco"}</span>
        <span class="disk-usage-text">${usedGB} GB <span class="light">/ ${disk.capacity} GB</span></span>
      </div>
      <div class="disk-progress"><div class="disk-progress-fill" style="width:${percent}%"></div></div>
      <span class="disk-percent">${percent}%</span>
    `;
    container.appendChild(div);
  });
}