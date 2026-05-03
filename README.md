# Budgenet — Finanzas personales en el navegador

Aplicación sencilla de finanzas personales construida con JavaScript, HTML y CSS (vanilla) y almacenamiento local con IndexedDB. Es un proyecto 100% de aprendizaje, pensado para practicar conceptos base del cliente web: componentización, reutilización de componentes, manejo de eventos, estilos y templates. Fue mi base antes de pasar a frameworks como React o Angular.

**Demo en vivo:** https://budgenet-app.vercel.app

## Lo más importante

- Serverless y sin backend: todo vive en el navegador.
- Persistencia local con IndexedDB (tus datos se guardan en tu propio dispositivo).
- Arquitectura por componentes reutilizables, sin frameworks.

## Funcionalidades

- Dashboard con resumen mensual, balance, presupuestos y gráficos.
- Gestión de transacciones (ingresos/egresos) con filtros y búsqueda.
- Gestión de categorías con categorías por defecto y edición personalizada.
- Presupuestos mensuales por categoría y comparación con gasto real.
- Gráficos con Chart.js para análisis visual.

## Tecnologías

- JavaScript (ES Modules)
- HTML5 y CSS3
- IndexedDB (persistencia local)
- Chart.js (gráficos)

## Estructura del proyecto

```
budgenet/
├─ components/           # Componentes reutilizables (UI)
│  ├─ Button.js
│  ├─ Input.js
│  ├─ Select.js
│  ├─ Textarea.js
│  ├─ Navbar.js
│  ├─ Sidebar.js
│  ├─ Toast.js
│  └─ ConfirmDialog.js
├─ views/                # Vistas principales de la app
│  ├─ Dashboard.js
│  ├─ Transactions.js
│  ├─ Categories.js
│  ├─ Budgets.js
│  └─ styles/            # Estilos por vista
├─ services/             # Servicios de datos y gráficos
│  ├─ IndexedDB.js
│  └─ Charts.js
├─ index.html
├─ index.js              # Punto de entrada
└─ styles.css            # Estilos globales
```

## Cómo funciona (arquitectura)

- **Componentes**: UI desacoplada y reutilizable (inputs, botones, select, toasts, diálogos).
- **Vistas**: cada sección se renderiza de forma independiente (Dashboard, Transacciones, Categorías, Presupuestos).
- **Eventos**: las vistas se sincronizan con `CustomEvent` (por ejemplo, `transactionsUpdated`, `categoriesUpdated`).
- **Datos**: IndexedDB con stores para `categories`, `transactions` y `budgets`.
- **Montos**: se guardan en centavos para evitar errores de precisión.

## Ejecutar en local

Esta app usa ES Modules, así que es recomendable servirla con un servidor estático:

```bash
# Opción 1 (Node)
npx serve .

# Opción 2 (Python)
python -m http.server 5173
```

Luego abre `http://localhost:5173` (o el puerto que te indique tu servidor).

## Notas

- No hay autenticación ni backend.
- Si limpias el almacenamiento del navegador, se borran todos los datos.

## Sobre este proyecto

Budgenet fue un proyecto completamente de aprendizaje. Me permitió dominar la base del frontend: componentes reutilizables, manejo de eventos, estilos y templates, antes de migrar a frameworks modernos.
