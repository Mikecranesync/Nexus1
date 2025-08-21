"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const db_1 = require("../db");
const router = express_1.default.Router();
// GET /api/work-orders - Get all work orders with optional filters
router.get('/', async (req, res) => {
    try {
        const { organizationId, status, priority, assignedToId, createdById, assetId, type, search, limit, offset } = req.query;
        const where = {};
        if (organizationId)
            where.organizationId = organizationId;
        if (status)
            where.status = status;
        if (priority)
            where.priority = priority;
        if (assignedToId)
            where.assignedToId = assignedToId;
        if (createdById)
            where.createdById = createdById;
        if (assetId)
            where.assetId = assetId;
        if (type)
            where.type = { contains: type, mode: 'insensitive' };
        // Search across title, description, and work order number
        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
                { workOrderNumber: { contains: search, mode: 'insensitive' } }
            ];
        }
        const workOrders = await db_1.prisma.workOrder.findMany({
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
            skip: offset ? parseInt(offset) : undefined,
            take: limit ? parseInt(limit) : undefined
        });
        // Get total count for pagination
        const totalCount = await db_1.prisma.workOrder.count({ where });
        res.json({
            success: true,
            data: workOrders,
            pagination: {
                total: totalCount,
                offset: offset ? parseInt(offset) : 0,
                limit: limit ? parseInt(limit) : workOrders.length
            }
        });
    }
    catch (error) {
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
        const workOrder = await db_1.prisma.workOrder.findUnique({
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
    }
    catch (error) {
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
        const { title, description, status, priority, type, dueDate, scheduledDate, estimatedHours, instructions, parts, tools, safetyNotes, notes, organizationId, assetId, assignedToId, createdById } = req.body;
        // Validate required fields
        if (!title || !organizationId || !createdById) {
            return res.status(400).json({
                success: false,
                message: 'Title, organizationId, and createdById are required'
            });
        }
        // Generate work order number
        const workOrderCount = await db_1.prisma.workOrder.count({
            where: { organizationId }
        });
        const workOrderNumber = `WO-${String(workOrderCount + 1).padStart(6, '0')}`;
        const workOrder = await db_1.prisma.workOrder.create({
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
    }
    catch (error) {
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
        const existingWorkOrder = await db_1.prisma.workOrder.findUnique({
            where: { id }
        });
        if (!existingWorkOrder) {
            return res.status(404).json({
                success: false,
                message: 'Work order not found'
            });
        }
        // Convert date strings to Date objects
        if (updateData.dueDate)
            updateData.dueDate = new Date(updateData.dueDate);
        if (updateData.scheduledDate)
            updateData.scheduledDate = new Date(updateData.scheduledDate);
        const workOrder = await db_1.prisma.workOrder.update({
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
    }
    catch (error) {
        console.error('Error updating work order:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update work order',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
});
exports.default = router;
//# sourceMappingURL=workOrders.js.map