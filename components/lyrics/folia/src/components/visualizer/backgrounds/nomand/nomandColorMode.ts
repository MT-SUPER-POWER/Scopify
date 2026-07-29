/** Resolves the shader's sampling direction without depending on React or WebGL. */
export const resolveNomandInverted = (
  inverted: boolean,
  isDaylight: boolean,
  originalColors: boolean,
): boolean => (isDaylight && !originalColors ? !inverted : inverted);
