import type { Contract } from './contract.helpers';

export const createContract = <T extends Contract>(contract: T): T => {
  return contract;
};
