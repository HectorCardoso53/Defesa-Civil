// Importar as funções necessárias do SDK do Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-auth.js";
import { getFirestore, collection, onSnapshot } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-firestore.js";
import { firebaseConfig } from '../config/firebase_config.js';

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth();
const db = getFirestore(app);

// Verifica o estado de autenticação do usuário
document.addEventListener('DOMContentLoaded', () => {
    onAuthStateChanged(auth, (user) => {
        if (!user) {
            // Exibe uma mensagem de alerta e redireciona para a página de login
            alert("Você precisa se autenticar para acessar o gráfico.");
            window.location.href = "index.html";
        } else {
            // Exibe o usuário autenticado no console
            console.log("Usuário autenticado:", user.email);
            // Chama a função para carregar o gráfico
            fetchOccurrencesData(); 
        }
    });
});

// Função para buscar e exibir os dados das ocorrências
function fetchOccurrencesData() {
    const monthlyCounts = Array(12).fill(0); // Inicializa um array com 12 valores (um para cada mês)

    // Obtenha os dados da coleção "occurrences"
    onSnapshot(collection(db, "occurrences"), (snapshot) => {
        if (snapshot.empty) {
            console.log("Nenhuma ocorrência encontrada.");
            return;
        }

        snapshot.forEach(doc => {
            const occurrence = doc.data();
            const timestamp = occurrence.timestamp; // Supondo que você tenha o timestamp da ocorrência
            const date = new Date(timestamp.seconds * 1000); // Convertendo para objeto Date
            const month = date.getMonth(); // Obtendo o mês (0-11)

            // Incrementa a contagem de ocorrências para o mês correspondente
            monthlyCounts[month] += 1;
        });

        renderChart(monthlyCounts);
    });
}

// Função para renderizar o gráfico com os dados recuperados
function renderChart(monthlyCounts) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const ctx = document.getElementById('occurrencesChart').getContext('2d');
    new Chart(ctx, {
        type: 'line', // Tipo de gráfico: linha
        data: {
            labels: months, // Meses do ano
            datasets: [{
                label: 'Ocorrências por Mês',
                data: monthlyCounts, // Contagem de ocorrências por mês
                borderColor: 'blue',
                backgroundColor: 'rgba(0, 0, 255, 0.2)',
                fill: true, // Preenchimento abaixo da linha
                tension: 0.1, // Suaviza a linha
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(tooltipItem) {
                            return `Ocorrências: ${tooltipItem.raw}`;
                        }
                    }
                }
            }
        }
    });
}
