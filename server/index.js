const express = require('express');
const connectDB = require('./config/db');
const cors = require('cors');

const app = express();

// Connect Database
connectDB();

// Init Middleware
app.use(express.json({ extended: false }));
app.use(cors());

app.get('/', (req, res) => res.send('API Running'));

// Routes
app.use('/api/common', require('./routes/common'));
app.use('/api/mongo/auth', require('./routes/mongoAuth'));
app.use('/api/employee', require('./routes/employeeMIS'));
app.use('/actions', require('./routes/actions'));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
