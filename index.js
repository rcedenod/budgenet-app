// importamos los componentes principales y las vistas de la app
import { Navbar } from './components/Navbar.js';
import { Sidebar } from './components/Sidebar.js';
import { Dashboard } from './views/Dashboard.js';
import { Transactions } from './views/Transactions.js';
import { Categories } from './views/Categories.js';
import { Budgets } from './views/Budgets.js';
import { IndexedDB } from './services/IndexedDB.js';
import { Charts } from './services/Charts.js';
import { Toast } from './components/Toast.js';

// esperamos a que todo el contenido de la pagina este cargado antes de empezar a utilizarlo
document.addEventListener('DOMContentLoaded', async () => {
    // agarramos el contenedor principal de la app
    const app = document.getElementById('main-container');

    // creamos una instancia de la base de datos.
    const db = new IndexedDB();
    try {
        // se inicializa la base de datos.
        await db.initialize();
        console.log('indexeddb inicializada con exito y lista para usar.');
    } catch (error) {
        // si hay un problema al iniciar la db, lo mostramos en consola y avisamos al usuario.
        console.error('fallo al inicializar indexeddb:', error);
        alert('hubo un problema al iniciar la base de datos. la aplicacion podria no funcionar correctamente.');
        return; // si la db falla, no seguimos con la app.
    }

    // creamos una instancia de charts, pasandole la db para que pueda acceder a los datos.
    const charts = new Charts(db);

    const toast = new Toast();

    // creamos un div que servira como la estructura principal de la aplicacion (un grid).
    const appGridContainer = document.createElement('div');
    appGridContainer.classList.add('app-grid-container');
    // y lo añadimos a nuestro contenedor 'app'.
    app.appendChild(appGridContainer);

    // creamos la barra de navegacion (navbar) con el titulo 'budgenet' y la añadimos.
    const navbarElement = new Navbar('Budgenet').render();
    appGridContainer.appendChild(navbarElement);

    // definimos las vistas: dashboard, transacciones, categorias y presupuestos.
    // cada una tiene su nombre para el menu, el componente javascript que la maneja, y una instancia que se creara despues.
    const views = {
        dashboard: { label: 'Resumen', component: Dashboard, instance: null },
        transactions: { label: 'Transacciones', component: Transactions, instance: null },
        categories: { label: 'Categorias', component: Categories, instance: null },
        budgets: { label: 'Presupuestos', component: Budgets, instance: null }
    };

    // creamos la barra lateral (sidebar) pasandole las opciones de menu (los nombres de las vistas).
    const sidebarElement = new Sidebar(
        Object.keys(views).map(key => ({ label: views[key].label, view: key }))
    ).render();

    // y la añadimos a nuestro contenedor principal.
    appGridContainer.appendChild(sidebarElement);

    // creamos el area de contenido principal, donde se cargara cada vista.
    const contentElement = document.createElement('main');
    contentElement.classList.add('content');
    appGridContainer.appendChild(contentElement);

    // esta funcion es la que se encarga de cambiar la vista actual.
    const loadView = (view) => {
        // primero, actualizamos la clase 'active' en la barra lateral
        // para resaltar la opcion de menu que esta seleccionada.
        sidebarElement.querySelectorAll('.sidebar-item').forEach(li => {
            li.classList.toggle('active', li.dataset.view === view);
        });

        // vaciamos el contenido actual del area principal.
        contentElement.innerHTML = '';
        // obtenemos la configuracion de la vista que queremos cargar.
        const viewConfig = views[view];
        // si la vista existe y tiene un componente asociado...
        if (viewConfig && viewConfig.component) {
            // si aun no hemos creado una instancia de esta vista (es la primera vez que la cargamos)...
            if (!viewConfig.instance) {
                // creamos la instancia de la vista, pasandole los elementos necesarios.
                // algunas vistas necesitan la db y charts, otras solo la db.
                if(view === 'categories' || view === 'dashboard' || view === 'budgets') { 
                    viewConfig.instance = new viewConfig.component(contentElement, db, charts, toast);
                }
                else if (view === 'transactions' ) {
                    viewConfig.instance = new viewConfig.component(contentElement, db, toast);
                }
            }
            // finalmente, renderizamos (dibujamos) la vista en el area de contenido.
            viewConfig.instance.render();
        }
    };

    // añadimos un "escuchador de eventos" a cada opcion de la barra lateral.
    // cuando se hace click en una, llamamos a loadview para cargar esa vista.
    sidebarElement.querySelectorAll('.sidebar-item').forEach(li => {
        li.addEventListener('click', () => loadView(li.dataset.view));
    });

    // al iniciar la aplicacion, cargamos por defecto la vista del dashboard.
    loadView('dashboard');
});