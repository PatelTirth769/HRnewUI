const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => res.send('Resume Parser Server Running'));

// Resume parser route
app.use('/resume-parser', require('./resume-parser/index'));

const PORT = process.env.PORT || 3636;

app.listen(PORT, () => console.log(`Resume Parser Server started on port ${PORT}`));
