import { hasMessageField } from 'delphirtl/sysutils';
import { EIP6963AnnounceProviderEvent, EIP6963ProviderDetail } from './EIP6963Types';

interface UnlockedAPI {
  /**
   * Indicates if MetaMask is unlocked by the user. MetaMask must be unlocked to perform any operation involving user accounts. Note that this method doesn't indicate if the user has exposed any accounts to the caller.
   */
  isUnlocked(): Promise<boolean>;
}

interface ConnectInfo {
  readonly chainId: string;
}

interface ProviderRpcError extends Error {
  code: number;
  data?: unknown;
}

interface ProviderMessage {
  readonly type: string;
  readonly data: unknown;
}

interface WalletAPI {
  on(eventName: "_initialized", handler: (accounts: Array<string>) => void): void;
  on(eventName: "accountsChanged", handler: (accounts: Array<string>) => void): void;
  on(eventName: "chainChanged", handler: (chainId: string) => void): void;
  on(eventName: "connect", handler: (connectInfo: ConnectInfo) => void): void;
  on(eventName: "disconnect", handler: (error: ProviderRpcError) => void): void;
  removeAllListeners(): void;
  removeListener(eventName: string, eventListener: EventListener): void;
}

interface RequestAPI extends WalletAPI {
  /**
   * This method is used to submit JSON-RPC API requests to Ethereum using MetaMask.
   * @param method The JSON-RPC API method name.
   * @param params array or object - (Optional) Parameters of the RPC method. In practice, if a method has parameters, they're almost always of type array.
   */
  request?: (method: string, params?: any[] | object) => Promise<unknown | ProviderRpcError>;
  send?: (method: string, params?: any[] | object) => Promise<unknown | ProviderRpcError>;
}

async function nullFunc(method: string, params?: object | any[]): Promise<unknown | ProviderRpcError> {
  return;
}

async function execCall(commonWalletProvider: RequestAPI, method: string, params?: object | any[]): Promise<unknown | ProviderRpcError> {
  let providerFunc: (method: string, params?: any[] | object) => Promise<unknown > = nullFunc;
  if (typeof commonWalletProvider.request === 'function') {
    providerFunc = commonWalletProvider.request;
  } else if (typeof commonWalletProvider.send === 'function') {
    providerFunc = commonWalletProvider.send;
  };
  let result; let error = false; let message = "";
  try {
    result = await providerFunc(method, params);
  } catch (e)
  {
    if (hasMessageField(e)) {
      error = true;
      message = e.message;
    }
  }
  if (error) {
    switch(message) {
      case "Expected a single, non-array, object argument.":
        try {
          result = await (providerFunc as any)({method: method, params: params});
        } catch (e)
        {
          error = true;
        }
        break;
      case "Cannot read properties of undefined (reading 'jsonRpcFetchFunc')":
        try {
          result = await (commonWalletProvider.send! as any)(method, params);
        } catch (e)
        {
          error = true;
        }
        break;
    }
  }
  return result;
}

async function getEthereumChainId(commonWalletProvider: RequestAPI): Promise<unknown | ProviderRpcError> {
  const result = await execCall(commonWalletProvider, 'eth_chainId', []);
  return result;
}

async function switchEthereumChain(commonWalletProvider: RequestAPI, chainId: number): Promise<unknown | ProviderRpcError> {
  const hexId = '0x' + chainId.toString(16);
  const result = await execCall(
    commonWalletProvider,
    "wallet_switchEthereumChain",
    [{ chainId: hexId }],
  );
  return result;
}

interface MetamaskAPI extends RequestAPI {
  /**
   * This non-standard property is true if the user has MetaMask installed, and false otherwise.
  Non-MetaMask providers may also set this property to true.
   */
  isMetaMask: boolean;
  /**
   * Indicates whether the provider is connected to the current chain. If the provider isn't connected, the page must be reloaded to re-establish the connection. See the connect and disconnect events for more information.
   */
  isConnected(): boolean;
  _metamask: UnlockedAPI;
}

const eip6063AnnounceProvider = "eip6963:announceProvider";
const eip6963RequestProvider = "eip6963:requestProvider";

declare global {
  interface WindowEventMap {
    eip6063announcePrivider: CustomEvent<EIP6963AnnounceProviderEvent>;
  }
}

export type {
  ConnectInfo,
  MetamaskAPI,
  ProviderMessage,
  ProviderRpcError,
  RequestAPI,
  UnlockedAPI,
  WalletAPI,
};

export {
  eip6063AnnounceProvider,
  eip6963RequestProvider
}

/**
 * 
 * @returns An array of EIP-6963 compatible wallet providers installed in the current browser.
 */
function getWallets(): EIP6963ProviderDetail[] {
  
  let providers: EIP6963ProviderDetail[] = [];

  /**
   * 
   * @param event A provider that supports EIP-6963
   * @returns 
   */
  function onAnnouncement(event: EIP6963AnnounceProviderEvent) {
    // Prevent adding a provider if it already exists in the list based on its uuid.
    if (providers.some(p => p.info.uuid === event.detail.info.uuid)) return;

    // Add the new provider to the list and call the provided callback function.
    providers = [...providers, event.detail];
  }

  // Attaches the event listener, dispatches the EIP-6963 event, then removes the event listener
  // and returns the providers
  window.addEventListener(eip6063AnnounceProvider, onAnnouncement as EventListener);
  window.dispatchEvent(new Event(eip6963RequestProvider));
  window.removeEventListener(eip6063AnnounceProvider, onAnnouncement as EventListener);

  return providers;
}

export {
  getEthereumChainId,
  switchEthereumChain,
  getWallets
};