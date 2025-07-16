import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/blogs - Get published blogs
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = (page - 1) * limit;

    const blogs = await prisma.blog.findMany({
      where: {
        is_published: true,
      },
      include: {
        contents: {
          orderBy: { order: "asc" },
        },
      },
      orderBy: { created_at: "desc" },
      skip: offset,
      take: limit,
    });

    const total = await prisma.blog.count({
      where: {
        is_published: true,
      },
    });

    return NextResponse.json({
      blogs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching blogs:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
