import express from 'express';
import { prisma } from '../db';
import { UserRole } from '@prisma/client';

const router = express.Router();

// GET /api/users - Get all users with optional filters
router.get('/', async (req, res) => {
  try {
    const { organizationId, role, isActive } = req.query;

    const where: any = {};
    if (organizationId) where.organizationId = organizationId as string;
    if (role) where.role = role as UserRole;
    if (isActive !== undefined) where.isActive = isActive === 'true';

    const users = await prisma.user.findMany({
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
  } catch (error) {
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

    const user = await prisma.user.findUnique({
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
  } catch (error) {
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
    const {
      email,
      name,
      givenName,
      familyName,
      picture,
      locale,
      googleId,
      role,
      organizationId
    } = req.body;

    // Validate required fields
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
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
      const organization = await prisma.organization.findUnique({
        where: { id: organizationId }
      });

      if (!organization) {
        return res.status(400).json({
          success: false,
          message: 'Invalid organization ID'
        });
      }
    }
    
    const user = await prisma.user.create({
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
  } catch (error) {
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
    const {
      name,
      givenName,
      familyName,
      picture,
      locale,
      role,
      isActive,
      organizationId
    } = req.body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
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
      const organization = await prisma.organization.findUnique({
        where: { id: organizationId }
      });

      if (!organization) {
        return res.status(400).json({
          success: false,
          message: 'Invalid organization ID'
        });
      }
    }

    const user = await prisma.user.update({
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
  } catch (error) {
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
    const {
      email,
      name,
      givenName,
      familyName,
      picture,
      locale,
      googleId
    } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Find existing user or create new one
    let user = await prisma.user.findUnique({
      where: { email },
      include: {
        organization: true
      }
    });

    if (user) {
      // Update existing user with latest info and login time
      user = await prisma.user.update({
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
    } else {
      // Create new user
      user = await prisma.user.create({
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
  } catch (error) {
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
    const existingUser = await prisma.user.findUnique({
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
      const workOrdersCount = await prisma.workOrder.count({
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

      await prisma.user.delete({
        where: { id }
      });

      res.json({
        success: true,
        message: 'User permanently deleted'
      });
    } else {
      // Soft delete
      await prisma.user.update({
        where: { id },
        data: { isActive: false }
      });

      res.json({
        success: true,
        message: 'User deactivated'
      });
    }
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user',
      error: process.env.NODE_ENV === 'development' ? error : {}
    });
  }
});

export default router;