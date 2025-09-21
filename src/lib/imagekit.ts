import ImageKit from "imagekit";

type Transformation = NonNullable<Parameters<ImageKit["url"]>[0]["transformation"]>;

const publicKey = process.env.IMAGEKIT_PUBLIC_KEY;
const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
const urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT;

if (!publicKey || !privateKey || !urlEndpoint) {
  throw new Error("Missing ImageKit configuration. Please set IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY, and IMAGEKIT_URL_ENDPOINT.");
}

export const IMAGEKIT_GENERATED_FOLDER = (process.env.IMAGEKIT_GENERATED_FOLDER ?? "/ultragaz-generated").replace(/\/+$/, "");

export const imageKit = new ImageKit({
  publicKey,
  privateKey,
  urlEndpoint,
});

export function resolveImageKitFolder(userId: string): string {
  const base = IMAGEKIT_GENERATED_FOLDER.startsWith("/") ? IMAGEKIT_GENERATED_FOLDER : `/${IMAGEKIT_GENERATED_FOLDER}`;
  return `${base.replace(/\/+$/, "")}/${userId}`.replace(/\/+/, "/");
}

export function createImageKitUrl(path: string, transformation?: Transformation): string {
  return imageKit.url({
    path,
    transformation,
    signed: false,
  });
}
