import { Input } from '../components/Input.js';
import { Button } from '../components/Button.js';
import { Select } from '../components/Select.js';

export class Categories {
    _container = null;
    _db = null;
    _charts = null;
    _toast = null;
    _confirmDialog = null;
    _categories = [];
    _newCategoryInput = null;
    _editCategoryInput = null;
    _editingCategoryId = null;
    _categoriesListContainer = null;
    _cssPath = './views/styles/Categories.css';
    _monthSelect = null;
    _currentMonth = new Date().getMonth() + 1;
    _currentYear = new Date().getFullYear();

    constructor(container, db, charts, toast, confirmDialog) {
        if (!(container instanceof HTMLElement)) throw new Error('Categories: container inválido.');
        if (!db) throw new Error('Categories: DB requerida.');
        if (!charts) throw new Error('Categories: Charts requerido.');

        this._container = container;
        this._db = db;
        this._charts = charts;
        this._toast = toast;
        this._confirmDialog = confirmDialog;

        this._loadCSS(this._cssPath);
        this.initializeDefaultCategories();
    }

    _loadCSS(path) {
        if (document.querySelector(`link[href="${path}"]`)) return;
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = path;
        document.head.appendChild(link);
    }

    async initializeDefaultCategories(forceRecreate = false) {
        const predefinedCategories = [
            { id: -1, name: 'Comida', isDefault: true },
            { id: -2, name: 'Transporte', isDefault: true },
            { id: -3, name: 'Vivienda', isDefault: true },
            { id: -4, name: 'Entretenimiento', isDefault: true },
            { id: -5, name: 'Salario', isDefault: true },
            { id: -6, name: 'Otros', isDefault: true }
        ];

        try {
            for (const predefinedCat of predefinedCategories) {
                const existingCategory = await this._db.getCategoryById(predefinedCat.id);
                if (forceRecreate || !existingCategory) {
                    await this._db.putCategory(predefinedCat);
                }
            }
            this.loadCategories();
        } catch (error) {
            console.error('Error inicializando categorías:', error);
        }
    }

    async loadCategories() {
        try {
            this._categories = await this._db.getCategories();
            this._categories.sort((a, b) => a.name.localeCompare(b.name));
            this.renderCategoriesList();
            await this._loadChartsForCurrentMonth(this._currentMonth, this._currentYear);
        } catch (error) {
            console.error('Error al cargar categorías:', error);
            this._toast.show('Error al cargar categorías.', 'error');
        }
    }

    render() {
        this._container.innerHTML = '';
        const categoriesView = document.createElement('div');
        categoriesView.classList.add('categories-grid-container');

        const headerArea = document.createElement('div');
        headerArea.classList.add('header');
        headerArea.innerHTML = '<h2>Gestión de categorías</h2>';
        categoriesView.appendChild(headerArea);

        const createArea = document.createElement('div');
        createArea.classList.add('create-area');
        createArea.innerHTML = '<h3>Añadir categoría</h3>';

        const newCategoryInputWrapper = document.createElement('div');
        this._newCategoryInput = new Input(newCategoryInputWrapper, {
            placeholder: 'Nombre de la categoría',
            styles: { width: '100%' },
        });
        createArea.appendChild(this._newCategoryInput.render());

        const addCategoryButtonWrapper = document.createElement('div');
        const addCategoryButton = new Button(addCategoryButtonWrapper, {
            text: 'Guardar',
            styles: { width: '100%', padding: '10px' },
            onClick: () => this.handleAddCategory(),
        });
        createArea.appendChild(addCategoryButton.render());
        categoriesView.appendChild(createArea);

        const viewArea = document.createElement('div');
        viewArea.classList.add('view-area');
        const titleAndResetContainer = document.createElement('div');
        titleAndResetContainer.classList.add('title-reset-container');
        titleAndResetContainer.innerHTML = '<h3>Categorías existentes</h3>';

        const resetLink = document.createElement('a');
        resetLink.href = '#';
        resetLink.textContent = 'Restablecer categorías';
        resetLink.classList.add('reset-link');
        resetLink.addEventListener('click', (e) => {
            e.preventDefault();
            this.handleResetCategories();
        });
        titleAndResetContainer.appendChild(resetLink);
        viewArea.appendChild(titleAndResetContainer);

        this._categoriesListContainer = document.createElement('ul');
        this._categoriesListContainer.classList.add('categories-list');
        viewArea.appendChild(this._categoriesListContainer);
        categoriesView.appendChild(viewArea);

        const extraArea = document.createElement('div');
        extraArea.classList.add('extra');
        extraArea.id = 'category-charts-area';

        const monthSelectorContainer = document.createElement('div');
        monthSelectorContainer.classList.add('month-selector-container');
        monthSelectorContainer.innerHTML = '<h3>Mes: </h3>';

        const monthOptions = [
            'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
        ].map((name, index) => ({ value: (index + 1).toString(), text: name }));

        const monthSelectWrapper = document.createElement('div');
        monthSelectWrapper.classList.add('month-select-wrapper');
        this._monthSelect = new Select(monthSelectWrapper, {
            items: monthOptions,
            selectedValue: this._currentMonth.toString(),
            styles: { width: '100%' },
            onChange: (event) => this._handleMonthChange(event.target.value)
        });
        monthSelectorContainer.appendChild(this._monthSelect.render());
        extraArea.appendChild(monthSelectorContainer);

        const chartsContainerWrapper = document.createElement('div');
        chartsContainerWrapper.id = 'charts-display-area';
        chartsContainerWrapper.classList.add('charts-container-wrapper');
        extraArea.appendChild(chartsContainerWrapper);

        categoriesView.appendChild(extraArea);
        this._container.appendChild(categoriesView);
        this.loadCategories();
        return categoriesView;
    }

    renderCategoriesList() {
        if (!this._categoriesListContainer) return;
        this._categoriesListContainer.innerHTML = '';

        if (this._categories.length === 0) {
            this._categoriesListContainer.innerHTML = '<li class="no-categories-message">No hay categorías.</li>';
            return;
        }

        this._categories.forEach(category => {
            const listItem = document.createElement('li');
            listItem.classList.add('category-item');

            const categoryNameDisplay = document.createElement('span');
            categoryNameDisplay.textContent = category.name;
            categoryNameDisplay.classList.add('category-name');
            listItem.appendChild(categoryNameDisplay);

            const actionsContainer = document.createElement('div');
            actionsContainer.classList.add('category-actions');

            const editLink = document.createElement('a');
            editLink.href = '#';
            editLink.textContent = 'Editar';
            editLink.classList.add('edit-link');
            editLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleEditCategory(category.id, category.name, listItem);
            });
            actionsContainer.appendChild(editLink);

            const deleteLink = document.createElement('a');
            deleteLink.href = '#';
            deleteLink.textContent = 'Eliminar';
            deleteLink.classList.add('delete-link');
            deleteLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleDeleteCategory(category.id, category.name);
            });
            actionsContainer.appendChild(deleteLink);

            listItem.appendChild(actionsContainer);
            this._categoriesListContainer.appendChild(listItem);
        });
    }

    async handleAddCategory() {
        const categoryName = this._newCategoryInput.getValue().trim();
        if (!categoryName) {
            this._toast.show('El nombre es obligatorio.', 'error');
            return;
        }

        try {
            const existing = await this._db.getCategories();
            if (existing.some(c => c.name.toLowerCase() === categoryName.toLowerCase())) {
                this._toast.show('Esa categoría ya existe.', 'warning');
                return;
            }

            await this._db.addCategory({ name: categoryName, isDefault: false });
            this._newCategoryInput.setValue('');
            this._toast.show('Categoría creada.', 'success');
            await this.loadCategories();
        } catch (error) {
            console.error('Error:', error);
            this._toast.show('Error al guardar categoría.', 'error');
        }
    }

    handleEditCategory(id, currentName, listItem) {
        if (this._editingCategoryId === id) return;
        if (this._editingCategoryId !== null) this.cancelEdit();

        this._editingCategoryId = id;
        listItem.innerHTML = '';
        listItem.classList.add('category-item-editing');
        listItem.style.flexDirection = 'column';

        const editInputWrapper = document.createElement('div');
        editInputWrapper.classList.add('edit-input-wrapper');
        this._editCategoryInput = new Input(editInputWrapper, { value: currentName, styles: { width: '97%' } });
        const editInputField = this._editCategoryInput.render();
        listItem.appendChild(editInputField);

        const actions = document.createElement('div');
        actions.classList.add('edit-actions-container');

        const saveLink = document.createElement('a');
        saveLink.href = '#'; saveLink.textContent = 'Guardar'; saveLink.classList.add('save-link');
        saveLink.addEventListener('click', (e) => { e.preventDefault(); this.handleSaveEdit(id); });
        actions.appendChild(saveLink);

        const cancelLink = document.createElement('a');
        cancelLink.href = '#'; cancelLink.textContent = 'Cancelar'; cancelLink.classList.add('cancel-link');
        cancelLink.addEventListener('click', (e) => { e.preventDefault(); this.cancelEdit(); });
        actions.appendChild(cancelLink);

        listItem.appendChild(actions);
        editInputField.focus();
    }

    async handleSaveEdit(id) {
        const newName = this._editCategoryInput.getValue().trim();
        if (!newName) {
            this._toast.show('El nombre es obligatorio.', 'error');
            return;
        }
        
        const currentCategory = this._categories.find(c => c.id === id);
        if (currentCategory && newName === currentCategory.name) {
            this.cancelEdit();
            return;
        }

        try {
            const existing = await this._db.getCategories();
            if (existing.some(c => c.id !== id && c.name.toLowerCase() === newName.toLowerCase())) {
                this._toast.show('Ya existe una categoría con ese nombre.', 'warning');
                return;
            }

            if (currentCategory) {
                currentCategory.name = newName;
                await this._db.updateCategory(currentCategory);
                this._toast.show('Categoría actualizada.', 'success');
                this._editingCategoryId = null;
                this._editCategoryInput.remove();
                await this.loadCategories();
            }
        } catch (error) {
            console.error('Error:', error);
            this._toast.show('Error al actualizar.', 'error');
        }
    }

    cancelEdit() {
        this._editingCategoryId = null;
        if (this._editCategoryInput) {
            this._editCategoryInput.remove();
            this._editCategoryInput = null;
        }
        this.renderCategoriesList();
    }

    async handleDeleteCategory(categoryId, categoryName) {
        const message = `¿Eliminar "${categoryName}"? Se borrarán sus datos asociados.`;
        this._confirmDialog.show(message, async () => {
            try {
                await this._db.deleteCategory(categoryId);
                document.dispatchEvent(new CustomEvent('categoryDeleted', { detail: { categoryId } }));
                document.dispatchEvent(new CustomEvent('categoriesUpdated'));
                this._toast.show('Categoría eliminada.', 'success');
                await this.loadCategories();
            } catch (error) {
                console.error('Error:', error);
                this._toast.show('Error al eliminar.', 'error');
            }
        });
    }

    async handleResetCategories() {
        const message = '¿Restablecer categorías por defecto? Se perderán las personalizadas.';
        this._confirmDialog.show(message, async () => {
            try {
                const all = await this._db.getCategories();
                for (const c of all) await this._db.deleteCategory(c.id);
                await this.initializeDefaultCategories(true);
                this._toast.show('Categorías restablecidas.', 'success');
                await this.loadCategories();
            } catch (error) {
                console.error('Error:', error);
                this._toast.show('Error al restablecer.', 'error');
            }
        });
    }

    async _handleMonthChange(val) {
        this._currentMonth = parseInt(val, 10);
        await this._loadChartsForCurrentMonth(this._currentMonth, this._currentYear);
    }

    async _loadChartsForCurrentMonth(m, y) {
        const area = this._container.querySelector('#charts-display-area');
        if (area && this._charts) {
            area.innerHTML = '';
            const expContainer = document.createElement('div');
            expContainer.classList.add('chart-wrapper');
            area.appendChild(expContainer);
            await this._charts.genExpensesByMonthCategory(expContainer, m, y);

            const incContainer = document.createElement('div');
            incContainer.classList.add('chart-wrapper');
            area.appendChild(incContainer);
            await this._charts.genIncomesByMonthCategory(incContainer, m, y);
        }
    }
}