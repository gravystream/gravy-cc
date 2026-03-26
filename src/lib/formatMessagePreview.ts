export function formatMessagePreview(content: string): string {
  if (!content) return "";

  // Handle notification prefixes like CONTRACT_NOTIFICATION:{...}, PAYMENT_NOTIFICATION:{...}, etc.
  const prefixMatch = content.match(/^([A-Z_]+_NOTIFICATION):(.+)$/s);
  if (prefixMatch) {
    const type = prefixMatch[1];
    try {
      const data = JSON.parse(prefixMatch[2]);
      switch (type) {
        case "CONTRACT_NOTIFICATION":
          if (data.action === "sent") return "Sent you a contract";
          if (data.action === "accepted") return "Contract accepted";
          if (data.action === "declined") return "Contract declined";
          if (data.action === "completed") return "Contract marked as completed";
          if (data.action === "terminated") return "Contract terminated";
          return `Contract update: ${data.action || "new activity"}`;
        case "PAYMENT_NOTIFICATION":
          if (data.action === "released") return "Payment released";
          if (data.action === "requested") return "Payment requested";
          return `Payment update: ${data.action || "new activity"}`;
        case "ESCROW_NOTIFICATION":
          if (data.action === "funded") return "Escrow funded";
          if (data.action === "released") return "Escrow released";
          return `Escrow update: ${data.action || "new activity"}`;
        case "PROPOSAL_NOTIFICATION":
          if (data.action === "submitted") return "New proposal submitted";
          if (data.action === "accepted") return "Proposal accepted";
          if (data.action === "declined") return "Proposal declined";
          return `Proposal update: ${data.action || "new activity"}`;
        case "DELIVERABLE_NOTIFICATION":
          if (data.action === "submitted") return "Deliverable submitted";
          if (data.action === "approved") return "Deliverable approved";
          if (data.action === "revision_requested") return "Revision requested";
          return `Deliverable update: ${data.action || "new activity"}`;
        default:
          return type.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c: string) => c.toUpperCase());
      }
    } catch {
      // If JSON parse fails, just clean up the prefix
      return type.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c: string) => c.toUpperCase());
    }
  }

  // Handle other structured message formats
  if (content.startsWith("{") && content.endsWith("}")) {
    try {
      const data = JSON.parse(content);
      if (data.message) return data.message;
      if (data.text) return data.text;
      if (data.action) return data.action;
      return "New notification";
    } catch {
      return content;
    }
  }

  return content;
}
