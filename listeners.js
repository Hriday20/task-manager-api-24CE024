const taskEvents = require("./events");

taskEvents.on("task-created", (task) => {
  setTimeout(() => {
    try {
      console.log("\n========== TASK NOTIFICATION ==========");
      console.log(`Task Title: ${task.title}`);
      console.log(
        `Assigned User: ${task.assignedUser || "Not assigned"}`
      );
      console.log(
        `Notification Timestamp: ${new Date().toISOString()}`
      );
      console.log("=======================================\n");
    } catch (error) {
      taskEvents.emit("notification-error", error);
    }
  }, 2000);
});

taskEvents.on("task-deleted", (task) => {
  console.log(
    `[Task Deleted] "${task.title}" deleted at ${new Date().toISOString()}`
  );
});

// Handle notification errors
taskEvents.on("notification-error", (error) => {
  console.error(
    `[Notification Error] ${error.message}`,
    new Date().toISOString()
  );
});

module.exports = taskEvents;