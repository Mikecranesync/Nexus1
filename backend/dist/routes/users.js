"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const db_1 = require("../db");
const router = express_1.default.Router();
// GET /api/users - Get all users with optional filters
router.get('/', async (req, res) => {
    try {
        const { organizationId, role, isActive } = req.query;
        const where = {};
        if (organizationId)
            where.organizationId = organizationId;
        if (role)
            where.role = role;
        if (isActive !== undefined)
            where.isActive = isActive === 'true';
        const users = await db_1.prisma.user.findMany({
            where,
            include: {
                organization: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                _count: {
                    select: {
                        createdAssets: true,
                        assignedWorkOrders: true,
                        createdWorkOrders: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        res.json({
            success: true,
            data: users
        });
    }
    catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch users',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
});
// GET /api/users/:id - Get user by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const user = await db_1.prisma.user.findUnique({
            where: { id },
            include: {
                organization: true,
                createdAssets: {
                    select: {
                        id: true,
                        name: true,
                        type: true,
                        status: true,
                        location: true,
                        createdAt: true
                    }
                },
                assignedWorkOrders: {
                    select: {
                        id: true,
                        workOrderNumber: true,
                        title: true,
                        status: true,
                        priority: true,
                        dueDate: true
                    }
                },
                createdWorkOrders: {
                    select: {
                        id: true,
                        workOrderNumber: true,
                        title: true,
                        status: true,
                        createdAt: true
                    }
                },
                _count: {
                    select: {
                        createdAssets: true,
                        assignedWorkOrders: true,
                        createdWorkOrders: true,
                        workOrderComments: true
                    }
                }
            }
        });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        res.json({
            success: true,
            data: user
        });
    }
    catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch user',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
});
// POST /api/users - Create new user
router.post('/', async (req, res) => {
    try {
        const { email, name, givenName, familyName, picture, locale, googleId, role, organizationId } = req.body;
        // Validate required fields
        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required'
            });
        }
        // Check if user already exists
        const existingUser = await db_1.prisma.user.findUnique({
            where: { email }
        });
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'User with this email already exists'
            });
        }
        // Validate organization if provided
        if (organizationId) {
            const organization = await db_1.prisma.organization.findUnique({
                where: { id: organizationId }
            });
            if (!organization) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid organization ID'
                });
            }
        }
        const user = await db_1.prisma.user.create({
            data: {
                email,
                name,
                givenName,
                familyName,
                picture,
                locale,
                googleId,
                role: role || 'USER',
                organizationId,
                lastLoginAt: new Date()
            },
            include: {
                organization: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        });
        res.status(201).json({
            success: true,
            data: user,
            message: 'User created successfully'
        });
    }
    catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create user',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
});
// PUT /api/users/:id - Update user
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, givenName, familyName, picture, locale, role, isActive, organizationId } = req.body;
        // Check if user exists
        const existingUser = await db_1.prisma.user.findUnique({
            where: { id }
        });
        if (!existingUser) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        // Validate organization if provided
        if (organizationId) {
            const organization = await db_1.prisma.organization.findUnique({
                where: { id: organizationId }
            });
            if (!organization) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid organization ID'
                });
            }
        }
        const user = await db_1.prisma.user.update({
            where: { id },
            data: {
                name,
                givenName,
                familyName,
                picture,
                locale,
                role,
                isActive,
                organizationId
            },
            include: {
                organization: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        });
        res.json({
            success: true,
            data: user,
            message: 'User updated successfully'
        });
    }
    catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update user',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
});
// POST /api/users/login - Handle user login (create or update)
router.post('/login', async (req, res) => {
    try {
        const { email, name, givenName, familyName, picture, locale, googleId } = req.body;
        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required'
            });
        }
        // Find existing user or create new one
        let user = await db_1.prisma.user.findUnique({
            where: { email },
            include: {
                organization: true
            }
        });
        if (user) {
            // Update existing user with latest info and login time
            user = await db_1.prisma.user.update({
                where: { id: user.id },
                data: {
                    name: name || user.name,
                    givenName: givenName || user.givenName,
                    familyName: familyName || user.familyName,
                    picture: picture || user.picture,
                    locale: locale || user.locale,
                    googleId: googleId || user.googleId,
                    lastLoginAt: new Date()
                },
                include: {
                    organization: true
                }
            });
        }
        else {
            // Create new user
            user = await db_1.prisma.user.create({
                data: {
                    email,
                    name,
                    givenName,
                    familyName,
                    picture,
                    locale,
                    googleId,
                    lastLoginAt: new Date()
                },
                include: {
                    organization: true
                }
            });
        }
        res.json({
            success: true,
            data: user,
            message: user ? 'Login successful' : 'User created and logged in'
        });
    }
    catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({
            success: false,
            message: 'Login failed',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
});
// DELETE /api/users/:id - Delete user (soft delete by setting isActive to false)
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { permanent } = req.query;
        // Check if user exists
        const existingUser = await db_1.prisma.user.findUnique({
            where: { id }
        });
        if (!existingUser) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        if (permanent === 'true') {
            // Check for dependent records
            const workOrdersCount = await db_1.prisma.workOrder.count({
                where: {
                    OR: [
                        { assignedToId: id },
                        { createdById: id }
                    ]
                }
            });
            if (workOrdersCount > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot permanently delete user with associated work orders'
                });
            }
            await db_1.prisma.user.delete({
                where: { id }
            });
            res.json({
                success: true,
                message: 'User permanently deleted'
            });
        }
        else {
            // Soft delete
            await db_1.prisma.user.update({
                where: { id },
                data: { isActive: false }
            });
            res.json({
                success: true,
                message: 'User deactivated'
            });
        }
    }
    catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete user',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
});
exports.default = router;
//# sourceMappingURL=users.js.map