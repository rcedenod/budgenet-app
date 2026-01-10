export class IndexedDB {
    constructor() {
        this.dbName = 'BudgenetDB';
        this.dbVersion = 21;
        this._db = null;
    }

    async initialize() {
        return new Promise((resolve, reject) => {
            if (this._db) {
                return resolve(this._db);
            }

            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                if (!db.objectStoreNames.contains('categories')) {
                    const categoriesStore = db.createObjectStore('categories', { keyPath: 'id', autoIncrement: true });
                    categoriesStore.createIndex('name', 'name', { unique: true });
                }

                if (!db.objectStoreNames.contains('transactions')) {
                    const transactionsStore = db.createObjectStore('transactions', { keyPath: 'id', autoIncrement: true });
                    transactionsStore.createIndex('type', 'type', { unique: false });
                    transactionsStore.createIndex('categoryId', 'categoryId', { unique: false });
                    transactionsStore.createIndex('date', 'date', { unique: false });
                    transactionsStore.createIndex('typeAndCategory', ['type', 'categoryId'], { unique: false });
                }

                if (!db.objectStoreNames.contains('budgets')) {
                    const budgetsStore = db.createObjectStore('budgets', { keyPath: 'id', autoIncrement: true });
                    budgetsStore.createIndex('monthYear', ['month', 'year'], { unique: false });
                } else {
                    const budgetsStore = event.target.transaction.objectStore('budgets');
                    if (!budgetsStore.indexNames.contains('monthYear')) {
                        budgetsStore.createIndex('monthYear', ['month', 'year'], { unique: false });
                    }
                }
            };

            request.onsuccess = (event) => {
                this._db = event.target.result;
                resolve(this._db);
            };

            request.onerror = (event) => {
                console.error('IndexedDB: Error al abrir la base de datos:', event.target.error);
                reject(event.target.error);
            };
        });
    }

    // ... (Mantén los métodos addBudget, getBudgets, updateBudget, deleteBudget, getBudgetsByMonthYear, addCategory, getCategories, getCategoryById, updateCategory, deleteCategory, putCategory, addTransaction, getTransactions, getTransactionById, updateTransaction, deleteTransaction, deleteTransactionsByCategoryId IGUALES) ...
    // NOTA: Asegúrate de copiar todos esos métodos aquí. Por brevedad, solo pongo el modificado abajo.
    
    // Métodos CRUD básicos (Resumidos para mantener el contexto, asegúrate de tenerlos en tu archivo final)
    async addBudget(b){ await this.initialize(); const t=this._db.transaction(['budgets'],'readwrite'); return new Promise((r,j)=>{const req=t.objectStore('budgets').add(b);req.onsuccess=()=>r(req.result);req.onerror=e=>j(e.target.error);});}
    async getBudgets(f={}){ return new Promise((r,j)=>{const req=this._db.transaction('budgets','readonly').objectStore('budgets').getAll(); req.onsuccess=e=>{let b=e.target.result; if(Object.keys(f).length>0){b=b.filter(x=>{let m=true;if(f.categoryId&&x.categoryId!==f.categoryId)m=false;if(f.month&&x.month!==f.month)m=false;if(f.year&&x.year!==f.year)m=false;if(f.type) { /* si tuvieras filtro por type en budgets */ } return m;});} r(b);}; req.onerror=e=>j(e.target.error);});}
    async updateBudget(b){ await this.initialize(); return new Promise((r,j)=>{const t=this._db.transaction(['budgets'],'readwrite').objectStore('budgets').put(b);t.onsuccess=()=>r();t.onerror=e=>j(e.target.error);});}
    async deleteBudget(id){ await this.initialize(); return new Promise((r,j)=>{const t=this._db.transaction(['budgets'],'readwrite').objectStore('budgets').delete(id);t.onsuccess=()=>r();t.onerror=e=>j(e.target.error);});}
    async getBudgetsByMonthYear(m,y){ await this.initialize(); return new Promise((r,j)=>{const idx=this._db.transaction(['budgets'],'readonly').objectStore('budgets').index('monthYear'); idx.getAll(IDBKeyRange.only([m,y])).onsuccess=e=>r(e.target.result);});}

    async addCategory(c){ await this.initialize(); return new Promise((r,j)=>{const req=this._db.transaction(['categories'],'readwrite').objectStore('categories').add(c);req.onsuccess=()=>r(req.result);req.onerror=e=>j(e.target.error);});}
    async getCategories(){ await this.initialize(); return new Promise((r,j)=>{this._db.transaction(['categories'],'readonly').objectStore('categories').getAll().onsuccess=e=>r(e.target.result);});}
    async getCategoryById(id){ await this.initialize(); return new Promise((r,j)=>{this._db.transaction(['categories'],'readonly').objectStore('categories').get(id).onsuccess=e=>r(e.target.result);});}
    async updateCategory(c){ await this.initialize(); return new Promise((r,j)=>{this._db.transaction(['categories'],'readwrite').objectStore('categories').put(c).onsuccess=()=>r();});}
    async deleteCategory(id){ await this.initialize(); return new Promise((r,j)=>{this._db.transaction(['categories'],'readwrite').objectStore('categories').delete(id).onsuccess=()=>r();});}
    async putCategory(c){ await this.initialize(); return new Promise((r,j)=>{const req=this._db.transaction(['categories'],'readwrite').objectStore('categories').put(c);req.onsuccess=()=>r(req.result||c.id);});}

    async addTransaction(t){ await this.initialize(); return new Promise((r,j)=>{t.isEdited=false; const req=this._db.transaction(['transactions'],'readwrite').objectStore('transactions').add(t);req.onsuccess=()=>r(req.result);req.onerror=e=>j(e.target.error);});}
    async getTransactions(){ await this.initialize(); return new Promise((r,j)=>{this._db.transaction(['transactions'],'readonly').objectStore('transactions').getAll().onsuccess=e=>r(e.target.result);});}
    async getTransactionById(id){ await this.initialize(); return new Promise((r,j)=>{this._db.transaction(['transactions'],'readonly').objectStore('transactions').get(id).onsuccess=e=>r(e.target.result);});}
    async updateTransaction(t){ await this.initialize(); return new Promise((r,j)=>{t.isEdited=true; this._db.transaction(['transactions'],'readwrite').objectStore('transactions').put(t).onsuccess=()=>r();});}
    async deleteTransaction(id){ await this.initialize(); return new Promise((r,j)=>{this._db.transaction(['transactions'],'readwrite').objectStore('transactions').delete(id).onsuccess=()=>r();});}
    async deleteTransactionsByCategoryId(id){ await this.initialize(); return new Promise((r,j)=>{const idx=this._db.transaction(['transactions'],'readwrite').objectStore('transactions').index('categoryId'); const req=idx.openCursor(IDBKeyRange.only(id)); let c=0; req.onsuccess=e=>{const cur=e.target.result; if(cur){cur.delete();c++;cur.continue();}else r(c);};});}

    // MÉTODO OPTIMIZADO:
    async getTransactionsFiltered(type = null, categoryId = null, searchTerm = null) {
        await this.initialize();
        return new Promise((resolve, reject) => {
            const transactionDB = this._db.transaction(['transactions'], 'readonly');
            const store = transactionDB.objectStore('transactions');
            let request;

            // 1. Uso de índices para filtrado eficiente
            if (type && type !== 'all' && categoryId && categoryId !== 'all') {
                const index = store.index('typeAndCategory');
                request = index.getAll([type, parseInt(categoryId)]);
            } else if (type && type !== 'all') {
                const index = store.index('type');
                request = index.getAll(type);
            } else if (categoryId && categoryId !== 'all') {
                const index = store.index('categoryId');
                request = index.getAll(parseInt(categoryId));
            } else {
                request = store.getAll();
            }

            request.onsuccess = () => {
                let transactions = request.result;

                // 2. Filtro de texto en memoria (los índices no soportan 'includes' nativo fácilmente)
                if (searchTerm) {
                    const lowerCaseSearchTerm = searchTerm.toLowerCase();
                    transactions = transactions.filter(t =>
                        (t.description && t.description.toLowerCase().includes(lowerCaseSearchTerm)) ||
                        // Nota: categoryName usualmente se busca cruzando IDs, pero si guardaste el nombre, sirve esto.
                        (t.categoryName && t.categoryName.toLowerCase().includes(lowerCaseSearchTerm)) 
                    );
                }
                resolve(transactions);
            };

            request.onerror = (event) => {
                console.error('IndexedDB: Error al obtener transacciones filtradas:', event.target.error);
                reject(event.target.error);
            };
        });
    }
}