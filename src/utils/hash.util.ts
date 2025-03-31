import * as bcrypt from 'bcrypt';

const saltOrRounds = 10;

export const encrypt = async (str: string): Promise<string> => {
  return await bcrypt.hash(str, saltOrRounds);
};

export const compareCrypt = async (
  str: string,
  hash: string,
): Promise<boolean> => {
  return await bcrypt.compare(str, hash);
};
