import fs from "fs";

export const getQuotesData = () => {
  try {
    const data = fs.readFileSync("./data/quotes.json", "utf8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading data.json file:", err);
    throw new Error("Failed to read quiz data");
  }
};