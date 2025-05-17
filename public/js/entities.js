/* ----- GESTION DES CLIENTS ----- */

// Charger les clients
async function loadClients() {
    if (!db) {
        showError("Base de données non initialisée");
        return;
    }
    try {
        const clientList = document.getElementById('clientList');
        const projectClientSelect = document.getElementById('projectClient');
        const editProjectClientSelect = document.getElementById('editProjectClient');
        const financeClientSelect = document.getElementById('financeClient');
        const documentClientSelect = document.getElementById('documentClient');
        const projectClientFilter = document.getElementById('projectClientFilter');

        // Réinitialiser les éléments s'ils existent
        if (clientList) clientList.innerHTML = '';
        if (projectClientSelect) projectClientSelect.innerHTML = '<option value="">Sélectionner un client</option>';
        if (editProjectClientSelect) editProjectClientSelect.innerHTML = '<option value="">Sélectionner un client</option>';
        if (financeClientSelect) financeClientSelect.innerHTML = '<option value="">Sélectionner un client</option>';
        if (documentClientSelect) documentClientSelect.innerHTML = '<option value="">Sélectionner un client</option>';
        if (projectClientFilter) projectClientFilter.innerHTML = '<option value="">Tous les clients</option>';

        clients = [];
        const snapshot = await db.collection('clients').get();
        
        if (!snapshot || snapshot.empty) {
            const clientCountElement = document.getElementById('clientCount');
            if (clientCountElement) clientCountElement.textContent = '0';
            return;
        }

        snapshot.forEach(doc => {
            const client = { id: doc.id, ...doc.data() };
            clients.push(client);

            if (clientList) {
                const li = document.createElement('li');
                li.innerHTML = `
                    <div>
                        <strong>${client.name || 'Sans nom'}</strong><br>
                        ${client.email ? `Email: ${client.email}<br>` : ''}
                        ${client.phone ? `Tél: ${client.phone}<br>` : ''}
                        Adresse: ${client.address || 'Non spécifiée'}${client.city ? `, ${client.city}` : ''}
                        ${client.type ? `<br>Type: ${client.type}` : ''}
                    </div>
                    <div class="button-group">
                        <button class="edit" onclick="editClient('${doc.id}')">Modifier</button>
                        <button class="delete" onclick="deleteClient('${doc.id}')">Supprimer</button>
                    </div>
                `;
                clientList.appendChild(li);
            }

            // Éviter les doublons en vérifiant si l'option existe déjà
            function addOptionIfNotExists(select, value, text) {
                if (!select) return;
                const existingOption = Array.from(select.options).find(option => option.value === value);
                if (!existingOption) {
                    const option = document.createElement('option');
                    option.value = value;
                    option.textContent = text;
                    select.appendChild(option);
                }
            }

            addOptionIfNotExists(projectClientSelect, doc.id, client.name);
            addOptionIfNotExists(editProjectClientSelect, doc.id, client.name);
            addOptionIfNotExists(financeClientSelect, doc.id, client.name);
            addOptionIfNotExists(documentClientSelect, doc.id, client.name);
            addOptionIfNotExists(projectClientFilter, doc.id, client.name);
        });

        const clientCountElement = document.getElementById('clientCount');
        if (clientCountElement) clientCountElement.textContent = clients.length.toString();
        
        console.log("Clients chargés");
    } catch (error) {
        showError(`Erreur chargement clients: ${error.message}`);
        console.error(error);
        if (error.code === 'unavailable') {
            showError("Problème de connexion réseau. Vérifiez votre connexion.");
        }
    }
}

// Ajouter un client
function setupClientForm() {
    const clientForm = document.getElementById('clientForm');
    if (clientForm) {
        clientForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!db) {
                showError("Base de données non initialisée");
                return;
            }
            try {
                const name = document.getElementById('clientName')?.value.trim() || '';
                const email = document.getElementById('clientEmail')?.value.trim() || '';
                const phone = document.getElementById('clientPhone')?.value.trim() || '';
                const address = document.getElementById('clientAddress')?.value.trim() || '';
                const city = document.getElementById('clientCity')?.value.trim() || '';
                const type = document.getElementById('clientType')?.value || 'Particulier';
                const notes = document.getElementById('clientNotes')?.value.trim() || '';

                if (!name) {
                    showError("Le nom du client est requis");
                    return;
                }
                if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                    showError("Email invalide");
                    return;
                }

                await db.collection('clients').add({
                    name,
                    email,
                    phone,
                    address,
                    city,
                    type,
                    notes,
                    dateCreated: firebase.firestore.FieldValue.serverTimestamp()
                });

                clientForm.reset();
                showSuccess("Client ajouté avec succès!");
                await loadClients();
            } catch (error) {
                showError(`Erreur ajout client: ${error.message}`);
                console.error(error);
            }
        });
    }
}

// Modifier un client
async function editClient(id) {
    if (!id || !db) {
        showError("ID client ou base de données non valide");
        return;
    }
    
    try {
        const clientDoc = await db.collection('clients').doc(id).get();
        if (!clientDoc.exists) {
            showError("Client non trouvé!");
            return;
        }

        const client = clientDoc.data();
        const editClientId = document.getElementById('editClientId');
        const editClientName = document.getElementById('editClientName');
        const editClientEmail = document.getElementById('editClientEmail');
        const editClientPhone = document.getElementById('editClientPhone');
        const editClientAddress = document.getElementById('editClientAddress');
        const editClientCity = document.getElementById('editClientCity');
        const editClientType = document.getElementById('editClientType');
        const editClientNotes = document.getElementById('editClientNotes');
        
        if (editClientId) editClientId.value = id;
        if (editClientName) editClientName.value = client.name || '';
        if (editClientEmail) editClientEmail.value = client.email || '';
        if (editClientPhone) editClientPhone.value = client.phone || '';
        if (editClientAddress) editClientAddress.value = client.address || '';
        if (editClientCity) editClientCity.value = client.city || '';
        if (editClientType) editClientType.value = client.type || 'Particulier';
        if (editClientNotes) editClientNotes.value = client.notes || '';

        openModal('editClientModal');
    } catch (error) {
        showError(`Erreur chargement client: ${error.message}`);
        console.error(error);
    }
}

function setupEditClientForm() {
    const editClientForm = document.getElementById('editClientForm');
    if (editClientForm) {
        editClientForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            try {
                const id = document.getElementById('editClientId')?.value;
                const name = document.getElementById('editClientName')?.value.trim() || '';
                const email = document.getElementById('editClientEmail')?.value.trim() || '';
                const phone = document.getElementById('editClientPhone')?.value.trim() || '';
                const address = document.getElementById('editClientAddress')?.value.trim() || '';
                const city = document.getElementById('editClientCity')?.value.trim() || '';
                const type = document.getElementById('editClientType')?.value || 'Particulier';
                const notes = document.getElementById('editClientNotes')?.value.trim() || '';

                if (!id) {
                    showError("ID client manquant");
                    return;
                }
                
                if (!name) {
                    showError("Le nom du client est requis");
                    return;
                }
                
                if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                    showError("Email invalide");
                    return;
                }

                await db.collection('clients').doc(id).update({
                    name,
                    email,
                    phone,
                    address,
                    city,
                    type,
                    notes,
                    dateModified: firebase.firestore.FieldValue.serverTimestamp()
                });

                closeModal('editClientModal');
                showSuccess("Client modifié avec succès!");
                await loadClients();
            } catch (error) {
                showError(`Erreur modification client: ${error.message}`);
                console.error(error);
            }
        });
    }
}

// Supprimer un client
async function deleteClient(id) {
    if (!id || !db) {
        showError("ID client ou base de données non valide");
        return;
    }
    
    if (confirm("Êtes-vous sûr de vouloir supprimer ce client ? Cette action est irréversible.")) {
        try {
            // Vérifier les dépendances
            const projectsSnapshot = await db.collection('projects').where('clientId', '==', id).limit(1).get();
            
            if (!projectsSnapshot.empty) {
                showError("Impossible de supprimer ce client car il est associé à des projets.");
                return;
            }

            await db.collection('clients').doc(id).delete();
            showSuccess("Client supprimé avec succès!");
            await loadClients();
        } catch (error) {
            showError(`Erreur suppression client: ${error.message}`);
            console.error(error);
        }
    }
}

// Rechercher des clients
function searchClients() {
    const searchInput = document.getElementById('clientSearchInput')?.value.toLowerCase() || '';
    const clientList = document.getElementById('clientList');
    if (!clientList) return;
    
    clientList.innerHTML = '';

    // Filtrage des clients
    const filteredClients = clients.filter(client => 
        (client.name && client.name.toLowerCase().includes(searchInput)) || 
        (client.email && client.email.toLowerCase().includes(searchInput)) ||
        (client.address && client.address.toLowerCase().includes(searchInput)) ||
        (client.city && client.city.toLowerCase().includes(searchInput)) ||
        (client.notes && client.notes.toLowerCase().includes(searchInput))
    );

    if (filteredClients.length === 0) {
        const li = document.createElement('li');
        li.textContent = 'Aucun résultat trouvé';
        clientList.appendChild(li);
        return;
    }

    filteredClients.forEach(client => {
        const li = document.createElement('li');
        li.innerHTML = `
            <div>
                <strong>${client.name || 'Sans nom'}</strong><br>
                ${client.email ? `Email: ${client.email}<br>` : ''}
                ${client.phone ? `Tél: ${client.phone}<br>` : ''}
                Adresse: ${client.address || 'Non spécifiée'}${client.city ? `, ${client.city}` : ''}
                ${client.type ? `<br>Type: ${client.type}` : ''}
            </div>
            <div class="button-group">
                <button class="edit" onclick="editClient('${client.id}')">Modifier</button>
                <button class="delete" onclick="deleteClient('${client.id}')">Supprimer</button>
            </div>
        `;
        clientList.appendChild(li);
    });
}

/* ----- GESTION DES PROJETS ----- */

// Charger les projets
async function loadProjects() {
    if (!db) {
        showError("Base de données non initialisée");
        return;
    }
    try {
        const projectList = document.getElementById('projectList');
        const taskProjectSelect = document.getElementById('taskProject');
        const editTaskProjectSelect = document.getElementById('editTaskProject');
        const financeProjectSelect = document.getElementById('financeProject');
        const documentProjectSelect = document.getElementById('documentProject');
        const eventProjectSelect = document.getElementById('eventProject');
        const taskProjectFilter = document.getElementById('taskProjectFilter');
        const financeProjectFilter = document.getElementById('financeProjectFilter');
        const documentProjectFilter = document.getElementById('documentProjectFilter');

        if (projectList) projectList.innerHTML = '';
        if (taskProjectSelect) taskProjectSelect.innerHTML = '<option value="">Sélectionner un projet</option>';
        if (editTaskProjectSelect) editTaskProjectSelect.innerHTML = '<option value="">Sélectionner un projet</option>';
        if (financeProjectSelect) financeProjectSelect.innerHTML = '<option value="">Sélectionner un projet</option>';
        if (documentProjectSelect) documentProjectSelect.innerHTML = '<option value="">Sélectionner un projet</option>';
        if (eventProjectSelect) eventProjectSelect.innerHTML = '<option value="">Aucun projet</option>';
        if (taskProjectFilter) taskProjectFilter.innerHTML = '<option value="">Tous les projets</option>';
        if (financeProjectFilter) financeProjectFilter.innerHTML = '<option value="">Tous les projets</option>';
        if (documentProjectFilter) documentProjectFilter.innerHTML = '<option value="">Tous les projets</option>';

        projects = [];
        const snapshot = await db.collection('projects').get();
        if (!snapshot || snapshot.empty) {
            const activeProjectCount = document.getElementById('activeProjectCount');
            const totalBudget = document.getElementById('totalBudget');
            if (activeProjectCount) activeProjectCount.textContent = '0';
            if (totalBudget) totalBudget.textContent = '0 MAD';
            loadDashboard();
            return;
        }

        let activeProjects = 0;
        let totalBudgetAmount = 0;

        snapshot.forEach(doc => {
            const project = { id: doc.id, ...doc.data() };
            projects.push(project);

            if (project.status === 'En cours') {
                activeProjects++;
            }
            
            totalBudgetAmount += parseFloat(project.budget || 0);

            if (projectList) {
                const li = document.createElement('li');
                const clientName = clients.find(c => c.id === project.clientId)?.name || 'Client inconnu';
                const statusClass = project.status === 'En cours' ? 'status-en-cours' : 
                                project.status === 'Terminé' ? 'status-termine' : 'status-en-attente';

                li.innerHTML = `
                    <div>
                        <strong>${project.name || 'Sans nom'}</strong><br>
                        <span class="status ${statusClass}">${project.status}</span>
                        ${project.type ? `<span class="badge">${project.type}</span>` : ''}<br>
                        Client: ${clientName}<br>
                        Budget: ${parseFloat(project.budget || 0).toLocaleString('fr-MA')} MAD<br>
                        ${project.startDate ? `Début: ${new Date(project.startDate).toLocaleDateString('fr-MA')}<br>` : ''}
                        ${project.endDate ? `Fin prévue: ${new Date(project.endDate).toLocaleDateString('fr-MA')}<br>` : ''}
                        ${project.location ? `Localisation: ${project.location}<br>` : ''}
                        ${project.description ? `Description: ${project.description}` : ''}
                    </div>
                    <div class="button-group">
                        <button class="edit" onclick="editProject('${doc.id}')">Modifier</button>
                        <button class="delete" onclick="deleteProject('${doc.id}')">Supprimer</button>
                    </div>
                `;
                projectList.appendChild(li);
            }

            // Ajouter aux sélecteurs, éviter les doublons
            function addOptionIfNotExists(select, value, text) {
                if (!select) return;
                const existingOption = Array.from(select.options).find(option => option.value === value);
                if (!existingOption) {
                    const option = document.createElement('option');
                    option.value = value;
                    option.textContent = text;
                    select.appendChild(option);
                }
            }

            addOptionIfNotExists(taskProjectSelect, doc.id, project.name);
            addOptionIfNotExists(editTaskProjectSelect, doc.id, project.name);
            addOptionIfNotExists(financeProjectSelect, doc.id, project.name);
            addOptionIfNotExists(documentProjectSelect, doc.id, project.name);
            addOptionIfNotExists(eventProjectSelect, doc.id, project.name);
            addOptionIfNotExists(taskProjectFilter, doc.id, project.name);
            addOptionIfNotExists(financeProjectFilter, doc.id, project.name);
            addOptionIfNotExists(documentProjectFilter, doc.id, project.name);
        });

        const activeProjectCount = document.getElementById('activeProjectCount');
        const totalBudget = document.getElementById('totalBudget');
        if (activeProjectCount) activeProjectCount.textContent = activeProjects.toString();
        if (totalBudget) totalBudget.textContent = totalBudgetAmount.toLocaleString('fr-MA') + ' MAD';

        loadDashboard();
        console.log("Projets chargés");
    } catch (error) {
        showError(`Erreur chargement projets: ${error.message}`);
        console.error(error);
        if (error.code === 'unavailable') {
            showError("Problème de connexion réseau. Vérifiez votre connexion.");
        }
    }
}

// Ajouter un projet
function setupProjectForm() {
    const projectForm = document.getElementById('projectForm');
    if (projectForm) {
        projectForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!db) {
                showError("Base de données non initialisée");
                return;
            }
            try {
                const name = document.getElementById('projectName')?.value.trim() || '';
                const clientId = document.getElementById('projectClient')?.value || '';
                const budget = parseFloat(document.getElementById('projectBudget')?.value) || 0;
                const startDate = document.getElementById('projectStartDate')?.value || '';
                const endDate = document.getElementById('projectEndDate')?.value || '';
                const type = document.getElementById('projectType')?.value || '';
                const status = document.getElementById('projectStatus')?.value || 'En attente';
                const location = document.getElementById('projectLocation')?.value.trim() || '';
                const description = document.getElementById('projectDescription')?.value.trim() || '';

                if (!name) {
                    showError("Le nom du projet est requis");
                    return;
                }
                if (!clientId) {
                    showError("Un client doit être sélectionné");
                    return;
                }

                await db.collection('projects').add({
                    name,
                    clientId,
                    budget,
                    startDate,
                    endDate,
                    type,
                    status,
                    location,
                    description,
                    dateCreated: firebase.firestore.FieldValue.serverTimestamp()
                });

                projectForm.reset();
                showSuccess("Projet ajouté avec succès!");
                await loadProjects();
            } catch (error) {
                showError(`Erreur ajout projet: ${error.message}`);
                console.error(error);
            }
        });
    }
}

// Modifier un projet
async function editProject(id) {
    if (!id || !db) {
        showError("ID projet ou base de données non valide");
        return;
    }
    
    try {
        const projectDoc = await db.collection('projects').doc(id).get();
        if (!projectDoc.exists) {
            showError("Projet non trouvé!");
            return;
        }

        const project = projectDoc.data();
        const editProjectId = document.getElementById('editProjectId');
        const editProjectName = document.getElementById('editProjectName');
        const editProjectClient = document.getElementById('editProjectClient');
        const editProjectBudget = document.getElementById('editProjectBudget');
        const editProjectStartDate = document.getElementById('editProjectStartDate');
        const editProjectEndDate = document.getElementById('editProjectEndDate');
        const editProjectType = document.getElementById('editProjectType');
        const editProjectStatus = document.getElementById('editProjectStatus');
        const editProjectLocation = document.getElementById('editProjectLocation');
        const editProjectDescription = document.getElementById('editProjectDescription');
        
        if (editProjectId) editProjectId.value = id;
        if (editProjectName) editProjectName.value = project.name || '';
        if (editProjectClient) editProjectClient.value = project.clientId || '';
        if (editProjectBudget) editProjectBudget.value = project.budget || '';
        if (editProjectStartDate) editProjectStartDate.value = project.startDate || '';
        if (editProjectEndDate) editProjectEndDate.value = project.endDate || '';
        if (editProjectType) editProjectType.value = project.type || '';
        if (editProjectStatus) editProjectStatus.value = project.status || 'En attente';
        if (editProjectLocation) editProjectLocation.value = project.location || '';
        if (editProjectDescription) editProjectDescription.value = project.description || '';

        openModal('editProjectModal');
    } catch (error) {
        showError(`Erreur chargement projet: ${error.message}`);
        console.error(error);
    }
}

function setupEditProjectForm() {
    const editProjectForm = document.getElementById('editProjectForm');
    if (editProjectForm) {
        editProjectForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            try {
                const id = document.getElementById('editProjectId')?.value;
                const name = document.getElementById('editProjectName')?.value.trim() || '';
                const clientId = document.getElementById('editProjectClient')?.value || '';
                const budget = parseFloat(document.getElementById('editProjectBudget')?.value) || 0;
                const startDate = document.getElementById('editProjectStartDate')?.value || '';
                const endDate = document.getElementById('editProjectEndDate')?.value || '';
                const type = document.getElementById('editProjectType')?.value || '';
                const status = document.getElementById('editProjectStatus')?.value || 'En attente';
                const location = document.getElementById('editProjectLocation')?.value.trim() || '';
                const description = document.getElementById('editProjectDescription')?.value.trim() || '';

                if (!id) {
                    showError("ID projet manquant");
                    return;
                }
                
                if (!name) {
                    showError("Le nom du projet est requis");
                    return;
                }
                if (!clientId) {
                    showError("Un client doit être sélectionné");
                    return;
                }

                await db.collection('projects').doc(id).update({
                    name,
                    clientId,
                    budget,
                    startDate,
                    endDate,
                    type,
                    status,
                    location,
                    description,
                    dateModified: firebase.firestore.FieldValue.serverTimestamp()
                });

                closeModal('editProjectModal');
                showSuccess("Projet modifié avec succès!");
                await loadProjects();
            } catch (error) {
                showError(`Erreur modification projet: ${error.message}`);
                console.error(error);
            }
        });
    }
}

// Supprimer un projet
async function deleteProject(id) {
    if (!id || !db) {
        showError("ID projet ou base de données non valide");
        return;
    }
    
    if (confirm("Êtes-vous sûr de vouloir supprimer ce projet ? Cette action est irréversible.")) {
        try {
            // Vérifier les dépendances avec limit(1) pour optimiser
            const [tasksSnapshot, financesSnapshot, documentsSnapshot] = await Promise.all([
                db.collection('tasks').where('projectId', '==', id).limit(1).get(),
                db.collection('finances').where('projectId', '==', id).limit(1).get(),
                db.collection('documents').where('projectId', '==', id).limit(1).get()
            ]);

            if (!tasksSnapshot.empty || !financesSnapshot.empty || !documentsSnapshot.empty) {
                showError("Impossible de supprimer ce projet car il est associé à des tâches, finances ou documents.");
                return;
            }

            await db.collection('projects').doc(id).delete();
            showSuccess("Projet supprimé avec succès!");
            await loadProjects();
        } catch (error) {
            showError(`Erreur suppression projet: ${error.message}`);
            console.error(error);
        }
    }
}

// Rechercher des projets
function searchProjects() {
    const searchInput = document.getElementById('projectSearchInput')?.value.toLowerCase() || '';
    const projectList = document.getElementById('projectList');
    if (!projectList) return;
    
    projectList.innerHTML = '';

    // Filtrage des projets
    const filteredProjects = projects.filter(project => 
        (project.name && project.name.toLowerCase().includes(searchInput)) ||
        (project.description && project.description.toLowerCase().includes(searchInput)) ||
        (project.location && project.location.toLowerCase().includes(searchInput)) ||
        (clients.find(c => c.id === project.clientId)?.name.toLowerCase().includes(searchInput))
    );

    if (filteredProjects.length === 0) {
        const li = document.createElement('li');
        li.textContent = 'Aucun résultat trouvé';
        projectList.appendChild(li);
        return;
    }

    filteredProjects.forEach(project => {
        const li = document.createElement('li');
        const clientName = clients.find(c => c.id === project.clientId)?.name || 'Client inconnu';
        const statusClass = project.status === 'En cours' ? 'status-en-cours' : 
                        project.status === 'Terminé' ? 'status-termine' : 'status-en-attente';

        li.innerHTML = `
            <div>
                <strong>${project.name || 'Sans nom'}</strong><br>
                <span class="status ${statusClass}">${project.status}</span>
                ${project.type ? `<span class="badge">${project.type}</span>` : ''}<br>
                Client: ${clientName}<br>
                Budget: ${parseFloat(project.budget || 0).toLocaleString('fr-MA')} MAD<br>
                ${project.startDate ? `Début: ${new Date(project.startDate).toLocaleDateString('fr-MA')}<br>` : ''}
                ${project.endDate ? `Fin prévue: ${new Date(project.endDate).toLocaleDateString('fr-MA')}<br>` : ''}
                ${project.location ? `Localisation: ${project.location}<br>` : ''}
                ${project.description ? `Description: ${project.description}` : ''}
            </div>
            <div class="button-group">
                <button class="edit" onclick="editProject('${project.id}')">Modifier</button>
                <button class="delete" onclick="deleteProject('${project.id}')">Supprimer</button>
            </div>
        `;
        projectList.appendChild(li);
    });
}

// Filtrer les projets
function filterProjects() {
    const clientFilter = document.getElementById('projectClientFilter')?.value || '';
    const projectList = document.getElementById('projectList');
    if (!projectList) return;
    
    projectList.innerHTML = '';

    // Filtrage des projets
    const filteredProjects = projects.filter(project => 
        clientFilter === '' || project.clientId === clientFilter
    );

    if (filteredProjects.length === 0) {
        const li = document.createElement('li');
        li.textContent = 'Aucun résultat trouvé';
        projectList.appendChild(li);
        return;
    }

    filteredProjects.forEach(project => {
        const li = document.createElement('li');
        const clientName = clients.find(c => c.id === project.clientId)?.name || 'Client inconnu';
        const statusClass = project.status === 'En cours' ? 'status-en-cours' : 
                        project.status === 'Terminé' ? 'status-termine' : 'status-en-attente';

        li.innerHTML = `
            <div>
                <strong>${project.name || 'Sans nom'}</strong><br>
                <span class="status ${statusClass}">${project.status}</span>
                ${project.type ? `<span class="badge">${project.type}</span>` : ''}<br>
                Client: ${clientName}<br>
                Budget: ${parseFloat(project.budget || 0).toLocaleString('fr-MA')} MAD<br>
                ${project.startDate ? `Début: ${new Date(project.startDate).toLocaleDateString('fr-MA')}<br>` : ''}
                ${project.endDate ? `Fin prévue: ${new Date(project.endDate).toLocaleDateString('fr-MA')}<br>` : ''}
                ${project.location ? `Localisation: ${project.location}<br>` : ''}
                ${project.description ? `Description: ${project.description}` : ''}
            </div>
            <div class="button-group">
                <button class="edit" onclick="editProject('${project.id}')">Modifier</button>
                <button class="delete" onclick="deleteProject('${project.id}')">Supprimer</button>
            </div>
        `;
        projectList.appendChild(li);
    });
}

// Initialisation des écouteurs d'événements pour les clients et projets
function setupEntitiesEventListeners() {
    // Clients
    const clientSearchInput = document.getElementById('clientSearchInput');
    if (clientSearchInput) {
        clientSearchInput.addEventListener('input', searchClients);
    }

    // Projets
    const projectSearchInput = document.getElementById('projectSearchInput');
    if (projectSearchInput) {
        projectSearchInput.addEventListener('input', searchProjects);
    }

    const projectClientFilter = document.getElementById('projectClientFilter');
    if (projectClientFilter) {
        projectClientFilter.addEventListener('change', filterProjects);
    }

    // Setup formulaires
    setupClientForm();
    setupEditClientForm();
    setupProjectForm();
    setupEditProjectForm();
}

// Initialiser les écouteurs d'événements lorsque le DOM est chargé
document.addEventListener('DOMContentLoaded', setupEntitiesEventListeners);

// Exporter les fonctions pour les autres modules
window.EntityManager = {
    loadClients,
    editClient,
    deleteClient,
    searchClients,
    loadProjects,
    editProject,
    deleteProject,
    searchProjects,
    filterProjects
};