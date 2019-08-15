const AWS = require("aws-sdk")
const env = require("./config/environment")
const {
  runTask,
  endTask,
  waitForTaskState,
  sendPayloadToTask,
  getRunningTaskIP,
  getProperty,
} = require("./util")

exports.handler = async function(event, context) {
  const ecs = new AWS.ECS(env.awsAuthParams)

  console.log("Starting the configured task...")

  try {
    const startedTask = await runTask(ecs, env.taskParams)
    const taskArn = getProperty(["tasks", 0, "taskArn"], startedTask)

    console.log(
      `Waiting for the task with arn: ${getProperty(
        ["tasks", 0, "taskArn"],
        startedTask,
      )} to be ready...`,
    )

    await waitForTaskState(
      ecs,
      "tasksRunning",
      env.taskParams.cluster,
      taskArn,
    )

    console.log("Task is running!")
    const taskIP = await getRunningTaskIP(ecs, env.taskParams.cluster, taskArn)
    const response = await sendPayloadToTask(taskIP, context)

    await endTask(ecs, env.taskParams.cluster, taskArn)
    
    return response
  } catch (error) {
    return error
  }
}