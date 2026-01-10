import { Select } from '../../components/Select.js';
import { Button } from '../../components/Button.js';
import { Input } from '../../components/Input.js';

export class Dashboard {
    _container = null;
    _db = null;
    _charts = null;
    _cssPath = './views/styles/Dashboard.css';
    _recentTransactionsListContainer = null;
    _categories = [];
    _expensesComparativeArea = null;
    _balanceEvolutionArea = null;
    _monthSelect = null;
    _yearInput = null;
    _currentMonth = null;
    _currentYear = null;
    _expensesIncomesArea = null;
    _budgetStatusElement = null;

    constructor(dashboardView, db, charts) {
        if (!(dashboardView instanceof HTMLElement)) {
            throw new Error('Dashboard: el dashboardView debe ser un elemento HTML válido.');
        }
        if (!db) {
            console.warn('Dashboard: la instancia de IndexedDB no fue proporcionada.');
        }
        if (!charts) {
            console.warn('Dashboard: la instancia de Charts no fue proporcionada.');
        }
        this._container = dashboardView;
        this._db = db;
        this._charts = charts;
        this._loadCSS(this._cssPath);

        this._currentMonth = new Date().getMonth() + 1;
        this._currentYear = new Date().getFullYear();

        document.addEventListener('transactionsUpdated', async () => {
            console.log('transactionsUpdated event received in Dashboard, refreshing data.');
            await this.loadRecentTransactions();
            await this.renderCharts();
            await this.loadBudgetStatus();
        });
        document.addEventListener('budgetsUpdated', async () => {
            console.log('budgetsUpdated event received in Dashboard, refreshing data.');
            await this.loadBudgetStatus();
            await this.renderCharts();
        });
        document.addEventListener('categoriesUpdated', async () => {
            console.log('categoriesUpdated event received in Dashboard, refreshing categories and budget status.');
            await this.loadCategories();
            await this.loadBudgetStatus();
            await this.renderCharts();
        });
    }

    _loadCSS(path) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = path;
        document.head.appendChild(link);
    }

    async render() {
        this._container.innerHTML = '';

        const dashboardView = document.createElement('div');
        dashboardView.classList.add('dashboardView');

        const headerArea = document.createElement('div');
        headerArea.classList.add('header');
        headerArea.innerHTML = '<h2>Bienvenido a su resumen de finanzas</h2>';
        dashboardView.appendChild(headerArea);

        const recentTransactionsArea = document.createElement('div');
        recentTransactionsArea.classList.add('recent-transactions');
        const recentTransactionsTitle = document.createElement('h3');
        recentTransactionsTitle.textContent = 'Transacciones del mes';
        recentTransactionsArea.appendChild(recentTransactionsTitle);

        this._recentTransactionsListContainer = document.createElement('ul');
        this._recentTransactionsListContainer.classList.add('transactions-list');
        recentTransactionsArea.appendChild(this._recentTransactionsListContainer);
        dashboardView.appendChild(recentTransactionsArea);

        this._expensesIncomesArea = document.createElement('div');
        this._expensesIncomesArea.classList.add('expenses-incomes');
        dashboardView.appendChild(this._expensesIncomesArea);

        const asideArea = document.createElement('div');
        asideArea.classList.add('aside');
        dashboardView.appendChild(asideArea);

        const userArea = document.createElement('div');
        userArea.classList.add('user');
        asideArea.appendChild(userArea);

        const monthNames = [
            'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
        ];

        const budgetArea = document.createElement('div');
        budgetArea.classList.add('budget');
        budgetArea.innerHTML = `<h3>Estado del presupuesto</h3><div id="current-budget-status">Cargando...</div>`;
        this._budgetStatusElement = budgetArea.querySelector('#current-budget-status');
        asideArea.appendChild(budgetArea);

        const filtersArea = document.createElement('div');
        filtersArea.classList.add('d-filters');
        filtersArea.innerHTML = '<h3>Filtros de tiempo</h3>';
        asideArea.appendChild(filtersArea);

        const monthOptions = [];
        monthNames.forEach((name, index) => {
            monthOptions.push({ value: (index + 1).toString(), text: name });
        });

        const monthSelectWrapper = document.createElement('div');
        monthSelectWrapper.classList.add('select-wrapper');
        filtersArea.appendChild(monthSelectWrapper);
        this._monthSelect = new Select(monthSelectWrapper, {
            items: monthOptions,
            selectedValue: this._currentMonth.toString(),
            styles: { width: '100%' },
            onChange: (event) => this._currentMonth = parseInt(event.target.value, 10)
        });
        this._monthSelect.render();

        const yearInputWrapper = document.createElement('div');
        yearInputWrapper.classList.add('input-wrapper');
        filtersArea.appendChild(yearInputWrapper);
        this._yearInput = new Input(yearInputWrapper, {
            type: 'number',
            placeholder: 'Año',
            value: this._currentYear.toString(),
            styles: { width: '96.5%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' },
            onChange: (event) => {
                const value = parseInt(event.target.value, 10);
                if (!isNaN(value)) {
                    this._currentYear = value;
                } else {
                    console.warn('Año inválido ingresado.');
                }
            }
        });
        this._yearInput.render();

        const buttonContainer = document.createElement('div');
        buttonContainer.classList.add('filter-buttons');
        filtersArea.appendChild(buttonContainer);

        const applyFilterBtnWrapper = document.createElement('div');
        buttonContainer.appendChild(applyFilterBtnWrapper);
        const applyFilterBtn = new Button(applyFilterBtnWrapper, {
            text: 'Aplicar',
            className: 'btn btn-primary',
            styles: { width: '100%', marginBottom: '10px' },
            onClick: () => {
                this.loadRecentTransactions();
                this.renderCharts();
                this.loadBudgetStatus();
            }
        });
        applyFilterBtn.render();

        const clearFilterBtnWrapper = document.createElement('div');
        buttonContainer.appendChild(clearFilterBtnWrapper);
        const clearFilterBtn = new Button(clearFilterBtnWrapper, {
            text: 'Limpiar',
            className: 'btn btn-secondary',
            styles: { width: '100%' },
            onClick: () => {
                const today = new Date();
                this._currentMonth = today.getMonth() + 1;
                this._currentYear = today.getFullYear();
                this._monthSelect.setValue(this._currentMonth.toString());
                this._yearInput.setValue(this._currentYear.toString());
                this.loadRecentTransactions();
                this.renderCharts();
                this.loadBudgetStatus();
            }
        });
        clearFilterBtn.render();

        this._balanceEvolutionArea = document.createElement('div');
        this._balanceEvolutionArea.classList.add('balance-evolution');
        dashboardView.appendChild(this._balanceEvolutionArea);

        const expensesComparativeArea = document.createElement('div');
        expensesComparativeArea.classList.add('expenses-comparative');
        dashboardView.appendChild(expensesComparativeArea);
        this._expensesComparativeArea = expensesComparativeArea;

        this._container.appendChild(dashboardView);

        await this.loadCategories();
        await this.loadRecentTransactions();
        await this.loadBudgetStatus();
        await this.renderCharts();

        return dashboardView;
    }

    async loadBudgetStatus() {
        if (!this._budgetStatusElement || !this._db) {
            console.warn('Dashboard: Elemento de estado del presupuesto o DB no disponibles.');
            return;
        }

        try {
            const allBudgets = await this._db.getBudgets({ month: this._currentMonth, year: this._currentYear, type: 'expense' });
            const allTransactions = await this._db.getTransactions();

            const expensesForPeriod = allTransactions.filter(t => {
                const transactionDate = new Date(t.date);
                return transactionDate.getMonth() + 1 === this._currentMonth &&
                       transactionDate.getFullYear() === this._currentYear &&
                       t.type === 'expense';
            });

            let statusHTML = '';
            let totalEstimatedExpenses = 0;
            let totalActualExpenses = 0;

            if (allBudgets.length > 0 || expensesForPeriod.length > 0) {
                const budgetDetails = {};

                this._categories.forEach(cat => {
                    budgetDetails[cat.id] = {
                        name: cat.name,
                        estimated: 0,
                        actual: 0
                    };
                });

                allBudgets.forEach(budget => {
                    if (budgetDetails[budget.categoryId]) {
                        budgetDetails[budget.categoryId].estimated += budget.amount;
                        totalEstimatedExpenses += budget.amount;
                    }
                });

                expensesForPeriod.forEach(transaction => {
                    if (budgetDetails[transaction.categoryId]) {
                        budgetDetails[transaction.categoryId].actual += transaction.amount;
                        totalActualExpenses += transaction.amount;
                    }
                });

                statusHTML += '<div class="budget-summary">';
                statusHTML += `<p><strong>Presupuesto total estimado:</strong> Bs. ${totalEstimatedExpenses.toFixed(2)}</p>`;
                statusHTML += `<p><strong>Egreso total actual:</strong> Bs. ${totalActualExpenses.toFixed(2)}</p>`;

                const overallRemaining = totalEstimatedExpenses - totalActualExpenses;
                if (overallRemaining < 0) {
                    statusHTML += `<p class="budget-exceeded">¡Se ha excedido el presupuesto total por Bs. ${Math.abs(overallRemaining).toFixed(2)}! 🔴</p>`;
                } else if (overallRemaining === 0) {
                    statusHTML += `<p class="budget-warning">¡Presupuesto total utilizado completamente! 🟠</p>`;
                } else {
                    statusHTML += `<p class="budget-ok">Queda un margen total de Bs. ${overallRemaining.toFixed(2)} en el presupuesto. 🟢</p>`;
                }
                statusHTML += '</div>';

                statusHTML += '<h4>Estado del Presupuesto por Categoría</h4>';
                statusHTML += '<ul class="budget-category-list">';

                for (const categoryId in budgetDetails) {
                    const category = budgetDetails[categoryId];
                    const categoryName = category.name || 'Categoría Desconocida';
                    const estimated = category.estimated;
                    const actual = category.actual;
                    const remaining = estimated - actual;

                    let categoryStatusMessage = '';
                    let statusClass = '';

                    if (estimated === 0 && actual === 0) {
                        continue;
                    } else if (estimated === 0 && actual > 0) {
                        categoryStatusMessage = `No hay presupuesto definido para esta categoría. Gastado: Bs. ${actual.toFixed(2)}. 🟡`;
                        statusClass = 'no-budget-defined';
                    } else if (remaining < 0) {
                        categoryStatusMessage = `Excedido por Bs. ${Math.abs(remaining).toFixed(2)}. Gastado: Bs. ${actual.toFixed(2)} de Bs. ${estimated.toFixed(2)}. 🔴`;
                        statusClass = 'exceeded';
                    } else if (remaining === 0) {
                        categoryStatusMessage = `Presupuesto utilizado completamente. Gastado: Bs. ${actual.toFixed(2)} de Bs. ${estimated.toFixed(2)}. 🟠`;
                        statusClass = 'warning';
                    } else {
                        categoryStatusMessage = `Quedan Bs. ${remaining.toFixed(2)}. Gastado: Bs. ${actual.toFixed(2)} de Bs. ${estimated.toFixed(2)}. 🟢`;
                        statusClass = 'ok';
                    }

                    statusHTML += `
                        <li class="budget-category-item ${statusClass}">
                            <strong>${categoryName}:</strong> ${categoryStatusMessage}
                        </li>
                    `;
                }
                statusHTML += '</ul>';
            } else {
                statusHTML += '<p>No hay presupuestos ni transacciones de egreso para este mes y año.</p>';
            }

            this._budgetStatusElement.innerHTML = statusHTML;
        } catch (error) {
            console.error('Error al cargar el estado del presupuesto:', error);
            this._budgetStatusElement.innerHTML = '<p class="error-message">Error al cargar el estado del presupuesto.</p>';
        }
    }

    async loadCategories() {
        try {
            this._categories = await this._db.getCategories();
        } catch (error) {
            console.error('Error al cargar categorías en Dashboard:', error);
        }
    }

    async loadRecentTransactions() {
        if (!this._recentTransactionsListContainer || !this._db || this._currentMonth === null || this._currentYear === null) {
            console.warn('Dashboard: Contenedor de transacciones, DB, mes o año no disponibles para cargar recientes.');
            return;
        }

        this._recentTransactionsListContainer.innerHTML = '';

        try {
            const allTransactions = await this._db.getTransactions();
            const transactionsForSelectedPeriod = allTransactions.filter(transaction => {
                const transactionDate = new Date(transaction.date);
                return (transactionDate.getMonth() + 1) === this._currentMonth &&
                       transactionDate.getFullYear() === this._currentYear;
            });

            transactionsForSelectedPeriod.sort((a, b) => new Date(b.date) - new Date(a.date));

            if (transactionsForSelectedPeriod.length === 0) {
                const noTransactionsMessage = document.createElement('li');
                noTransactionsMessage.textContent = 'No hay transacciones para el mes/año seleccionados.';
                noTransactionsMessage.classList.add('no-transactions-message');
                this._recentTransactionsListContainer.appendChild(noTransactionsMessage);
                return;
            }

            transactionsForSelectedPeriod.forEach(transaction => {
                const listItem = document.createElement('li');
                listItem.classList.add('transaction-item');
                listItem.classList.add(transaction.type === 'income' ? 'income-item' : 'expense-item');

                const categoryName = this._categories.find(cat => cat.id === transaction.categoryId)?.name || 'Desconocida';

                const transactionDateTime = new Date(transaction.date);
                const formattedDate = transactionDateTime.toLocaleDateString('es-ES');
                const formattedTime = transactionDateTime.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

                let dateDisplay = `${formattedDate} ${formattedTime}`;
                if (transaction.isEdited) {
                    dateDisplay += ' (editado)';
                }

                listItem.innerHTML = `
                    <div class="transaction-details">
                        <span class="transaction-type">${transaction.type === 'income' ? 'Ingreso' : 'Egreso'}</span>
                        <span class="transaction-amount">Bs. ${transaction.amount.toFixed(2)}</span>
                        <span class="transaction-date">${dateDisplay}</span>
                        <span class="transaction-category">Categoría: ${categoryName}</span>
                        <p class="transaction-description">${transaction.description || 'Sin descripción'}</p>
                    </div>
                `;
                this._recentTransactionsListContainer.appendChild(listItem);
            });
        } catch (error) {
            console.error('Error al cargar transacciones del mes en Dashboard:', error);
            const errorMessage = document.createElement('li');
            errorMessage.textContent = 'Error al cargar transacciones del mes.';
            errorMessage.classList.add('no-transactions-message');
            this._recentTransactionsListContainer.appendChild(errorMessage);
        }
    }

    async renderCharts() {
        if (this._charts && this._expensesIncomesArea && this._currentMonth !== null && this._currentYear !== null) {
            await this._charts.genIncomeExpenseBarChart(this._expensesIncomesArea, this._currentMonth, this._currentYear);

            if (this._balanceEvolutionArea) {
                await this._charts.genBalanceEvolutionLineChart(this._balanceEvolutionArea, this._currentYear);
            }

            if (this._expensesComparativeArea) {
                await this._charts.genExpensesComparativeBarChart(this._expensesComparativeArea, this._currentMonth, this._currentYear);
            }
        }
    }
}