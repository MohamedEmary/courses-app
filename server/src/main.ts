// Bootstrap: create the app, connect to MongoDB, then listen.
import { createApp } from "@/app.ts";
import { connectDB } from "@/utils/db.ts";
import { loadEnvVar } from "@/utils/loadEnvVar.ts";

const app = createApp();
const PORT = loadEnvVar("PORT", "3000");

await connectDB(loadEnvVar("MONGODB_URI"))
  .then(() => console.log("Connection Established Successfully."))
  .catch((e) => {
    console.log("Connection Failed With Error:", e);
    // Terminate the process with a failure code
    process.exit(1);
  });

app.listen(PORT, () => {
  console.log("App Running On Port", PORT);
});
