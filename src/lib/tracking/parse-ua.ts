// User Agent parsing utility
// Uses ua-parser-js (already installed in the project)

import UAParser from "ua-parser-js";

export interface ParsedUA {
  browser: string | null;
  browserVersion: string | null;
  os: string | null;
  osVersion: string | null;
  device: string | null;
  deviceType: string | null; // mobile, tablet, desktop
}

export function parseUserAgent(userAgent: string): ParsedUA {
  if (!userAgent) {
    return {
      browser: null,
      browserVersion: null,
      os: null,
      osVersion: null,
      device: null,
      deviceType: null,
    };
  }

  try {
    const parser = new UAParser(userAgent);
    const result = parser.getResult();

    // Determine device type
    let deviceType: string | null = null;
    if (result.device.type) {
      deviceType = result.device.type; // mobile, tablet, console, smarttv, wearable, embedded
    } else {
      // If no device type detected, it's likely desktop
      deviceType = "desktop";
    }

    return {
      browser: result.browser.name || null,
      browserVersion: result.browser.version || null,
      os: result.os.name || null,
      osVersion: result.os.version || null,
      device: result.device.model || result.device.vendor || deviceType,
      deviceType,
    };
  } catch (error) {
    console.error("UA parse error:", error);
    return {
      browser: null,
      browserVersion: null,
      os: null,
      osVersion: null,
      device: null,
      deviceType: null,
    };
  }
}
