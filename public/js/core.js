// Gestionnaire d'erreurs global
window.onerror = function(message, source, lineno, colno, error) {
    showError(`Erreur: ${message} (Ligne: ${lineno})`);
    console.error(error);
    return true;
};

// Fonctions d'affichage des notifications
function showError(message) {
    const errorElement = document.getElementById('error');
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
        setTimeout(() => { errorElement.style.display = 'none'; }, 5000);
    } else {
        console.error(`Erreur: ${message}`);
    }
}

function showSuccess(message) {
    const successElement = document.getElementById('success');
    if (successElement) {
        successElement.textContent = message;
        successElement.style.display = 'block';
        setTimeout(() => { successElement.style.display = 'none'; }, 5000);
    } else {
        console.log(`Succès: ${message}`);
    }
}

// Vérifier que Firebase est chargé
if (typeof firebase === 'undefined') {
    showError("Erreur: Firebase SDK non chargé. Vérifiez les scripts.");
    throw new Error("Firebase SDK non chargé");
}

// Configuration Firebase
const firebaseConfig = {
    apiKey: "AIzaSyAxMNInJ2ZPZHYLbf2_RMMV17q0d5LNGUk",
    authDomain: "architalmoudi.firebaseapp.com",
    projectId: "architalmoudi",
    storageBucket: "architalmoudi.firebasestorage.app",
    messagingSenderId: "405863666834",
    appId: "1:405863666834:web:7e9d8500638cf6a43cc24b",
    measurementId: "G-KGED04F3K7"
};

// Initialiser Firebase
let db;
let storage;
try {
    // Vérifier si Firebase est déjà initialisé pour éviter les erreurs
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    } else {
        firebase.app(); // Si déjà initialisé, utiliser l'instance existante
    }
    db = firebase.firestore();
    storage = firebase.storage();
    console.log("Firebase initialisé avec succès");
} catch (error) {
    showError(`Erreur Firebase: ${error.message}`);
    console.error(error);
    throw error;
}

// Variables globales
let currentEditId = null;
let clients = [];
let projects = [];
let tasks = [];
let finances = [];
let documents = [];
let events = [];
let calendarCurrentMonth = new Date().getMonth();
let calendarCurrentYear = new Date().getFullYear();

// Afficher une section
function showSection(sectionId) {
    const sections = document.querySelectorAll('.section');
    if (sections) {
        sections.forEach(section => {
            section.classList.remove('active');
        });
    }
    
    const navButtons = document.querySelectorAll('nav button');
    if (navButtons) {
        navButtons.forEach(button => {
            button.classList.remove('active');
        });
    }
    
    const section = document.getElementById(sectionId);
    if (section) {
        section.classList.add('active');
        const navButton = document.querySelector(`nav button[onclick="window.App.showSection('${sectionId}')"]`);
        if (navButton) navButton.classList.add('active');
    } else {
        console.error(`Section ${sectionId} non trouvée`);
    }
}

// Fonctions de gestion des modales
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = 'block';
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = 'none';
}

// Fonction d'initialisation principale
async function initApp() {
    try {
        console.log("Démarrage de l'initialisation de l'application");

        // Préférer la redirection vers la section principale si aucune n'est sélectionnée
        const activeSection = document.querySelector('.section.active');
        if (!activeSection) {
            showSection('dashboard');
        }

        // Charger les données de manière séquentielle pour éviter les problèmes de référence
        if (db) {
            await window.EntityManager.loadClients();
            await window.EntityManager.loadProjects();
            
            // Charger le reste des données en parallèle avec les fonctions de DashboardManager
            await Promise.all([
                window.loadTasks(),
                window.DashboardManager.loadFinances(),
                window.loadDocuments(),
                window.DashboardManager.loadEvents()
            ]);
            
            console.log("Application initialisée avec succès");
        } else {
            throw new Error("Base de données non initialisée");
        }
    } catch (error) {
        console.error("Erreur lors de l'initialisation:", error);
        showError(`Erreur d'initialisation: ${error.message}`);
    }
}

// Gestion des déconnexions et reconnexions
window.addEventListener('online', () => {
    console.log("Connexion internet rétablie");
    showSuccess("Connexion rétablie");
    // Recharger les données importantes
    initApp();
});

window.addEventListener('offline', () => {
    console.log("Connexion internet perdue");
    showError("Connexion internet perdue. Certaines fonctionnalités peuvent être indisponibles.");
});

// Initialiser l'application lorsque le DOM est chargé
document.addEventListener('DOMContentLoaded', initApp);

// Exporter les fonctions pour les autres modules
window.App = {
    showError,
    showSuccess,
    openModal,
    closeModal,
    showSection,
    db,
    storage
};