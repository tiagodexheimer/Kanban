import prisma from "@/lib/prisma"; // Updated for Sprint 7
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = (session.user as any).id;

    const projects = await prisma.project.findMany({
      where: {
        OR: [
          { ownerId: userId },
          { members: { some: { userId } } }
        ]
      },
      include: {
        boards: true,
        folders: {
          include: { boards: true }
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true
              }
            }
          }
        },
        owner: {
          select: {
            id: true,
            name: true,
            image: true
          }
        }
      },
      orderBy: { updatedAt: "desc" }
    });

    return NextResponse.json(projects);
  } catch (error) {
    console.error("Error fetching projects:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { title, description, boardTitles, initialMembers } = body;

    if (!title) return NextResponse.json({ error: "Title is required" }, { status: 400 });

    const userId = (session.user as any).id;

    const project = await prisma.project.create({
      data: {
        title,
        description: description || null,
        ownerId: userId,
        members: {
          create: { 
            userId, 
            role: "OWNER" 
          }
        }
      },
      include: {
        members: {
          include: { user: true }
        }
      }
    });

    // Create initial boards if requested
    if (boardTitles && Array.isArray(boardTitles) && boardTitles.length > 0) {
      for (const boardTitle of boardTitles) {
        if (!boardTitle || !boardTitle.trim()) continue;
        await prisma.board.create({
          data: {
            title: boardTitle.trim(),
            description: `Quadro inicial do projeto ${title}`,
            ownerId: userId,
            projectId: project.id,
            permissions: {
              create: {
                userId,
                canView: true,
                canEditTasks: true,
                canMoveTasks: true,
                canManageBoard: true
              }
            },
            columns: {
              create: [
                { title: "To Do", position: 1, type: "TODO", color: "#eab308" },
                { title: "Doing", position: 2, type: "IN_PROGRESS", color: "#3b82f6" },
                { title: "Done", position: 3, type: "DONE", color: "#22c55e" },
              ],
            },
          }
        });
      }
    }

    // Add initial members if provided
    if (initialMembers && Array.isArray(initialMembers) && initialMembers.length > 0) {
      for (const email of initialMembers) {
        if (!email || !email.trim()) continue;
        const userToInvite = await prisma.user.findUnique({
          where: { email: email.trim() }
        });
        if (userToInvite && userToInvite.id !== userId) {
          const existing = await prisma.projectMember.findUnique({
            where: {
              projectId_userId: {
                projectId: project.id,
                userId: userToInvite.id
              }
            }
          });
          if (!existing) {
            await prisma.projectMember.create({
              data: {
                projectId: project.id,
                userId: userToInvite.id,
                role: "MEMBER"
              }
            });
            // Also grant permissions to project boards
            const projectBoards = await prisma.board.findMany({
              where: { projectId: project.id }
            });
            for (const board of projectBoards) {
              await prisma.boardPermission.create({
                data: {
                  boardId: board.id,
                  userId: userToInvite.id,
                  canView: true,
                  canEditTasks: true,
                  canMoveTasks: true,
                  canManageBoard: false
                }
              });
            }
          }
        }
      }
    }

    // Fetch full project with newly created boards and members to return
    const fullProject = await prisma.project.findUnique({
      where: { id: project.id },
      include: {
        boards: true,
        folders: {
          include: { boards: true }
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true
              }
            }
          }
        },
        owner: {
          select: {
            id: true,
            name: true,
            image: true
          }
        }
      }
    });

    return NextResponse.json(fullProject, { status: 201 });
  } catch (error) {
    console.error("Error creating project:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
