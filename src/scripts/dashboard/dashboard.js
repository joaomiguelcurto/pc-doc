// dashboard.js - VERSÃO FINAL COM GRÁFICOS PERFEITOS
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

  const companyId = currentUser.id_company;
  const companyRef = ref(db, `companies/${companyId}`);

  onValue(companyRef, (snapshot) => {
    const company = snapshot.val();
    if (!company || !company.computers || Object.keys(company.computers).length === 0) {
      document.querySelector(".dashboard").innerHTML = "<h2>Nenhum PC conectado à empresa.</h2>";
      return;
    }

    const computers = company.computers;
    const pcIds = Object.keys(computers);
    const firstPcId = pcIds[0];
    const pc = computers[firstPcId];

    renderDashboard(pc);
  });

  function renderDashboard(pc) {
    // Nome do PC
    document.querySelector(".device-name").textContent = pc.name || pc.id_computer;

    // Status
    const isOnline = pc.status === "online";
    document.querySelector(".status-online").textContent = isOnline ? "Online • Em tempo real" : "Offline";
    document.querySelector(".plug-icon").style.borderColor = isOnline ? "#10b981" : "#ef4444";
    document.querySelector(".dot.online").style.backgroundColor = isOnline ? "#10b981" : "#ef4444";

    // === RAM ===
    if (pc.ram) {
      renderDualBarChart(
        ".memory-chart .dual-bar-chart",
        pc.ram.data || {},
        pc.ram.usage || 0,
        12
      );
    }

    // === CPU ===
    if (pc.cpu) {
      renderDualBarChart(
        ".cpu-chart .dual-bar-chart",
        pc.cpu.data || {},
        pc.cpu.usage || 0,
        9
      );
    }

    // === GPU ===
    if (pc.gpus && pc.gpus[0]) {
      renderLineChart(".gpu-chart .line-chart svg", pc.gpus[0].data || {});
    }

    // === Discos ===
    renderDisks(pc.disks || []);
  }

  // Gráfico de barras duplas (RAM e CPU)
  function renderDualBarChart(containerSelector, dataObj, currentUsage, maxBars = 12) {
    const container = document.querySelector(containerSelector);
    if (!container) return;

    const entries = Object.entries(dataObj)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-maxBars);

    const values = entries.map(([, v]) => parseFloat(v) || 0);
    if (values.length === 0) values.push(...Array(maxBars).fill(0));
    if (values.length < maxBars) values.unshift(...Array(maxBars - values.length).fill(values[0] || 50));

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

  // Gráfico de linha da GPU
  function renderLineChart(svgSelector, dataObj) {
    const svg = document.querySelector(svgSelector);
    if (!svg) return;

    const entries = Object.entries(dataObj)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6);

    const values = entries.length > 0
      ? entries.map(([, v]) => parseFloat(v) || 0)
      : [30, 45, 60, 40, 75, 55];

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

  // Discos com barra de progresso
  function renderDisks(disks) {
    const container = document.querySelector(".disks-card");
    container.innerHTML = `
      <h3 class="chart-title">Discos</h3>
      <p class="chart-desc">Armazenamento disponível por unidade.</p>
    `;

    disks.forEach(disk => {
      const used = ((disk.usage / 100) * disk.capacity).toFixed(1);
      const percent = disk.usage || 0;

      const div = document.createElement("div");
      div.className = "disk-item";
      div.innerHTML = `
        <div style="margin-bottom: 8px;">
          <span class="disk-label">${disk.name || "Disco"}</span>
          <span class="disk-value">${used}GB / ${disk.capacity}GB</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${percent}%"></div>
        </div>
      `;
      container.appendChild(div);
    });
  }
});