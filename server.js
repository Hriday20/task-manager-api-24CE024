const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();

const Task = require("./models/Task");

const app = express();
const PORT = process.env.PORT || 5003;

// Parse JSON request bodies
app.use(express.json());

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB Connected");
  })
  .catch((err) => {
    console.error("MongoDB Connection Error:", err);
  });

// Global Request Logging Middleware
app.use((req, res, next) => {
  console.log(
    `${req.method} ${req.url} - ${new Date().toISOString()}`
  );
  next();
});

// Content-Type Middleware for POST and PUT
app.use((req, res, next) => {
  if (req.method === "POST" || req.method === "PUT") {
    if (!req.is("application/json")) {
      return res.status(400).json({
        error: "Content-Type must be application/json",
      });
    }
  }

  next();
});

// Home Route
app.get("/", (req, res) => {
  res.status(200).json({
    message: "Task Manager API is running!",
  });
});

// GET All Tasks
app.get("/tasks", async (req, res, next) => {
  try {
    const tasks = await Task.find();

    res.status(200).json(tasks);
  } catch (err) {
    next(err);
  }
});

// GET Single Task
app.get("/tasks/:id", async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        message: "Task not found",
      });
    }

    res.status(200).json(task);
  } catch (err) {
    next(err);
  }
});

// POST Create Task
app.post("/tasks", async (req, res, next) => {
  try {
    const task = await Task.create({
      title: req.body.title,
      description: req.body.description,
      completed: req.body.completed,
      priority: req.body.priority,
    });

    res.status(201).json(task);
  } catch (err) {
    next(err);
  }
});

// PUT Update Task
app.put("/tasks/:id", async (req, res, next) => {
  try {
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      {
        title: req.body.title,
        description: req.body.description,
        completed: req.body.completed,
        priority: req.body.priority,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!task) {
      return res.status(404).json({
        message: "Task not found",
      });
    }

    res.status(200).json(task);
  } catch (err) {
    next(err);
  }
});

// DELETE Task
app.delete("/tasks/:id", async (req, res, next) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);

    if (!task) {
      return res.status(404).json({
        message: "Task not found",
      });
    }

    res.status(200).json({
      message: "Task deleted successfully",
      task,
    });
  } catch (err) {
    next(err);
  }
});

// 404 Handler for Undefined Routes
app.use((req, res) => {
  res.status(404).json({
    error: "Route not found",
    path: req.originalUrl,
  });
});

// Global Error Handler - Must Be Last
app.use((err, req, res, next) => {
  console.error(err);

  // Mongoose Validation Error
  if (err.name === "ValidationError") {
    return res.status(400).json({
      error: "Validation failed",
      details: Object.values(err.errors).map(
        (error) => error.message
      ),
    });
  }

  // Invalid MongoDB ObjectId
  if (err.name === "CastError") {
    return res.status(400).json({
      error: "Invalid task ID",
    });
  }

  // Other Errors
  res.status(500).json({
    error: "Something went wrong",
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});