import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-auth.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-firestore.js";
import { firebaseConfig } from '../config/firebase_config.js';

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);


// Função para obter ocorrências
async function fetchOccurrences() {
    const user = auth.currentUser;

    if (user) {
        try {
            // Referência à coleção 'occurrences'
            const querySnapshot = await getDocs(collection(db, "occurrences"));
            const occurrences = [];
            querySnapshot.forEach((doc) => {
                occurrences.push(doc.data());
            });
            console.log("Ocorrências: ", occurrences);
        } catch (error) {
            console.error("Erro ao buscar ocorrências: ", error);
            alert("Houve um erro ao carregar as ocorrências. Tente novamente mais tarde.");
        }
    } else {
        console.error("Usuário não autenticado!");
        alert("Você precisa estar autenticado para acessar as ocorrências.");
    }
}

// Manipula o formulário de login
document.getElementById("loginForm").addEventListener("submit", (event) => {
    event.preventDefault(); // Evita o envio padrão do formulário

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const errorMessage = document.getElementById("errorMessage");

    // Limpa a mensagem de erro anterior
    errorMessage.textContent = "";

    // Validação de campos
    if (!email || !password) {
        errorMessage.textContent = "Por favor, preencha todos os campos.";
        return;
    }

    // Mostra um indicador de carregamento enquanto o login é processado
    const loadingMessage = document.createElement("p");
    loadingMessage.textContent = "Autenticando...";
    errorMessage.appendChild(loadingMessage);

    // Realiza o login
    signInWithEmailAndPassword(auth, email, password)
        .then(() => {
            console.log("Login realizado com sucesso.");
            loadingMessage.textContent = "Login bem-sucedido! Redirecionando..."; // Atualiza a mensagem de carregamento

            // Busca as ocorrências após o login bem-sucedido
            fetchOccurrences();

            // Aguarda um momento antes de redirecionar, para o usuário ver a mensagem
            setTimeout(() => {
                window.location.href = "/html/defesa_civil.html"; // Redireciona para a página inicial
            }, 1000); // Atraso de 1 segundo
        })
        .catch((error) => {
            console.error("Erro no login:", error.message);

            // Limpa o indicador de carregamento
            loadingMessage.remove();

            // Exibe a mensagem de erro 
            if (error.code === 'auth/invalid-email') {
                errorMessage.textContent = "E-mail inválido. Verifique o formato do e-mail.";
            } else if (error.code === 'auth/wrong-password') {
                errorMessage.textContent = "Senha incorreta. Tente novamente.";
            } else if (error.code === 'auth/user-not-found') {
                errorMessage.textContent = "Usuário não encontrado. Verifique o e-mail.";
            } else {
                errorMessage.textContent = "Erro no login: " + error.message;
            }
        });
});

// Verifica a autenticação em tempo real
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log("Usuário autenticado: ", user.email);
    } else {
        console.log("Usuário não autenticado.");
    }
});
