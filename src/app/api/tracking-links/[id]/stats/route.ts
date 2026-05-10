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
    });

    if (!link) {
      return NextResponse.json({ error: 'Link not found' }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const days = parseInt(searchParams.get('days') || '30');
    const since = new Date();
    since.setDate(since.getDate() - days);

    const [clicksByDay, topCountries, topDevices, topBrowsers, recentClicks] = await Promise.all([
      db.performanceMetric.findMany({
        where: { trackingLinkId: params.id, date: { gte: since } },
        orderBy: { date: 'asc' },
      }),
      db.linkClick.groupBy({
        by: ['country'],
        where: { trackingLinkId: params.id, timestamp: { gte: since } },
        _count: true,
        orderBy: { _count: { country: 'desc' } },
        take: 10,
      }),
      db.linkClick.groupBy({
        by: ['device'],
        where: { trackingLinkId: params.id, timestamp: { gte: since } },
        _count: true,
        orderBy: { _count: { device: 'desc' } },
        take: 5,
      }),
      db.linkClick.groupBy({
        by: ['browser'],
        where: { trackingLinkId: params.id, timestamp: { gte: since } },
        _count: true,
        orderBy: { _count: { browser: 'desc' } },
        take: 5,
      }),
      db.linkClick.findMany({
        where: { trackingLinkId: params.id },
        orderBy: { timestamp: 'desc' },
        take: 20,
        select: { country: true, city: true, device: true, browser: true, referrer: true, timestamp: true },
      }),
    ]);

    return NextResponse.json({
      totalClicks: link.totalClicks,
      uniqueClicks: link.uniqueClicks,
      clicksByDay,
      topCountries,
      topDevices,
      topBrowsers,
      recentClicks,
    });
  } catch (error) {
    console.error('Error fetching link stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
