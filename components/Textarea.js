export class Textarea {
    // estilos por defecto del textarea (sin focus)
    _defaultStyles = {
        backgroundColor: '#fff',
        padding: '10px 15px',
        border: '1px solid #ccc',
        borderRadius: '5px',
        fontSize: '16px',
        width: '100%',
        minHeight: '80px',
        resize: 'none',
        boxSizing: 'border-box',
    };

    // textarea con focus
    _defaultFocusStyles = {
        borderColor: '#1ab7bc',
        outline: 'none',
    };

    // textarea deshabilitado
    _defaultDisabledStyles = {
        backgroundColor: '#f0f0f0',
        color: '#a0a0a0',
        cursor: 'not-allowed',
    };

    constructor(container, {
        placeholder = 'Ingresar texto',
        value = '',
        rows = 2, // Propiedad específica para textarea
        styles = {},
        focusStyles = {},
        disabledStyles = {},
        isDisabled = false,
        onInput = () => {},
        onChange = () => {}
    }) {
        if (!(container instanceof HTMLElement)) {
            throw new Error('Textarea: el container debe ser un elemento HTML válido.');
        }

        this.container = container; // contenedor
        this.placeholder = placeholder; // placeholder
        this.value = value; // valor inicial
        this.rows = rows; // número de filas
        this.isDisabled = isDisabled; // estado deshabilitado/habilitado

        // fusionamos los estilos por defecto con los del usuario
        this.styles = { ...this._defaultStyles, ...styles };
        this.focusStyles = { ...this._defaultFocusStyles, ...focusStyles };
        this.disabledStyles = { ...this._defaultDisabledStyles, ...disabledStyles };

        this.onInput = onInput; // que hacer al recibir informacion (tiempo real)
        this.onChange = onChange; // al finalizar de ingresar la informacion (al perder foco)

        this.textareaElement = document.createElement('textarea');
        this.render();
    }

    _applyStyles(element, stylesObject) {
        for (const key in stylesObject) {
            if (Object.hasOwnProperty.call(stylesObject, key)) {
                element.style[key] = stylesObject[key];
            }
        }
    }

    render() {
        this.textareaElement.placeholder = this.placeholder;
        this.textareaElement.value = this.value;
        this.textareaElement.rows = this.rows; // numero de filas o saltos de linea iniciales en el textarea
        this.textareaElement.disabled = this.isDisabled;

        this._applyStyles(this.textareaElement, this.styles);

        // guardar estilos iniciales para poder volver a ellos al quitar el foco o habilitar
        this.initialStyles = {};
        for (const key in this.styles) {
            this.initialStyles[key] = this.textareaElement.style[key];
        }

        // eventos de foco (focus y perder focus)
        this.handleFocus = () => {
            if (!this.textareaElement.disabled) {
                this._applyStyles(this.textareaElement, this.focusStyles);
            }
        };
        this.handleBlur = () => {
            if (!this.textareaElement.disabled) {
                this._applyStyles(this.textareaElement, this.initialStyles);
            }
        };

        this.textareaElement.addEventListener('focus', this.handleFocus); // al hacer click al textarea (focus)
        this.textareaElement.addEventListener('blur', this.handleBlur); // al salir del textarea (perder el focus)
        this.textareaElement.addEventListener('input', this.onInput); // cambio de tecla
        this.textareaElement.addEventListener('change', this.onChange); // al finalizar de ingresar informacion

        this.container.appendChild(this.textareaElement);

        return this.textareaElement;
    }

    // metodos para interactuar con el textarea desde fuera
    getValue() {
        return this.textareaElement.value;
    }
    setValue(newValue) {
        this.textareaElement.value = newValue;
    }
    setDisabled(isDisabled) {
        if (this.textareaElement) {
            this.textareaElement.disabled = isDisabled;
            if (isDisabled) {
                // aplicar estilos de deshabilitado
                this._applyStyles(this.textareaElement, this.disabledStyles);
            } else {
                // restaurar estilos por defecto
                this._applyStyles(this.textareaElement, this.initialStyles);
            }
        }
    }
    remove() {
        if (this.textareaElement && this.textareaElement.parentElement) {
            this.textareaElement.parentElement.removeChild(this.textareaElement);
        }
    }
}