const mongoose = require("mongoose");
const { MONGO_URI } = require("../config/config");

const SLOW_MS = Number(process.env.MONGO_SLOW_LOG_MS);
const slowLogThresholdMs =
  Number.isFinite(SLOW_MS) && SLOW_MS >= 0 ? SLOW_MS : 200;

let slowMongoLoggingInstalled = false;

const installSlowMongoLogging = () => {
  if (slowLogThresholdMs <= 0 || slowMongoLoggingInstalled) return;
  slowMongoLoggingInstalled = true;

  const logIfSlow = (label, ms, detail) => {
    if (ms < slowLogThresholdMs) return;
    console.warn(`[mongo-slow] ${label} ${ms}ms`, detail);
  };

  const wrapExec = (proto, label, getDetail) => {
    if (proto._slowMongoExecWrapped) return;
    proto._slowMongoExecWrapped = true;
    const origExec = proto.exec;
    proto.exec = function (...args) {
      const start = Date.now();
      const out = origExec.apply(this, args);
      const finish = (result, isError) => {
        logIfSlow(label, Date.now() - start, getDetail.call(this));
        return isError ? Promise.reject(result) : result;
      };
      if (out && typeof out.then === "function") {
        return out.then(
          (res) => finish(res, false),
          (err) => finish(err, true),
        );
      }
      logIfSlow(label, Date.now() - start, getDetail.call(this));
      return out;
    };
  };

  wrapExec(mongoose.Query.prototype, "query", function detail() {
    return {
      op: this.op,
      model: this.model?.modelName,
      filter: this.getFilter?.(),
    };
  });

  wrapExec(mongoose.Aggregate.prototype, "aggregate", function detail() {
    const stages = typeof this.pipeline === "function" ? this.pipeline() : [];
    return {
      collection: this._model?.collection?.name,
      pipelineHead: stages.slice(0, 3),
    };
  });
};

installSlowMongoLogging();

const connectDB = async () => {
  try {
    mongoose.set("transactionAsyncLocalStorage", true);

    // Connection options for better reliability
    const options = {
      serverSelectionTimeoutMS: 10000, // 10 seconds timeout
      socketTimeoutMS: 45000, // 45 seconds socket timeout
      family: 4, // Use IPv4, skip trying IPv6
      retryWrites: true,
      w: "majority",
      // Small Atlas tiers (M5/Flex): keep pool modest to limit conn + RAM pressure
      maxPoolSize: Number(process.env.MONGO_MAX_POOL_SIZE) || 8,
      minPoolSize:
        Number.isFinite(Number(process.env.MONGO_MIN_POOL_SIZE)) &&
        Number(process.env.MONGO_MIN_POOL_SIZE) >= 0
          ? Number(process.env.MONGO_MIN_POOL_SIZE)
          : 0,
    };

    await mongoose.connect(MONGO_URI, options);
    console.log("DB connected");
  } catch (err) {
    console.log("Unable to connect DB", err);
    console.log("Error details:", {
      name: err.name,
      message: err.message,
      code: err.code,
    });

    // If DNS error, provide helpful message
    if (err.code === "ESERVFAIL" || err.name === "MongoServerSelectionError") {
      console.log("\n⚠️  DNS Resolution Error - Troubleshooting steps:");
      console.log("1. Check if MongoDB Atlas cluster is running");
      console.log("2. Verify MONGO_URI in environment variables");
      console.log("3. Check network connectivity");
      console.log("4. Verify IP is whitelisted in MongoDB Atlas");
      console.log(
        "5. Try using direct connection string (replace +srv:// with mongodb://)",
      );
    }

    // Exit process with failure
    process.exit(1);
  }
};

module.exports = connectDB;
