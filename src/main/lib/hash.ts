import sharp from 'sharp'

const HASH_SIZE = 8
const DCT_SIZE = 32

/**
 * Orthonormal 1D DCT-II on an array of length N.
 *
 * DCT[k] = w(k) * Σ x[n] * cos(π·k·(2n+1) / 2N)
 * where w(0) = √(1/N) and w(k>0) = √(2/N)
 */
function dct1d(signal: number[]): number[] {
  const N = signal.length
  const output = new Array<number>(N)
  for (let k = 0; k < N; k++) {
    let sum = 0
    for (let n = 0; n < N; n++) {
      sum += signal[n] * Math.cos((Math.PI * k * (2 * n + 1)) / (2 * N))
    }
    output[k] = sum * (k === 0 ? Math.sqrt(1 / N) : Math.sqrt(2 / N))
  }
  return output
}

/** Separable 2D DCT: apply 1D DCT to every row, then every column. */
function dct2d(matrix: number[][]): number[][] {
  const N = matrix.length
  const rowDct = matrix.map((row) => dct1d(row))
  const result: number[][] = Array.from({ length: N }, () => new Array<number>(N).fill(0))
  for (let col = 0; col < N; col++) {
    const column = rowDct.map((row) => row[col])
    const colDct = dct1d(column)
    for (let row = 0; row < N; row++) {
      result[row][col] = colDct[row]
    }
  }
  return result
}

/**
 * Computes a 64-bit perceptual hash for an image file and returns it as a
 * 16-character lowercase hex string.
 *
 * Algorithm:
 *  1. Resize to 32×32 greyscale (eliminate detail, normalise size).
 *  2. Apply 2D DCT — concentrates structural energy in the top-left.
 *  3. Extract the top-left 8×8 sub-matrix (64 low-frequency coefficients).
 *  4. Compute the mean of the 63 non-DC coefficients.
 *  5. Each of the 64 bits = coefficient > mean ? 1 : 0.
 *  6. Pack bits into 16 hex chars.
 */
export async function computePHash(filePath: string): Promise<string> {
  const { data } = await sharp(filePath)
    .resize(DCT_SIZE, DCT_SIZE, { fit: 'fill' })
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true })

  const matrix: number[][] = []
  for (let row = 0; row < DCT_SIZE; row++) {
    const start = row * DCT_SIZE
    matrix.push(Array.from(data.subarray(start, start + DCT_SIZE)))
  }

  const dct = dct2d(matrix)

  // Flatten the top-left HASH_SIZE×HASH_SIZE block
  const topLeft: number[] = []
  for (let row = 0; row < HASH_SIZE; row++) {
    for (let col = 0; col < HASH_SIZE; col++) {
      topLeft.push(dct[row][col])
    }
  }

  // Mean of the 63 non-DC values (index 0 is the DC component)
  const nonDc = topLeft.slice(1)
  const mean = nonDc.reduce((a, b) => a + b, 0) / nonDc.length

  let bits = ''
  for (const v of topLeft) {
    bits += v > mean ? '1' : '0'
  }

  let hex = ''
  for (let i = 0; i < bits.length; i += 4) {
    hex += parseInt(bits.slice(i, i + 4), 2).toString(16)
  }
  return hex
}

/**
 * Counts the number of bit positions that differ between two hex-encoded
 * perceptual hashes. Returns `Infinity` when lengths differ.
 */
export function hammingDistance(a: string, b: string): number {
  if (a.length !== b.length) return Infinity
  let dist = 0
  for (let i = 0; i < a.length; i++) {
    let xor = parseInt(a[i], 16) ^ parseInt(b[i], 16)
    while (xor > 0) {
      dist += xor & 1
      xor >>>= 1
    }
  }
  return dist
}
