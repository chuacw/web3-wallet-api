import { lookupByChainId } from "../src";

describe('lookupByChainId', () => {
  it('should find the chain name given the ChainId', () => {
    let chainName = lookupByChainId(11155111);
    expect(chainName).toBe("Sepolia");

    chainName = lookupByChainId(1);
    expect(chainName).toBe("Ethereum Mainnet");
  });
});
