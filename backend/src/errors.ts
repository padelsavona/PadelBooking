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

export const errorHandler = async (error: Error, request: unknown, reply: unknown) => {
  const req = request as { id?: string; log?: { error: (err: Error) => void } };
  const rep = reply as { status: (code: number) => { send: (data: unknown) => unknown } };

  if (error instanceof AppError) {
    return rep.status(error.statusCode).send({
      code: error.code || 'ERROR',
      message: error.message,
      traceId: req.id,
    });
  }

  // Log unexpected errors
  req.log?.error(error);

  return rep.status(500).send({
    code: 'INTERNAL_SERVER_ERROR',
    message: 'An unexpected error occurred',
    traceId: req.id,
  });
};
