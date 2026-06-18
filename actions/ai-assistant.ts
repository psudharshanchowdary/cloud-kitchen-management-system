"use server";

import { aiEngine } from "@/lib/ai-engine";

export async function queryAssistant(message: string): Promise<string> {
  try {
    return await aiEngine.handleChatQuery(message);
  } catch (error) {
    console.error("AI assistant query error", error);
    return "I apologize, but I encountered an error processing your query. Please try again.";
  }
}

export async function getDailySummaryReport() {
  try {
    return await aiEngine.generateDailySummary();
  } catch (error) {
    console.error("Failed to generate daily summary", error);
    return null;
  }
}
