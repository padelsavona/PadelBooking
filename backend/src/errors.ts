export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const errorHandler = async (error: Error, request: any, reply: any) => {
  if (error instanceof AppError) {
    return reply.status(error.statusCode).send({
      code: error.code || 'ERROR',
      message: error.message,
      traceId: request.id,
    });
  }

  // Log unexpected errors
  request.log.error(error);

  return reply.status(500).send({
    code: 'INTERNAL_SERVER_ERROR',
    message: 'An unexpected error occurred',
    traceId: request.id,
  });
};
