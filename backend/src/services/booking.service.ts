import prisma from '../db.js';
import { AppError } from '../errors.js';
import { getCourtById } from './court.service.js';

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

  // Check for conflicts
  const hasConflict = await checkBookingConflict(courtId, startTime, endTime);
  if (hasConflict) {
    throw new AppError(409, 'Time slot already booked', 'BOOKING_CONFLICT');
  }

  // Calculate price
  const totalPrice = calculateBookingPrice(Number(court.pricePerHour), startTime, endTime);

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
