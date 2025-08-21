"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const db_1 = require("../db");
const router = express_1.default.Router();
// GET /api/assets - Get all assets with optional filters
router.get('/', async (req, res) => {
    try {
        const { organizationId, status, criticality, type, location, createdById, search } = req.query;
        const where = {};
        if (organizationId)
            where.organizationId = organizationId;
        if (status)
            where.status = status;
        if (criticality)
            where.criticality = criticality;
        if (type)
            where.type = { contains: type, mode: 'insensitive' };
        if (location)
            where.location = { contains: location, mode: 'insensitive' };
        if (createdById)
            where.createdById = createdById;
        // Search across name, description, and model
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
                { model: { contains: search, mode: 'insensitive' } },
                { serialNumber: { contains: search, mode: 'insensitive' } }
            ];
        }
        const assets = await db_1.prisma.asset.findMany({
            where,
            include: {
                organization: {
                    select: {
                        id: true,
                        name: true
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
                        workOrders: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        res.json({
            success: true,
            data: assets
        });
    }
    catch (error) {
        console.error('Error fetching assets:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch assets',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
});
// GET /api/assets/:id - Get asset by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const asset = await db_1.prisma.asset.findUnique({
            where: { id },
            include: {
                organization: true,
                createdBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                },
                workOrders: {
                    include: {
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
                                name: true
                            }
                        }
                    },
                    orderBy: {
                        createdAt: 'desc'
                    }
                }
            }
        });
        if (!asset) {
            return res.status(404).json({
                success: false,
                message: 'Asset not found'
            });
        }
        res.json({
            success: true,
            data: asset
        });
    }
    catch (error) {
        console.error('Error fetching asset:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch asset',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
});
// POST /api/assets - Create new asset
router.post('/', async (req, res) => {
    try {
        const { name, description, type, category, location, status, criticality, manufacturer, model, serialNumber, purchaseDate, warrantyExpiry, installationDate, lastMaintenance, nextMaintenance, maintenanceInterval, purchasePrice, currentValue, depreciationRate, specifications, documents, notes, organizationId, createdById } = req.body;
        // Validate required fields
        if (!name || !type || !location || !organizationId || !createdById) {
            return res.status(400).json({
                success: false,
                message: 'Name, type, location, organizationId, and createdById are required'
            });
        }
        // Validate organization exists
        const organization = await db_1.prisma.organization.findUnique({
            where: { id: organizationId }
        });
        if (!organization) {
            return res.status(400).json({
                success: false,
                message: 'Invalid organization ID'
            });
        }
        // Validate creator exists
        const creator = await db_1.prisma.user.findUnique({
            where: { id: createdById }
        });
        if (!creator) {
            return res.status(400).json({
                success: false,
                message: 'Invalid creator user ID'
            });
        }
        const asset = await db_1.prisma.asset.create({
            data: {
                name,
                description,
                type,
                category,
                location,
                status: status || 'ACTIVE',
                criticality: criticality || 'MEDIUM',
                manufacturer,
                model,
                serialNumber,
                purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
                warrantyExpiry: warrantyExpiry ? new Date(warrantyExpiry) : null,
                installationDate: installationDate ? new Date(installationDate) : null,
                lastMaintenance: lastMaintenance ? new Date(lastMaintenance) : null,
                nextMaintenance: nextMaintenance ? new Date(nextMaintenance) : null,
                maintenanceInterval,
                purchasePrice,
                currentValue,
                depreciationRate,
                specifications,
                documents,
                notes,
                organizationId,
                createdById
            },
            include: {
                organization: {
                    select: {
                        id: true,
                        name: true
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
        // Log activity
        await db_1.prisma.activityLog.create({
            data: {
                action: 'created',
                entityType: 'Asset',
                entityId: asset.id,
                description: `Asset "${asset.name}" was created`,
                newValues: asset,
                organizationId,
                userId: createdById
            }
        });
        res.status(201).json({
            success: true,
            data: asset,
            message: 'Asset created successfully'
        });
    }
    catch (error) {
        console.error('Error creating asset:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create asset',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
});
// PUT /api/assets/:id - Update asset
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        const { updatedById } = updateData;
        // Remove updatedById from update data
        delete updateData.updatedById;
        // Check if asset exists
        const existingAsset = await db_1.prisma.asset.findUnique({
            where: { id }
        });
        if (!existingAsset) {
            return res.status(404).json({
                success: false,
                message: 'Asset not found'
            });
        }
        // Convert date strings to Date objects
        if (updateData.purchaseDate)
            updateData.purchaseDate = new Date(updateData.purchaseDate);
        if (updateData.warrantyExpiry)
            updateData.warrantyExpiry = new Date(updateData.warrantyExpiry);
        if (updateData.installationDate)
            updateData.installationDate = new Date(updateData.installationDate);
        if (updateData.lastMaintenance)
            updateData.lastMaintenance = new Date(updateData.lastMaintenance);
        if (updateData.nextMaintenance)
            updateData.nextMaintenance = new Date(updateData.nextMaintenance);
        const asset = await db_1.prisma.asset.update({
            where: { id },
            data: updateData,
            include: {
                organization: {
                    select: {
                        id: true,
                        name: true
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
        // Log activity
        if (updatedById) {
            await db_1.prisma.activityLog.create({
                data: {
                    action: 'updated',
                    entityType: 'Asset',
                    entityId: asset.id,
                    description: `Asset "${asset.name}" was updated`,
                    oldValues: existingAsset,
                    newValues: asset,
                    organizationId: asset.organizationId,
                    userId: updatedById
                }
            });
        }
        res.json({
            success: true,
            data: asset,
            message: 'Asset updated successfully'
        });
    }
    catch (error) {
        console.error('Error updating asset:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update asset',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
});
// DELETE /api/assets/:id - Delete asset
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { deletedById } = req.body;
        // Check if asset exists
        const existingAsset = await db_1.prisma.asset.findUnique({
            where: { id },
            include: {
                _count: {
                    select: {
                        workOrders: true
                    }
                }
            }
        });
        if (!existingAsset) {
            return res.status(404).json({
                success: false,
                message: 'Asset not found'
            });
        }
        // Check for dependent work orders
        if (existingAsset._count.workOrders > 0) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete asset with associated work orders',
                details: {
                    workOrders: existingAsset._count.workOrders
                }
            });
        }
        await db_1.prisma.asset.delete({
            where: { id }
        });
        // Log activity
        if (deletedById) {
            await db_1.prisma.activityLog.create({
                data: {
                    action: 'deleted',
                    entityType: 'Asset',
                    entityId: id,
                    description: `Asset "${existingAsset.name}" was deleted`,
                    oldValues: existingAsset,
                    organizationId: existingAsset.organizationId,
                    userId: deletedById
                }
            });
        }
        res.json({
            success: true,
            message: 'Asset deleted successfully'
        });
    }
    catch (error) {
        console.error('Error deleting asset:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete asset',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
});
// GET /api/assets/:id/maintenance-history - Get asset maintenance history
router.get('/:id/maintenance-history', async (req, res) => {
    try {
        const { id } = req.params;
        // Check if asset exists
        const asset = await db_1.prisma.asset.findUnique({
            where: { id }
        });
        if (!asset) {
            return res.status(404).json({
                success: false,
                message: 'Asset not found'
            });
        }
        const maintenanceHistory = await db_1.prisma.workOrder.findMany({
            where: {
                assetId: id,
                type: { contains: 'maintenance', mode: 'insensitive' }
            },
            include: {
                assignedTo: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                createdBy: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            },
            orderBy: {
                completedAt: 'desc'
            }
        });
        res.json({
            success: true,
            data: maintenanceHistory
        });
    }
    catch (error) {
        console.error('Error fetching maintenance history:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch maintenance history',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
});
// POST /api/assets/:id/maintenance - Schedule maintenance for asset
router.post('/:id/maintenance', async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, scheduledDate, estimatedHours, assignedToId, createdById, priority, instructions } = req.body;
        // Check if asset exists
        const asset = await db_1.prisma.asset.findUnique({
            where: { id }
        });
        if (!asset) {
            return res.status(404).json({
                success: false,
                message: 'Asset not found'
            });
        }
        // Generate work order number
        const workOrderCount = await db_1.prisma.workOrder.count({
            where: { organizationId: asset.organizationId }
        });
        const workOrderNumber = `WO-${String(workOrderCount + 1).padStart(6, '0')}`;
        const workOrder = await db_1.prisma.workOrder.create({
            data: {
                workOrderNumber,
                title: title || `Scheduled Maintenance - ${asset.name}`,
                description,
                type: 'Preventive Maintenance',
                status: 'OPEN',
                priority: priority || 'MEDIUM',
                scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
                estimatedHours,
                instructions,
                organizationId: asset.organizationId,
                assetId: id,
                assignedToId,
                createdById
            },
            include: {
                asset: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                assignedTo: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        });
        res.status(201).json({
            success: true,
            data: workOrder,
            message: 'Maintenance work order created successfully'
        });
    }
    catch (error) {
        console.error('Error scheduling maintenance:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to schedule maintenance',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
});
exports.default = router;
//# sourceMappingURL=assets.js.map