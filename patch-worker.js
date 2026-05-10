const fs = require('fs');
const fpath = '/var/www/gravy-cc-deploy/src/lib/tracking/click-worker.ts';
let c = fs.readFileSync(fpath, 'utf8');

// 1. Add import for emitClickEvent after createHash import
if (!c.includes('emitClickEvent')) {
  c = c.replace(
    'import { createHash } from "crypto";',
    'import { createHash } from "crypto";\nimport { emitClickEvent } from "./click-event-emitter";'
  );
}

// 2. Add the emit call after the tracking link update section
// We need to find where totalClicks gets incremented and add the emit after that block
const emitBlock = `

    // Emit real-time click event via Redis pub/sub
    try {
      const updatedLink = await db.trackingLink.findUnique({
        where: { id: data.trackingLinkId },
        select: { totalClicks: true, uniqueClicks: true, campaignId: true, creatorId: true },
      });
      if (updatedLink) {
        await emitClickEvent({
          trackingLinkId: data.trackingLinkId,
          creatorId: updatedLink.creatorId,
          campaignId: updatedLink.campaignId || "",
          totalClicks: updatedLink.totalClicks,
          uniqueClicks: updatedLink.uniqueClicks,
          timestamp: data.timestamp,
        });
      }
    } catch (emitErr) {
      console.error("Failed to emit click event:", emitErr);
    }`;

// Insert before the console.log that says "processed" (the success message at the end of processing)
if (!c.includes('emitClickEvent(')) {
  // Look for a pattern like: console.log(`Click processed...`) or console.log("Click processed...")
  const processedLogRegex = /(\s*console\.log\(["`'].*(?:processed|Click).*["`']\);)/i;
  const match = c.match(processedLogRegex);
  if (match) {
    c = c.replace(match[0], emitBlock + '\n' + match[0]);
  } else {
    // Fallback: insert before the worker options (concurrency line)
    // Find the closing brace of the async processor function followed by comma or options
    const workerEndRegex = /(\s*\},\s*\{[\s\S]*?concurrency)/;
    const match2 = c.match(workerEndRegex);
    if (match2) {
      c = c.replace(match2[0], emitBlock + '\n' + match2[0]);
    } else {
      console.log('WARNING: Could not find insertion point for emitClickEvent');
    }
  }
}

fs.writeFileSync(fpath, c, 'utf8');
console.log('Patched click-worker.ts successfully');
console.log('New file size:', c.length);
