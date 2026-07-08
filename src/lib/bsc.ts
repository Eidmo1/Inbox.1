/**
 * Binance Smart Chain (BSC/BEP-20) Real-Time Balance Query Helper.
 * Facilitates direct read calls to standard public RPC nodes with safety fallbacks.
 */

const BSC_RPC_NODES = [
  "https://bsc-dataseed.binance.org/",
  "https://bsc-dataseed1.binance.org/",
  "https://rpc.ankr.com/bsc",
  "https://binance.llamarpc.com"
];

const PEPE_CONTRACT = "0x25062f76ca5185361665aea9ad3e4e8a9a3ffeb3";
const USDT_CONTRACT = "0x55d398326f99059ff775485246999027b3197955";
const JMPT_CONTRACT = "0x886241ab1ae4e4e94476501740e70a1a38eb520b";

async function postRpc(payload: any): Promise<any> {
  let lastError: any = null;
  for (const node of BSC_RPC_NODES) {
    try {
      const response = await fetch(node, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(payload)
      });
      if (!response.ok) continue;
      const data = await response.json();
      if (data && (data.result !== undefined || data.error !== undefined)) {
        return data;
      }
    } catch (e) {
      lastError = e;
    }
  }
  throw lastError || new Error("Failed to contact any BSC RPC nodes");
}

export interface BscBalances {
  bnb: number;
  pepe: number;
  usdt: number;
  jmpt: number;
}

/**
 * Fetch native BNB balance and popular BEP-20 token balances (PEPE, USDT & JMPT) for a given address.
 */
export async function fetchBscBalances(address: string): Promise<BscBalances> {
  const cleanAddress = address.trim().toLowerCase();
  
  // Validate basic address shape
  if (!/^0x[a-f0-9]{40}$/.test(cleanAddress)) {
    throw new Error("Invalid Smart Chain address format");
  }

  const hexAddressNoPrefix = cleanAddress.substring(2).padStart(64, "0");

  try {
    // 1. Fetch native BNB Balance
    const bnbPayload = {
      jsonrpc: "2.0",
      id: 1,
      method: "eth_getBalance",
      params: [cleanAddress, "latest"]
    };

    // 2. Fetch PEPE BEP-20 Balance (balanceOf method selector: 0x70a08231)
    const pepePayload = {
      jsonrpc: "2.0",
      id: 2,
      method: "eth_call",
      params: [
        {
          to: PEPE_CONTRACT,
          data: "0x70a08231" + hexAddressNoPrefix
        },
        "latest"
      ]
    };

    // 3. Fetch USDT BEP-20 Balance
    const usdtPayload = {
      jsonrpc: "2.0",
      id: 3,
      method: "eth_call",
      params: [
        {
          to: USDT_CONTRACT,
          data: "0x70a08231" + hexAddressNoPrefix
        },
        "latest"
      ]
    };

    // 4. Fetch JMPT BEP-20 Balance
    const jmptPayload = {
      jsonrpc: "2.0",
      id: 4,
      method: "eth_call",
      params: [
        {
          to: JMPT_CONTRACT,
          data: "0x70a08231" + hexAddressNoPrefix
        },
        "latest"
      ]
    };

    // Run calls concurrently
    const [bnbRes, pepeRes, usdtRes, jmptRes] = await Promise.allSettled([
      postRpc(bnbPayload),
      postRpc(pepePayload),
      postRpc(usdtPayload),
      postRpc(jmptPayload)
    ]);

    let bnb = 0;
    let pepe = 0;
    let usdt = 0;
    let jmpt = 0;

    if (bnbRes.status === "fulfilled" && bnbRes.value.result) {
      const wei = BigInt(bnbRes.value.result);
      bnb = Number(wei) / 1e18;
    }

    if (pepeRes.status === "fulfilled" && pepeRes.value.result) {
      const result = pepeRes.value.result;
      if (result !== "0x" && result !== "0x0") {
        const tokenWei = BigInt(result);
        pepe = Number(tokenWei) / 1e18; // standard 18 decimal peg
      }
    }

    if (usdtRes.status === "fulfilled" && usdtRes.value.result) {
      const result = usdtRes.value.result;
      if (result !== "0x" && result !== "0x0") {
        const tokenWei = BigInt(result);
        usdt = Number(tokenWei) / 1e18; // standard 18 decimals on BSC
      }
    }

    if (jmptRes.status === "fulfilled" && jmptRes.value.result) {
      const result = jmptRes.value.result;
      if (result !== "0x" && result !== "0x0") {
        const tokenWei = BigInt(result);
        jmpt = Number(tokenWei) / 1e18; // standard 18 decimals on BSC
      }
    }

    return { bnb, pepe, usdt, jmpt };
  } catch (error) {
    console.error("BSC fetch balances error:", error);
    throw error;
  }
}
