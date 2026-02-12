import { NextRequest, NextResponse } from 'next/server';
import { sanitizeObject } from '@/utils/sanitize';
import { validateInput, commonSchemas } from '@/utils/validation';
import { prisma } from '@/lib/prisma';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import type { Role } from '@/config/roles';
import { hasPermission } from '@/config/roles';

const AUTH_SECRET = process.env.AUTH_SECRET || 'development-secret-change-in-production';

export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const secret = new TextEncoder().encode(AUTH_SECRET);
    const { payload } = await jwtVerify(token, secret);
    const role = payload.role as Role | undefined;

    if (!role || !hasPermission(role, 'create')) {
      return NextResponse.json(
        { error: 'Access denied: insufficient permissions.' },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Sanitize input data
    const sanitizedData = sanitizeObject(body, {
      name: 'text',
      code: 'string',
      avgServiceTimeMinutes: 'integer',
    });

    // Validate sanitized data
    const validation = validateInput(sanitizedData, commonSchemas.department);
    
    if (!validation.isValid) {
      return NextResponse.json(
        { 
          error: 'Validation failed', 
          details: validation.errors 
        },
        { status: 400 }
      );
    }

    // Check if department code already exists
    const existingDepartment = await prisma.department.findUnique({
      where: { code: sanitizedData.code!.toUpperCase() },
    });

    if (existingDepartment) {
      return NextResponse.json(
        { error: 'Department code already exists' },
        { status: 409 }
      );
    }

    // Create department with sanitized data
    const department = await prisma.department.create({
      data: {
        name: sanitizedData.name!,
        code: sanitizedData.code!.toUpperCase(),
        avgServiceTimeMinutes: sanitizedData.avgServiceTimeMinutes!,
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      department: {
        id: department.id,
        name: department.name,
        code: department.code,
        avgServiceTimeMinutes: department.avgServiceTimeMinutes,
        isActive: department.isActive,
        createdAt: department.createdAt,
      },
    });

  } catch (error) {
    console.error('Error creating department:', error);
    
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json(
        { error: 'Department with this name or code already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}