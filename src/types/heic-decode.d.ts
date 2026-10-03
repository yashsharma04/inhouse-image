declare module 'heic-decode' {
  interface HeicDecoded {
    width: number;
    height: number;
    data: Uint8ClampedArray;
  }

  function decode(input: { buffer: ArrayBuffer | Uint8Array }): Promise<HeicDecoded>;
  export default decode;
}
