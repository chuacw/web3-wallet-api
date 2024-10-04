import { lookupByChainId } from "../src/chainId-utils";

let chainName = lookupByChainId(2716446429837000);
console.log(chainName);

chainName = lookupByChainId(11155111);
console.log(chainName);