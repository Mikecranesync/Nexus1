"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const dotenv_1 = __importDefault(require("dotenv"));
const db_1 = require("./db");
// Route imports
const users_1 = __importDefault(require("./routes/users"));
const organizations_1 = __importDefault(require("./routes/organizations"));
const assets_1 = __importDefault(require("./routes/assets"));
const workOrders_1 = __importDefault(require("./routes/workOrders"));
const upload_1 = __importDefault(require("./routes/upload"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3002;
// Middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true
}));
app.use((0, morgan_1.default)('combined'));
app.use(express_1.default.json({ limit: process.env.MAX_UPLOAD_SIZE || '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: process.env.MAX_UPLOAD_SIZE || '10mb' }));
// Health check route
app.get('/api/health', async (req, res) => {
    try {
        // Test database connection
        await db_1.prisma.$queryRaw `SELECT 1`;
        res.json({
            status: 'OK',
            message: 'Nexus API is running',
            database: 'Connected',
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        res.status(500).json({
            status: 'ERROR',
            message: 'Database connection failed',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
});
// API Routes
app.use('/api/users', users_1.default);
app.use('/api/organizations', organizations_1.default);
app.use('/api/assets', assets_1.default);
app.use('/api/work-orders', workOrders_1.default);
app.use('/api/upload', upload_1.default);
// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Unhandled error:', error);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
});
// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint not found',
        path: req.originalUrl
    });
});
// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\nGracefully shutting down...');
    await db_1.prisma.$disconnect();
    process.exit(0);
});
process.on('SIGTERM', async () => {
    console.log('\nGracefully shutting down...');
    await db_1.prisma.$disconnect();
    process.exit(0);
});
app.listen(PORT, () => {
    console.log(`🚀 Nexus API server running on port ${PORT}`);
    console.log(`📊 Health check available at http://localhost:${PORT}/api/health`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});
//# sourceMappingURL=index.js.map