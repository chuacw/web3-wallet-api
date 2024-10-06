// Update sortedChainData with ..\Ethereum\chainIdToName\update.ps1

import { sortedChainData } from "./chainId-const";

const map = new Map(sortedChainData.map((obj) => [obj.chainId, obj.name]));

/**
 * 
 * @param chainId The number to look up
 * @returns The chain name of the given chainId
 */
function lookupByChainId(chainId: number): string | null {
  const result = map.get(chainId);
  return result ? result : null;
}

export {
  // lookupByChainId,
  lookupByChainId
}