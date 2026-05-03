import { Input } from '../components/Input.js';
import { Select } from '../components/Select.js';
import { Button } from '../components/Button.js';

export class Budgets {
    _container = null;
    _db = null;
    _charts = null;
    _toast = null;
    _confirmDialog = null;
    _categories = [];
    _budgets = [];
    _cssPath = './views/styles/Budgets.css';

    _budgetMonthSelect = null;
    _budgetYearInput = null;
    _budgetCategorySelect = null;
    _budgetAmountInput = null;
    _saveBudgetButton = null;
    _budgetsListContainer = null;
    _currentEditingBudgetId = null;
    _budgetChartsContainer = null;
    _chartMonthSelect = null;
    _chartYearInput = null;
    _filterCategorySelect = null;
    _filterMonthSelect = null;
    _filterYearInput = null;
    _applyFilterButton = null;
    _clearFilterButton = null;
    _onTransactionsUpdated = null;
    _onCategoryDeleted = null;
    _onCategoriesUpdated = null;

    _currentMonth = new Date().getMonth() + 1;
    _currentYear = new Date().getFullYear();

    constructor(container, db, charts, toast, confirmDialog) {
        if (!(container instanceof HTMLElement)) throw new Error('Budgets: container inválido.');
        if (!db) throw new Error('Budgets: DB requerida.');
        if (!charts) throw new Error('Budgets: Charts requerido.');

        this._container = container;
        this._db = db;
        this._charts = charts;
        this._toast = toast;
        this._confirmDialog = confirmDialog;
        this._loadCSS(this._cssPath);

        this._onTransactionsUpdated = () => {
            this.loadBudgets();
            this.updateBudgetCharts();
        };
        this._onCategoryDeleted = async (event) => {
            await this.handleCategoryDeleted(event.detail.categoryId);
        };
        this._onCategoriesUpdated = async () => {
            await this.loadCategories();
            await this.loadBudgets();
            this.updateBudgetCharts();
        };
        document.addEventListener('transactionsUpdated', this._onTransactionsUpdated);
        document.addEventListener('categoryDeleted', this._onCategoryDeleted);
        document.addEventListener('categoriesUpdated', this._onCategoriesUpdated);
    }

    _loadCSS(path) {
        if (!document.querySelector(`link[href="${path}"]`)) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = path;
            document.head.appendChild(link);
        }
    }

    async loadCategories() {
        try {
            this._categories = await this._db.getCategories();
            this.updateCategorySelects();
        } catch (error) {
            console.error('Error al cargar categorías:', error);
            this._toast.show('Error al cargar categorías.', 'error');
        }
    }

    async loadBudgets(filters = {}) {
        try {
            this._budgets = await this._db.getBudgets(filters);
            this.renderBudgetsList();
        } catch (error) {
            console.error('Error al cargar presupuestos:', error);
            this._toast.show('Error al cargar presupuestos.', 'error');
        }
    }

    render() {
        this._container.innerHTML = '';
        const budgetsView = document.createElement('div');
        budgetsView.classList.add('budgets-grid-container');

        const headerArea = document.createElement('div');
        headerArea.classList.add('header');
        headerArea.innerHTML = '<h2>Gestión de presupuestos de egresos</h2>';
        budgetsView.appendChild(headerArea);

        const budgetFormArea = document.createElement('div');
        budgetFormArea.classList.add('budget-form-area');

        // Definimos estilos comunes para asegurar alineación perfecta
        const commonInputStyles = {
            width: '100%',
            boxSizing: 'border-box', // Clave para que padding no afecte el ancho total
            height: '42px',          // Altura unificada
            margin: '0'              // El espaciado lo maneja el CSS (gap)
        };

        // --- Form Area (Crear Presupuesto) ---
        const formArea = document.createElement('div');
        formArea.classList.add('form-area');
        formArea.innerHTML = '<h3>Establecer presupuesto</h3>';

        const monthOptions = [
            'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
        ].map((name, index) => ({ value: (index + 1).toString(), text: name }));

        const budgetMonthWrapper = document.createElement('div');
        this._budgetMonthSelect = new Select(budgetMonthWrapper, {
            items: monthOptions,
            selectedValue: this._currentMonth.toString(),
            styles: commonInputStyles,
        });
        formArea.appendChild(this._budgetMonthSelect.render());

        const budgetYearWrapper = document.createElement('div');
        this._budgetYearInput = new Input(budgetYearWrapper, {
            placeholder: 'Año (ej: 2025)',
            type: 'number',
            value: this._currentYear.toString(),
            styles: commonInputStyles,
        });
        formArea.appendChild(this._budgetYearInput.render());

        const budgetCategoryWrapper = document.createElement('div');
        this._budgetCategorySelect = new Select(budgetCategoryWrapper, {
            items: [],
            styles: commonInputStyles,
            placeholder: 'Seleccione una categoría',
        });
        formArea.appendChild(this._budgetCategorySelect.render());

        const budgetAmountWrapper = document.createElement('div');
        this._budgetAmountInput = new Input(budgetAmountWrapper, {
            placeholder: 'Monto estimado (Bs.)',
            type: 'number',
            step: '0.01',
            styles: commonInputStyles,
        });
        formArea.appendChild(this._budgetAmountInput.render());

        const saveButtonWrapper = document.createElement('div');
        this._saveBudgetButton = new Button(saveButtonWrapper, {
            text: 'Guardar',
            styles: { width: '100%', padding: '10px' },
            onClick: () => this.handleAddOrUpdateBudget(),
        });
        formArea.appendChild(this._saveBudgetButton.render());
        budgetFormArea.appendChild(formArea);

        // --- Search Area (Filtros) ---
        const searchArea = document.createElement('div');
        searchArea.classList.add('search-area');
        searchArea.innerHTML = '<h3>Filtrar presupuestos</h3>';

        const filterCategoryWrapper = document.createElement('div');
        this._filterCategorySelect = new Select(filterCategoryWrapper, {
            items: [{ value: '', text: 'Todas las categorías' }],
            styles: commonInputStyles,
            placeholder: 'Categoría',
        });
        searchArea.appendChild(this._filterCategorySelect.render());

        const filterMonthWrapper = document.createElement('div');
        this._filterMonthSelect = new Select(filterMonthWrapper, {
            items: [{ value: '', text: 'Todos los meses' }, ...monthOptions],
            selectedValue: '',
            styles: commonInputStyles,
            placeholder: 'Mes',
        });
        searchArea.appendChild(this._filterMonthSelect.render());

        const filterYearWrapper = document.createElement('div');
        this._filterYearInput = new Input(filterYearWrapper, {
            placeholder: 'Año (ej: 2025)',
            type: 'number',
            styles: commonInputStyles,
        });
        searchArea.appendChild(this._filterYearInput.render());

        const applyFilterButtonWrapper = document.createElement('div');
        this._applyFilterButton = new Button(applyFilterButtonWrapper, {
            text: 'Aplicar',
            styles: { width: '100%', padding: '10px', marginTop: '10px' },
            onClick: () => this.applyFilters(),
        });
        searchArea.appendChild(this._applyFilterButton.render());

        const clearFilterButtonWrapper = document.createElement('div');
        this._clearFilterButton = new Button(clearFilterButtonWrapper, {
            text: 'Limpiar',
            styles: { width: '100%', padding: '10px', marginTop: '5px', backgroundColor: '#6c757d' },
            onClick: () => this.clearFilters(),
        });
        searchArea.appendChild(this._clearFilterButton.render());

        budgetFormArea.appendChild(searchArea);
        budgetsView.appendChild(budgetFormArea);

        // List Area
        const listArea = document.createElement('div');
        listArea.classList.add('budget-list-area');
        listArea.innerHTML = '<h3>Presupuestos registrados</h3>';

        this._budgetsListContainer = document.createElement('ul');
        this._budgetsListContainer.classList.add('budgets-list');
        listArea.appendChild(this._budgetsListContainer);
        budgetsView.appendChild(listArea);

        // Charts Area
        const chartsArea = document.createElement('div');
        chartsArea.classList.add('budget-charts-area');
        const chartControlsContainer = document.createElement('div');
        chartControlsContainer.classList.add('chart-controls');
        
        const chartMonthWrapper = document.createElement('div');
        chartMonthWrapper.style.flex = "1"; // Para que ocupen espacio igual en el control de charts
        const chartYearWrapper = document.createElement('div');
        chartYearWrapper.style.flex = "1";

        this._chartMonthSelect = new Select(chartMonthWrapper, {
            items: monthOptions,
            selectedValue: this._currentMonth.toString(),
            styles: commonInputStyles,
            onChange: (e) => this._handleChartMonthYearChange(e.target.value, this._chartYearInput.getValue())
        });
        chartControlsContainer.appendChild(this._chartMonthSelect.render());

        this._chartYearInput = new Input(chartYearWrapper, {
            placeholder: 'Año',
            type: 'number',
            value: this._currentYear.toString(),
            styles: commonInputStyles,
            onInput: (e) => this._handleChartMonthYearChange(this._chartMonthSelect.getValue(), e.target.value)
        });
        chartControlsContainer.appendChild(this._chartYearInput.render());
        chartsArea.appendChild(chartControlsContainer);

        this._budgetChartsContainer = document.createElement('div');
        this._budgetChartsContainer.id = 'budget-charts-display';
        this._budgetChartsContainer.classList.add('charts-display');
        chartsArea.appendChild(this._budgetChartsContainer);
        budgetsView.appendChild(chartsArea);

        this._container.appendChild(budgetsView);
        this.loadCategories();
        this.loadBudgets();
        this.updateBudgetCharts();
    }

    updateCategorySelects() {
        const categoryOptions = [{ value: '', text: 'Todas las categorías' }];
        this._categories.forEach(cat => {
            categoryOptions.push({ value: cat.id, text: cat.name });
        });

        // Mismos estilos consistentes
        const commonInputStyles = {
            width: '100%',
            boxSizing: 'border-box',
            height: '42px',
            margin: '0'
        };

        this._budgetCategorySelect.remove();
        const budgetCategoryWrapper = this._budgetCategorySelect.container; // Recuperamos el wrapper original
        this._budgetCategorySelect = new Select(budgetCategoryWrapper, {
            items: categoryOptions.filter(opt => opt.value !== ''),
            styles: commonInputStyles,
            placeholder: 'Seleccione una categoría',
        });
        // Como remove() quita el elemento del DOM, necesitamos volver a añadir el renderizado
        // Nota: En tu implementación original de Select, el constructor ya hace appendChild al container.
        // Pero en render() anterior usamos appendChild del resultado de render().
        // Para asegurar que no se duplique o pierda, limpiamos el wrapper antes.
        budgetCategoryWrapper.innerHTML = '';
        this._budgetCategorySelect = new Select(budgetCategoryWrapper, {
             items: categoryOptions.filter(opt => opt.value !== ''),
             styles: commonInputStyles,
             placeholder: 'Seleccione una categoría',
        });
        // Si el Select se auto-agrega en constructor, no necesitamos hacer nada más que instanciarlo con el wrapper correcto.
        // Pero según tu código anterior, hacías appendChild(render()). Asumiré que render() devuelve el elemento y es seguro añadirlo.
        if (!budgetCategoryWrapper.hasChildNodes()) {
             budgetCategoryWrapper.appendChild(this._budgetCategorySelect.render());
        }

        if (categoryOptions.filter(opt => opt.value !== '').length > 0) {
            this._budgetCategorySelect.setValue(categoryOptions.filter(opt => opt.value !== '')[0].value);
        }

        this._filterCategorySelect.remove();
        const filterCategoryWrapper = this._filterCategorySelect.container;
        filterCategoryWrapper.innerHTML = '';
        this._filterCategorySelect = new Select(filterCategoryWrapper, {
            items: categoryOptions,
            styles: commonInputStyles,
            placeholder: 'Categoría',
        });
        if (!filterCategoryWrapper.hasChildNodes()) {
            filterCategoryWrapper.appendChild(this._filterCategorySelect.render());
        }
        this._filterCategorySelect.setValue('');
    }

    async renderBudgetsList() {
        if (!this._budgetsListContainer) return;
        this._budgetsListContainer.innerHTML = '';

        if (this._budgets.length === 0) {
            const noBudgetsMessage = document.createElement('li');
            noBudgetsMessage.textContent = 'No hay presupuestos registrados.';
            noBudgetsMessage.classList.add('no-budgets-message');
            this._budgetsListContainer.appendChild(noBudgetsMessage);
            return;
        }

        const allTransactions = await this._db.getTransactions();

        this._budgets.forEach(budget => {
            const listItem = document.createElement('li');
            listItem.classList.add('budget-item');

            const monthName = new Date(budget.year, budget.month - 1).toLocaleString('es-ES', { month: 'long' });
            const categoryName = this._categories.find(cat => cat.id === budget.categoryId)?.name;

            if (!categoryName) return;

            // PRECISIÓN: Calcular gastos reales (están en centavos)
            const actualExpenses = allTransactions
                .filter(t => {
                    const transactionDate = new Date(t.date);
                    return t.type === 'expense' &&
                        t.categoryId === budget.categoryId &&
                        transactionDate.getMonth() + 1 === budget.month &&
                        transactionDate.getFullYear() === budget.year;
                })
                .reduce((sum, t) => sum + t.amount, 0);

            // PRECISIÓN: La desviación se calcula en centavos
            const deviation = actualExpenses - budget.amount;
            let deviationClass = '';
            let deviationText = '';

            // PRECISIÓN: Al mostrar, dividimos todo por 100
            if (deviation > 0) {
                deviationClass = 'deviation-over';
                deviationText = ` (+Bs. ${(deviation / 100).toFixed(2)})`;
            } else if (deviation < 0) {
                deviationClass = 'deviation-under';
                deviationText = ` (-Bs. ${(Math.abs(deviation) / 100).toFixed(2)})`;
            } else {
                deviationClass = 'deviation-ok';
                deviationText = ' (Exacto)';
            }

            listItem.innerHTML = `
                <div class="budget-details">
                    <span class="budget-period">Mes: ${monthName.charAt(0).toUpperCase() + monthName.slice(1)} ${budget.year}</span>
                    <span class="budget-category">Categoría: ${categoryName}</span>
                    <span class="budget-estimated">Estimado: Bs. ${(budget.amount / 100).toFixed(2)}</span>
                    <span class="budget-actual">Real: Bs. ${(actualExpenses / 100).toFixed(2)}</span>
                    <span class="budget-deviation ${deviationClass}">Desviación: ${deviationText}</span>
                </div>
                <div class="budget-actions">
                    <a href="#" class="edit-budget-link" data-id="${budget.id}">Editar</a>
                    <a href="#" class="delete-budget-link" data-id="${budget.id}">Eliminar</a>
                </div>
            `;

            listItem.querySelector('.edit-budget-link').addEventListener('click', (e) => {
                e.preventDefault();
                this.handleEditBudget(budget.id);
            });
            listItem.querySelector('.delete-budget-link').addEventListener('click', (e) => {
                e.preventDefault();
                this.handleDeleteBudget(budget.id, categoryName, monthName, budget.year);
            });

            this._budgetsListContainer.appendChild(listItem);
        });
    }

    async handleAddOrUpdateBudget() {
        const month = parseInt(this._budgetMonthSelect.getValue(), 10);
        const year = parseInt(this._budgetYearInput.getValue(), 10);
        const categoryId = parseInt(this._budgetCategorySelect.getValue(), 10);
        const rawAmount = parseFloat(this._budgetAmountInput.getValue());

        if (!month || !year || !categoryId || isNaN(rawAmount) || rawAmount <= 0) {
            this._toast.show('Todos los campos son obligatorios y el monto debe ser positivo.', 'error');
            return;
        }

        // PRECISIÓN: Guardar en centavos
        const amount = Math.round(rawAmount * 100);

        const budgetData = { month, year, categoryId, amount };

        this._saveBudgetButton.setDisabled(true);
        try {
            if (this._currentEditingBudgetId) {
                budgetData.id = this._currentEditingBudgetId;
                await this._db.updateBudget(budgetData);
                this._toast.show('Presupuesto actualizado.', 'success');
                this._currentEditingBudgetId = null;
            } else {
                const existingBudget = this._budgets.find(b =>
                    b.month === month && b.year === year && b.categoryId === categoryId
                );
                if (existingBudget) {
                    this._toast.show('Ya existe un presupuesto para esta categoría y fecha.', 'info');
                    return;
                }
                await this._db.addBudget(budgetData);
                this._toast.show('Presupuesto guardado.', 'success');
            }
            this.clearForm();
            await this.loadBudgets();
            this.updateBudgetCharts();
        } catch (error) {
            console.error('Error al guardar presupuesto:', error);
            this._toast.show('Error al guardar el presupuesto.', 'error');
        } finally {
            this._saveBudgetButton.setDisabled(false);
        }
    }

    handleEditBudget(id) {
        if (this._currentEditingBudgetId !== null) {
            this.clearForm();
        }
        const budgetToEdit = this._budgets.find(b => b.id === id);

        if (budgetToEdit) {
            this._currentEditingBudgetId = id;
            this._budgetMonthSelect.setValue(budgetToEdit.month.toString());
            this._budgetYearInput.setValue(budgetToEdit.year.toString());
            this._budgetCategorySelect.setValue(budgetToEdit.categoryId.toString());
            // PRECISIÓN: Editar en decimales
            this._budgetAmountInput.setValue((budgetToEdit.amount / 100).toFixed(2));
            this._saveBudgetButton.setText('Actualizar Presupuesto');
        } else {
            this._toast.show('Presupuesto no encontrado.', 'error');
        }
    }

    async handleDeleteBudget(id, categoryName, monthName, year) {
        const message = `¿Eliminar presupuesto de "${categoryName}" para ${monthName} ${year}?`;
        this._confirmDialog.show(message, async () => {
            try {
                await this._db.deleteBudget(id);
                this._toast.show('Presupuesto eliminado.', 'success');
                await this.loadBudgets();
                this.updateBudgetCharts();
            } catch (error) {
                console.error('Error al eliminar:', error);
                this._toast.show('Error al eliminar.', 'error');
            }
        });
    }

    async handleCategoryDeleted(deletedCategoryId) {
        try {
            const budgetsToDelete = this._budgets.filter(b => b.categoryId === deletedCategoryId);
            if (budgetsToDelete.length > 0) {
                for (const budget of budgetsToDelete) {
                    await this._db.deleteBudget(budget.id);
                }
                this._toast.show(`Se eliminaron ${budgetsToDelete.length} presupuestos asociados.`, 'info');
                await this.loadBudgets();
                this.updateBudgetCharts();
            }
            await this.loadCategories();
        } catch (error) {
            console.error('Error:', error);
            this._toast.show('Error al limpiar presupuestos.', 'error');
        }
    }

    clearForm() {
        this._budgetMonthSelect.setValue(this._currentMonth.toString());
        this._budgetYearInput.setValue(this._currentYear.toString());
        if (this._categories.length > 0 && this._categories.some(c => c.id !== '')) {
             this._budgetCategorySelect.setValue(this._categories.find(c => c.id !== '').id);
        } else {
            this._budgetCategorySelect.setValue('');
        }
        this._budgetAmountInput.setValue('');
        this._currentEditingBudgetId = null;
        this._saveBudgetButton.setText('Guardar');
    }

    async applyFilters() {
        const filters = {};
        const categoryId = this._filterCategorySelect.getValue();
        const month = this._filterMonthSelect.getValue();
        const year = this._filterYearInput.getValue();

        if (categoryId !== '') filters.categoryId = parseInt(categoryId, 10);
        if (month !== '') filters.month = parseInt(month, 10);
        if (year !== '') filters.year = parseInt(year, 10);

        await this.loadBudgets(filters);
    }

    async clearFilters() {
        this._filterCategorySelect.setValue('');
        this._filterMonthSelect.setValue('');
        this._filterYearInput.setValue('');
        await this.loadBudgets();
    }

    _handleChartMonthYearChange(month, year) {
        this._currentMonth = parseInt(month, 10);
        this._currentYear = parseInt(year, 10);
        this.updateBudgetCharts();
    }

    async updateBudgetCharts() {
        if (!this._budgetChartsContainer) return;
        this._budgetChartsContainer.innerHTML = '';

        const barChartContainer = document.createElement('div');
        barChartContainer.classList.add('chart-container', 'bar-chart-container');
        this._budgetChartsContainer.appendChild(barChartContainer);

        const projectionChartContainer = document.createElement('div');
        projectionChartContainer.classList.add('chart-container', 'projection-chart-container');
        this._budgetChartsContainer.appendChild(projectionChartContainer);

        await this._charts.genBudgetComparisonChart(barChartContainer, this._currentMonth, this._currentYear);
        await this._charts.genMonthlyExpenseProjection(projectionChartContainer, this._currentMonth, this._currentYear);
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
