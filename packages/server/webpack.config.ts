import path from "path";
import dotenv from "dotenv";

dotenv.config();
const inProduction = process.env.NODE_ENV === "production";

export default {
  context: path.resolve(__dirname, "./ts"),
  entry: "./main.ts",
  devtool: inProduction ? "source-map" : "inline-source-map",
  name: `Kaetram Server`,
  mode: process.env.NODE_ENV as "development" | "production",
  module: {
    rules: [
      {
        test: /\.ts$/i,
        use: "babel-loader",
        exclude: /(node_modules|bower_components)/
      }
    ]
  },
  resolve: {
    extensions: [".ts", ".js", ".json"]
  },
  output: {
    filename: "[name].js",
    path: path.resolve(__dirname, "./dist")
  }
}

