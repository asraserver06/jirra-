import crypto from 'crypto';

export const hashInviteToken = (token: string) =>
  crypto.createHash('sha256').update(token).digest('hex');

export const generateInviteToken = () => {
  const token = crypto.randomBytes(32).toString('hex');
  return { token, tokenHash: hashInviteToken(token) };
};
