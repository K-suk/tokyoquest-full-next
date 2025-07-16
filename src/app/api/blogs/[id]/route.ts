import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/blogs/[id] - Get a specific published blog
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const blog = await prisma.blog.findFirst({
      where: {
        id: parseInt(resolvedParams.id),
        is_published: true,
      },
      include: {
        contents: {
          orderBy: { order: "asc" },
        },
      },
    });

    if (!blog) {
      return NextResponse.json({ error: "Blog not found" }, { status: 404 });
    }

    return NextResponse.json(blog);
  } catch (error) {
    console.error("Error fetching blog:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/blogs/[id] - Update a blog
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const body = await request.json();
    const { title, thumbnail, contents, is_published } = body;

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    // Delete existing contents
    await prisma.blogContent.deleteMany({
      where: { blog_id: parseInt(resolvedParams.id) },
    });

    // Update blog and create new contents
    const blog = await prisma.blog.update({
      where: { id: parseInt(resolvedParams.id) },
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

    return NextResponse.json(blog);
  } catch (error) {
    console.error("Error updating blog:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/blogs/[id] - Delete a blog
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    await prisma.blog.delete({
      where: { id: parseInt(resolvedParams.id) },
    });

    return NextResponse.json({ message: "Blog deleted successfully" });
  } catch (error) {
    console.error("Error deleting blog:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
