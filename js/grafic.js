// Importando funções do Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-auth.js";
import { getFirestore, collection, onSnapshot } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-firestore.js";
import { firebaseConfig } from '../config/firebase_config.js';

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let currentChart = null; // Variável para armazenar o gráfico atual

// Função para buscar dados da coleção "occurrences"
function fetchOccurrencesData() {
    onSnapshot(collection(db, "occurrences"), (snapshot) => {
        let occurrencesByYear = {}; // Inicializar a cada atualização
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        if (snapshot.empty) {
            console.log("Nenhuma ocorrência encontrada.");
            return;
        }

        snapshot.forEach(doc => {
            const occurrence = doc.data();
            if (!occurrence.timestamp || !occurrence.timestamp.seconds) {
                console.warn("Ocorrência sem timestamp válido:", doc.id);
                return;
            }

            const date = new Date(occurrence.timestamp.seconds * 1000);
            const year = date.getFullYear();
            const month = date.getMonth();

            if (!occurrencesByYear[year]) {
                occurrencesByYear[year] = Array(12).fill(0);
            }
            occurrencesByYear[year][month] += 1;
        });

        fillYearSelect(occurrencesByYear);
        renderChart(occurrencesByYear, new Date().getFullYear());
    });
}

// Função para preencher o campo de seleção de ano
function fillYearSelect(occurrencesByYear) {
    const yearSelect = document.getElementById('yearSelect');
    yearSelect.innerHTML = "";

    const years = Object.keys(occurrencesByYear).sort((a, b) => b - a);
    const currentYear = new Date().getFullYear();

    years.forEach(year => {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        if (Number(year) === currentYear) {
            option.selected = true;
        }
        yearSelect.appendChild(option);
    });

    if (!yearSelect.dataset.listenerAdded) {
        yearSelect.addEventListener('change', (event) => {
            renderChart(occurrencesByYear, Number(event.target.value));
        });
        yearSelect.dataset.listenerAdded = true;
    }
}

// Função para renderizar o gráfico
function renderChart(occurrencesByYear, selectedYear) {
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const ctx = document.getElementById('occurrencesChart').getContext('2d');
    const yearToShow = selectedYear || new Date().getFullYear();
    const dataForSelectedYear = occurrencesByYear[yearToShow] || Array(12).fill(0);

    if (currentChart) {
        currentChart.destroy();
    }

    currentChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: months,
            datasets: [{
                label: `Ocorrências em ${yearToShow}`,
                data: dataForSelectedYear,
                borderColor: 'blue',
                backgroundColor: 'rgba(0, 0, 255, 0.2)',
                fill: true,
                tension: 0.1,
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { stepSize: 1 }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: tooltipItem => `Ocorrências: ${tooltipItem.raw}`
                    }
                }
            }
        }
    });
}

// Chamar a função para buscar os dados ao carregar a página
fetchOccurrencesData();