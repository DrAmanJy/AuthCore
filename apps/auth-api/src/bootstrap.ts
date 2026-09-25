import dns from "node:dns";

dns.setServers(["8.8.8.8", "8.8.4.4"]);

await import("./server.js");
