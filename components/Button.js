export class Button {
    // estilos por defecto del boton (si no se le pasan estilos por parametros)
    _defaultStyles = {
        backgroundColor: '#34495E',
        color: 'white',
        padding: '10px 15px',
        border: 'none',
        borderRadius: '5px',
        fontSize: '16px'
    };

    // hover por defecto del boton (si no se le pasan estilos por parametros)
    _defaultHoverStyles = {
        backgroundColor: '#2C3E50'
    };

    _defaultDisabledStyles = {
        backgroundColor: '#bdc3c742',
        color: '#7f8c8d',
    };

    constructor(container, { text = 'Boton',  styles = {}, hoverStyles = {}, disabledStyles = {}, onClick = () => {} }) {
        if (!(container instanceof HTMLElement)) {
            throw new Error('Button: el parentElement debe ser un elemento HTML válido.');
        }

        this.container = container;
        this.text = text;
        // fusionamos los dos conjuntos de propiedades, las default y las del usuario
        // el valor de la propiedad que aparece de ultimo en el objeto es el que prevalece
        this.styles = { ...this._defaultStyles, ...styles };
        this.hoverStyles = { ...this._defaultHoverStyles, ...hoverStyles };
        this.disabledStyles = { ...this._defaultDisabledStyles, ...disabledStyles };

        this.onClick = onClick;

        this.buttonElement = document.createElement('button');
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
        this.buttonElement.textContent = this.text;

        // aplicar estilos base iniciales (cuando no hay hover)
        this._applyStyles(this.buttonElement, this.styles);

        // guardamos los estilos iniciales para volverlos a poner al quitar el hover
        this.initialStyles = {};
        for (const key in this.styles) {
            this.initialStyles[key] = this.buttonElement.style[key];
        }

        this.handleMouseOver = () => {
            if (!this.buttonElement.disabled) {
                this._applyStyles(this.buttonElement, this.hoverStyles);
            }
        };

        this.handleMouseOut = () => {
            if (!this.buttonElement.disabled) {
                this._applyStyles(this.buttonElement, this.initialStyles);
            }
        };

        this.buttonElement.addEventListener('mouseover', this.handleMouseOver);
        this.buttonElement.addEventListener('mouseout', this.handleMouseOut);

        // añadir onClick
        this.buttonElement.addEventListener('click', this.onClick);

        // agregar el boton a su contenedor
        this.container.appendChild(this.buttonElement);

        return this.buttonElement;
    }

    // actualizar texto del boton
    setText(newText) {
        this.text = newText;
        if (this.buttonElement) {
            this.buttonElement.textContent = newText;
        }
    }

    // deshabilitar o habilitar boton
    setDisabled(isDisabled) {
        if (this.buttonElement) {
            this.buttonElement.disabled = isDisabled;
            if (isDisabled) {
                // aplicar estilos de deshabilitado
                this._applyStyles(this.buttonElement, this.disabledStyles);
            } else {
                // restaurar estilos por defecto
                this._applyStyles(this.buttonElement, this.initialStyles);
            }
        }
    }

    // remover boton del DOM
    remove() {
        if (this.buttonElement && this.buttonElement.parentElement) {
            this.buttonElement.parentElement.removeChild(this.buttonElement);
            this.buttonElement = null;
        }
    }
}