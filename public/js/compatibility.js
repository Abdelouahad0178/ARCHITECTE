// compatibility.js
// Ce fichier sert à maintenir la compatibilité avec les fonctions globales
// utilisées dans les attributs onclick du HTML

// Fonctions de core.js
window.showError = window.App.showError;
window.showSuccess = window.App.showSuccess;
window.showSection = window.App.showSection;
window.openModal = window.App.openModal;
window.closeModal = window.App.closeModal;
window.loadDashboard = window.DashboardManager.loadDashboard;
window.db = window.App.db;
window.storage = window.App.storage;

// Clients (entities.js)
window.loadClients = window.EntityManager.loadClients;
window.editClient = window.EntityManager.editClient;
window.deleteClient = window.EntityManager.deleteClient;
window.searchClients = window.EntityManager.searchClients;

// Projets (entities.js)
window.loadProjects = window.EntityManager.loadProjects;
window.editProject = window.EntityManager.editProject;
window.deleteProject = window.EntityManager.deleteProject;
window.searchProjects = window.EntityManager.searchProjects;
window.filterProjects = window.EntityManager.filterProjects;

// Tâches (à implémenter dans tasks.js)
window.loadTasks = async function loadTasks() {
    if (!db) {
        showError("Base de données non initialisée");
        return;
    }
    try {
        const taskList = document.getElementById('taskList');
        const taskProjectFilter = document.getElementById('taskProjectFilter');

        if (taskList) taskList.innerHTML = '';
        if (taskProjectFilter) taskProjectFilter.innerHTML = '<option value="">Tous les projets</option>';

        tasks = [];
        // Utiliser await pour attendre la résolution de la Promise
        const snapshot = await db.collection('tasks').get();
        if (!snapshot || snapshot.empty) {
            const pendingTaskCount = document.getElementById('pendingTaskCount');
            if (pendingTaskCount) pendingTaskCount.textContent = '0';
            window.DashboardManager.loadDashboard();
            return;
        }

        // Nombre de tâches en attente pour le tableau de bord
        let pendingTasksCount = 0;

        // Ensemble pour suivre les projectIds uniques déjà ajoutés au filtre
        const addedProjectIds = new Set();

        snapshot.forEach(doc => {
            const task = { id: doc.id, ...doc.data() };
            tasks.push(task);

            if (task.status !== 'Terminée') {
                pendingTasksCount++;
            }

            if (taskList) {
                const li = document.createElement('li');
                const projectName = projects.find(p => p.id === task.projectId)?.name || 'Projet inconnu';
                const priorityClass = task.priority === 'Haute' ? 'priority-haute' : 
                                task.priority === 'Moyenne' ? 'priority-moyenne' : 'priority-basse';

                li.innerHTML = `
                    <div>
                        <strong>${task.title || 'Sans titre'}</strong><br>
                        <span class="badge ${priorityClass}">${task.priority}</span>
                        <span class="badge">${task.status}</span><br>
                        Projet: ${projectName}<br>
                        ${task.dueDate ? `Échéance: ${new Date(task.dueDate).toLocaleDateString('fr-MA')}<br>` : ''}
                        ${task.description ? `Description: ${task.description}` : ''}
                    </div>
                    <div class="button-group">
                        <button class="edit" onclick="editTask('${doc.id}')">Modifier</button>
                        <button class="delete" onclick="deleteTask('${doc.id}')">Supprimer</button>
                    </div>
                `;
                taskList.appendChild(li);
            }

            // Ajouter au filtre de projet si ce n'est pas déjà fait
            if (taskProjectFilter && task.projectId && !addedProjectIds.has(task.projectId)) {
                const project = projects.find(p => p.id === task.projectId);
                if (project) {
                    const option = document.createElement('option');
                    option.value = task.projectId;
                    option.textContent = project.name;
                    taskProjectFilter.appendChild(option);
                    addedProjectIds.add(task.projectId);
                }
            }
        });

        const pendingTaskCount = document.getElementById('pendingTaskCount');
        if (pendingTaskCount) pendingTaskCount.textContent = pendingTasksCount.toString();

        window.DashboardManager.loadDashboard();
        console.log("Tâches chargées");
    } catch (error) {
        showError(`Erreur chargement tâches: ${error.message}`);
        console.error(error);
        if (error.code === 'unavailable') {
            showError("Problème de connexion réseau. Vérifiez votre connexion.");
        }
    }
};

window.editTask = async function editTask(id) {
    if (!id || !db) {
        showError("ID tâche ou base de données non valide");
        return;
    }
    
    try {
        const taskDoc = await db.collection('tasks').doc(id).get();
        if (!taskDoc.exists) {
            showError("Tâche non trouvée!");
            return;
        }

        const task = taskDoc.data();
        const editTaskId = document.getElementById('editTaskId');
        const editTaskTitle = document.getElementById('editTaskTitle');
        const editTaskProject = document.getElementById('editTaskProject');
        const editTaskDueDate = document.getElementById('editTaskDueDate');
        const editTaskPriority = document.getElementById('editTaskPriority');
        const editTaskStatus = document.getElementById('editTaskStatus');
        const editTaskDescription = document.getElementById('editTaskDescription');
        
        if (editTaskId) editTaskId.value = id;
        if (editTaskTitle) editTaskTitle.value = task.title || '';
        if (editTaskProject) editTaskProject.value = task.projectId || '';
        if (editTaskDueDate) editTaskDueDate.value = task.dueDate || '';
        if (editTaskPriority) editTaskPriority.value = task.priority || 'Basse';
        if (editTaskStatus) editTaskStatus.value = task.status || 'À faire';
        if (editTaskDescription) editTaskDescription.value = task.description || '';

        openModal('editTaskModal');
    } catch (error) {
        showError(`Erreur chargement tâche: ${error.message}`);
        console.error(error);
    }
};

window.deleteTask = async function deleteTask(id) {
    if (!id || !db) {
        showError("ID tâche ou base de données non valide");
        return;
    }
    
    if (confirm("Êtes-vous sûr de vouloir supprimer cette tâche ? Cette action est irréversible.")) {
        try {
            await db.collection('tasks').doc(id).delete();
            showSuccess("Tâche supprimée avec succès!");
            await loadTasks();
        } catch (error) {
            showError(`Erreur suppression tâche: ${error.message}`);
            console.error(error);
        }
    }
};

window.searchTasks = function searchTasks() {
    const searchInput = document.getElementById('taskSearchInput')?.value.toLowerCase() || '';
    const taskList = document.getElementById('taskList');
    if (!taskList) return;
    
    taskList.innerHTML = '';

    // Filtrage des tâches
    const filteredTasks = tasks.filter(task => 
        (task.title && task.title.toLowerCase().includes(searchInput)) ||
        (task.description && task.description.toLowerCase().includes(searchInput)) ||
        (projects.find(p => p.id === task.projectId)?.name.toLowerCase().includes(searchInput))
    );

    if (filteredTasks.length === 0) {
        const li = document.createElement('li');
        li.textContent = 'Aucun résultat trouvé';
        taskList.appendChild(li);
        return;
    }

    filteredTasks.forEach(task => {
        const li = document.createElement('li');
        const projectName = projects.find(p => p.id === task.projectId)?.name || 'Projet inconnu';
        const priorityClass = task.priority === 'Haute' ? 'priority-haute' : 
                          task.priority === 'Moyenne' ? 'priority-moyenne' : 'priority-basse';

        li.innerHTML = `
            <div>
                <strong>${task.title || 'Sans titre'}</strong><br>
                <span class="badge ${priorityClass}">${task.priority}</span>
                <span class="badge">${task.status}</span><br>
                Projet: ${projectName}<br>
                ${task.dueDate ? `Échéance: ${new Date(task.dueDate).toLocaleDateString('fr-MA')}<br>` : ''}
                ${task.description ? `Description: ${task.description}` : ''}
            </div>
            <div class="button-group">
                <button class="edit" onclick="editTask('${task.id}')">Modifier</button>
                <button class="delete" onclick="deleteTask('${task.id}')">Supprimer</button>
            </div>
        `;
        taskList.appendChild(li);
    });
};

window.filterTasks = function filterTasks() {
    const statusFilter = document.getElementById('taskStatusFilter')?.value || '';
    const projectFilter = document.getElementById('taskProjectFilter')?.value || '';
    const priorityFilter = document.getElementById('taskPriorityFilter')?.value || '';
    const taskList = document.getElementById('taskList');
    if (!taskList) return;
    
    taskList.innerHTML = '';

    // Filtrage des tâches
    const filteredTasks = tasks.filter(task => 
        (statusFilter === '' || task.status === statusFilter) &&
        (projectFilter === '' || task.projectId === projectFilter) &&
        (priorityFilter === '' || task.priority === priorityFilter)
    );

    if (filteredTasks.length === 0) {
        const li = document.createElement('li');
        li.textContent = 'Aucun résultat trouvé';
        taskList.appendChild(li);
        return;
    }

    filteredTasks.forEach(task => {
        const li = document.createElement('li');
        const projectName = projects.find(p => p.id === task.projectId)?.name || 'Projet inconnu';
        const priorityClass = task.priority === 'Haute' ? 'priority-haute' : 
                          task.priority === 'Moyenne' ? 'priority-moyenne' : 'priority-basse';

        li.innerHTML = `
            <div>
                <strong>${task.title || 'Sans titre'}</strong><br>
                <span class="badge ${priorityClass}">${task.priority}</span>
                <span class="badge">${task.status}</span><br>
                Projet: ${projectName}<br>
                ${task.dueDate ? `Échéance: ${new Date(task.dueDate).toLocaleDateString('fr-MA')}<br>` : ''}
                ${task.description ? `Description: ${task.description}` : ''}
            </div>
            <div class="button-group">
                <button class="edit" onclick="editTask('${task.id}')">Modifier</button>
                <button class="delete" onclick="deleteTask('${task.id}')">Supprimer</button>
            </div>
        `;
        taskList.appendChild(li);
    });
};

// Documents (à implémenter dans tasks.js)
window.loadDocuments = async function loadDocuments() {
    if (!db) {
        showError("Base de données non initialisée");
        return;
    }
    try {
        const documentList = document.getElementById('documentList');
        if (documentList) documentList.innerHTML = '';

        documents = [];
        const snapshot = await db.collection('documents').get();
        if (!snapshot || snapshot.empty) {
            return;
        }

        snapshot.forEach(doc => {
            const documentItem = { id: doc.id, ...doc.data() };
            documents.push(documentItem);

            if (documentList) {
                const li = document.createElement('li');
                const projectName = projects.find(p => p.id === documentItem.projectId)?.name || '';
                const clientName = clients.find(c => c.id === documentItem.clientId)?.name || '';

                li.innerHTML = `
                    <div>
                        <strong>${documentItem.title || 'Sans titre'}</strong><br>
                        <span class="badge">${documentItem.type || 'Non spécifié'}</span><br>
                        Date: ${documentItem.date ? new Date(documentItem.date).toLocaleDateString('fr-MA') : 'Non spécifiée'}<br>
                        ${projectName ? `Projet: ${projectName}<br>` : ''}
                        ${clientName ? `Client: ${clientName}<br>` : ''}
                        ${documentItem.description ? `Description: ${documentItem.description}<br>` : ''}
                        ${documentItem.fileUrl ? `<a href="${documentItem.fileUrl}" target="_blank" class="document-link">Voir le document</a>` : 'Pas de fichier associé'}
                    </div>
                    <div class="button-group">
                        <button class="edit" onclick="editDocument('${doc.id}')">Modifier</button>
                        <button class="delete" onclick="deleteDocument('${doc.id}')">Supprimer</button>
                    </div>
                `;
                documentList.appendChild(li);
            }
        });

        console.log("Documents chargés");
    } catch (error) {
        showError(`Erreur chargement documents: ${error.message}`);
        console.error(error);
        if (error.code === 'unavailable') {
            showError("Problème de connexion réseau. Vérifiez votre connexion.");
        }
    }
};

window.editDocument = async function editDocument(id) {
    // Fonction temporaire, sera remplacée par l'implémentation réelle dans tasks.js
    console.log(`Édition du document ${id} - à implémenter dans tasks.js`);
};

window.deleteDocument = async function deleteDocument(id) {
    // Fonction temporaire, sera remplacée par l'implémentation réelle dans tasks.js
    console.log(`Suppression du document ${id} - à implémenter dans tasks.js`);
};

window.searchDocuments = function searchDocuments() {
    // Fonction temporaire, sera remplacée par l'implémentation réelle dans tasks.js
    console.log("Recherche de documents - à implémenter dans tasks.js");
};

window.filterDocuments = function filterDocuments() {
    // Fonction temporaire, sera remplacée par l'implémentation réelle dans tasks.js
    console.log("Filtrage de documents - à implémenter dans tasks.js");
};

// Finances (implémenté dans dashboard.js)
window.loadFinances = window.DashboardManager.loadFinances;
window.editFinance = window.DashboardManager.editFinance;
window.deleteFinance = window.DashboardManager.deleteFinance;
window.searchFinances = window.DashboardManager.searchFinances;
window.filterFinances = window.DashboardManager.filterFinances;

// Calendrier (implémenté dans dashboard.js)
window.loadEvents = window.DashboardManager.loadEvents;
window.renderCalendar = window.DashboardManager.renderCalendar;
window.prevMonth = window.DashboardManager.prevMonth;
window.nextMonth = window.DashboardManager.nextMonth;
window.openEventModal = window.DashboardManager.openEventModal;
window.closeEventModal = window.DashboardManager.closeEventModal;
window.deleteEvent = window.DashboardManager.deleteEvent;