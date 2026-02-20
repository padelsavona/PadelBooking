import prisma from '../db.js';
import { AppError } from '../errors.js';
import { getCourtById } from './court.service.js';
import { getHourlyRateForUser } from './pricing.service.js';

export const checkBookingConflict = async (
  courtId: string,
  startTime: Date,
  endTime: Date,
  excludeBookingId?: string
) => {
  const conflict = await prisma.booking.findFirst({
    where: {
      courtId,
      status: { in: ['PENDING', 'CONFIRMED', 'BLOCKED'] },
      id: excludeBookingId ? { not: excludeBookingId } : undefined,
      OR: [
        {
          AND: [{ startTime: { lte: startTime } }, { endTime: { gt: startTime } }],
        },
        {
          AND: [{ startTime: { lt: endTime } }, { endTime: { gte: endTime } }],
        },
        {
          AND: [{ startTime: { gte: startTime } }, { endTime: { lte: endTime } }],
        },
      ],
    },
  });

  return conflict !== null;
};

export const calculateBookingPrice = (
  pricePerHour: number,
  startTime: Date,
  endTime: Date
): number => {
  const hours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
  return pricePerHour * hours;
};

export const createBooking = async (
  userId: string,
  courtId: string,
  startTime: Date,
  endTime: Date,
  notes?: string,
  isAdminBlock = false
) => {
  // Validate times
  if (startTime >= endTime) {
    throw new AppError(400, 'End time must be after start time', 'INVALID_TIME_RANGE');
  }

  if (startTime < new Date()) {
    throw new AppError(400, 'Cannot book in the past', 'PAST_BOOKING');
  }

  // Check court exists
  const court = await getCourtById(courtId);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { membershipStatus: true, membershipExpiresAt: true },
  });

  if (!user) {
    throw new AppError(404, 'User not found', 'USER_NOT_FOUND');
  }

  // Check for conflicts
  const hasConflict = await checkBookingConflict(courtId, startTime, endTime);
  if (hasConflict) {
    throw new AppError(409, 'Time slot already booked', 'BOOKING_CONFLICT');
  }

  // Calculate price
  const { hourlyRate } = getHourlyRateForUser({
    pricePerHour: Number(court.pricePerHour),
    memberPricePerHour: court.memberPricePerHour ? Number(court.memberPricePerHour) : null,
    membershipStatus: user.membershipStatus,
    membershipExpiresAt: user.membershipExpiresAt,
  });

  const totalPrice = calculateBookingPrice(hourlyRate, startTime, endTime);

  // Create booking
  const booking = await prisma.booking.create({
    data: {
      userId,
      courtId,
      startTime,
      endTime,
      totalPrice,
      notes,
      status: isAdminBlock ? 'BLOCKED' : 'PENDING',
    },
    include: {
      court: true,
    },
  });

  return booking;
};

export const getBookingById = async (id: string) => {
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { court: true, user: { select: { id: true, name: true, email: true } } },
  });

  if (!booking) {
    throw new AppError(404, 'Booking not found', 'BOOKING_NOT_FOUND');
  }

  return booking;
};

export const getUserBookings = async (userId: string) => {
  return prisma.booking.findMany({
    where: { userId },
    include: { court: true },
    orderBy: { startTime: 'desc' },
  });
};

export const getAllBookings = async () => {
  return prisma.booking.findMany({
    include: {
      court: true,
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: { startTime: 'desc' },
  });
};

export const getCourtBookings = async (courtId: string, startDate?: Date, endDate?: Date) => {
  return prisma.booking.findMany({
    where: {
      courtId,
      status: { in: ['PENDING', 'CONFIRMED', 'BLOCKED'] },
      ...(startDate && endDate
        ? {
            startTime: { gte: startDate },
            endTime: { lte: endDate },
          }
        : {}),
    },
    include: {
      user: { select: { id: true, name: true } },
    },
    orderBy: { startTime: 'asc' },
  });
};

export const cancelBooking = async (bookingId: string, userId: string, isAdmin = false) => {
  const booking = await getBookingById(bookingId);

  // Check ownership or admin
  if (!isAdmin && booking.userId !== userId) {
    throw new AppError(403, 'Not authorized to cancel this booking', 'FORBIDDEN');
  }

  // Check if already cancelled
  if (booking.status === 'CANCELLED') {
    throw new AppError(400, 'Booking already cancelled', 'ALREADY_CANCELLED');
  }

  // Check if booking is in the past
  if (booking.startTime < new Date() && !isAdmin) {
    throw new AppError(400, 'Cannot cancel past bookings', 'PAST_BOOKING');
  }

  // Update booking
  return prisma.booking.update({
    where: { id: bookingId },
    data: { status: 'CANCELLED' },
  });
};

export const createBookingForUser = async (params: {
  userId?: string;
  userEmail?: string;
  courtId: string;
  startTime: Date;
  endTime: Date;
  notes?: string;
  status?: 'PENDING' | 'CONFIRMED' | 'BLOCKED';
}) => {
  let bookingUserId = params.userId;

  if (!bookingUserId && params.userEmail) {
    const user = await prisma.user.findUnique({ where: { email: params.userEmail } });
    if (!user) {
      throw new AppError(404, 'Utente non trovato', 'USER_NOT_FOUND');
    }
    bookingUserId = user.id;
  }

  if (!bookingUserId) {
    throw new AppError(400, 'userId o userEmail obbligatorio', 'INVALID_INPUT');
  }

  const booking = await createBooking(
    bookingUserId,
    params.courtId,
    params.startTime,
    params.endTime,
    params.notes,
    params.status === 'BLOCKED'
  );

  if (!params.status || booking.status === params.status) {
    return booking;
  }

  return prisma.booking.update({
    where: { id: booking.id },
    data: { status: params.status },
    include: {
      court: true,
      user: { select: { id: true, name: true, email: true } },
    },
  });
};

export const updateBookingAsAdmin = async (
  bookingId: string,
  data: {
    courtId?: string;
    startTime?: Date;
    endTime?: Date;
    notes?: string;
    status?: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'BLOCKED';
  }
) => {
  const booking = await getBookingById(bookingId);

  const nextCourtId = data.courtId ?? booking.courtId;
  const nextStartTime = data.startTime ?? booking.startTime;
  const nextEndTime = data.endTime ?? booking.endTime;

  if (nextStartTime >= nextEndTime) {
    throw new AppError(400, 'End time must be after start time', 'INVALID_TIME_RANGE');
  }

  const hasConflict = await checkBookingConflict(nextCourtId, nextStartTime, nextEndTime, bookingId);
  if (hasConflict) {
    throw new AppError(409, 'Time slot already booked', 'BOOKING_CONFLICT');
  }

  const court = await getCourtById(nextCourtId);
  const bookingUser = await prisma.user.findUnique({
    where: { id: booking.userId },
    select: { membershipStatus: true, membershipExpiresAt: true },
  });

  const { hourlyRate } = getHourlyRateForUser({
    pricePerHour: Number(court.pricePerHour),
    memberPricePerHour: court.memberPricePerHour ? Number(court.memberPricePerHour) : null,
    membershipStatus: bookingUser?.membershipStatus,
    membershipExpiresAt: bookingUser?.membershipExpiresAt,
  });

  const totalPrice = calculateBookingPrice(hourlyRate, nextStartTime, nextEndTime);

  return prisma.booking.update({
    where: { id: bookingId },
    data: {
      courtId: nextCourtId,
      startTime: nextStartTime,
      endTime: nextEndTime,
      notes: data.notes,
      status: data.status,
      totalPrice,
    },
    include: {
      court: true,
      user: { select: { id: true, name: true, email: true } },
    },
  });
};

export const deleteBookingAsAdmin = async (bookingId: string) => {
  await getBookingById(bookingId);

  await prisma.$transaction(async (tx) => {
    await tx.payment.deleteMany({ where: { bookingId } });
    await tx.booking.delete({ where: { id: bookingId } });
  });

  return { success: true };
};
