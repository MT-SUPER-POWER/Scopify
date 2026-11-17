import {
  isSeatTaken,
  ROWS,
  rowFloor,
  rowZ,
  seatXs,
} from "@/components/lyrics/folia/src/components/scenes/cinema/cinemaLayout";
import type { CinemaSeat } from "@/types/lyrics/cinema";

const positions = seatXs();
const preferredRow = Math.round((ROWS.count - 1) * (2 / 3)) + 1;

export const cinemaSeats: readonly CinemaSeat[] = Array.from({ length: ROWS.count }, (_, row) =>
  positions.map((x, index): CinemaSeat => ({
    id: `R${row + 1}-${index + 1}`,
    row: row + 1,
    number: index + 1,
    eye: [x, rowFloor(row) + 1.15, rowZ(row, x) - 0.3],
    occupied: isSeatTaken(row, x),
  })),
).flat();

export const availableCinemaSeats = cinemaSeats.filter((seat) => !seat.occupied);

const seatsById = new Map(availableCinemaSeats.map((seat) => [seat.id, seat]));
const preferredSeat = availableCinemaSeats
  .filter((seat) => seat.row === preferredRow)
  .sort((left, right) => Math.abs(left.eye[0]) - Math.abs(right.eye[0]))[0];

export function resolveCinemaSeat(seatId: string | null): CinemaSeat {
  return (seatId !== null ? seatsById.get(seatId) : undefined) ?? preferredSeat;
}
