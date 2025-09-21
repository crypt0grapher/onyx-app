/**
 * Type for image sources that can be either a string URL or an object with a src property
 */
export type ImageLikeSrc = string | { src: string };

/**
 * Converts an ImageLikeSrc to a string URL
 * @param image - The image source (string or object with src property)
 * @returns The string URL
 */
export const toSrc = (image: ImageLikeSrc): string =>
    typeof image === "string" ? image : image.src;
