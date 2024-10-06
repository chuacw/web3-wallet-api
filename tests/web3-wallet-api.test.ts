// web3-wallet-api
import { List } from "delphirtl/collections";
import { getWallets } from "../src";
import { EIP6963AnnounceProviderEvent } from "../src/EIP6963Types";
import { eip6063AnnounceProvider, eip6963RequestProvider } from "../src/web3-wallet-api";
import { v4 as uuidv4 } from 'uuid';

declare global {
    interface Eip1193Provider {
    }
    interface Window {
        ethereum: Eip1193Provider
    }
}

function clone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
}

describe('getWallets', () => {
    //#region beforeAll afterEach
    beforeAll(() => {
        // Mocking the window object methods
        global.window.addEventListener = jest.fn();
        global.window.dispatchEvent = jest.fn();
        global.window.removeEventListener = jest.fn();
    });

    afterEach(() => {
        jest.clearAllMocks();  // Clear previous mock calls
    });
    //#endregion

    //#region getProviders
    function getProvider(name: string): EIP6963AnnounceProviderEvent {
        let provider: EIP6963AnnounceProviderEvent = {
            detail: {
                info: { uuid: uuidv4(), icon: '', name: name, walletId: name },
                provider: {
                    request: jest.fn(),
                    host: '',
                    isStatus: true,
                    path: '',
                    send: jest.fn(),
                    sendAsync: jest.fn(),
                }
                // Add any other necessary properties here
            },
            bubbles: false,
            cancelBubble: false,
            cancelable: false,
            composed: false,
            currentTarget: null,
            defaultPrevented: false,
            eventPhase: 0,
            isTrusted: false,
            returnValue: false,
            srcElement: null,
            target: null,
            timeStamp: 0,
            type: "",
            composedPath: function (): EventTarget[] {
                throw new Error("Function not implemented.");
            },
            initEvent: function (type: string, bubbles?: boolean, cancelable?: boolean): void {
                throw new Error("Function not implemented.");
            },
            preventDefault: function (): void {
                throw new Error("Function not implemented.");
            },
            stopImmediatePropagation: function (): void {
                throw new Error("Function not implemented.");
            },
            stopPropagation: function (): void {
                throw new Error("Function not implemented.");
            },
            NONE: 0,
            CAPTURING_PHASE: 1,
            AT_TARGET: 2,
            BUBBLING_PHASE: 3
        };
        provider.detail.info.uuid = uuidv4();
        provider.detail.info.name = name;
        provider.detail.info.walletId = name;
        return provider;
    }

    function getMetamaskProvider(): EIP6963AnnounceProviderEvent {
        let provider = getProvider('Metamask');
      return provider;
    }

    function getTrustProvider(): EIP6963AnnounceProviderEvent {
        const provider = getProvider('Trust Wallet');
        return provider;
    }

    function getRoninWallet(): EIP6963AnnounceProviderEvent {
        const provider = getProvider('Ronin Wallet');
        return provider;
    }
    //#endregion

    //#region mock functions
    const evMap = new Map<CustomEvent, List<EventListener>>();
    let eventDetailProviders: EIP6963AnnounceProviderEvent[];
    
    /**
     * Create 2 wallets
     */
    function create2Wallets() {
        // Mock the event detail for EIP-6963 announcement
        const MetamaskProvider = getMetamaskProvider();
        const TrustProvider = getTrustProvider();

        eventDetailProviders = [TrustProvider, MetamaskProvider];

        (global.window.addEventListener as any).mockImplementation((event: Event, callback: EventListener) => {
            if ((event as any) === eip6063AnnounceProvider) {
                // Call the provided callback with the mocked event detail
                let list = evMap.get(event as any) as List<EventListener>;
                if (list == undefined) {
                    list = new List<EventListener>();
                    list.add(callback);
                    evMap.set(event as CustomEvent<any>, list);
                } else
                    if (list.find(callback) == undefined) {
                        list.add(callback);
                    }
            }
        });
        (global.window.removeEventListener as any).mockImplementation((event: Event, callback: EventListener) => {
            if ((event as any) === eip6063AnnounceProvider) {
                // Call the provided callback with the mocked event detail
                let list = evMap.get(event as any) as List<EventListener>;
                if (!list) {
                    return;
                }
                list.delete(callback);
            }
        });
        (global.window.dispatchEvent as any).mockImplementation((event: Event) => {
            if (event.type == eip6963RequestProvider) {
                // Call the provided callback with the mocked event detail
                let announceEvent = eip6063AnnounceProvider;
                const list = evMap.get(announceEvent as unknown as CustomEvent<any>);
                if (!list) {
                    return;
                }
                for (const callback of list) {
                    for (const eventDetailProvider of eventDetailProviders) {
                        callback(eventDetailProvider);
                    }
                }
            }
        });
    }

    /**
     * Create 3 wallets
     */
    function create3Wallets() {
        create2Wallets();
        const roninWallet = getRoninWallet();
        eventDetailProviders = [roninWallet, ...eventDetailProviders];
    }
    //#endregion

    it('should add provider(s) on announcement', () => {
        create2Wallets();
        // Call / Test the function
        const providers = getWallets();

        // Check that the providers were added
        expect(providers).toHaveLength(eventDetailProviders.length);
        expect(providers.length).toBe(2);
        for(let i = 0; i < eventDetailProviders.length; i++) {
            expect(providers[i].info.uuid).toBe(eventDetailProviders[i].detail.info.uuid);
            expect(providers[i].info.name).toBe(eventDetailProviders[i].detail.info.name);
        }

        // Ensure that the event listeners were called correctly
        expect(global.window.addEventListener).toHaveBeenCalledWith(eip6063AnnounceProvider, expect.any(Function));
        expect(global.window.dispatchEvent).toHaveBeenCalledWith(new Event(eip6963RequestProvider));
        expect(global.window.removeEventListener).toHaveBeenCalledWith(eip6063AnnounceProvider, expect.any(Function));

        create3Wallets();
        const providers2 = getWallets();
        expect(providers2).toHaveLength(eventDetailProviders.length);
        expect(providers2.length).toBe(3);
        for(let i = 0; i < eventDetailProviders.length; i++) {
            expect(providers2[i].info.uuid).toBe(eventDetailProviders[i].detail.info.uuid);
            expect(providers2[i].info.name).toBe(eventDetailProviders[i].detail.info.name);
        }

    });

});
