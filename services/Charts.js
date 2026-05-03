export class Charts {
    _db = null;
    _chartInstances = {};

    constructor(db) {
        if (!db) throw new Error('Charts: IndexedDB requerida.');
        this._db = db;
    }

    _getMonthName(index) {
        return new Date(2000, index).toLocaleString('es-ES', { month: 'long' });
    }

    // Helper para corregir montos (de centavos a decimales)
    _fixAmount(amount) {
        return amount / 100;
    }

    async genExpensesByMonthCategory(target, month, year) {
        this._destroyChart(`expenses-${target.id}`);
        const ctx = this._setupCanvas(target, `expensesPieChart-${target.id}`);
        if (!ctx) return;

        try {
            const allTransactions = await this._db.getTransactions();
            const allCategories = await this._db.getCategories();
            const categoryMap = new Map(allCategories.map(cat => [cat.id, cat.name]));

            const filtered = allTransactions.filter(t => {
                const d = new Date(t.date);
                return d.getMonth() + 1 === month && d.getFullYear() === year && t.type === 'expense';
            });

            const dataMap = {};
            filtered.forEach(t => {
                const name = categoryMap.get(t.categoryId) || 'Otros';
                dataMap[name] = (dataMap[name] || 0) + t.amount;
            });

            // CORRECCIÓN: Dividir valores por 100
            const labels = Object.keys(dataMap);
            const data = Object.values(dataMap).map(val => this._fixAmount(val));

            if (labels.length === 0) {
                target.innerHTML = '<p class="no-chart-data-message">No hay datos.</p>';
                return;
            }

            this._chartInstances[`expenses-${target.id}`] = new window.Chart(ctx, {
                type: 'pie',
                data: {
                    labels,
                    datasets: [{ data, backgroundColor: this._genColors(labels.length) }]
                },
                options: { plugins: { title: { display: true, text: `Egresos - ${this._getMonthName(month - 1)} ${year}` } } }
            });
        } catch (e) { console.error(e); }
    }

    async genIncomesByMonthCategory(target, month, year) {
        this._destroyChart(`incomes-${target.id}`);
        const ctx = this._setupCanvas(target, `incomesPieChart-${target.id}`);
        if (!ctx) return;

        try {
            const all = await this._db.getTransactions();
            const cats = await this._db.getCategories();
            const map = new Map(cats.map(c => [c.id, c.name]));

            const filtered = all.filter(t => {
                const d = new Date(t.date);
                return d.getMonth() + 1 === month && d.getFullYear() === year && t.type === 'income';
            });

            const dataMap = {};
            filtered.forEach(t => {
                const name = map.get(t.categoryId) || 'Otros';
                dataMap[name] = (dataMap[name] || 0) + t.amount;
            });

            const labels = Object.keys(dataMap);
            const data = Object.values(dataMap).map(val => this._fixAmount(val));

            if (labels.length === 0) {
                target.innerHTML = '<p class="no-chart-data-message">No hay datos.</p>';
                return;
            }

            this._chartInstances[`incomes-${target.id}`] = new window.Chart(ctx, {
                type: 'pie',
                data: { labels, datasets: [{ data, backgroundColor: this._genColors(labels.length) }] },
                options: { plugins: { title: { display: true, text: `Ingresos - ${this._getMonthName(month - 1)} ${year}` } } }
            });
        } catch (e) { console.error(e); }
    }

    async genIncomeExpenseBarChart(target, month, year) {
        const id = `incomeExpenseBarChart-${target.id}`;
        this._destroyChart(id);
        const ctx = this._setupCanvas(target, id, 'income-expense-chart-container');
        if (!ctx) return;

        try {
            const all = await this._db.getTransactions();
            const current = all.filter(t => {
                const d = new Date(t.date);
                return d.getMonth() + 1 === month && d.getFullYear() === year;
            });

            let income = 0, expense = 0;
            current.forEach(t => {
                if (t.type === 'income') income += t.amount;
                else expense += t.amount;
            });

            if (income === 0 && expense === 0) {
                target.innerHTML = '<p class="no-chart-data-message">Sin datos.</p>';
                return;
            }

            this._chartInstances[id] = new window.Chart(ctx, {
                type: 'bar',
                data: {
                    labels: ['Ingresos', 'Egresos'],
                    datasets: [{
                        label: 'Monto',
                        data: [this._fixAmount(income), this._fixAmount(expense)],
                        backgroundColor: ['rgba(75, 192, 192, 0.6)', 'rgba(255, 99, 132, 0.6)']
                    }]
                },
                options: { maintainAspectRatio: false }
            });
        } catch (e) { console.error(e); }
    }

    async genBalanceEvolutionLineChart(target, year) {
        const id = `balanceLine-${target.id}`;
        this._destroyChart(id);
        const ctx = this._setupCanvas(target, id, 'balance-evolution-chart-container');
        if (!ctx) return;

        try {
            const all = await this._db.getTransactions();
            const balances = new Array(12).fill(0);
            all.forEach(t => {
                const d = new Date(t.date);
                if (d.getFullYear() === year) {
                    if (t.type === 'income') balances[d.getMonth()] += t.amount;
                    else balances[d.getMonth()] -= t.amount;
                }
            });

            const currentMonth = new Date().getMonth();
            const data = balances.slice(0, currentMonth + 1).map(val => this._fixAmount(val));
            const labels = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'].slice(0, currentMonth + 1);

            this._chartInstances[id] = new window.Chart(ctx, {
                type: 'line',
                data: {
                    labels,
                    datasets: [{
                        label: 'Balance',
                        data,
                        borderColor: 'blue',
                        fill: false
                    }]
                },
                options: { maintainAspectRatio: false }
            });
        } catch (e) { console.error(e); }
    }

    async genBudgetComparisonChart(target, month, year) {
        const id = `budgetComp-${target.id}`;
        this._destroyChart(id);
        const ctx = this._setupCanvas(target, id);
        if (!ctx) return;

        try {
            const budgets = await this._db.getBudgetsByMonthYear(month, year);
            const allTrans = await this._db.getTransactions();
            const cats = await this._db.getCategories();
            const catMap = new Map(cats.map(c => [c.id, c.name]));

            const labels = [], est = [], act = [];

            budgets.forEach(b => {
                const name = catMap.get(b.categoryId);
                if (name) {
                    labels.push(name);
                    est.push(this._fixAmount(b.amount));
                    
                    const actual = allTrans
                        .filter(t => t.type === 'expense' && t.categoryId === b.categoryId && new Date(t.date).getMonth()+1 === month && new Date(t.date).getFullYear() === year)
                        .reduce((s, t) => s + t.amount, 0);
                    act.push(this._fixAmount(actual));
                }
            });

            if (labels.length === 0) { target.innerHTML = '<p class="no-chart-data-message">No hay presupuestos.</p>'; return; }

            this._chartInstances[id] = new window.Chart(ctx, {
                type: 'bar',
                data: {
                    labels,
                    datasets: [
                        { label: 'Estimado', data: est, backgroundColor: 'rgba(54, 162, 235, 0.6)' },
                        { label: 'Real', data: act, backgroundColor: 'rgba(255, 99, 132, 0.6)' }
                    ]
                },
                options: { maintainAspectRatio: false }
            });
        } catch (e) { console.error(e); }
    }

    _destroyChart(id) {
        if (this._chartInstances[id]) { this._chartInstances[id].destroy(); delete this._chartInstances[id]; }
    }

    _setupCanvas(target, id, className = 'chart-container') {
        target.innerHTML = '';
        const div = document.createElement('div');
        div.classList.add(className);
        div.style.width='100%'; div.style.height='100%';
        const cvs = document.createElement('canvas');
        cvs.id = id;
        div.appendChild(cvs);
        target.appendChild(div);
        return cvs.getContext('2d');
    }

    _genColors(count) {
        const c=[]; for(let i=0;i<count;i++) c.push(`hsl(${Math.floor(Math.random()*360)}, 70%, 60%)`); return c;
    }

    async genMonthlyExpenseProjection(targetElement, currentMonth, currentYear) {
        if (this._chartInstances[`expense-projection-${targetElement.id}`]) {
            this._chartInstances[`expense-projection-${targetElement.id}`].destroy();
            delete this._chartInstances[`expense-projection-${targetElement.id}`];
        }

        const canvas = document.createElement('canvas');
        canvas.id = `expenseProjectionChart-${targetElement.id}`;
        targetElement.innerHTML = '';
        targetElement.appendChild(canvas);
        const ctx = canvas.getContext('2d');

        try {
            const monthsToShow = 6;
            const labels = [];
            const estimatedTotals = [];
            const actualTotals = [];

            for (let i = -monthsToShow; i <= monthsToShow; i++) {
                const date = new Date(currentYear, currentMonth - 1 + i, 1);
                const month = date.getMonth() + 1;
                const year = date.getFullYear();
                labels.push(this._getMonthName(month - 1).charAt(0).toUpperCase() + this._getMonthName(month - 1).slice(1) + ' ' + year);

                const budgets = await this._db.getBudgetsByMonthYear(month, year);
                const totalEstimated = budgets.reduce((sum, b) => sum + b.amount, 0);
                estimatedTotals.push(totalEstimated);

                const transactions = await this._db.getTransactions();
                const actualExpenses = transactions
                    .filter(t => {
                        const transactionDate = new Date(t.date);
                        return t.type === 'expense' &&
                            transactionDate.getMonth() + 1 === month &&
                            transactionDate.getFullYear() === year;
                    })
                    .reduce((sum, t) => sum + t.amount, 0);
                actualTotals.push(actualExpenses);
            }

            if (labels.length === 0) {
                targetElement.innerHTML = '<p class="no-chart-data-message">No hay datos para la proyección de egresos.</p>';
                return;
            }

            this._chartInstances[`expense-projection-${targetElement.id}`] = new window.Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: 'Egresos estimados',
                            data: estimatedTotals,
                            borderColor: 'rgb(75, 192, 192)',
                            backgroundColor: 'rgba(75, 192, 192, 0.2)',
                            fill: false,
                            tension: 0.1
                        },
                        {
                            label: 'Egresos reales',
                            data: actualTotals,
                            borderColor: 'rgb(255, 99, 132)',
                            backgroundColor: 'rgba(255, 99, 132, 0.2)',
                            fill: false,
                            tension: 0.1
                        }
                    ]
                },
                options: {
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'top',
                            labels: {
                                font: {
                                    size: 12
                                }
                            }
                        },
                        title: {
                            display: true,
                            text: 'Proyección mensual de egresos (estimados vs. reales)',
                            font: {
                                size: 14
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'Monto (Bs.)'
                            }
                        },
                        x: {
                            title: {
                                display: true,
                                text: 'Mes y Año'
                            }
                        }
                    }
                }
            });

        } catch (error) {
            console.error('Error al cargar el gráfico de proyección de egresos:', error);
        }
    }

    async genExpensesComparativeBarChart(targetElement, currentMonth, currentYear) {
        const chartId = `expensesComparativeBarChart-${targetElement.id}`;
        if (this._chartInstances[chartId]) {
            this._chartInstances[chartId].destroy();
            delete this._chartInstances[chartId];
        }

        const canvas = document.createElement('canvas');
        canvas.id = chartId;
        
        let chartContainer = targetElement.querySelector('.expenses-comparative-chart-container');
        if (!chartContainer) {
            chartContainer = document.createElement('div');
            chartContainer.classList.add('expenses-comparative-chart-container');
            chartContainer.style.width = '100%';
            chartContainer.style.height = '100%';
            chartContainer.style.display = 'flex';
            chartContainer.style.justifyContent = 'center';
            chartContainer.style.alignItems = 'center';

            targetElement.appendChild(chartContainer);
        }
        chartContainer.innerHTML = '';
        chartContainer.appendChild(canvas);

        const ctx = canvas.getContext('2d');

        try {
            const allTransactions = await this._db.getTransactions();
            const allBudgets = await this._db.getBudgets();

            const monthLabels = [
                'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
                'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
            ];

            const realExpensesByMonth = new Array(12).fill(0);
            const estimatedExpensesByMonth = new Array(12).fill(0);

            allTransactions.filter(t => {
                const transactionDate = new Date(t.date);
                return t.type === 'expense' && transactionDate.getFullYear() === currentYear;
            }).forEach(expense => {
                const monthIndex = new Date(expense.date).getMonth();
                realExpensesByMonth[monthIndex] += expense.amount;
            });

            allBudgets.filter(b => b.year === currentYear)
            .forEach(budget => {
                const monthIndex = budget.month - 1;
                if (monthIndex >= 0 && monthIndex < 12) {
                    estimatedExpensesByMonth[monthIndex] += budget.amount;
                } else {
                    console.warn(`Presupuesto con mes inválido o ausente:`, budget);
                }
            });

            const chartLabels = monthLabels;
            const chartRealExpenses = realExpensesByMonth;
            const chartEstimatedExpenses = estimatedExpensesByMonth;

            if (chartRealExpenses.every(val => val === 0) && chartEstimatedExpenses.every(val => val === 0)) {
                chartContainer.innerHTML = '<p class="no-chart-data-message">No hay datos de egresos para comparar este año.</p>';
                return;
            }
            
            const chartTitle = `Comparación de egresos (reales vs. estimados) - ${currentYear}`;

            this._chartInstances[chartId] = new window.Chart(ctx, {
                type: 'bar',
                data: {
                    labels: chartLabels,
                    datasets: [
                        {
                            label: 'Egresos reales',
                            data: chartRealExpenses,
                            backgroundColor: 'rgba(255, 99, 132, 0.8)',
                            borderColor: 'rgba(255, 99, 132, 1)',
                            borderWidth: 1,
                            borderRadius: 5,
                        },
                        {
                            label: 'Egresos estimados',
                            data: chartEstimatedExpenses,
                            backgroundColor: 'rgba(54, 162, 235, 0.8)',
                            borderColor: 'rgba(54, 162, 235, 1)',
                            borderWidth: 1,
                            borderRadius: 5, 
                        }
                    ]
                },
                options: {
                    maintainAspectRatio: false,
                    responsive: true,
                    indexAxis: 'y',
                    plugins: {
                        legend: {
                            position: 'top',
                            labels: {
                                font: {
                                    size: 12
                                }
                            }
                        },
                        title: {
                            display: true,
                            text: chartTitle,
                            font: {
                                size: 14
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'Monto (Bs.)'
                            }
                        },
                        x: {
                            title: {
                                display: true,
                                text: 'Mes'
                            },
                            grid: {
                                display: false
                            }
                        }
                    }
                }
            });

        } catch (error) {
            console.error('Error al cargar los datos del gráfico de comparación de egresos:', error);
        }
    }
}