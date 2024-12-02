import express from "express";
import cors from "cors";
import { getQuotesData } from "./quotes.js";
import path from "path";
import axios from "axios";
import dotenv from "dotenv";


dotenv.config();
const app = express();
const __dirname = path.resolve();

app.use("/public", express.static(path.join(__dirname, "public")));
app.use(cors());
app.use(express.json());


app.get("/quotes", (_req, res) => {
  try {
    const data = getQuotesData();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const RAPIDAPI_HOST = "yahoo-finance166.p.rapidapi.com";
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const FMP_API_KEY = process.env.FMP_API_KEY;

// Route for Financial Summary
app.get("/financial-summary/:ticker", async (req, res) => {
    const { ticker } = req.params;
  
    try {
      console.log("Fetching data for ticker:", ticker);
      console.log("FMP API Key:", FMP_API_KEY);
  
      const response = await axios.get(
        `https://financialmodelingprep.com/api/v3/quote/${ticker}?apikey=${FMP_API_KEY}`
      );
  
      console.log("API Response:", response.data);
  
      const data = response.data[0];
      if (!data) {
        return res.status(404).json({ error: `No financial data found for ticker: ${ticker}` });
      }
  
      const formattedData = {
        price: data.price,
        changesPercentage: `${data.changesPercentage}%`,
        change: data.change,
        dayRange: `${data.dayLow} - ${data.dayHigh}`,
        yearRange: `${data.yearLow} - ${data.yearHigh}`,
        marketCap: data.marketCap,
        priceAvg50: data.priceAvg50,
        priceAvg200: data.priceAvg200,
        exchange: data.exchange,
        volume: data.volume,
        avgVolume: data.avgVolume,
        open: data.open,
        previousClose: data.previousClose,
        eps: data.eps,
        peRatio: data.pe,
        earningsDate: data.earningsAnnouncement || "N/A",
        sharesOutstanding: data.sharesOutstanding,
      };
  
      res.json(formattedData);
    } catch (error) {
      console.error("Error fetching financial summary:", error.message);
      console.error("Error details:", error.response?.data);
      res.status(500).json({ error: "Failed to fetch financial summary. Please try again later." });
    }
  });
  
// Route for Stock Data (Yahoo Finance API)
app.get("/chart/:ticker", async (req, res) => {
    const ticker = req.params.ticker.toUpperCase();
  
    try {
      const response = await axios.get(
        `https://${RAPIDAPI_HOST}/api/stock/get-chart`,
        {
          params: {
            region: "US",
            range: "1d",
            symbol: ticker,
            interval: "5m",
          },
          headers: {
            "x-rapidapi-host": RAPIDAPI_HOST,
            "x-rapidapi-key": RAPIDAPI_KEY,
          },
        }
      );
  
      if (!response.data || Object.keys(response.data).length === 0) {
        return res
          .status(404)
          .json({ error: `No chart data available for ticker: ${ticker}` });
      }
      res.json(response.data);
    } catch (error) {
      console.error(`Error fetching chart data for ${ticker}:`, error.message);
      res.status(500).json({
        error: "Failed to fetch chart data. Please try again later.",
      });
    }
  });
  

// Route for Stock News (Yahoo Finance API)
app.get("/news/:symbols", async (req, res) => {
  const symbols = req.params.symbols;
  try {
    const response = await axios.get(
      `https://${RAPIDAPI_HOST}/api/news/list-by-symbol`,
      {
        params: {
          s: symbols,
          region: "US",
          snippetCount: 100,
        },
        headers: {
          "x-rapidapi-host": RAPIDAPI_HOST,
          "x-rapidapi-key": RAPIDAPI_KEY,
        },
      }
    );

    if (!response.data || Object.keys(response.data).length === 0) {
      return res.status(404).json({ error: "No news available for the given symbols." });
    }

    
    res.json(response.data);
  } catch (error) {
    console.error("Error fetching stock news:", error.message);
    res.status(500).json({ error: "Failed to fetch stock news. Please try again later." });
  }
});
app.post("/chat", async (req, res) => {
    const { prompt } = req.body;
  
 
    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return res.status(400).json({ error: "Invalid prompt input." });
    }
  
    try {
      
      const response = await axios.post(
        "https://api.cohere.ai/v1/generate", 
        {
          model: "command-xlarge", 
          prompt: prompt, 
          max_tokens: 250, 
          temperature: 0.7, 
          k: 0, 
          p: 0.75, 
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.COHERE_API_KEY}`,
            "Content-Type": "application/json",
            "Cohere-Version": "2022-12-06", 
          },
        }
      );
  
      if (!response.data || !response.data.generations || response.data.generations.length === 0) {
        console.error("Invalid Cohere API response:", response.data);
        throw new Error("Cohere API did not return a valid response.");
      }
  
      const generatedText = response.data.generations[0]?.text || "No response generated.";
      res.json({ response: generatedText });
    } catch (error) {
      console.error("Error communicating with Cohere API:", error.message, error.response?.data);
      res.status(500).json({ error: "Failed to fetch response from Cohere API. Please try again later." });
    }
  });
  
  app.listen(4000, () => {
    console.log("Server is running on port 4000");
  })