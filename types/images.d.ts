declare module "*.svg" {
  const content: string | { src: string };
  export default content;
}

declare module "*.png" {
  const content: string | { src: string };
  export default content;
}
