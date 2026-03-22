import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id as string
    const {
      conversationId,
      creatorId,
      deliverable,
      platform,
      deadline,
      amountKobo,
      revisions,
      usageRights,
      additionalTerms,
      campaignId,
    } = await request.json()

    const brand = await db.brandProfile.findUnique({ where: { userId } })
    if (!brand) return NextResponse.json({ error: 'Brand profile not found' }, { status: 404 })

    const contract = await db.contract.create({
      data: {
        conversationId,
        brandId: brand.id,
        creatorId,
        deliverable,
        platform,
        deadline: new Date(deadline),
        amountKobo,
        revisions,
        usageRights,
        additionalTerms,
        status: 'PENDING_CREATOR_SIGN',
        brandSignedAt: new Date(),
        campaignId,
      },
    })

    // Notify creator in message inbox
    try {
      const conv = await db.conversation.findFirst({
        where: { brandId: brand.id, creatorId },
      })
      if (conv) {
        const amtNGN = (amountKobo / 100).toLocaleString('en-NG')
        const dueStr = new Date(deadline).toLocaleDateString('en-NG', { day: '2-digit', month: '2-digit', year: 'numeric' })
        const notifContent = `CONTRACT_NOTIFICATION:${JSON.stringify({ contractId: contract.id, deliverable, platform: platform || 'Social Media', amount: amtNGN, deadline: dueStr })}`
        await db.$transaction([
          db.message.create({
            data: {
              conversationId: conv.id,
              senderId: userId,
              content: notifContent,
            },
          }),
          db.conversation.update({
            where: { id: conv.id },
            data: { updatedAt: new Date() },
          }),
        ])
      }
    } catch (_e) {
      console.error('Contract notification error:', _e)
    }
    return NextResponse.json({ contractId: contract.id })
  } catch (error) {
    console.error('POST /api/contracts error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
