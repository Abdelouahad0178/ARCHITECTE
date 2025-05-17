/* ----- GESTION DES TÂCHES ----- */

// Charger les tâches
async function loadTasks() {
    // Code pour chargement des tâches...
}

// Setup pour les formulaires de tâches
function setupTaskForms() {
    // Code pour setupTaskForm et setupEditTaskForm...
}

// Modifier une tâche
async function editTask(id) {
    // Code pour modifier une tâche...
}

// Supprimer une tâche
async function deleteTask(id) {
    // Code pour supprimer une tâche...
}

// Filtrer et rechercher des tâches
function filterTasks() {
    // Code pour filtrer les tâches...
}

function searchTasks() {
    // Code pour rechercher des tâches...
}

/* ----- GESTION DOCUMENTAIRE ----- */

// Charger les documents
async function loadDocuments() {
    // Code pour chargement des documents...
}

// Setup pour les formulaires de documents
function setupDocumentForms() {
    // Code pour setupDocumentForm et setupEditDocumentForm...
}

// Modifier un document
async function editDocument(id) {
    // Code pour modifier un document...
}

// Supprimer un document
async function deleteDocument(id) {
    // Code pour supprimer un document...
}

// Filtrer et rechercher des documents
function filterDocuments() {
    // Code pour filtrer les documents...
}

function searchDocuments() {
    // Code pour rechercher des documents...
}

// Initialisation des écouteurs d'événements pour les tâches et documents
function setupTasksDocumentsEventListeners() {
    // Tâches
    const taskSearchInput = document.getElementById('taskSearchInput');
    if (taskSearchInput) {
        taskSearchInput.addEventListener('input', searchTasks);
    }

    const taskStatusFilter = document.getElementById('taskStatusFilter');
    if (taskStatusFilter) {
        taskStatusFilter.addEventListener('change', filterTasks);
    }

    const taskProjectFilter = document.getElementById('taskProjectFilter');
    if (taskProjectFilter) {
        taskProjectFilter.addEventListener('change', filterTasks);
    }

    // Documents
    const documentSearchInput = document.getElementById('documentSearchInput');
    if (documentSearchInput) {
        documentSearchInput.addEventListener('input', searchDocuments);
    }

    const documentTypeFilter = document.getElementById('documentTypeFilter');
    if (documentTypeFilter) {
        documentTypeFilter.addEventListener('change', filterDocuments);
    }

    const documentProjectFilter = document.getElementById('documentProjectFilter');
    if (documentProjectFilter) {
        documentProjectFilter.addEventListener('change', filterDocuments);
    }

    // Setup formulaires
    setupTaskForms();
    setupDocumentForms();
}

// Initialiser les écouteurs d'événements lorsque le DOM est chargé
document.addEventListener('DOMContentLoaded', setupTasksDocumentsEventListeners);

// Exporter les fonctions pour les autres modules
window.TaskDocManager = {
    loadTasks,
    editTask,
    deleteTask,
    searchTasks,
    filterTasks,
    loadDocuments,
    editDocument,
    deleteDocument,
    searchDocuments,
    filterDocuments
};