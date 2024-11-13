require("dotenv").config();
const fs = require("fs");
const { Web3 } = require("web3");

const web3 = new Web3(
  new Web3.providers.WebsocketProvider(process.env.INFURA_WS_URL)
);

// Set up WebSocket connection listeners on the provider
web3.currentProvider.on("connect", () => console.log("WebSocket connected"));
web3.currentProvider.on("error", (err) =>
  console.error("WebSocket error:", err)
);
web3.currentProvider.on("end", () =>
  console.log("WebSocket connection ended.")
);

const tokenAddress = process.env.TOKEN_ADDRESS;
const tokenABI = [
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "from", type: "address" },
      { indexed: true, name: "to", type: "address" },
      { indexed: false, name: "value", type: "uint256" },
    ],
    name: "Transfer",
    type: "event",
  },
];

// Load the list of addresses to monitor
const addressesToMonitor = fs
  .readFileSync("./addresses.txt", "utf-8")
  .split("\n")
  .filter(Boolean);

console.log("Addresses to monitor:", addressesToMonitor); // Log addresses to monitor

// Initialize token contract instance
const tokenContract = new web3.eth.Contract(tokenABI, tokenAddress);

// Subscribe to the Transfer event
tokenContract.events.Transfer({}, (error, event) => {
  if (error) {
    console.error("Error in event subscription:", error);
    return;
  }

  // Log event details
  console.log("Received event:", event);

  const { from, to, value } = event.returnValues;
  console.log("From:", from, "To:", to, "Value:", value);

  // Check if the address is in the list of addresses to monitor
  if (addressesToMonitor.includes(from) || addressesToMonitor.includes(to)) {
    console.log("Transfer detected:", {
      txHash: event.transactionHash,
      from,
      to,
      amount: web3.utils.fromWei(value, "ether"),
      timestamp: new Date(),
    });
  }
});

// https://stackoverflow.com/questions/71007946/web3js-event-listen-subscribe-to-transactions-to-or-from-a-wallet-address
