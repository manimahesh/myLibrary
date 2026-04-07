const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const config = require('./config');
const authRoutes = require('./routes/auth');
const addressRoutes = require('./routes/address');
const paymentRoutes = require('./routes/payment');
const booksRoutes = require('./routes/books');
const wishlistRoutes = require('./routes/wishlist');
const bookSummaryRoutes = require('./routes/bookSummary');
const readBooksRoutes = require('./routes/readBooks');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/books', booksRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/summaries', bookSummaryRoutes);
app.use('/api/read-books', readBooksRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
});

module.exports = app;
