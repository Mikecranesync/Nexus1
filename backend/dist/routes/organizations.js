"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const db_1 = require("../db");
const router = express_1.default.Router();
// GET /api/organizations - Get all organizations
router.get('/', async (req, res) => {
    try {
        const organizations = await db_1.prisma.organization.findMany({
            include: {
                _count: {
                    select: {
                        users: true,
                        assets: true,
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
            data: organizations
        });
    }
    catch (error) {
        console.error('Error fetching organizations:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch organizations',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
});
// GET /api/organizations/:id - Get organization by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const organization = await db_1.prisma.organization.findUnique({
            where: { id },
            include: {
                users: {
                    select: {
                        id: true,
                        email: true,
                        name: true,
                        role: true,
                        isActive: true,
                        lastLoginAt: true
                    }
                },
                assets: {
                    select: {
                        id: true,
                        name: true,
                        type: true,
                        status: true,
                        criticality: true,
                        location: true
                    }
                },
                workOrders: {
                    select: {
                        id: true,
                        workOrderNumber: true,
                        title: true,
                        status: true,
                        priority: true,
                        dueDate: true
                    }
                },
                _count: {
                    select: {
                        users: true,
                        assets: true,
                        workOrders: true
                    }
                }
            }
        });
        if (!organization) {
            return res.status(404).json({
                success: false,
                message: 'Organization not found'
            });
        }
        res.json({
            success: true,
            data: organization
        });
    }
    catch (error) {
        console.error('Error fetching organization:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch organization',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
});
// POST /api/organizations - Create new organization
router.post('/', async (req, res) => {
    try {
        const { name, description, industry, address, phone, email, website, logoUrl, timezone, settings } = req.body;
        // Validate required fields
        if (!name) {
            return res.status(400).json({
                success: false,
                message: 'Organization name is required'
            });
        }
        const organization = await db_1.prisma.organization.create({
            data: {
                name,
                description,
                industry,
                address,
                phone,
                email,
                website,
                logoUrl,
                timezone: timezone || 'UTC',
                settings
            }
        });
        res.status(201).json({
            success: true,
            data: organization,
            message: 'Organization created successfully'
        });
    }
    catch (error) {
        console.error('Error creating organization:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create organization',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
});
// PUT /api/organizations/:id - Update organization
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, industry, address, phone, email, website, logoUrl, timezone, settings } = req.body;
        // Check if organization exists
        const existingOrganization = await db_1.prisma.organization.findUnique({
            where: { id }
        });
        if (!existingOrganization) {
            return res.status(404).json({
                success: false,
                message: 'Organization not found'
            });
        }
        const organization = await db_1.prisma.organization.update({
            where: { id },
            data: {
                name,
                description,
                industry,
                address,
                phone,
                email,
                website,
                logoUrl,
                timezone,
                settings
            }
        });
        res.json({
            success: true,
            data: organization,
            message: 'Organization updated successfully'
        });
    }
    catch (error) {
        console.error('Error updating organization:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update organization',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
});
// DELETE /api/organizations/:id - Delete organization
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        // Check if organization exists
        const existingOrganization = await db_1.prisma.organization.findUnique({
            where: { id },
            include: {
                _count: {
                    select: {
                        users: true,
                        assets: true,
                        workOrders: true
                    }
                }
            }
        });
        if (!existingOrganization) {
            return res.status(404).json({
                success: false,
                message: 'Organization not found'
            });
        }
        // Check if organization has dependent records
        const { users, assets, workOrders } = existingOrganization._count;
        if (users > 0 || assets > 0 || workOrders > 0) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete organization with existing users, assets, or work orders',
                details: {
                    users,
                    assets,
                    workOrders
                }
            });
        }
        await db_1.prisma.organization.delete({
            where: { id }
        });
        res.json({
            success: true,
            message: 'Organization deleted successfully'
        });
    }
    catch (error) {
        console.error('Error deleting organization:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete organization',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
});
// GET /api/organizations/:id/stats - Get organization statistics
router.get('/:id/stats', async (req, res) => {
    try {
        const { id } = req.params;
        // Check if organization exists
        const organization = await db_1.prisma.organization.findUnique({
            where: { id }
        });
        if (!organization) {
            return res.status(404).json({
                success: false,
                message: 'Organization not found'
            });
        }
        // Get comprehensive statistics
        const [totalUsers, activeUsers, totalAssets, activeAssets, offlineAssets, totalWorkOrders, openWorkOrders, overdueWorkOrders, completedWorkOrders] = await Promise.all([
            db_1.prisma.user.count({ where: { organizationId: id } }),
            db_1.prisma.user.count({ where: { organizationId: id, isActive: true } }),
            db_1.prisma.asset.count({ where: { organizationId: id } }),
            db_1.prisma.asset.count({ where: { organizationId: id, status: 'ACTIVE' } }),
            db_1.prisma.asset.count({
                where: {
                    organizationId: id,
                    status: { in: ['INACTIVE', 'UNDER_MAINTENANCE'] }
                }
            }),
            db_1.prisma.workOrder.count({ where: { organizationId: id } }),
            db_1.prisma.workOrder.count({
                where: {
                    organizationId: id,
                    status: { in: ['OPEN', 'IN_PROGRESS'] }
                }
            }),
            db_1.prisma.workOrder.count({
                where: {
                    organizationId: id,
                    status: { in: ['OPEN', 'IN_PROGRESS'] },
                    dueDate: { lt: new Date() }
                }
            }),
            db_1.prisma.workOrder.count({
                where: {
                    organizationId: id,
                    status: 'COMPLETED'
                }
            })
        ]);
        const stats = {
            users: {
                total: totalUsers,
                active: activeUsers,
                inactive: totalUsers - activeUsers
            },
            assets: {
                total: totalAssets,
                active: activeAssets,
                offline: offlineAssets,
                underMaintenance: await db_1.prisma.asset.count({
                    where: { organizationId: id, status: 'UNDER_MAINTENANCE' }
                })
            },
            workOrders: {
                total: totalWorkOrders,
                open: openWorkOrders,
                overdue: overdueWorkOrders,
                completed: completedWorkOrders,
                completionRate: totalWorkOrders > 0 ? (completedWorkOrders / totalWorkOrders) * 100 : 0
            }
        };
        res.json({
            success: true,
            data: stats
        });
    }
    catch (error) {
        console.error('Error fetching organization stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch organization statistics',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
});
exports.default = router;
//# sourceMappingURL=organizations.js.map