import { 
  ConnectInfo, MetamaskAPI, ProviderMessage, ProviderRpcError, 
  RequestAPI, UnlockedAPI, WalletAPI, getEthereumChainId, switchEthereumChain } from './web3-wallet-api';
// export * from './web3-wallet-api';
import {lookupByChainId} from './chainId-utils';

export type { 
  ConnectInfo, MetamaskAPI, ProviderMessage, ProviderRpcError, 
  RequestAPI, UnlockedAPI, WalletAPI };
export { getEthereumChainId, switchEthereumChain, lookupByChainId };