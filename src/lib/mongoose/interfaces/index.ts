import mongoose from "mongoose";

export interface DatabaseConfig {
  url: string;
  options: mongoose.ConnectOptions;
}
