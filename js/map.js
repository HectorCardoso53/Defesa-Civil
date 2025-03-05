import { initializeApp } from "https://www.gstatic.com/firebasejs/9.21.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.21.0/firebase-auth.js";
import { getFirestore, collection, onSnapshot } from "https://www.gstatic.com/firebasejs/9.21.0/firebase-firestore.js";
import { firebaseConfig } from "../config/firebase_config.js";

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth();

// Elementos do DOM
const yearFilter = document.getElementById("yearFilter");
const monthFilter = document.getElementById("monthFilter");
const applyFilterBtn = document.getElementById("applyFilter");

// Gerar anos dinamicamente a partir do ano atual
const currentYear = new Date().getFullYear();
for (let i = currentYear; i <= currentYear + 5; i++) {
    const option = document.createElement("option");
    option.value = i;
    option.textContent = i;
    yearFilter.appendChild(option);
}

// Define o valor padrão do filtro de ano e mês para o atual
yearFilter.value = currentYear;
monthFilter.value = new Date().getMonth() + 1;

// Inicializa o mapa
const map = L.map("map").setView([-1.7633858, -55.8633922], 16);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap contributors",
    maxZoom: 19,
}).addTo(map);

// Grupo de camadas para os marcadores
const markerGroup = L.layerGroup().addTo(map);

// Armazena a assinatura do Firestore para evitar recargas desnecessárias
let unsubscribe = null;

// Função para carregar os marcadores filtrados
async function loadMarkers(year, month) {
    try {
        if (unsubscribe) {
            unsubscribe(); // Cancela a assinatura anterior
        }

        // Limpar marcadores anteriores
        markerGroup.clearLayers();

        // Buscar ocorrências do Firestore
        unsubscribe = onSnapshot(collection(db, "occurrences"), (snapshot) => {
            snapshot.docs.forEach((doc) => {
                const data = doc.data();
                const { location, description, name, disasterType, timestamp } = data;

                if (timestamp) {
                    const date = new Date(timestamp.seconds * 1000);
                    const docYear = date.getFullYear();
                    const docMonth = date.getMonth() + 1;

                    // Aplicando filtro por ano e mês
                    if (docYear !== year || docMonth !== month) {
                        return; // Ignora ocorrências fora do mês e ano filtrado
                    }
                    
                }

                // Criar marcador se houver localização válida
                if (location) {
                    const coords = location.split("query=")[1]?.split(",");
                    if (coords && coords.length === 2) {
                        addMarker(parseFloat(coords[0]), parseFloat(coords[1]), name, disasterType, description, location);
                    }
                }
            });
        });
    } catch (error) {
        console.error("Erro ao carregar os marcadores:", error);
    }
}

// Função para adicionar marcador no mapa
function addMarker(lat, lng, name, disasterType, description, location) {
    const marker = L.marker([lat, lng], {
        icon: L.icon({
            iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
            iconSize: [20, 31],
            iconAnchor: [10, 31],
            popupAnchor: [1, -34]
        })
    }).bindPopup(`
        <b>Nome: ${name || "Sem nome"}</b><br>
        <i>Desastre: ${disasterType || "Não especificado"}</i><br>
        <p>Descrição: ${description || "Sem descrição"}</p>
        <a href="${location}" target="_blank">Ver no Google Maps</a>
    `);
    
    markerGroup.addLayer(marker);
}

// Verifica se o usuário está autenticado antes de carregar os dados
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log("Usuário autenticado:", user.email);
        loadMarkers(parseInt(yearFilter.value), parseInt(monthFilter.value));
    } else {
        console.log("Usuário não autenticado");
    }
});

// Atualizar o filtro do mapa quando um novo ano ou mês for selecionado
applyFilterBtn.addEventListener("click", () => {
    const year = parseInt(yearFilter.value);
    const month = parseInt(monthFilter.value);
    console.log(`Filtro aplicado - Ano: ${year}, Mês: ${month}`);
    loadMarkers(year, month);
});
