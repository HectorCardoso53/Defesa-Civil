import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-app.js";
import { getFirestore, collection, onSnapshot } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-firestore.js";
import { firebaseConfig } from '../config/firebase_config.js';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const audio = new Audio('../assets/audio/sirene_de_escola.mp3');

let displayedOccurrenceIds = [];
let lastTimestamp = localStorage.getItem('lastTimestamp'); // Pega o timestamp do localStorage

// Obter os elementos de seleção de mês, status e ano
const monthSelector = document.getElementById('monthSelector');
const statusSelector = document.getElementById('statusSelector');
const yearSelector = document.getElementById('yearSelector');

function loadOccurrences(month = null, status = null, year = null) {
    console.log("Carregando ocorrências...");
    const occurrencesBody = document.getElementById('occurrencesBody');
    occurrencesBody.innerHTML = ''; // Limpa a tabela para recarregar

    const loadingMessage = document.createElement('tr');
    loadingMessage.innerHTML = '<td colspan="10" style="text-align:center;">Carregando...</td>';
    occurrencesBody.appendChild(loadingMessage);

    onSnapshot(collection(db, "occurrences"), (snapshot) => {
        // Limpa a tabela após carregar as ocorrências
        occurrencesBody.innerHTML = ''; // Limpa a tabela antes de adicionar os resultados

        let index = 0;
        let hasNewOccurrence = false;

        if (snapshot.empty) {
            // Cria uma linha de mensagem informando que não há ocorrências
            const noOccurrencesMessage = document.createElement('tr');
            noOccurrencesMessage.innerHTML = '<td colspan="10" style="text-align:center;">Nenhuma ocorrência encontrada.</td>';
            occurrencesBody.appendChild(noOccurrencesMessage);
            return; // Termina a função se não houver ocorrências
        }

        snapshot.forEach(doc => {
            const occurrence = doc.data();
            const occurrenceId = doc.id;

            if (!occurrence.timestamp) {
                console.error("Timestamp não encontrado para a ocorrência:", occurrenceId);
                return;
            }

            const occurrenceDate = new Date(occurrence.timestamp.seconds * 1000);
            const occurrenceMonth = occurrenceDate.getMonth() + 1;  // Mês (1-12)
            const occurrenceYear = occurrenceDate.getFullYear(); // Ano
            const occurrenceStatus = Number(occurrence.status); // Garantir tipo numérico

            // Verificar se o mês, o status e o ano coincidem com os filtros
            const monthMatches = month ? occurrenceMonth === month : true;
            const statusMatches = (status !== null && status === occurrenceStatus); // Exibir apenas status correspondentes
            const yearMatches = year ? occurrenceYear === year : true; // Verificar se o ano também corresponde

            if (!monthMatches || !statusMatches || !yearMatches) {
                return; // Ignorar ocorrências que não correspondem aos filtros
            }

            // Se chegou aqui, significa que os filtros coincidem
            index++;
            const statusClass = getStatusClass(occurrenceStatus);
            const locationLink = occurrence.location || 'Localização não informada';

            const rowHTML =  
                `<tr>
                    <td>${index}</td>
                    <td>${occurrenceDate.toLocaleString('pt-BR')}</td>
                    <td>${occurrence.name || 'Nome não informado'}</td>
                    <td>${occurrence.disasterType || 'Tipo desconhecido'}</td>
                    <td>${occurrence.address || 'Endereço não informado'}</td>
                    <td>${occurrence.number || 'Número desconhecido'}</td>
                    <td>${occurrence.description || 'Descrição indisponível'}</td>
                    <td><a href="${locationLink}" target="_blank">${locationLink}</a></td>
                    <td><img src="${occurrence.imageUrl || ''}" alt="Imagem da ocorrência"></td>
                    <td class="${statusClass}">${getStatusName(occurrenceStatus)}</td>
                </tr>`;
            occurrencesBody.insertAdjacentHTML('beforeend', rowHTML);
        });

        console.log(`Número total de ocorrências exibidas: ${index}`);

        if (hasNewOccurrence) {
            audio.play();  // Toca a sirene se houver uma nova ocorrência
            lastTimestamp = new Date().toISOString();  // Atualiza o timestamp
            localStorage.setItem('lastTimestamp', lastTimestamp);  // Armazena o timestamp atualizado
        }
    }, (error) => {
        console.error("Erro ao buscar ocorrências:", error);
    });
}


// Atualização dos filtros e chamadas:
function updateFilters() {
    const selectedMonth = parseInt(monthSelector.value);
    const selectedStatus = parseInt(statusSelector.value);
    const selectedYear = parseInt(yearSelector.value); // Adicionando o filtro de ano
    console.log(`Mês selecionado: ${selectedMonth}, Status selecionado: ${selectedStatus}, Ano selecionado: ${selectedYear}`);
    loadOccurrences(selectedMonth, selectedStatus, selectedYear);
}

// Definir o mês atual, ano e status "Pendente" como padrão
const currentMonth = new Date().getMonth() + 1;  // Meses começam do 0 no JavaScript, então adiciona 1
const currentYear = new Date().getFullYear();  // Ano atual
const currentStatus = 0;  // Pendente

// Carregar as ocorrências com os valores padrão
loadOccurrences(currentMonth, currentStatus, currentYear);
monthSelector.value = currentMonth;
statusSelector.value = currentStatus;
yearSelector.value = currentYear;

// Adicionar os event listeners após os elementos estarem definidos
monthSelector.addEventListener('change', updateFilters);
statusSelector.addEventListener('change', updateFilters);
yearSelector.addEventListener('change', updateFilters);

function getStatusName(status) {
    const statusNames = {
        0: 'Pendente',
        1: 'Em execução',
        2: 'Concluído'
    };
    return statusNames[status] || 'Desconhecido';
}

function getStatusClass(status) {
    const statusClasses = {
        0: 'status-pendente',
        1: 'status-em-execucao',
        2: 'status-concluido'
    };
    return statusClasses[status] || '';
}
