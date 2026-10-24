const express = require("express");
const cors = require("cors");

const Task = require("./models/Task");
const authRoutes = require("./routes/auth");
const authMiddleware = require("./middleware/auth");
const validateTask = require("./middleware/validateTask");
const cache = require("./cache");
const taskEvents = require("./events");

// Register event listeners
require("./listeners");

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Logging Middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url} - ${new Date().toISOString()}`);
  next();
});

// Authentication Routes
app.use("/auth", authRoutes);

// Home Route
app.get("/", (req, res) => {
  res.status(200).json({
    message: "Task Manager API is running!",
  });
});

// GET All Tasks
app.get("/tasks", authMiddleware, async (req, res, next) => {
  try {
    const cachedTasks = cache.get("all_tasks");

    if (cachedTasks !== undefined) {
      console.log("Cache HIT: all_tasks");
      return res.status(200).json(cachedTasks);
    }

    console.log("Cache MISS: all_tasks");

    const tasks = await Task.find();
    cache.set("all_tasks", tasks);

    res.status(200).json(tasks);
  } catch (err) {
    next(err);
  }
});

// GET Task By ID
app.get("/tasks/:id", authMiddleware, async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.status(200).json(task);
  } catch (err) {
    next(err);
  }
});

// POST Task
app.post(
  "/tasks",
  authMiddleware,
  validateTask,
  async (req, res, next) => {
    try {
      const newTask = await Task.create(req.body);

      cache.del("all_tasks");

      console.log(`[API] Task response sent at ${new Date().toISOString()}`);
      res.status(201).json(newTask);

      taskEvents.emit("task-created", {
        title: newTask.title,
        assignedUser:
          newTask.assignedUser ||
          newTask.userId ||
          newTask.user ||
          "Not assigned",
        taskId: newTask._id,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      if (!res.headersSent) {
        next(err);
      } else {
        console.error("[Task Event Error]", err);
      }
    }
  }
);

// PUT Task
app.put("/tasks/:id", authMiddleware, async (req, res, next) => {
  try {
    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedTask) {
      return res.status(404).json({ message: "Task not found" });
    }

    cache.del("all_tasks");
    res.status(200).json(updatedTask);
  } catch (err) {
    next(err);
  }
});

// DELETE Task
app.delete("/tasks/:id", authMiddleware, async (req, res, next) => {
  try {
    const deletedTask = await Task.findByIdAndDelete(req.params.id);

    if (!deletedTask) {
      return res.status(404).json({ message: "Task not found" });
    }

    cache.del("all_tasks");

    res.status(200).json({ message: "Task deleted successfully" });

    taskEvents.emit("task-deleted", {
      title: deletedTask.title,
      taskId: deletedTask._id,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    if (!res.headersSent) {
      next(err);
    } else {
      console.error("[Task Deletion Event Error]", err);
    }
  }
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    error: "Route not found",
    path: req.originalUrl,
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err);

  if (res.headersSent) {
    return next(err);
  }

  if (err.name === "ValidationError") {
    return res.status(400).json({
      error: "Validation failed",
      details: Object.values(err.errors).map((error) => error.message),
    });
  }

  if (err.code === 11000) {
    return res.status(409).json({
      error: "Duplicate value",
      message: "A user with this email already exists",
    });
  }

  if (err.name === "CastError") {
    return res.status(400).json({ error: "Invalid task ID" });
  }

  res.status(500).json({ error: "Something went wrong" });
});

module.exports = app;