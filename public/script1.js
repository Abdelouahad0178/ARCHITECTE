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
      const navButton = document.querySelector(`nav button[onclick="showSection('${sectionId}')"]`);
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
  
  /* ----- GESTION DES TÂCHES ----- */
  
  // Charger les tâches
  async function loadTasks() {
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
      const snapshot = await db.collection('tasks').get();
      if (!snapshot || snapshot.empty) {
        loadDashboard();
        return;
      }
  
      // Ensemble pour suivre les projectIds uniques déjà ajoutés au filtre
      const addedProjectIds = new Set();
  
      snapshot.forEach(doc => {
        const task = { id: doc.id, ...doc.data() };
        tasks.push(task);
  
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
  
      loadDashboard();
      console.log("Tâches chargées");
    } catch (error) {
      showError(`Erreur chargement tâches: ${error.message}`);
      console.error(error);
      if (error.code === 'unavailable') {
        showError("Problème de connexion réseau. Vérifiez votre connexion.");
      }
    }
  }
  
  // Ajouter une tâche
  const taskForm = document.getElementById('taskForm');
  if (taskForm) {
    taskForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!db) {
        showError("Base de données non initialisée");
        return;
      }
      try {
        const title = document.getElementById('taskTitle')?.value.trim() || '';
        const projectId = document.getElementById('taskProject')?.value || '';
        const dueDate = document.getElementById('taskDueDate')?.value || '';
        const priority = document.getElementById('taskPriority')?.value || 'Basse';
        const status = document.getElementById('taskStatus')?.value || 'À faire';
        const description = document.getElementById('taskDescription')?.value.trim() || '';
  
        if (!title) {
          showError("Le titre de la tâche est requis");
          return;
        }
        if (!projectId) {
          showError("Un projet doit être sélectionné");
          return;
        }
  
        await db.collection('tasks').add({
          title,
          projectId,
          dueDate,
          priority,
          status,
          description,
          dateCreated: firebase.firestore.FieldValue.serverTimestamp()
        });
  
        taskForm.reset();
        showSuccess("Tâche ajoutée avec succès!");
        await loadTasks();
      } catch (error) {
        showError(`Erreur ajout tâche: ${error.message}`);
        console.error(error);
      }
    });
  }
  
  // Modifier une tâche
  async function editTask(id) {
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
  }
  
  const editTaskForm = document.getElementById('editTaskForm');
  if (editTaskForm) {
    editTaskForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        const id = document.getElementById('editTaskId')?.value;
        const title = document.getElementById('editTaskTitle')?.value.trim() || '';
        const projectId = document.getElementById('editTaskProject')?.value || '';
        const dueDate = document.getElementById('editTaskDueDate')?.value || '';
        const priority = document.getElementById('editTaskPriority')?.value || 'Basse';
        const status = document.getElementById('editTaskStatus')?.value || 'À faire';
        const description = document.getElementById('editTaskDescription')?.value.trim() || '';
  
        if (!id) {
          showError("ID tâche manquant");
          return;
        }
        
        if (!title) {
          showError("Le titre de la tâche est requis");
          return;
        }
        if (!projectId) {
          showError("Un projet doit être sélectionné");
          return;
        }
  
        await db.collection('tasks').doc(id).update({
          title,
          projectId,
          dueDate,
          priority,
          status,
          description,
          dateModified: firebase.firestore.FieldValue.serverTimestamp()
        });
  
        closeModal('editTaskModal');
        showSuccess("Tâche modifiée avec succès!");
        await loadTasks();
      } catch (error) {
        showError(`Erreur modification tâche: ${error.message}`);
        console.error(error);
      }
    });
  }
  
  // Supprimer une tâche
  async function deleteTask(id) {
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
  }
  
  // Filtrer les tâches
  function filterTasks() {
    const statusFilter = document.getElementById('taskStatusFilter')?.value || '';
    const projectFilter = document.getElementById('taskProjectFilter')?.value || '';
    const taskList = document.getElementById('taskList');
    if (!taskList) return;
    
    taskList.innerHTML = '';
  
    // Filtrage des tâches
    const filteredTasks = tasks.filter(task => 
      (statusFilter === '' || task.status === statusFilter) &&
      (projectFilter === '' || task.projectId === projectFilter)
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
  }
  
  // Rechercher des tâches
  function searchTasks() {
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
  }
  
  /* ----- GESTION DES FINANCES ----- */
  
  // Charger les finances
  async function loadFinances() {
    if (!db) {
      showError("Base de données non initialisée");
      return;
    }
    try {
      const financeList = document.getElementById('financeList');
      if (financeList) financeList.innerHTML = '';
  
      finances = [];
      const snapshot = await db.collection('finances').get();
      if (!snapshot || snapshot.empty) {
        return;
      }
  
      snapshot.forEach(doc => {
        const finance = { id: doc.id, ...doc.data() };
        finances.push(finance);
  
        if (financeList) {
          const li = document.createElement('li');
          const projectName = projects.find(p => p.id === finance.projectId)?.name || '';
          const clientName = clients.find(c => c.id === finance.clientId)?.name || '';
          const amount = parseFloat(finance.amount || 0);
  
          li.innerHTML = `
            <div>
              <strong>${finance.type} - ${amount.toLocaleString('fr-MA')} MAD</strong><br>
              <span class="badge">${finance.status}</span><br>
              Date: ${finance.date ? new Date(finance.date).toLocaleDateString('fr-MA') : 'Non spécifiée'}<br>
              ${projectName ? `Projet: ${projectName}<br>` : ''}
              ${clientName ? `Client: ${clientName}<br>` : ''}
              ${finance.description ? `Description: ${finance.description}` : ''}
            </div>
            <div class="button-group">
              <button class="edit" onclick="editFinance('${finance.id}')">Modifier</button>
              <button class="delete" onclick="deleteFinance('${finance.id}')">Supprimer</button>
            </div>
          `;
          financeList.appendChild(li);
        }
      });
  
      console.log("Finances chargées");
    } catch (error) {
      showError(`Erreur chargement finances: ${error.message}`);
      console.error(error);
      if (error.code === 'unavailable') {
        showError("Problème de connexion réseau. Vérifiez votre connexion.");
      }
    }
  }
  
  // Ajouter une transaction financière
  const financeForm = document.getElementById('financeForm');
  if (financeForm) {
    financeForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!db) {
        showError("Base de données non initialisée");
        return;
      }
      try {
        const type = document.getElementById('financeType')?.value || '';
        const amount = parseFloat(document.getElementById('financeAmount')?.value) || 0;
        const date = document.getElementById('financeDate')?.value || '';
        const projectId = document.getElementById('financeProject')?.value || '';
        const clientId = document.getElementById('financeClient')?.value || '';
        const status = document.getElementById('financeStatus')?.value || 'En attente';
        const description = document.getElementById('financeDescription')?.value.trim() || '';
  
        if (isNaN(amount) || amount <= 0) {
          showError("Le montant doit être un nombre positif");
          return;
        }
        if (!type) {
          showError("Le type de transaction est requis");
          return;
        }
  
        await db.collection('finances').add({
          type,
          amount,
          date,
          projectId,
          clientId,
          status,
          description,
          dateCreated: firebase.firestore.FieldValue.serverTimestamp()
        });
  
        financeForm.reset();
        showSuccess("Transaction financière ajoutée avec succès!");
        await loadFinances();
      } catch (error) {
        showError(`Erreur ajout transaction: ${error.message}`);
        console.error(error);
      }
    });
  }
  
  // Modifier une transaction financière
  async function editFinance(id) {
    if (!id || !db) {
      showError("ID transaction ou base de données non valide");
      return;
    }
    
    try {
      const financeDoc = await db.collection('finances').doc(id).get();
      if (!financeDoc.exists) {
        showError("Transaction non trouvée!");
        return;
      }
  
      const finance = financeDoc.data();
      const editFinanceId = document.getElementById('editFinanceId');
      const editFinanceType = document.getElementById('editFinanceType');
      const editFinanceAmount = document.getElementById('editFinanceAmount');
      const editFinanceDate = document.getElementById('editFinanceDate');
      const editFinanceProject = document.getElementById('editFinanceProject');
      const editFinanceClient = document.getElementById('editFinanceClient');
      const editFinanceStatus = document.getElementById('editFinanceStatus');
      const editFinanceDescription = document.getElementById('editFinanceDescription');
      
      if (editFinanceId) editFinanceId.value = id;
      if (editFinanceType) editFinanceType.value = finance.type || '';
      if (editFinanceAmount) editFinanceAmount.value = finance.amount || '';
      if (editFinanceDate) editFinanceDate.value = finance.date || '';
      if (editFinanceProject) editFinanceProject.value = finance.projectId || '';
      if (editFinanceClient) editFinanceClient.value = finance.clientId || '';
      if (editFinanceStatus) editFinanceStatus.value = finance.status || 'En attente';
      if (editFinanceDescription) editFinanceDescription.value = finance.description || '';
  
      openModal('editFinanceModal');
    } catch (error) {
      showError(`Erreur chargement transaction: ${error.message}`);
      console.error(error);
    }
  }
  
  const editFinanceForm = document.getElementById('editFinanceForm');
  if (editFinanceForm) {
    editFinanceForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        const id = document.getElementById('editFinanceId')?.value;
        const type = document.getElementById('editFinanceType')?.value || '';
        const amount = parseFloat(document.getElementById('editFinanceAmount')?.value) || 0;
        const date = document.getElementById('editFinanceDate')?.value || '';
        const projectId = document.getElementById('editFinanceProject')?.value || '';
        const clientId = document.getElementById('editFinanceClient')?.value || '';
        const status = document.getElementById('editFinanceStatus')?.value || 'En attente';
        const description = document.getElementById('editFinanceDescription')?.value.trim() || '';
  
        if (!id) {
          showError("ID transaction manquant");
          return;
        }
        
        if (isNaN(amount) || amount <= 0) {
          showError("Le montant doit être un nombre positif");
          return;
        }
        if (!type) {
          showError("Le type de transaction est requis");
          return;
        }
  
        await db.collection('finances').doc(id).update({
          type,
          amount,
          date,
          projectId,
          clientId,
          status,
          description,
          dateModified: firebase.firestore.FieldValue.serverTimestamp()
        });
  
        closeModal('editFinanceModal');
        showSuccess("Transaction modifiée avec succès!");
        await loadFinances();
      } catch (error) {
        showError(`Erreur modification transaction: ${error.message}`);
        console.error(error);
      }
    });
  }
  
  // Supprimer une transaction financière
  async function deleteFinance(id) {
    if (!id || !db) {
      showError("ID transaction ou base de données non valide");
      return;
    }
    
    if (confirm("Êtes-vous sûr de vouloir supprimer cette transaction ? Cette action est irréversible.")) {
      try {
        await db.collection('finances').doc(id).delete();
        showSuccess("Transaction supprimée avec succès!");
        await loadFinances();
      } catch (error) {
        showError(`Erreur suppression transaction: ${error.message}`);
        console.error(error);
      }
    }
  }
  // Filtrer les transactions financières
function filterFinances() {
    const typeFilter = document.getElementById('financeTypeFilter')?.value || '';
    const projectFilter = document.getElementById('financeProjectFilter')?.value || '';
    const financeList = document.getElementById('financeList');
    if (!financeList) return;
    
    financeList.innerHTML = '';
  
    // Filtrage des finances
    const filteredFinances = finances.filter(finance => 
      (typeFilter === '' || finance.type === typeFilter) &&
      (projectFilter === '' || finance.projectId === projectFilter)
    );
  
    if (filteredFinances.length === 0) {
      const li = document.createElement('li');
      li.textContent = 'Aucun résultat trouvé';
      financeList.appendChild(li);
      return;
    }
  
    filteredFinances.forEach(finance => {
      const li = document.createElement('li');
      const projectName = projects.find(p => p.id === finance.projectId)?.name || '';
      const clientName = clients.find(c => c.id === finance.clientId)?.name || '';
      const amount = parseFloat(finance.amount || 0);
  
      li.innerHTML = `
        <div>
          <strong>${finance.type} - ${amount.toLocaleString('fr-MA')} MAD</strong><br>
          <span class="badge">${finance.status}</span><br>
          Date: ${finance.date ? new Date(finance.date).toLocaleDateString('fr-MA') : 'Non spécifiée'}<br>
          ${projectName ? `Projet: ${projectName}<br>` : ''}
          ${clientName ? `Client: ${clientName}<br>` : ''}
          ${finance.description ? `Description: ${finance.description}` : ''}
        </div>
        <div class="button-group">
          <button class="edit" onclick="editFinance('${finance.id}')">Modifier</button>
          <button class="delete" onclick="deleteFinance('${finance.id}')">Supprimer</button>
        </div>
      `;
      financeList.appendChild(li);
    });
  }
  
  // Rechercher des transactions financières
  function searchFinances() {
    const searchInput = document.getElementById('financeSearchInput')?.value.toLowerCase() || '';
    const financeList = document.getElementById('financeList');
    if (!financeList) return;
    
    financeList.innerHTML = '';
  
    // Filtrage des finances
    const filteredFinances = finances.filter(finance => 
      (finance.description && finance.description.toLowerCase().includes(searchInput)) ||
      (finance.type && finance.type.toLowerCase().includes(searchInput)) ||
      (finance.status && finance.status.toLowerCase().includes(searchInput)) ||
      (finance.amount && finance.amount.toString().includes(searchInput))
    );
  
    if (filteredFinances.length === 0) {
      const li = document.createElement('li');
      li.textContent = 'Aucun résultat trouvé';
      financeList.appendChild(li);
      return;
    }
  
    filteredFinances.forEach(finance => {
      const li = document.createElement('li');
      const projectName = projects.find(p => p.id === finance.projectId)?.name || '';
      const clientName = clients.find(c => c.id === finance.clientId)?.name || '';
      const amount = parseFloat(finance.amount || 0);
  
      li.innerHTML = `
        <div>
          <strong>${finance.type} - ${amount.toLocaleString('fr-MA')} MAD</strong><br>
          <span class="badge">${finance.status}</span><br>
          Date: ${finance.date ? new Date(finance.date).toLocaleDateString('fr-MA') : 'Non spécifiée'}<br>
          ${projectName ? `Projet: ${projectName}<br>` : ''}
          ${clientName ? `Client: ${clientName}<br>` : ''}
          ${finance.description ? `Description: ${finance.description}` : ''}
        </div>
        <div class="button-group">
          <button class="edit" onclick="editFinance('${finance.id}')">Modifier</button>
          <button class="delete" onclick="deleteFinance('${finance.id}')">Supprimer</button>
        </div>
      `;
      financeList.appendChild(li);
    });
  }
  
  /* ----- GESTION DOCUMENTAIRE ----- */
  
  // Charger les documents
  async function loadDocuments() {
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
  
          // Ici, nous modifions l'affichage pour éliminer l'effet de bouton sur les documents
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
              <span onclick="editDocument('${doc.id}')">Modifier</span>
              <span onclick="deleteDocument('${doc.id}')">Supprimer</span>
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
  }
  
  // Ajouter un document
  const documentForm = document.getElementById('documentForm');
  if (documentForm) {
    documentForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!db || !storage) {
        showError("Base de données ou stockage non initialisé");
        return;
      }
      try {
        const title = document.getElementById('documentTitle')?.value.trim() || '';
        const type = document.getElementById('documentType')?.value || '';
        const projectId = document.getElementById('documentProject')?.value || '';
        const clientId = document.getElementById('documentClient')?.value || '';
        const date = document.getElementById('documentDate')?.value || '';
        const description = document.getElementById('documentDescription')?.value.trim() || '';
        const fileInput = document.getElementById('documentFile');
        const file = fileInput?.files?.[0];
  
        if (!title) {
          showError("Le titre du document est requis");
          return;
        }
        if (!type) {
          showError("Le type de document est requis");
          return;
        }
  
        let fileUrl = '';
        if (file) {
          try {
            const storageRef = storage.ref(`documents/${Date.now()}_${file.name}`);
            const snapshot = await storageRef.put(file);
            fileUrl = await snapshot.ref.getDownloadURL();
          } catch (uploadError) {
            showError(`Erreur téléchargement: ${uploadError.message}`);
            console.error(uploadError);
            return;
          }
        }
  
        await db.collection('documents').add({
          title,
          type,
          projectId,
          clientId,
          date,
          description,
          fileUrl,
          dateCreated: firebase.firestore.FieldValue.serverTimestamp()
        });
  
        documentForm.reset();
        showSuccess("Document ajouté avec succès!");
        await loadDocuments();
      } catch (error) {
        showError(`Erreur ajout document: ${error.message}`);
        console.error(error);
      }
    });
  }
  
  // Modifier un document
  async function editDocument(id) {
    if (!id || !db) {
      showError("ID document ou base de données non valide");
      return;
    }
    
    try {
      const documentDoc = await db.collection('documents').doc(id).get();
      if (!documentDoc.exists) {
        showError("Document non trouvé!");
        return;
      }
  
      const documentItem = documentDoc.data();
      const editDocumentId = document.getElementById('editDocumentId');
      const editDocumentTitle = document.getElementById('editDocumentTitle');
      const editDocumentType = document.getElementById('editDocumentType');
      const editDocumentProject = document.getElementById('editDocumentProject');
      const editDocumentClient = document.getElementById('editDocumentClient');
      const editDocumentDate = document.getElementById('editDocumentDate');
      const editDocumentDescription = document.getElementById('editDocumentDescription');
      
      if (editDocumentId) editDocumentId.value = id;
      if (editDocumentTitle) editDocumentTitle.value = documentItem.title || '';
      if (editDocumentType) editDocumentType.value = documentItem.type || '';
      if (editDocumentProject) editDocumentProject.value = documentItem.projectId || '';
      if (editDocumentClient) editDocumentClient.value = documentItem.clientId || '';
      if (editDocumentDate) editDocumentDate.value = documentItem.date || '';
      if (editDocumentDescription) editDocumentDescription.value = documentItem.description || '';
  
      openModal('editDocumentModal');
    } catch (error) {
      showError(`Erreur chargement document: ${error.message}`);
      console.error(error);
    }
  }
  
  const editDocumentForm = document.getElementById('editDocumentForm');
  if (editDocumentForm) {
    editDocumentForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        const id = document.getElementById('editDocumentId')?.value;
        const title = document.getElementById('editDocumentTitle')?.value.trim() || '';
        const type = document.getElementById('editDocumentType')?.value || '';
        const projectId = document.getElementById('editDocumentProject')?.value || '';
        const clientId = document.getElementById('editDocumentClient')?.value || '';
        const date = document.getElementById('editDocumentDate')?.value || '';
        const description = document.getElementById('editDocumentDescription')?.value.trim() || '';
  
        if (!id) {
          showError("ID document manquant");
          return;
        }
        
        if (!title) {
          showError("Le titre du document est requis");
          return;
        }
        if (!type) {
          showError("Le type de document est requis");
          return;
        }
  
        await db.collection('documents').doc(id).update({
          title,
          type,
          projectId,
          clientId,
          date,
          description,
          dateModified: firebase.firestore.FieldValue.serverTimestamp()
        });
  
        closeModal('editDocumentModal');
        showSuccess("Document modifié avec succès!");
        await loadDocuments();
      } catch (error) {
        showError(`Erreur modification document: ${error.message}`);
        console.error(error);
      }
    });
  }
  
  // Supprimer un document
  async function deleteDocument(id) {
    if (!id || !db) {
      showError("ID document ou base de données non valide");
      return;
    }
    
    if (confirm("Êtes-vous sûr de vouloir supprimer ce document ? Cette action est irréversible.")) {
      try {
        // Supprimer le fichier dans le stockage si présent
        const docRef = await db.collection('documents').doc(id).get();
        if (docRef.exists && docRef.data().fileUrl) {
          try {
            const fileRef = storage.refFromURL(docRef.data().fileUrl);
            await fileRef.delete();
          } catch (deleteError) {
            console.error("Erreur suppression fichier:", deleteError);
            // Continuer même si la suppression du fichier échoue
          }
        }
        
        await db.collection('documents').doc(id).delete();
        showSuccess("Document supprimé avec succès!");
        await loadDocuments();
      } catch (error) {
        showError(`Erreur suppression document: ${error.message}`);
        console.error(error);
      }
    }
  }
  
  // Filtrer les documents
  function filterDocuments() {
    const typeFilter = document.getElementById('documentTypeFilter')?.value || '';
    const projectFilter = document.getElementById('documentProjectFilter')?.value || '';
    const documentList = document.getElementById('documentList');
    if (!documentList) return;
    
    documentList.innerHTML = '';
  
    // Filtrage des documents
    const filteredDocuments = documents.filter(doc => 
      (typeFilter === '' || doc.type === typeFilter) &&
      (projectFilter === '' || doc.projectId === projectFilter)
    );
  
    if (filteredDocuments.length === 0) {
      const li = document.createElement('li');
      li.textContent = 'Aucun résultat trouvé';
      documentList.appendChild(li);
      return;
    }
  
    filteredDocuments.forEach(doc => {
      const li = document.createElement('li');
      const projectName = projects.find(p => p.id === doc.projectId)?.name || '';
      const clientName = clients.find(c => c.id === doc.clientId)?.name || '';
  
      // Même modification pour l'affichage des documents filtrés
      li.innerHTML = `
        <div>
          <strong>${doc.title || 'Sans titre'}</strong><br>
          <span class="badge">${doc.type || 'Non spécifié'}</span><br>
          Date: ${doc.date ? new Date(doc.date).toLocaleDateString('fr-MA') : 'Non spécifiée'}<br>
          ${projectName ? `Projet: ${projectName}<br>` : ''}
          ${clientName ? `Client: ${clientName}<br>` : ''}
          ${doc.description ? `Description: ${doc.description}<br>` : ''}
          ${doc.fileUrl ? `<a href="${doc.fileUrl}" target="_blank" class="document-link">Voir le document</a>` : 'Pas de fichier associé'}
        </div>
        <div class="button-group">
          <span onclick="editDocument('${doc.id}')">Modifier</span>
          <span onclick="deleteDocument('${doc.id}')">Supprimer</span>
        </div>
      `;
      documentList.appendChild(li);
    });
  }
  
  // Rechercher des documents
  function searchDocuments() {
    const searchInput = document.getElementById('documentSearchInput')?.value.toLowerCase() || '';
    const documentList = document.getElementById('documentList');
    if (!documentList) return;
    
    documentList.innerHTML = '';
  
    // Filtrage des documents
    const filteredDocuments = documents.filter(doc => 
      (doc.title && doc.title.toLowerCase().includes(searchInput)) ||
      (doc.description && doc.description.toLowerCase().includes(searchInput)) ||
      (doc.type && doc.type.toLowerCase().includes(searchInput))
    );
  
    if (filteredDocuments.length === 0) {
      const li = document.createElement('li');
      li.textContent = 'Aucun résultat trouvé';
      documentList.appendChild(li);
      return;
    }
  
    filteredDocuments.forEach(doc => {
      const li = document.createElement('li');
      const projectName = projects.find(p => p.id === doc.projectId)?.name || '';
      const clientName = clients.find(c => c.id === doc.clientId)?.name || '';
  
      // Même modification pour l'affichage des documents recherchés
      li.innerHTML = `
        <div>
          <strong>${doc.title || 'Sans titre'}</strong><br>
          <span class="badge">${doc.type || 'Non spécifié'}</span><br>
          Date: ${doc.date ? new Date(doc.date).toLocaleDateString('fr-MA') : 'Non spécifiée'}<br>
          ${projectName ? `Projet: ${projectName}<br>` : ''}
          ${clientName ? `Client: ${clientName}<br>` : ''}
          ${doc.description ? `Description: ${doc.description}<br>` : ''}
          ${doc.fileUrl ? `<a href="${doc.fileUrl}" target="_blank" class="document-link">Voir le document</a>` : 'Pas de fichier associé'}
        </div>
        <div class="button-group">
          <span onclick="editDocument('${doc.id}')">Modifier</span>
          <span onclick="deleteDocument('${doc.id}')">Supprimer</span>
        </div>
      `;
      documentList.appendChild(li);
    });
  }
  
  /* ----- GESTION DU CALENDRIER ----- */
  
  // Charger les événements
  async function loadEvents() {
    if (!db) {
      showError("Base de données non initialisée");
      return;
    }
    try {
      events = [];
      const snapshot = await db.collection('events').get();
      if (!snapshot || snapshot.empty) {
        renderCalendar();
        return;
      }
  
      snapshot.forEach(doc => {
        const event = { id: doc.id, ...doc.data() };
        events.push(event);
      });
  
      renderCalendar();
      console.log("Événements chargés");
    } catch (error) {
      showError(`Erreur chargement événements: ${error.message}`);
      console.error(error);
      if (error.code === 'unavailable') {
        showError("Problème de connexion réseau. Vérifiez votre connexion.");
      }
    }
  }
  
  // Afficher le calendrier
  function renderCalendar() {
    const calendarGrid = document.getElementById('calendarGrid');
    const currentMonthYearElem = document.getElementById('currentMonthYear');
    if (!calendarGrid || !currentMonthYearElem) return;
  
    const date = new Date(calendarCurrentYear, calendarCurrentMonth, 1);
    const today = new Date();
  
    const options = { month: 'long', year: 'numeric' };
    currentMonthYearElem.textContent = date.toLocaleDateString('fr-MA', options);
  
    calendarGrid.innerHTML = '';
  
    const daysOfWeek = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    daysOfWeek.forEach(day => {
      const dayHeader = document.createElement('div');
      dayHeader.textContent = day;
      dayHeader.style.fontWeight = 'bold';
      dayHeader.style.textAlign = 'center';
      dayHeader.style.padding = '10px';
      dayHeader.style.backgroundColor = '#f0f0f0';
      calendarGrid.appendChild(dayHeader);
    });
  
    const firstDayOfMonth = date.getDay();
    for (let i = 0; i < firstDayOfMonth; i++) {
      const emptyDay = document.createElement('div');
      emptyDay.className = 'calendar-day';
      emptyDay.style.backgroundColor = '#f9f9f9';
      calendarGrid.appendChild(emptyDay);
    }
  
    const lastDay = new Date(calendarCurrentYear, calendarCurrentMonth + 1, 0).getDate();
    for (let day = 1; day <= lastDay; day++) {
      const dayCell = document.createElement('div');
      dayCell.className = 'calendar-day';
  
      if (today.getDate() === day && today.getMonth() === calendarCurrentMonth && today.getFullYear() === calendarCurrentYear) {
        dayCell.classList.add('today');
      }
  
      const dayNumber = document.createElement('div');
      dayNumber.textContent = day;
      dayNumber.style.fontWeight = 'bold';
      dayNumber.style.marginBottom = '5px';
      dayCell.appendChild(dayNumber);
  
      const addButton = document.createElement('button');
      addButton.textContent = '+';
      addButton.style.fontSize = '0.8em';
      addButton.style.padding = '2px 5px';
      addButton.style.float = 'right';
      addButton.onclick = function() {
        openEventModal(new Date(calendarCurrentYear, calendarCurrentMonth, day));
      };
      dayNumber.appendChild(addButton);
  
      // Format de date YYYY-MM-DD
      const dateString = `${calendarCurrentYear}-${(calendarCurrentMonth + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      const dayEvents = events.filter(event => event.date === dateString);
  
      dayEvents.forEach(event => {
        const eventDiv = document.createElement('div');
        eventDiv.className = 'event';
        eventDiv.textContent = event.title;
        eventDiv.onclick = function(e) {
          e.preventDefault();
          e.stopPropagation();
          openEventModal(null, event.id);
        };
        dayCell.appendChild(eventDiv);
      });
  
      calendarGrid.appendChild(dayCell);
    }
  }
  
  // Mois précédent
  function prevMonth() {
    calendarCurrentMonth--;
    if (calendarCurrentMonth < 0) {
      calendarCurrentMonth = 11;
      calendarCurrentYear--;
    }
    renderCalendar();
  }
  
  // Mois suivant
  function nextMonth() {
    calendarCurrentMonth++;
    if (calendarCurrentMonth > 11) {
      calendarCurrentMonth = 0;
      calendarCurrentYear++;
    }
    renderCalendar();
  }
  
  // Ouvrir la modal d'événement
  function openEventModal(date, eventId) {
    const modal = document.getElementById('eventModal');
    const form = document.getElementById('eventForm');
    if (!modal || !form) return;
  
    form.reset();
  
    if (date) {
      const dateElem = document.getElementById('eventDate');
      if (dateElem) dateElem.value = date.toISOString().split('T')[0];
    }
  
    if (eventId) {
      const event = events.find(e => e.id === eventId);
      if (event) {
        const eventTitle = document.getElementById('eventTitle');
        const eventDate = document.getElementById('eventDate');
        const eventTime = document.getElementById('eventTime');
        const eventType = document.getElementById('eventType');
        const eventProject = document.getElementById('eventProject');
        const eventDescription = document.getElementById('eventDescription');
        
        if (eventTitle) eventTitle.value = event.title || '';
        if (eventDate) eventDate.value = event.date || '';
        if (eventTime) eventTime.value = event.time || '';
        if (eventType) eventType.value = event.type || 'Rendez-vous';
        if (eventProject) eventProject.value = event.projectId || '';
        if (eventDescription) eventDescription.value = event.description || '';
  
        // Supprimer le bouton de suppression s'il existe déjà
        const existingDeleteButton = form.querySelector('button.delete');
        if (existingDeleteButton) existingDeleteButton.remove();
  
        // Ajouter bouton de suppression
        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Supprimer';
        deleteButton.className = 'delete';
        deleteButton.type = 'button';
        deleteButton.onclick = function() {
          if (confirm('Voulez-vous supprimer cet événement?')) {
            deleteEvent(eventId);
            closeEventModal();
          }
        };
        form.appendChild(deleteButton);
  
        form.dataset.eventId = eventId;
      }
    } else {
      const existingDeleteButton = form.querySelector('button.delete');
      if (existingDeleteButton) existingDeleteButton.remove();
      delete form.dataset.eventId;
    }
  
    modal.style.display = 'block';
  }
  
  // Fermer la modal d'événement
  function closeEventModal() {
    const modal = document.getElementById('eventModal');
    if (modal) modal.style.display = 'none';
  }
  
  // Soumettre le formulaire d'événement
  const eventForm = document.getElementById('eventForm');
  if (eventForm) {
    eventForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      if (!db) {
        showError("Base de données non initialisée");
        return;
      }
      try {
        const title = document.getElementById('eventTitle')?.value.trim() || '';
        const date = document.getElementById('eventDate')?.value || '';
        const time = document.getElementById('eventTime')?.value || '';
        const type = document.getElementById('eventType')?.value || 'Rendez-vous';
        const projectId = document.getElementById('eventProject')?.value || '';
        const description = document.getElementById('eventDescription')?.value.trim() || '';
  
        if (!title) {
          showError("Le titre de l'événement est requis");
          return;
        }
        if (!date) {
          showError("La date de l'événement est requise");
          return;
        }
  
        const eventData = {
          title,
          date,
          time,
          type,
          projectId,
          description,
          lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
        };
  
        const eventId = this.dataset.eventId;
        if (eventId) {
          await db.collection('events').doc(eventId).update(eventData);
          showSuccess('Événement mis à jour avec succès');
        } else {
          eventData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
          await db.collection('events').add(eventData);
          showSuccess('Événement ajouté avec succès');
        }
  
        closeEventModal();
        await loadEvents();
      } catch (error) {
        showError(`Erreur: ${error.message}`);
        console.error(error);
      }
    });
  }
  
  // Supprimer un événement
  async function deleteEvent(id) {
    if (!id || !db) {
      showError("ID événement ou base de données non valide");
      return;
    }
    
    try {
      await db.collection('events').doc(id).delete();
      showSuccess('Événement supprimé avec succès');
      await loadEvents();
    } catch (error) {
      showError(`Erreur suppression événement: ${error.message}`);
      console.error(error);
    }
  }
  
  /* ----- TABLEAU DE BORD ----- */
  
  // Charger le tableau de bord
  function loadDashboard() {
    const dashboardProjects = document.getElementById('dashboardProjects');
    if (dashboardProjects) {
      dashboardProjects.innerHTML = '';
  
      // Projets récents en cours
      const recentProjects = projects
        .filter(project => project.status === 'En cours')
        .sort((a, b) => {
          // Utiliser dateCreated si disponible, sinon comparer par ID
          const dateA = a.dateCreated ? new Date(a.dateCreated) : null;
          const dateB = b.dateCreated ? new Date(b.dateCreated) : null;
          
          if (dateA && dateB) return dateB - dateA;
          return 0; // Si pas de date, maintenir l'ordre
        })
        .slice(0, 5);
  
      if (recentProjects.length === 0) {
        dashboardProjects.innerHTML = '<p>Aucun projet en cours</p>';
      } else {
        const ul = document.createElement('ul');
        ul.style.marginTop = '10px';
  
        recentProjects.forEach(project => {
          const li = document.createElement('li');
          li.innerHTML = `
            <strong>${project.name || 'Sans nom'}</strong>
            <span class="badge">Budget: ${parseFloat(project.budget || 0).toLocaleString('fr-MA')} MAD</span>
          `;
          ul.appendChild(li);
        });
  
        dashboardProjects.appendChild(ul);
      }
    }
  
    const dashboardTasks = document.getElementById('dashboardTasks');
    if (dashboardTasks) {
      dashboardTasks.innerHTML = '';
  
      // Tâches urgentes non terminées
      const urgentTasks = tasks
        .filter(task => task.priority === 'Haute' && task.status !== 'Terminée')
        .sort((a, b) => {
          // Trier par date d'échéance si disponible
          if (a.dueDate && b.dueDate) {
            return new Date(a.dueDate) - new Date(b.dueDate);
          }
          if (a.dueDate) return -1; // A a une date, B non
          if (b.dueDate) return 1;  // B a une date, A non
          return 0;
        })
        .slice(0, 5);
  
      if (urgentTasks.length === 0) {
        dashboardTasks.innerHTML = '<p>Aucune tâche urgente</p>';
      } else {
        const ul = document.createElement('ul');
        ul.style.marginTop = '10px';
  
        urgentTasks.forEach(task => {
          const li = document.createElement('li');
          const projectName = projects.find(p => p.id === task.projectId)?.name || 'Projet inconnu';
          
          // Calcul du nombre de jours restants jusqu'à l'échéance
          const daysUntilDue = task.dueDate 
            ? Math.ceil((new Date(task.dueDate) - new Date()) / (1000 * 60 * 60 * 24)) 
            : null;
  
          li.innerHTML = `
            <strong>${task.title || task.description || 'Sans titre'}</strong><br>
            Projet: ${projectName}<br>
            ${task.dueDate ? `Échéance: ${new Date(task.dueDate).toLocaleDateString('fr-MA')}` : ''}
            ${daysUntilDue !== null ? 
              `<span class="badge priority-${daysUntilDue <= 0 ? 'haute' : daysUntilDue <= 3 ? 'moyenne' : 'basse'}">
                ${daysUntilDue <= 0 ? 'En retard' : `${daysUntilDue} jour(s) restant(s)`}
              </span>` : ''}
          `;
          ul.appendChild(li);
        });
  
        dashboardTasks.appendChild(ul);
      }
    }
  }
  
  /* ----- ÉCOUTEURS D'ÉVÉNEMENTS ----- */
  /* ----- ÉCOUTEURS D'ÉVÉNEMENTS ----- */

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

// Finances
const financeSearchInput = document.getElementById('financeSearchInput');
if (financeSearchInput) {
  financeSearchInput.addEventListener('input', searchFinances);
}

const financeTypeFilter = document.getElementById('financeTypeFilter');
if (financeTypeFilter) {
  financeTypeFilter.addEventListener('change', filterFinances);
}

const financeProjectFilter = document.getElementById('financeProjectFilter');
if (financeProjectFilter) {
  financeProjectFilter.addEventListener('change', filterFinances);
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

// Calendrier
const prevMonthBtn = document.getElementById('prevMonth');
if (prevMonthBtn) {
  prevMonthBtn.addEventListener('click', prevMonth);
}

const nextMonthBtn = document.getElementById('nextMonth');
if (nextMonthBtn) {
  nextMonthBtn.addEventListener('click', nextMonth);
}

// Boutons de fermeture des modales
const closeButtons = document.querySelectorAll('.close-modal');
if (closeButtons) {
  closeButtons.forEach(button => {
    const modalId = button.getAttribute('data-modal');
    if (modalId) {
      button.addEventListener('click', () => closeModal(modalId));
    }
  });
}



/* ----- INITIALISATION ----- */

// Fonction d'initialisation principale
async function initApp() {
    try {
      // Ne pas utiliser firebase.database() si non disponible
      // La vérification de connectivité peut être faite autrement
      console.log("Démarrage de l'initialisation de l'application");
  
      // Préférer la redirection vers la section principale si aucune n'est sélectionnée
      const activeSection = document.querySelector('.section.active');
      if (!activeSection) {
        showSection('dashboard');
      }
  
      // Charger les données de manière séquentielle pour éviter les problèmes de référence
      if (db) {
        await loadClients();
        await loadProjects();
        
        // Charger le reste des données en parallèle
        await Promise.all([
          loadTasks(),
          loadFinances(),
          loadDocuments(),
          loadEvents()
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
  
  // Initialiser l'application lorsque le DOM est chargé
  document.addEventListener('DOMContentLoaded', initApp);
  
  // Gestion des déconnexions et reconnexions sans utiliser firebase.database()
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
