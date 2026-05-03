// Select.js
export class Select {
    // estilos por defecto del select (sin focus)
    _defaultStyles = {
        padding: '10px 15px',
        border: '1px solid #ccc',
        borderRadius: '5px',
        fontSize: '16px',
        width: '100%',
        backgroundColor: '#fff'
    };

    // estilos del select con focus
    _defaultFocusStyles = {
        borderColor: '#1ab7bc',
        outline: 'none'
    };

    // estilos del select deshabilitado
    _defaultDisabledStyles = {
        backgroundColor: '#f0f0f0',
        borderColor: '#e0e0e0'
    };

    constructor(container, {
        items = [],
        selectedValue = '',
        styles = {},
        focusStyles = {},
        disabledStyles = {},
        isDisabled = false,
        onChange = () => {}
    }) {
        if (!(container instanceof HTMLElement)) {
            throw new Error('Select: el container debe ser un elemento HTML válido.');
        }

        this.container = container; // contenedor donde se agregara el select
        this.items = items; // opciones del select
        this.selectedValue = selectedValue; // valor de la opcion seleccionada por defecto
        this.isDisabled = isDisabled; // estado deshabilitado/habilitado

        // fusionamos los estilos por defecto con los del usuario
        this.styles = { ...this._defaultStyles, ...styles };
        this.focusStyles = { ...this._defaultFocusStyles, ...focusStyles };
        this.disabledStyles = { ...this._defaultDisabledStyles, ...disabledStyles };

        this.onChange = onChange; // callback para el evento change

        this.selectElement = document.createElement('select');
        this.render();
    }

    // aplicar los estilos CSS al componente
    _applyStyles(element, stylesObject) {
        for (const key in stylesObject) {
            if (Object.hasOwnProperty.call(stylesObject, key)) {
                element.style[key] = stylesObject[key];
            }
        }
    }

    render() {
        this.selectElement.disabled = this.isDisabled; // establecer el estado deshabilitado inicial

        // limpiar opciones existentes (por si se re-renderiza)
        this.selectElement.innerHTML = '';

        // crear y agregar las opciones al select
        this.items.forEach(item => {
            const option = document.createElement('option');
            option.value = item.value;
            option.textContent = item.text;
            if (item.value === this.selectedValue) {
                option.selected = true; // marcar como seleccionada si coincide con selectedValue
            }
            this.selectElement.appendChild(option);
        });

        // aplicar estilos base iniciales
        this._applyStyles(this.selectElement, this.styles);

        // guardar estilos iniciales para volver a ellos al quitar el foco o habilitar
        this.initialStyles = {};
        for (const key in this.styles) {
            this.initialStyles[key] = this.selectElement.style[key];
        }

        // eventos de foco (focus y perder focus)
        this.handleFocus = () => {
            if (!this.selectElement.disabled) {
                this._applyStyles(this.selectElement, this.focusStyles);
            }
        };
        this.handleBlur = () => {
            if (!this.selectElement.disabled) {
                // al perder el foco, restaurar a los estilos iniciales
                this._applyStyles(this.selectElement, this.initialStyles);
            }
        };

        this.selectElement.addEventListener('focus', this.handleFocus); // al hacer click al select (focus)
        this.selectElement.addEventListener('blur', this.handleBlur); // al salir del select (perder el focus)
        this.selectElement.addEventListener('change', this.onChange); // al cambiar la selección

        this.container.appendChild(this.selectElement);

        return this.selectElement;
    }

    // metodos para interactuar con el select desde fuera
    getValue() {
        return this.selectElement.value;
    }
    setValue(newValue) {
        this.selectElement.value = newValue;
    }
    setDisabled(isDisabled) {
        if (this.selectElement) {
            this.selectElement.disabled = isDisabled;
            if (isDisabled) {
                // aplicar estilos de deshabilitado
                this._applyStyles(this.selectElement, this.disabledStyles);
            } else {
                // restaurar a los estilos iniciales
                this._applyStyles(this.selectElement, this.initialStyles);
            }
        }
    }

    // quitar del dom
    remove() {
        if (this.selectElement && this.selectElement.parentElement) {
            this.selectElement.parentElement.removeChild(this.selectElement);
            this.selectElement = null;
        }
    }
}