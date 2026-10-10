/**
 * Express Server for Multi Coding Agents with Single Shared History (MERN Stack).
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const cors = require('cors');
const { connectDB, getDBStatus } = require('./config/db');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB
connectDB();

// API Routes
app.use('/api', apiRoutes);

// Serve static frontend from client/dist or server/public
const clientDist = path.join(__dirname, '../client/dist');
const serverPublic = path.join(__dirname, 'public');

app.use(express.static(clientDist));
app.use(express.static(serverPublic));

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  const clientIndex = path.join(clientDist, 'index.html');
  const publicIndex = path.join(serverPublic, 'index.html');

  res.sendFile(clientIndex, (err) => {
    if (err) {
      res.sendFile(publicIndex, (err2) => {
        if (err2) {
          res.json({
            message: "Multi-Coding-Agents MERN API is running!",
            dbStatus: getDBStatus(),
            endpoints: [
              "POST /api/sessions",
              "GET  /api/sessions",
              "GET  /api/sessions/:id/history",
              "GET  /api/sessions/:id/files",
              "POST /api/sessions/:id/step",
              "POST /api/sessions/:id/run-all"
            ]
          });
        }
      });
    }
  });
});

app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 Multi Coding Agents (MERN) Server running on: http://localhost:${PORT}`);
  console.log(`🧠 Architecture: Bound Agents with Single Shared History`);
  console.log(`=======================================================`);
});
