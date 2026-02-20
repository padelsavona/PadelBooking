import prisma from '../db.js';
import { AppError } from '../errors.js';

export const getAllCourts = async () => {
  return prisma.court.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
  });
};

export const getCourtById = async (id: string) => {
  const court = await prisma.court.findUnique({ where: { id } });
  if (!court) {
    throw new AppError(404, 'Court not found', 'COURT_NOT_FOUND');
  }
  return court;
};

export const createCourt = async (data: {
  name: string;
  description?: string;
  pricePerHour: number;
  memberPricePerHour?: number;
}) => {
  return prisma.court.create({
    data: {
      ...data,
      pricePerHour: data.pricePerHour,
    },
  });
};

export const updateCourt = async (
  id: string,
  data: {
    name?: string;
    description?: string;
    pricePerHour?: number;
    memberPricePerHour?: number;
    isActive?: boolean;
  }
) => {
  await getCourtById(id);
  return prisma.court.update({
    where: { id },
    data,
  });
};

export const deleteCourt = async (id: string) => {
  await getCourtById(id);

  const bookings = await prisma.booking.findMany({
    where: { courtId: id },
    select: { id: true },
  });

  const bookingIds = bookings.map((booking) => booking.id);

  await prisma.$transaction(async (tx) => {
    if (bookingIds.length > 0) {
      await tx.payment.deleteMany({
        where: {
          bookingId: { in: bookingIds },
        },
      });

      await tx.booking.deleteMany({
        where: { id: { in: bookingIds } },
      });
    }

    await tx.court.delete({ where: { id } });
  });

  return { success: true };
};
