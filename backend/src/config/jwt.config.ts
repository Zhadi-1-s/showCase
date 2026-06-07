export function parseJwtExpirationSeconds(value?: string): number {
  if (!value) {
    return 60 * 60 * 24 * 7;
  }

  const match = /^(\d+)([dhms])?$/.exec(value.trim());
  if (!match) {
    return 60 * 60 * 24 * 7;
  }

  const amount = Number.parseInt(match[1], 10);
  const unit = match[2] ?? 's';

  switch (unit) {
    case 'd':
      return amount * 60 * 60 * 24;
    case 'h':
      return amount * 60 * 60;
    case 'm':
      return amount * 60;
    default:
      return amount;
  }
}
