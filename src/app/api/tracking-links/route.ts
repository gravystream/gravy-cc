import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { generateUniqueShortCode } from '@/lib/shortcode';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const campaignId = searchParams.get('campaignId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: any = { creatorId: session.user.id };
    if (campaignId) where.campaignId = campaignId;

    const [links, total] = await Promise.all([
      db.trackingLink.findMany({
        where,
        include: {
          campaign: { select: { id: true, title: true } },
          job: { select: { id: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.trackingLink.count({ where }),
    ]);

    return NextResponse.json({
      links,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Error fetching tracking links:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { campaignId, jobId, destinationUrl, linkType, utmSource, utmMedium, utmCampaign, utmContent, expiresAt, maxClicks } = body;

    if (!campaignId || !destinationUrl) {
      return NextResponse.json({ error: 'campaignId and destinationUrl are required' }, { status: 400 });
    }

    const shortCode = await generateUniqueShortCode();

    const link = await db.trackingLink.create({
      data: {
        shortCode,
        creatorId: session.user.id,
        campaignId,
        jobId: jobId || null,
        destinationUrl,
        linkType: linkType || 'website',
        utmSource: utmSource || null,
        utmMedium: utmMedium || null,
        utmCampaign: utmCampaign || null,
        utmContent: utmContent || null,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      maxClicks: maxClicks ? parseInt(maxClicks) : null,
      },
      include: {
        campaign: { select: { id: true, title: true } },
      },
    });

    return NextResponse.json(link, { status: 201 });
  } catch (error) {
    console.error('Error creating tracking link:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
