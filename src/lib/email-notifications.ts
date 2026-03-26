import { sendEmail } from "./email";
const siteUrl = process.env.NEXTAUTH_URL || "https://desk.novaclio.io";

export async function notifyNewBrief(creatorEmail: string, creatorName: string, campaignTitle: string, campaignId: string) {
  await sendEmail({ to: creatorEmail, subject: "New Brief: " + campaignTitle, html: '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto"><h2 style="color:#1a1a2e">New Brief Available!</h2><p>Hi ' + creatorName + ',</p><p>A new campaign brief has been posted: <strong>' + campaignTitle + '</strong></p><a href="' + siteUrl + '/creator/briefs/' + campaignId + '" style="display:inline-block;background:#2563eb;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold">View Brief</a><p style="color:#666;margin-top:24px;font-size:14px">The NovaClio Team</p></div>' });
}

export async function notifyProposalAccepted(creatorEmail: string, creatorName: string, campaignTitle: string, jobId: string) {
  await sendEmail({ to: creatorEmail, subject: "Proposal Accepted: " + campaignTitle, html: '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto"><h2 style="color:#1a1a2e">Your Proposal Was Accepted!</h2><p>Hi ' + creatorName + ',</p><p>Your proposal for <strong>' + campaignTitle + '</strong> has been accepted.</p><a href="' + siteUrl + '/creator/jobs/' + jobId + '" style="display:inline-block;background:#16a34a;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold">View Job</a><p style="color:#666;margin-top:24px;font-size:14px">The NovaClio Team</p></div>' });
}

export async function notifyPaymentReleased(creatorEmail: string, creatorName: string, amount: number, campaignTitle: string) {
  const formatted = (amount / 100).toLocaleString();
  await sendEmail({ to: creatorEmail, subject: "Payment Released: N" + formatted, html: '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto"><h2 style="color:#1a1a2e">Payment Released!</h2><p>Hi ' + creatorName + ',</p><p>A payment of <strong>N' + formatted + '</strong> for <strong>' + campaignTitle + '</strong> has been released to your wallet.</p><p style="color:#666;margin-top:24px;font-size:14px">The NovaClio Team</p></div>' });
}

export async function notifyNewProposal(brandEmail: string, brandName: string, creatorName: string, campaignTitle: string, campaignId: string) {
  await sendEmail({ to: brandEmail, subject: "New Proposal for: " + campaignTitle, html: '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto"><h2 style="color:#1a1a2e">New Proposal Received</h2><p>Hi ' + brandName + ',</p><p><strong>' + creatorName + '</strong> has submitted a proposal for <strong>' + campaignTitle + '</strong>.</p><a href="' + siteUrl + '/brand/campaigns/' + campaignId + '/proposals" style="display:inline-block;background:#2563eb;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold">Review Proposals</a><p style="color:#666;margin-top:24px;font-size:14px">The NovaClio Team</p></div>' });
}

export async function notifyVideoSubmitted(brandEmail: string, brandName: string, creatorName: string, campaignTitle: string, jobId: string) {
  await sendEmail({ to: brandEmail, subject: "Video Submitted: " + campaignTitle, html: '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto"><h2 style="color:#1a1a2e">Video Submission Ready</h2><p>Hi ' + brandName + ',</p><p><strong>' + creatorName + '</strong> has submitted a video for <strong>' + campaignTitle + '</strong>.</p><a href="' + siteUrl + '/brand/jobs/' + jobId + '" style="display:inline-block;background:#2563eb;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold">Review Submission</a><p style="color:#666;margin-top:24px;font-size:14px">The NovaClio Team</p></div>' });
}
