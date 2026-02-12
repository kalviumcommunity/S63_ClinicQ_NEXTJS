import { NextRequest, NextResponse } from 'next/server';
import { sanitizeObject } from '@/utils/sanitize';
import { validateInput, commonSchemas } from '@/utils/validation';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Sanitize input data
    const sanitizedData = sanitizeObject(body, {
      patientName: 'name',
      patientPhone: 'phone',
      patientAge: 'integer',
      visitReason: 'text',
      departmentId: 'uuid',
    });

    // Validate sanitized data
    const validation = validateInput(sanitizedData, commonSchemas.patientToken);
    
    if (!validation.isValid) {
      return NextResponse.json(
        { 
          error: 'Validation failed', 
          details: validation.errors 
        },
        { status: 400 }
      );
    }

    // Additional business logic validation
    if (!sanitizedData.departmentId) {
      return NextResponse.json(
        { error: 'Department ID is required' },
        { status: 400 }
      );
    }

    // Verify department exists
    const department = await prisma.department.findUnique({
      where: { id: sanitizedData.departmentId },
    });

    if (!department || !department.isActive) {
      return NextResponse.json(
        { error: 'Invalid or inactive department' },
        { status: 400 }
      );
    }

    // Get or create today's queue
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let queue = await prisma.queue.findUnique({
      where: {
        departmentId_date: {
          departmentId: sanitizedData.departmentId,
          date: today,
        },
      },
    });

    if (!queue) {
      queue = await prisma.queue.create({
        data: {
          departmentId: sanitizedData.departmentId,
          date: today,
          currentTokenNumber: 0,
        },
      });
    }

    // Generate token number
    const tokenSequence = queue.currentTokenNumber + 1;
    const tokenNumber = `${department.code}${tokenSequence.toString().padStart(3, '0')}`;

    // Create token with sanitized data
    const token = await prisma.token.create({
      data: {
        queueId: queue.id,
        tokenNumber,
        tokenSequence,
        patientName: sanitizedData.patientName!,
        patientPhone: sanitizedData.patientPhone!,
        patientAge: sanitizedData.patientAge || null,
        visitReason: sanitizedData.visitReason || null,
        status: 'WAITING',
      },
    });

    // Update queue current token number
    await prisma.queue.update({
      where: { id: queue.id },
      data: { currentTokenNumber: tokenSequence },
    });

    return NextResponse.json({
      success: true,
      token: {
        id: token.id,
        tokenNumber: token.tokenNumber,
        patientName: token.patientName,
        status: token.status,
        createdAt: token.createdAt,
      },
    });

  } catch (error) {
    console.error('Error creating token:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}