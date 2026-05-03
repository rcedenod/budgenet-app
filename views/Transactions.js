import { Input } from '../components/Input.js';
import { Select } from '../components/Select.js';
import { Textarea } from '../components/Textarea.js';
import { Button } from '../components/Button.js';

export class Transactions {
    _container = null;
    _db = null;
    _toast = null;
    _confirmDialog = null;
    _transactions = [];
    _categories = [];
    _cssPath = './views/styles/Transactions.css';

    // ... (referencias a inputs)
    _transactionTypeSelect = null;
    _transactionAmountInput = null;
    _transactionDateInput = null;
    _transactionCategorySelect = null;
    _transactionDescriptionTextarea = null;
    _addTransactionButton = null;
    _filterTypeSelect = null;
    _filterCategorySelect = null;
    _searchTextInput = null;
    _applyFilterButton = null;
    _clearFilterButton = null;

    _transactionsListContainer = null;
    _currentEditingTransactionId = null;
    _onTransactionsUpdated = null;
    _onCategoryDeleted = null;
    _onCategoriesUpdated = null;

    constructor(container, db, toast, confirmDialog) {
        if (!(container instanceof HTMLElement)) {
            throw new Error('Transactions: el container debe ser un elemento HTML válido.');
        }
        if (!db) {
            throw new Error('Transactions: la instancia de IndexedDB es requerida.');
        }

        this._container = container;
        this._db = db;
        this._toast = toast;
        this._confirmDialog = confirmDialog;
        this._loadCSS(this._cssPath);

        this._onTransactionsUpdated = () => {
            this.loadTransactions();
        };
        this._onCategoryDeleted = async () => {
            await this.loadCategories();
            this.applyFilters();
        };
        this._onCategoriesUpdated = async () => {
            await this.loadCategories();
            this.applyFilters();
        };
        document.addEventListener('transactionsUpdated', this._onTransactionsUpdated);
        document.addEventListener('categoryDeleted', this._onCategoryDeleted);
        document.addEventListener('categoriesUpdated', this._onCategoriesUpdated);
    }

    _loadCSS(path) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = path;
        document.head.appendChild(link);
    }

    async loadCategories() {
        try {
            this._categories = await this._db.getCategories();
            this.updateCategorySelects();
        } catch (error) {
            console.error('Error al cargar categorías:', error);
            this._toast.show('Error al cargar categorías', 'error');
        }
    }

    async loadTransactions() {
        try {
            this._transactions = await this._db.getTransactions();
            this._transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
            this.renderTransactionsList();
        } catch (error) {
            console.error('Error al cargar transacciones:', error);
            this._toast.show('Error al cargar transacciones', 'error');
        }
    }

    async filterAndSearchTransactions() {
        const type = this._filterTypeSelect.getValue();
        const categoryValue = this._filterCategorySelect.getValue();
        const searchTerm = this._searchTextInput.getValue().trim();

        let filterCategoryId = null;
        if (categoryValue && categoryValue !== 'all') {
            filterCategoryId = parseInt(categoryValue, 10);
        }
        const filterType = type === 'all' ? null : type;

        try {
            let filteredTransactions = await this._db.getTransactionsFiltered(filterType, filterCategoryId, searchTerm);
            filteredTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));
            this._transactions = filteredTransactions;
            this.renderTransactionsList();
        } catch (error) {
            console.error('Error al filtrar:', error);
            this._toast.show('Error al aplicar filtros', 'error');
        }
    }

    render() {
        this._container.innerHTML = '';
        const container = document.createElement('div');
        container.classList.add('container');

        // Header
        const headerArea = document.createElement('div');
        headerArea.classList.add('header');
        headerArea.innerHTML = '<h2>Gestión de transacciones</h2>';
        container.appendChild(headerArea);

        // Register Area
        const registerArea = document.createElement('div');
        registerArea.classList.add('register');
        registerArea.innerHTML = '<h3>Información de la transacción</h3>';

        const typeWrapper = document.createElement('div');
        registerArea.appendChild(typeWrapper);
        this._transactionTypeSelect = new Select(typeWrapper, {
            items: [
                { value: 'income', text: 'Ingreso' },
                { value: 'expense', text: 'Egreso' }
            ],
            selectedValue: 'expense',
            styles: { width: '100%', marginBottom: '10px' },
        });

        const amountWrapper = document.createElement('div');
        registerArea.appendChild(amountWrapper);
        this._transactionAmountInput = new Input(amountWrapper, {
            placeholder: 'Monto (ej: 100.50)',
            type: 'number',
            step: '0.01',
            // Corregido: 100% en lugar de 95%
            styles: { width: '100%', marginBottom: '10px' }, 
        });

        const dateWrapper = document.createElement('div');
        registerArea.appendChild(dateWrapper);
        this._transactionDateInput = new Input(dateWrapper, {
            type: 'date',
            value: new Date().toISOString().slice(0, 10),
            // Corregido: 100% en lugar de 95%
            styles: { width: '100%', marginBottom: '10px' },
        });

        const categoryWrapper = document.createElement('div');
        registerArea.appendChild(categoryWrapper);
        this._transactionCategorySelect = new Select(categoryWrapper, {
            items: [],
            styles: { width: '100%', marginBottom: '10px' },
        });

        const descriptionWrapper = document.createElement('div');
        registerArea.appendChild(descriptionWrapper);
        this._transactionDescriptionTextarea = new Textarea(descriptionWrapper, {
            placeholder: 'Descripción (opcional)',
            styles: { width: '100%', marginBottom: '10px', minHeight: '60px' },
        });

        const addButtonWrapper = document.createElement('div');
        registerArea.appendChild(addButtonWrapper);
        this._addTransactionButton = new Button(addButtonWrapper, {
            text: 'Guardar',
            styles: { width: '100%', padding: '10px' },
            onClick: () => this.handleAddOrUpdateTransaction(),
        });
        container.appendChild(registerArea);

        // Filters Area
        const filtersArea = document.createElement('div');
        filtersArea.classList.add('filters');
        filtersArea.innerHTML = '<h3>Filtrar transacciones</h3>';

        const filterTypeWrapper = document.createElement('div');
        filtersArea.appendChild(filterTypeWrapper);
        this._filterTypeSelect = new Select(filterTypeWrapper, {
            items: [
                { value: 'all', text: 'Todos los tipos' },
                { value: 'income', text: 'Ingresos' },
                { value: 'expense', text: 'Egresos' }
            ],
            selectedValue: 'all',
            styles: { width: '100%', marginBottom: '10px' }
        });
        this._filterTypeSelect.render();

        const filterCategoryWrapper = document.createElement('div');
        filtersArea.appendChild(filterCategoryWrapper);
        this._filterCategorySelect = new Select(filterCategoryWrapper, {
            items: [{ value: 'all', text: 'Todas las categorías' }],
            styles: { width: '100%', marginBottom: '10px' }
        });
        this._filterCategorySelect.render();

        const searchInputWrapper = document.createElement('div');
        filtersArea.appendChild(searchInputWrapper);
        this._searchTextInput = new Input(searchInputWrapper, {
            placeholder: 'Buscar por descripción o categoría',
            // Corregido: 100% en lugar de 95%
            styles: { width: '100%', marginBottom: '10px' },
        });
        this._searchTextInput.render();

        const filterButtonsWrapper = document.createElement('div');
        filterButtonsWrapper.classList.add('filter-buttons-wrapper');
        filtersArea.appendChild(filterButtonsWrapper);

        this._applyFilterButton = new Button(filterButtonsWrapper, {
            text: 'Aplicar',
            styles: { flex: '1', padding: '10px', marginTop: '10px', marginRight: '5px' },
            onClick: () => this.applyFilters()
        });
        this._applyFilterButton.render();

        this._clearFilterButton = new Button(filterButtonsWrapper, {
            text: 'Limpiar',
            styles: { flex: '1', padding: '10px', marginTop: '10px', backgroundColor: '#6c757d', marginLeft: '5px' },
            onClick: () => this.clearFilters()
        });
        this._clearFilterButton.render();
        container.appendChild(filtersArea);

        // Content Area
        const contentArea = document.createElement('div');
        contentArea.classList.add('content');
        contentArea.innerHTML = '<h3>Transacciones registradas</h3>';

        this._transactionsListContainer = document.createElement('ul');
        this._transactionsListContainer.classList.add('transactions-list');
        contentArea.appendChild(this._transactionsListContainer);
        container.appendChild(contentArea);

        this._container.appendChild(container);
        this.loadCategories();
        this.loadTransactions();
    }

    // ... (El resto de los métodos updateCategorySelects, renderTransactionsList, handleAddOrUpdateTransaction, etc. se mantienen igual)
    // Asegúrate de copiar el resto de tu clase original aquí abajo.
    
    updateCategorySelects() {
        const categoryOptions = [{ value: 'all', text: 'Todas las categorías' }];
        this._categories.forEach(cat => {
            categoryOptions.push({ value: cat.id, text: cat.name });
        });

        // Actualizar Select de Registro
        this._transactionCategorySelect.remove();
        const transactionCategoryWrapper = this._transactionCategorySelect.container;
        this._transactionCategorySelect = new Select(transactionCategoryWrapper, {
            items: categoryOptions.filter(opt => opt.value !== 'all'),
            styles: { width: '100%', marginBottom: '10px' },
        });
        transactionCategoryWrapper.appendChild(this._transactionCategorySelect.render());
        if (categoryOptions.filter(opt => opt.value !== 'all').length > 0) {
            this._transactionCategorySelect.setValue(categoryOptions.filter(opt => opt.value !== 'all')[0].value);
        }

        // Actualizar Select de Filtro
        this._filterCategorySelect.remove();
        const filterCategoryWrapper = this._filterCategorySelect.container;
        this._filterCategorySelect = new Select(filterCategoryWrapper, {
            items: categoryOptions,
            styles: { width: '100%', marginBottom: '10px' },
            selectedValue: 'all'
        });
        filterCategoryWrapper.appendChild(this._filterCategorySelect.render());
    }

    renderTransactionsList() {
        if (!this._transactionsListContainer) return;
        this._transactionsListContainer.innerHTML = '';

        if (this._transactions.length === 0) {
            const noTransactionsMessage = document.createElement('li');
            noTransactionsMessage.textContent = 'No hay transacciones registradas.';
            noTransactionsMessage.classList.add('no-transactions-message');
            this._transactionsListContainer.appendChild(noTransactionsMessage);
            return;
        }

        this._transactions.forEach(transaction => {
            const listItem = document.createElement('li');
            listItem.classList.add('transaction-item', transaction.type);

            const categoryName = this._categories.find(cat => cat.id === transaction.categoryId)?.name || 'Sin Categoría';
            const transactionDate = new Date(transaction.date).toLocaleDateString('es-ES');
            
            // PRECISIÓN: Dividimos por 100 para mostrar
            const amountFormatted = `Bs. ${(transaction.amount / 100).toFixed(2)}`;
            const amountColorClass = transaction.type === 'income' ? 'amount-income' : 'amount-expense';

            listItem.innerHTML = `
                <div class="transaction-details">
                    <span class="transaction-type">${transaction.type === 'income' ? 'Ingreso' : 'Egreso'}</span>
                    <span class="transaction-category">${categoryName}</span>
                    <span class="transaction-amount ${amountColorClass}">${amountFormatted}</span> <span class="transaction-date">${transactionDate}</span>
                </div>
                <div class="transaction-actions">
                    <a href="#" class="edit-transaction-link">Editar</a>
                    <a href="#" class="delete-transaction-link">Eliminar</a>
                </div>
            `;
            
            // Seguridad: Insertar descripción de forma segura
            const descP = document.createElement('p');
            descP.classList.add('transaction-description');
            descP.textContent = transaction.description || 'Sin descripción';
            listItem.querySelector('.transaction-details').appendChild(descP);

            // Listeners
            const editLink = listItem.querySelector('.edit-transaction-link');
            editLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleEditTransaction(transaction.id);
            });
            // Guardamos el ID en el elemento para facilitar referencias si fuera necesario
            editLink.dataset.id = transaction.id;

            const deleteLink = listItem.querySelector('.delete-transaction-link');
            deleteLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleDeleteTransaction(transaction.id, transaction.amount, transaction.type, categoryName);
            });
            deleteLink.dataset.id = transaction.id;

            this._transactionsListContainer.appendChild(listItem);
        });
    }

    async handleAddOrUpdateTransaction() {
        const type = this._transactionTypeSelect.getValue();
        const rawAmount = parseFloat(this._transactionAmountInput.getValue());
        const date = this._transactionDateInput.getValue();
        const categoryId = parseInt(this._transactionCategorySelect.getValue(), 10);
        const description = this._transactionDescriptionTextarea.getValue();

        if (!type || isNaN(rawAmount) || rawAmount <= 0 || !date || !categoryId) {
            this._toast.show('Complete todos los campos. El monto debe ser positivo.', 'error');
            return;
        }

        // PRECISIÓN: Multiplicar por 100 y redondear
        const amount = Math.round(rawAmount * 100);

        const transactionData = {
            type,
            amount, // Guardado en centavos
            date,
            categoryId,
            description
        };

        this._addTransactionButton.setDisabled(true);
        try {
            if (this._currentEditingTransactionId) {
                transactionData.id = this._currentEditingTransactionId;
                await this._db.updateTransaction(transactionData);
                this._toast.show('Transacción actualizada con éxito.', 'success');
                this._currentEditingTransactionId = null;
            } else {
                await this._db.addTransaction(transactionData);
                this._toast.show('Transacción registrada con éxito.', 'success');
            }
            this.clearForm();
            document.dispatchEvent(new CustomEvent('transactionsUpdated'));
            await this.applyFilters();
        } catch (error) {
            console.error('Error al guardar:', error);
            this._toast.show('Error al guardar la transacción.', 'error');
        } finally {
            this._addTransactionButton.setDisabled(false);
        }
    }

    handleEditTransaction(id) {
        if (this._currentEditingTransactionId !== null) {
            this.clearForm();
        }

        const transactionToEdit = this._transactions.find(t => t.id === id);

        if (transactionToEdit) {
            this._currentEditingTransactionId = id;
            this._transactionTypeSelect.setValue(transactionToEdit.type);
            // PRECISIÓN: Dividir por 100 para editar
            this._transactionAmountInput.setValue((transactionToEdit.amount / 100).toFixed(2));
            this._transactionDateInput.setValue(transactionToEdit.date);
            this._transactionCategorySelect.setValue(transactionToEdit.categoryId.toString());
            this._transactionDescriptionTextarea.setValue(transactionToEdit.description);
            this._addTransactionButton.setText('Actualizar Transacción');
        } else {
            this._toast.show('Transacción no encontrada.', 'error');
        }
    }

    async handleDeleteTransaction(id, amount, type, categoryName) {
        // PRECISIÓN: Mostrar monto correcto en el mensaje
        const formattedAmount = (amount / 100).toFixed(2);
        const typeText = type === 'income' ? 'Ingreso' : 'Egreso';
        const message = `¿Estás seguro de eliminar el ${typeText} de Bs. ${formattedAmount} en "${categoryName}"?`;

        this._confirmDialog.show(message, async () => {
            try {
                await this._db.deleteTransaction(id);
                this._toast.show('Transacción eliminada.', 'success');
                document.dispatchEvent(new CustomEvent('transactionsUpdated'));
                await this.applyFilters();
            } catch (error) {
                console.error('Error al eliminar:', error);
                this._toast.show('Error al eliminar la transacción.', 'error');
            }
        });
    }

    clearForm() {
        this._transactionTypeSelect.setValue('expense');
        this._transactionAmountInput.setValue('');
        this._transactionDateInput.setValue(new Date().toISOString().slice(0, 10));
        if (this._categories.length > 0 && this._categories.some(c => c.id !== '')) {
             const firstValid = this._categories.find(c => c.id !== '');
             this._transactionCategorySelect.setValue(firstValid ? firstValid.id : '');
        } else {
            this._transactionCategorySelect.setValue('');
        }
        this._transactionDescriptionTextarea.setValue('');
        this._currentEditingTransactionId = null;
        this._addTransactionButton.setText('Guardar');
    }

    async applyFilters() {
        await this.filterAndSearchTransactions();
    }

    async clearFilters() {
        this._filterTypeSelect.setValue('all');
        this._filterCategorySelect.setValue('all');
        this._searchTextInput.setValue('');
        await this.applyFilters();
    }

    destroy() {
        if (this._onTransactionsUpdated) {
            document.removeEventListener('transactionsUpdated', this._onTransactionsUpdated);
            this._onTransactionsUpdated = null;
        }
        if (this._onCategoryDeleted) {
            document.removeEventListener('categoryDeleted', this._onCategoryDeleted);
            this._onCategoryDeleted = null;
        }
        if (this._onCategoriesUpdated) {
            document.removeEventListener('categoriesUpdated', this._onCategoriesUpdated);
            this._onCategoriesUpdated = null;
        }
    }
}
