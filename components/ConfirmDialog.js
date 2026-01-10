import { Button } from './Button.js';

export class ConfirmDialog {
    constructor() {
        // Crear el overlay (fondo oscuro)
        this.overlay = document.createElement('div');
        this.overlay.id = 'confirm-dialog-overlay';
        this.overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.5);
            display: none;
            justify-content: center;
            align-items: center;
            z-index: 2000;
            backdrop-filter: blur(2px);
        `;
        document.body.appendChild(this.overlay);

        // Crear la caja de diálogo
        const dialogBox = document.createElement('div');
        dialogBox.style.cssText = `
            background-color: white;
            padding: 25px;
            border-radius: 8px;
            width: 90%;
            max-width: 400px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            display: flex;
            flex-direction: column;
            gap: 20px;
            animation: fadeIn 0.2s ease-out;
        `;
        this.overlay.appendChild(dialogBox);

        // Mensaje
        this.messageElement = document.createElement('p');
        this.messageElement.style.cssText = `
            font-size: 16px;
            color: #2C3E50;
            text-align: center;
            line-height: 1.5;
            margin: 0;
        `;
        dialogBox.appendChild(this.messageElement);

        // Contenedor de botones
        const actionsContainer = document.createElement('div');
        actionsContainer.style.cssText = `
            display: flex;
            gap: 15px;
            justify-content: center;
            margin-top: 10px;
        `;
        dialogBox.appendChild(actionsContainer);

        // Botón Cancelar
        const cancelWrapper = document.createElement('div');
        cancelWrapper.style.width = '100%';
        this.cancelButton = new Button(cancelWrapper, {
            text: 'Cancelar',
            styles: { 
                width: '100%', 
                backgroundColor: '#95a5a6',
                color: 'white'
            },
            onClick: () => this.close()
        });
        actionsContainer.appendChild(cancelWrapper);

        // Botón Aceptar
        const confirmWrapper = document.createElement('div');
        confirmWrapper.style.width = '100%';
        this.confirmButton = new Button(confirmWrapper, {
            text: 'Aceptar',
            styles: { 
                width: '100%', 
                backgroundColor: '#e74c3c' // Rojo para indicar acción importante
            },
            onClick: () => {
                if (this.onConfirmCallback) this.onConfirmCallback();
                this.close();
            }
        });
        actionsContainer.appendChild(confirmWrapper);
    }

    show(message, onConfirm) {
        this.messageElement.textContent = message;
        this.onConfirmCallback = onConfirm;
        this.overlay.style.display = 'flex';
    }

    close() {
        this.overlay.style.display = 'none';
        this.onConfirmCallback = null;
    }
}