import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";

// GET /api/miasanmia_admin/blogs - Get all blogs
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user?.isStaff) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const blogs = await prisma.blog.findMany({
      include: {
        contents: {
          orderBy: { order: "asc" },
        },
      },
      orderBy: { created_at: "desc" },
    });

    return NextResponse.json(blogs);
  } catch (error) {
    console.error("Error fetching blogs:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/miasanmia_admin/blogs - Create a new blog
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user?.isStaff) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { title, thumbnail, contents, is_published = false } = body;

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const blog = await prisma.blog.create({
      data: {
        title,
        thumbnail,
        is_published,
        contents: {
          create:
            contents?.map((content: any, index: number) => ({
              subtitle: content.subtitle,
              content: content.content,
              image: content.image,
              order: content.order || index,
            })) || [],
        },
      },
      include: {
        contents: {
          orderBy: { order: "asc" },
        },
      },
    });

    return NextResponse.json(blog, { status: 201 });
  } catch (error) {
    console.error("Error creating blog:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
