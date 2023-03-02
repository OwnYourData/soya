import { init } from "./server";

init();

const gracefulExit = () => {
  process.exit(0);
}
process.on('SIGTERM', gracefulExit);
process.on('SIGINT', gracefulExit);