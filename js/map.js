import { initializeApp } from "https://www.gstatic.com/firebasejs/9.21.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.21.0/firebase-auth.js";
import { getFirestore, collection, onSnapshot } from "https://www.gstatic.com/firebasejs/9.21.0/firebase-firestore.js";
import { firebaseConfig } from '../config/firebase_config.js';

// Inicializar o Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Inicializa a autenticação
const auth = getAuth();

// Verifica o estado de autenticação do usuário
onAuthStateChanged(auth, (user) => {
    if (!user) {
        alert("Você precisa se autenticar para acessar as ocorrências.");
        window.location.href = "index.html";
    }
});

// Inicializar o mapa
const map = L.map('map').setView([-1.7633858, -55.8633922], 16);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 19
}).addTo(map);

// Referenciar a coleção 'occurrences' no Firestore
const occurrencesRef = collection(db, "occurrences");
let allMarkers = []; // Array para armazenar os marcadores

const loadMarkers = (month) => {
    // Remover todos os marcadores do mapa
    allMarkers.forEach(marker => map.removeLayer(marker));
    allMarkers = [];

    onSnapshot(occurrencesRef, (snapshot) => {
        snapshot.forEach((doc) => {
            const data = doc.data();
            const { location, description, name, disasterType, timestamp } = data;

            // Filtro pelo mês
            if (timestamp) {
                const date = new Date(timestamp.seconds * 1000); // Converter timestamp do Firestore
                const docMonth = date.getMonth() + 1; // Obter mês (1-12)

                if (month !== "all" && parseInt(month) !== docMonth) return;
            }

            if (location) {
                const coords = location.split('query=')[1]?.split(',');
                if (coords && coords.length === 2) {
                    const lat = parseFloat(coords[0]);
                    const lng = parseFloat(coords[1]);

                    // Adicionar marcador no mapa
                    const marker = L.marker([lat, lng], {
                        icon: L.icon({
                            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
                            iconSize: [20, 31],
                            iconAnchor: [10, 31],
                            popupAnchor: [1, -34]
                        })
                    }).addTo(map).bindPopup(`
                        <b>Nome: ${name || 'Sem nome'}</b><br>
                        <i>Desastre: ${disasterType || 'Tipo não especificado'}</i><br>
                        <p>Descrição: ${description || 'Sem descrição'}</p>
                        <a href="${location}" target="_blank">Ver no Google Maps</a>
                    `);

                    allMarkers.push(marker);
                }
            }
        });
    });
};

// Carregar todos os marcadores ao iniciar
loadMarkers("all");

// Aplicar o filtro ao clicar no botão
document.getElementById("applyFilter").addEventListener("click", () => {
    const month = document.getElementById("monthFilter").value;
    loadMarkers(month);
});
