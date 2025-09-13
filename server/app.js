require('dotenv').config();
const express = require('express');
const cors = require("cors");
const bodyParser = require('body-parser');
const app = express();
const connectDB = require('./config/db');
const swaggerDocs = require('./docs/swagger');
const adminRoutes = require('./routes/admin.route');
const userRoutes = require('./routes/user.route');
const businessRoutes = require('./routes/business.route');
const partiesRoutes = require('./routes/parties.route');
const transactionRoutes = require('./routes/transaction.route');
const staffRoutes = require('./routes/staff.route');
const categoryRoutes = require('./routes/category.route');
const expenseRoutes = require('./routes/expense.route');
const budgetRoutes = require('./routes/budget.route');
const productRoutes = require('./routes/product.route');
const stockRoutes = require('./routes/stock.route');
const serviceRoutes = require('./routes/service.route');
const cashbookRoutes = require('./routes/cashbook.route');
const billingRoutes = require('./routes/billing.route');
const billingTermsRoutes = require('./routes/billingTerms.route');

// Middleware
swaggerDocs(app);
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increased limit for image uploads
app.use(express.urlencoded({ extended: true, limit: '50mb' })); // Increased limit for image uploads
app.use(bodyParser.json({ limit: '50mb' })); // Increased limit for image uploads

// Serve static files from uploads directory
app.use('/uploads', express.static('uploads', {
    setHeaders: (res, path) => {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    }
}));

// MongoDB Connection
connectDB();

// Routes
app.use('/api', adminRoutes);
app.use('/api', userRoutes);
app.use('/api', businessRoutes);
app.use('/api', partiesRoutes);
app.use('/api', transactionRoutes);
app.use('/api', staffRoutes);
app.use('/api', categoryRoutes);
app.use('/api', expenseRoutes);
app.use('/api', budgetRoutes);
app.use('/api', productRoutes);
app.use('/api', stockRoutes);
app.use('/api', serviceRoutes);
app.use('/api', cashbookRoutes);
app.use('/api', billingRoutes);
app.use('/api', billingTermsRoutes);

// Start the server
const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
