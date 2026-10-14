// Lets TypeScript accept `import css from '.../styles.css?raw'` (handled by remotion.config.ts).
declare module '*?raw' {
  const content: string;
  export default content;
}
declare module '*.png' {
  const src: string;
  export default src;
}
