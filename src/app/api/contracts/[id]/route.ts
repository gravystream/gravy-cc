import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id as string
    const { id } = params

    const contract = await db.contract.findUnique({
      where: { id },
      include: {
        brand: { include: { user: true } },
        creator: { include: { user: true } },
        campaign: true,
        escrowPayment: true,
        videoSubmissions: true,
      },
    })

    if (!contract) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 })
    }

    const isBrand = contract.brandId === userId
    const isCreator = contract.creatorId === userId

    if (!isBrand && !isCreator) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json({
      contract,
      isBrand,
      isCreator,
    })
  } catch (error) {
    console.error('GET /api/contracts/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
