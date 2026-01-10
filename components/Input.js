// Input.js
export class Input {
    // input por defecto (sin focus)
    _defaultStyles = {
        backgroundColor: '#fff',
        padding: '10px 15px',
        border: '1px solid #ccc',
        borderRadius: '5px',
        fontSize: '16px',
        width: '100%', // Cambiado a 100% para ocupar todo su contenedor
        boxSizing: 'border-box', // Incluye el padding dentro del ancho
    };

    // input con focus
    _defaultFocusStyles = {
        borderColor: '#1ab7bc',
        outline: 'none',
    };

    // input deshabilitado
    _defaultDisabledStyles = {
        backgroundColor: '#f0f0f0',
    };

    constructor(container, {
        type = 'text',
        placeholder = '',
        value = '',
        styles = {},
        focusStyles = {},
        disabledStyles = {},
        isDisabled = false,
        onInput = () => {},
        onChange = () => {}
    }) {
        if (!(container instanceof HTMLElement)) {
            throw new Error('Input: el container debe ser un elemento HTML válido.');
        }

        this.container = container;
        this.type = type;
        this.placeholder = placeholder;
        this.value = value;
        this.isDisabled = isDisabled;

        this.styles = { ...this._defaultStyles, ...styles };
        this.focusStyles = { ...this._defaultFocusStyles, ...focusStyles };
        this.disabledStyles = { ...this._defaultDisabledStyles, ...disabledStyles };

        this.onInput = onInput;
        this.onChange = onChange;

        this.inputElement = document.createElement('input');
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
        this.inputElement.type = this.type;
        this.inputElement.placeholder = this.placeholder;
        this.inputElement.value = this.value;
        this.inputElement.disabled = this.isDisabled;

        this._applyStyles(this.inputElement, this.styles);

        this.initialStyles = {};
        for (const key in this.styles) {
            this.initialStyles[key] = this.inputElement.style[key];
        }

        this.handleFocus = () => {
            if (!this.inputElement.disabled) {
                this._applyStyles(this.inputElement, this.focusStyles);
            }
        };
        this.handleBlur = () => {
            if (!this.inputElement.disabled) {
                this._applyStyles(this.inputElement, this.initialStyles);
            }
        };

        this.inputElement.addEventListener('focus', this.handleFocus);
        this.inputElement.addEventListener('blur', this.handleBlur);
        this.inputElement.addEventListener('input', this.onInput);
        this.inputElement.addEventListener('change', this.onChange);

        this.container.appendChild(this.inputElement);

        return this.inputElement;
    }

    getValue() {
        return this.inputElement.value;
    }
    setValue(newValue) {
        this.inputElement.value = newValue;
    }
    setDisabled(isDisabled) {
        if (this.inputElement) {
            this.inputElement.disabled = isDisabled;
            if (isDisabled) {
                this._applyStyles(this.inputElement, this.disabledStyles);
            } else {
                this._applyStyles(this.inputElement, this.initialStyles);
            }
        }
    }
    remove() {
        if (this.inputElement && this.inputElement.parentElement) {
            this.inputElement.parentElement.removeChild(this.inputElement);
        }
    }
}