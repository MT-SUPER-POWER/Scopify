// lib/lyrics/prisma/at.ts

/** Reads a slot the surrounding code has already bounded, which the compiler cannot see in these index loops. */
export const at = <T>(list: ArrayLike<T>, index: number) => list[index] as T;
