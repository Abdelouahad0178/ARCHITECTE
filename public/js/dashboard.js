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

        let totalInvoiced = 0;
        let totalReceived = 0;
        let totalPending = 0;

        snapshot.forEach(doc => {
            const finance = { id: doc.id, ...doc.data() };
            finances.push(finance);

            const amount = parseFloat(finance.amount || 0);

            // Calculer les totaux pour le tableau de bord
            if (finance.type === 'Facture') {
                totalInvoiced += amount;
                if (finance.status === 'En attente') {
                    totalPending += amount;
                }
            } else if (finance.type === 'Paiement' && finance.status === 'Payé') {
                totalReceived += amount;
            }

            if (financeList) {
                const li = document.createElement('li');
                const projectName = projects.find(p => p.id === finance.projectId)?.name || '';
                const clientName = clients.find(c => c.id === finance.clientId)?.name || '';

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
                        <button class="edit" onclick="window.DashboardManager.editFinance('${finance.id}')">Modifier</button>
                        <button class="delete" onclick="window.DashboardManager.deleteFinance('${finance.id}')">Supprimer</button>
                    </div>
                `;
                financeList.appendChild(li);
            }
        });

        // Mettre à jour les totaux dans le tableau de bord
        const totalInvoicedElement = document.getElementById('totalInvoiced');
        const totalReceivedElement = document.getElementById('totalReceived');
        const totalPendingElement = document.getElementById('totalPending');

        if (totalInvoicedElement) totalInvoicedElement.textContent = totalInvoiced.toLocaleString('fr-MA') + ' MAD';
        if (totalReceivedElement) totalReceivedElement.textContent = totalReceived.toLocaleString('fr-MA') + ' MAD';
        if (totalPendingElement) totalPendingElement.textContent = totalPending.toLocaleString('fr-MA') + ' MAD';

        console.log("Finances chargées");
    } catch (error) {
        showError(`Erreur chargement finances: ${error.message}`);
        console.error(error);
        if (error.code === 'unavailable') {
            showError("Problème de connexion réseau. Vérifiez votre connexion.");
        }
    }
}

// Setup pour les formulaires de finances
function setupFinanceForms() {
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

    // Setup formulaire d'édition si nécessaire
    // Code pour configurer editFinanceForm
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
                <button class="edit" onclick="window.DashboardManager.editFinance('${finance.id}')">Modifier</button>
                <button class="delete" onclick="window.DashboardManager.deleteFinance('${finance.id}')">Supprimer</button>
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
                <button class="edit" onclick="window.DashboardManager.editFinance('${finance.id}')">Modifier</button>
                <button class="delete" onclick="window.DashboardManager.deleteFinance('${finance.id}')">Supprimer</button>
            </div>
        `;
        financeList.appendChild(li);
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

// Naviguer dans le calendrier
function prevMonth() {
    calendarCurrentMonth--;
    if (calendarCurrentMonth < 0) {
        calendarCurrentMonth = 11;
        calendarCurrentYear--;
    }
    renderCalendar();
}

function nextMonth() {
    calendarCurrentMonth++;
    if (calendarCurrentMonth > 11) {
        calendarCurrentMonth = 0;
        calendarCurrentYear++;
    }
    renderCalendar();
}

// Gérer les événements du calendrier
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

function closeEventModal() {
    const modal = document.getElementById('eventModal');
    if (modal) modal.style.display = 'none';
}

function setupEventForm() {
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

// Initialisation des écouteurs d'événements pour les finances et le calendrier
function setupDashboardFinancesCalendarEventListeners() {
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

    // Setup formulaires
    setupFinanceForms();
    setupEventForm();
}

// Initialiser les écouteurs d'événements lorsque le DOM est chargé
document.addEventListener('DOMContentLoaded', setupDashboardFinancesCalendarEventListeners);

// Exporter les fonctions pour les autres modules
window.DashboardManager = {
    loadDashboard,
    loadFinances,
    editFinance,
    deleteFinance,
    searchFinances,
    filterFinances,
    loadEvents,
    renderCalendar,
    prevMonth,
    nextMonth,
    openEventModal,
    closeEventModal,
    deleteEvent
};