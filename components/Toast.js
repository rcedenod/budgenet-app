export class Toast {
    constructor() {
        // Crear contenedor si no existe
        if (!document.getElementById('toast-container')) {
            this.container = document.createElement('div');
            this.container.id = 'toast-container';
            this.container.style.cssText = `
                position: fixed;
                bottom: 20px;
                right: 20px;
                display: flex;
                flex-direction: column;
                gap: 10px;
                z-index: 1000;
            `;
            document.body.appendChild(this.container);
        } else {
            this.container = document.getElementById('toast-container');
        }
    }

    show(message, type = 'success') {
        const toast = document.createElement('div');
        
        // Estilos base
        const colors = {
            success: '#27ae60', // Verde
            error: '#c0392b',   // Rojo
            info: '#2980b9'     // Azul
        };

        toast.style.cssText = `
            min-width: 250px;
            padding: 15px 20px;
            background-color: ${colors[type] || colors.info};
            color: white;
            border-radius: 5px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            font-family: 'Montserrat', sans-serif;
            font-size: 14px;
            opacity: 0;
            transform: translateX(100%);
            transition: all 0.3s ease-in-out;
            display: flex;
            align-items: center;
        `;
        
        // Iconos simples usando texto o emojis para no depender de librerías
        const icons = {
            success: '✅ ',
            error: '❌ ',
            info: 'ℹ️ '
        };

        toast.textContent = icons[type] + message;

        this.container.appendChild(toast);

        // Animación de entrada
        requestAnimationFrame(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateX(0)';
        });

        // Eliminar después de 3 segundos
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => {
                toast.remove();
            }, 300); // Esperar a que termine la transición CSS
        }, 3000);
    }
}