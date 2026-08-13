export function downsampleSpectrum(spectrum: number[], maximumBins: number) {
  if (maximumBins <= 0) return [];
  if (spectrum.length <= maximumBins) return [...spectrum];
  const result = new Array<number>(maximumBins);
  const stride = spectrum.length / maximumBins;
  for (let index = 0; index < maximumBins; index += 1) {
    result[index] = spectrum[Math.min(spectrum.length - 1, Math.floor(index * stride))] ?? 0;
  }
  return result;
}
