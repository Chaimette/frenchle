import { DictionaryService } from "./dictionaryService.js";

export const GameState = {
  secretWord: "",
  attempts: 0,
  gameOver: false,

  initialize() {
    this.secretWord = "";
    this.attempts = 0;
    this.gameOver = false;
  },

  getDailySecretWord() {
    const today = new Date().toISOString().split("T")[0];
    const saved = JSON.parse(
      localStorage.getItem("dailyWord") || '{"date":"","word":""}'
    );

    if (saved && saved.date === today && saved.word) {
      console.log("Using saved word from localStorage");
      return Promise.resolve(saved.word.toUpperCase());
    }

    const word = DictionaryService.getRandomWord();
    localStorage.setItem("dailyWord", JSON.stringify({ date: today, word }));
    console.log("Generated new word for today");
    return Promise.resolve(word);
  },

  saveState() {
    // localStorage.setItem("gameState", JSON.stringify({
    //   secretWord: this.secretWord,
    //   attempts: this.attempts,
    //   gameOver: this.gameOver
    // }));
  },

  loadState() {
    // const savedState = localStorage.getItem("gameState");
    // if (!savedState) return false;
    // try {
    //   const state = JSON.parse(savedState);
    //   this.secretWord = state.secretWord;
    //   this.attempts = state.attempts;
    //   this.gameOver = state.gameOver;
    //   return true;
    // } catch (e) {
    //   console.error("Error loading game state:", e);
    //   return false;
    // }
  },
};
