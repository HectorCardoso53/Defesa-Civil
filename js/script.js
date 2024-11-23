import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-app.js";
import { getFirestore, collection, onSnapshot } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyCZLAxqJiaFckcBL5Hb3e5ldQ3hhlacWx4",
    authDomain: "conecta-orixi.firebaseapp.com",
    projectId: "conecta-orixi",
    storageBucket: "conecta-orixi.appspot.com",
    messagingSenderId: "1040105797660",
    appId: "1:1040105797660:web:18d67b8c104d09543dc7d9"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const audio = new Audio('sirene de escola - Efeito sonoro.mp3');
let displayedOccurrenceIds = [];
let lastTimestamp = null;

function loadOccurrences(month = null, status = null) {
    console.log("Carregando ocorrências...");
    const occurrencesBody = document.getElementById('occurrencesBody');
    let occurrenceCount = 0;
    onSnapshot(collection(db, "occurrences"), (snapshot) => {
        occurrencesBody.innerHTML = ''; 
        let index = 0;
        let hasNewOccurrence = false;

        if (snapshot.empty) {
            console.log("Nenhuma ocorrência encontrada.");
            return;
        }

        snapshot.forEach(doc => {
            const occurrence = doc.data();
            const occurrenceId = doc.id;

            if (!occurrence.timestamp) {
                console.error("Timestamp não encontrado para a ocorrência:", occurrenceId);
                return;
            }

            const occurrenceDate = new Date(occurrence.timestamp.seconds * 1000);
            if (lastTimestamp === null || occurrenceDate > lastTimestamp) {
                hasNewOccurrence = true;
            }

            const occurrenceMonth = occurrenceDate.getMonth() + 1;
            const occurrenceStatus = Number(occurrence.status); // Garantir tipo numérico

            // Verificar se o mês e o status coincidem com os filtros
            const monthMatches = month ? occurrenceMonth === month : true;
            const statusMatches = 
                (status === 4) ||               // Mostrar todos
                (status !== null && status === occurrenceStatus); // Exibir apenas status correspondentes

            if (!monthMatches || !statusMatches) {
                return; // Ignorar ocorrências que não correspondem aos filtros
            }

            // Se chegou aqui, significa que os filtros coincidem
            if (!displayedOccurrenceIds.includes(occurrenceId)) {
                displayedOccurrenceIds.push(occurrenceId);
            }

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
            audio.play();
            lastTimestamp = new Date();
        }
    }, (error) => {
        console.error("Erro ao buscar ocorrências:", error);
    });
}

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

loadOccurrences();

const monthSelector = document.getElementById('monthSelector');
const statusSelector = document.getElementById('statusSelector');

monthSelector.addEventListener('change', () => {
    const selectedMonth = parseInt(monthSelector.value) || null;
    const selectedStatus = parseInt(statusSelector.value) || 4;
    console.log(`Mês selecionado: ${selectedMonth}, Status selecionado: ${selectedStatus}`);
    loadOccurrences(selectedMonth, selectedStatus);
});

statusSelector.addEventListener('change', () => {
    const selectedStatus = parseInt(statusSelector.value) || 4;
    const selectedMonth = parseInt(monthSelector.value) || null;
    console.log(`Mês selecionado: ${selectedMonth}, Status selecionado: ${selectedStatus}`);
    loadOccurrences(selectedMonth, selectedStatus);
});
