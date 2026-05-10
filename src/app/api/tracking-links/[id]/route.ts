import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const link = await db.trackingLink.findFirst({
      where: { id: params.id, creatorId: session.user.id },
      include: {
        campaign: { select: { id: true, title: true } },
        job: { select: { id: true } },
        _count: { select: { clicks: true, conversions: true } },
      },
    });

    if (!link) {
      return NextResponse.json({ error: 'Link not found' }, { status: 404 });
    }

    return NextResponse.json(link);
  } catch (error) {
    console.error('Error fetching tracking link:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const existing = await db.trackingLink.findFirst({
      where: { id: params.id, creatorId: session.user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Link not found' }, { status: 404 });
    }

    const body = await req.json();
    const { destinationUrl, linkType, utmSource, utmMedium, utmCampaign, utmContent, isActive } = body;

    const link = await db.trackingLink.update({
      where: { id: params.id },
      data: {
        ...(destinationUrl !== undefined && { destinationUrl }),
        ...(linkType !== undefined && { linkType }),
        ...(utmSource !== undefined && { utmSource }),
        ...(utmMedium !== undefined && { utmMedium }),
        ...(utmCampaign !== undefined && { utmCampaign }),
        ...(utmContent !== undefined && { utmContent }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return NextResponse.json(link);
  } catch (error) {
    console.error('Error updating tracking link:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const existing = await db.trackingLink.findFirst({
      where: { id: params.id, creatorId: session.user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Link not found' }, { status: 404 });
    }

    await db.trackingLink.delete({ where: { id: params.id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting tracking link:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
