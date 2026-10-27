/**
 * Configuración del club. Todo lo que define cómo funciona masquePadel
 * (horario, pistas, precios, reglas de reserva) vive aquí.
 */

export const CLUB = {
  name: "masquePadel",
  timeZone: "Europe/Madrid",
  address: {
    street: "Polígono Store (Parque Atlántico – San Matías)",
    city: "Sevilla",
    postalCode: "41008",
    mapsQuery: "Polígono Store, Sevilla",
  },
  contact: {
    email: "hola@masquepadel.es",
    phone: "+34 955 000 000",
  },
  /** Primer turno del día (HH:MM). */
  opensAt: "08:00",
  /** Hora a la que debe terminar el último turno (HH:MM). */
  closesAt: "23:00",
  /** Duración de cada reserva en minutos. */
  slotMinutes: 90,
  /** Precio por pista y turno, en euros. */
  pricePerCourt: 20,
  playersPerCourt: 4,
  /** Horas mínimas de antelación para cancelar una reserva. */
  cancellationHours: 24,
  /** Días hacia delante que se pueden reservar (incluido hoy). */
  bookingWindowDays: 14,
  /** Reservas futuras activas que puede tener un mismo jugador. */
  maxActiveBookingsPerUser: 3,
} as const;

export type CourtId = 1 | 2 | 3 | 4;

export const COURTS: { id: CourtId; kind: "panoramic" | "glass" }[] = [
  { id: 1, kind: "panoramic" },
  { id: 2, kind: "panoramic" },
  { id: 3, kind: "glass" },
  { id: 4, kind: "glass" },
];

export const PRICE_PER_PLAYER = CLUB.pricePerCourt / CLUB.playersPerCourt;
