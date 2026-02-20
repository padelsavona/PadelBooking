import prisma from '../db.js';
import { AppError } from '../errors.js';

export type MembershipStatus = 'MEMBER' | 'NON_MEMBER';

export const isMembershipActive = (
  membershipStatus?: MembershipStatus,
  membershipExpiresAt?: Date | null
): boolean => {
  if (membershipStatus !== 'MEMBER') {
    return false;
  }

  if (!membershipExpiresAt) {
    return true;
  }

  return membershipExpiresAt >= new Date();
};

export const getHourlyRateForUser = (params: {
  pricePerHour: number;
  memberPricePerHour?: number | null;
  membershipStatus?: MembershipStatus;
  membershipExpiresAt?: Date | null;
}): { hourlyRate: number; tariffType: 'MEMBER' | 'STANDARD' } => {
  const membershipActive = isMembershipActive(params.membershipStatus, params.membershipExpiresAt);

  if (membershipActive && params.memberPricePerHour && Number(params.memberPricePerHour) > 0) {
    return {
      hourlyRate: Number(params.memberPricePerHour),
      tariffType: 'MEMBER',
    };
  }

  return {
    hourlyRate: Number(params.pricePerHour),
    tariffType: 'STANDARD',
  };
};

export const getPricingQuote = async (params: {
  courtId: string;
  startTime: Date;
  endTime: Date;
  userId?: string;
}) => {
  if (params.startTime >= params.endTime) {
    throw new AppError(400, 'Intervallo orario non valido', 'INVALID_TIME_RANGE');
  }

  const durationHours = (params.endTime.getTime() - params.startTime.getTime()) / (1000 * 60 * 60);

  if (durationHours <= 0) {
    throw new AppError(400, 'Durata prenotazione non valida', 'INVALID_DURATION');
  }

  const court = await prisma.court.findUnique({ where: { id: params.courtId } });
  if (!court) {
    throw new AppError(404, 'Campo non trovato', 'COURT_NOT_FOUND');
  }

  const user = params.userId
    ? await prisma.user.findUnique({
        where: { id: params.userId },
        select: { membershipStatus: true, membershipExpiresAt: true },
      })
    : null;

  const { hourlyRate, tariffType } = getHourlyRateForUser({
    pricePerHour: Number(court.pricePerHour),
    memberPricePerHour: court.memberPricePerHour ? Number(court.memberPricePerHour) : null,
    membershipStatus: user?.membershipStatus,
    membershipExpiresAt: user?.membershipExpiresAt,
  });

  const totalPrice = calculateTotalPriceByDuration(hourlyRate, durationHours, tariffType);

  return {
    courtId: court.id,
    startTime: params.startTime.toISOString(),
    endTime: params.endTime.toISOString(),
    durationHours,
    hourlyRate,
    totalPrice,
    tariffType,
    tariffLabel: tariffType === 'MEMBER' ? 'Tariffa tesserati' : 'Tariffa standard',
  };
};

export const calculateTotalPriceByDuration = (
  hourlyRate: number,
  durationHours: number,
  tariffType: 'MEMBER' | 'STANDARD'
): number => {
  const roundedDuration = Number(durationHours.toFixed(2));

  const multipliers =
    tariffType === 'MEMBER'
      ? {
          1: 1,
          1.5: 1.25,
          2: 1.875,
        }
      : {
          1: 1,
          1.5: 1.3,
          2: 2,
        };

  const multiplier = multipliers[roundedDuration as keyof typeof multipliers];
  if (multiplier) {
    return Number((hourlyRate * multiplier).toFixed(2));
  }

  return Number((hourlyRate * durationHours).toFixed(2));
};
