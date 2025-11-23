// Declaraciones de tipos para archivos CSS
// Permite importar archivos CSS como efectos secundarios

declare module '*.css' {
  const content: { [className: string]: string };
  export default content;
}

declare module '*.module.css' {
  const content: { [className: string]: string };
  export default content;
}

declare module '*.scss' {
  const content: { [className: string]: string };
  export default content;
}

declare module '*.module.scss' {
  const content: { [className: string]: string };
  export default content;
}

declare module '*.sass' {
  const content: { [className: string]: string };
  export default content;
}

declare module '*.module.sass' {
  const content: { [className: string]: string };
  export default content;
}

// Para importaciones de CSS de node_modules (como mapbox-gl)
declare module '*.css' {
  const classes: { readonly [key: string]: string };
  export default classes;
}

declare module 'mapbox-gl/dist/mapbox-gl.css' {
  const content: any;
  export default content;
}

