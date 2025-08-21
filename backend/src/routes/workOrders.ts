import express from 'express';
import { prisma } from '../db';
import { WorkOrderStatus, Priority } from '@prisma/client';

const router = express.Router();

// GET /api/work-orders - Get all work orders with optional filters
router.get('/', async (req, res) => {
  try {
    const {
      organizationId,
      status,
      priority,
      assignedToId,
      createdById,
      assetId,
      type,
      search,
      limit,
      offset
    } = req.query;

    const where: any = {};
    if (organizationId) where.organizationId = organizationId as string;
    if (status) where.status = status as WorkOrderStatus;
    if (priority) where.priority = priority as Priority;
    if (assignedToId) where.assignedToId = assignedToId as string;
    if (createdById) where.createdById = createdById as string;
    if (assetId) where.assetId = assetId as string;
    if (type) where.type = { contains: type as string, mode: 'insensitive' };

    // Search across title, description, and work order number
    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
        { workOrderNumber: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    const workOrders = await prisma.workOrder.findMany({
      where,
      include: {
        organization: {
          select: {
            id: true,
            name: true
          }
        },
        asset: {
          select: {
            id: true,
            name: true,
            location: true,
            type: true
          }
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        _count: {
          select: {
            comments: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip: offset ? parseInt(offset as string) : undefined,
      take: limit ? parseInt(limit as string) : undefined
    });

    // Get total count for pagination
    const totalCount = await prisma.workOrder.count({ where });

    res.json({
      success: true,
      data: workOrders,
      pagination: {
        total: totalCount,
        offset: offset ? parseInt(offset as string) : 0,
        limit: limit ? parseInt(limit as string) : workOrders.length
      }
    });
  } catch (error) {
    console.error('Error fetching work orders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch work orders',
      error: process.env.NODE_ENV === 'development' ? error : {}
    });
  }
});

// GET /api/work-orders/:id - Get work order by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const workOrder = await prisma.workOrder.findUnique({
      where: { id },
      include: {
        organization: true,
        asset: true,
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
            picture: true
          }
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            picture: true
          }
        },
        comments: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                email: true,
                picture: true
              }
            }
          },
          orderBy: {
            createdAt: 'asc'
          }
        }
      }
    });

    if (!workOrder) {
      return res.status(404).json({
        success: false,
        message: 'Work order not found'
      });
    }

    res.json({
      success: true,
      data: workOrder
    });
  } catch (error) {
    console.error('Error fetching work order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch work order',
      error: process.env.NODE_ENV === 'development' ? error : {}
    });
  }
});

// POST /api/work-orders - Create new work order
router.post('/', async (req, res) => {
  try {
    const {
      title,
      description,
      status,
      priority,
      type,
      dueDate,
      scheduledDate,
      estimatedHours,
      instructions,
      parts,
      tools,
      safetyNotes,
      notes,
      organizationId,
      assetId,
      assignedToId,
      createdById
    } = req.body;

    // Validate required fields
    if (!title || !organizationId || !createdById) {
      return res.status(400).json({
        success: false,
        message: 'Title, organizationId, and createdById are required'
      });
    }

    // Generate work order number
    const workOrderCount = await prisma.workOrder.count({
      where: { organizationId }
    });
    const workOrderNumber = `WO-${String(workOrderCount + 1).padStart(6, '0')}`;

    const workOrder = await prisma.workOrder.create({
      data: {
        workOrderNumber,
        title,
        description,
        status: status || 'OPEN',
        priority: priority || 'MEDIUM',
        type,
        dueDate: dueDate ? new Date(dueDate) : null,
        scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
        estimatedHours,
        instructions,
        parts,
        tools,
        safetyNotes,
        notes,
        organizationId,
        assetId,
        assignedToId,
        createdById
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true
          }
        },
        asset: {
          select: {
            id: true,
            name: true,
            location: true
          }
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      data: workOrder,
      message: 'Work order created successfully'
    });
  } catch (error) {
    console.error('Error creating work order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create work order',
      error: process.env.NODE_ENV === 'development' ? error : {}
    });
  }
});

// PUT /api/work-orders/:id - Update work order
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Check if work order exists
    const existingWorkOrder = await prisma.workOrder.findUnique({
      where: { id }
    });

    if (!existingWorkOrder) {
      return res.status(404).json({
        success: false,
        message: 'Work order not found'
      });
    }

    // Convert date strings to Date objects
    if (updateData.dueDate) updateData.dueDate = new Date(updateData.dueDate);
    if (updateData.scheduledDate) updateData.scheduledDate = new Date(updateData.scheduledDate);

    const workOrder = await prisma.workOrder.update({
      where: { id },
      data: updateData,
      include: {
        organization: {
          select: {
            id: true,
            name: true
          }
        },
        asset: {
          select: {
            id: true,
            name: true,
            location: true
          }
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: workOrder,
      message: 'Work order updated successfully'
    });
  } catch (error) {
    console.error('Error updating work order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update work order',
      error: process.env.NODE_ENV === 'development' ? error : {}
    });
  }
});

export default router;