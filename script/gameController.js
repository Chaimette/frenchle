import { GameState } from "./gameState.js";
import { GameConfig } from "./config.js";
import { UI } from "./ui.js";
import { DictionaryService } from "./dictionaryService.js";
import { WordUtils } from "./wordUtils.js";

export const GameController = {
  initializeGame() {
    GameState.initialize();

    GameState.getDailySecretWord()
      .then((word) => {
        GameState.secretWord = word;
        // console.log("Today's word:", GameState.secretWord);
        UI.updateWordLength(GameState.secretWord.length);
        UI.createGrid(GameState.secretWord.length);
        UI.updateAttempts();
      })
      .catch((error) => {
        console.error("Error initializing game:", error);
        GameState.secretWord = GameConfig.DEFAULT_WORD;
        UI.updateWordLength(GameState.secretWord.length);
        UI.createGrid(GameState.secretWord.length);
        UI.updateAttempts();
      });
  },

  refreshAtMidnight() {
    const now = new Date();
    const msUntilMidnight =
      new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime() -
      now.getTime();
    setTimeout(() => window.location.reload(), msUntilMidnight + 1000); // +1s to avoid timing issues
  },

  async checkGuess(rowIndex) {
    const row = UI.elements.table.rows[rowIndex];
    const inputs = row.querySelectorAll("input");
    let guess = "";

    inputs.forEach((input) => {
      guess += input.value;
    });

    guess = guess.toUpperCase();

    if (guess.length !== GameState.secretWord.length) {
      alert("Please fill in all the letters before submitting.");
      return;
    }

    const isValid = await DictionaryService.isValidWord(guess);

    if (!isValid) {
      alert("This is not a valid French word. Please try again.");
      return;
    }

    const normalizedGuess = WordUtils.normalize(guess);
    const normalizedSecret = WordUtils.normalize(GameState.secretWord);

    let correct = 0;
    for (let i = 0; i < GameState.secretWord.length; i++) {
      const input = inputs[i];
      if (normalizedGuess[i] === normalizedSecret[i]) {
        input.classList.add("correct");
        correct++;
      } else if (normalizedSecret.includes(normalizedGuess[i])) {
        input.classList.add("present");
      } else {
        input.classList.add("absent");
      }
    }

    GameState.attempts++;
    UI.updateAttempts();

    if (correct === GameState.secretWord.length) {
      alert("Congratulations! You've guessed the word!");
      GameState.gameOver = true;
      UI.updateScore();
    } else if (GameState.attempts >= GameConfig.MAX_ATTEMPTS) {
      alert(`Game over! The word was ${GameState.secretWord}`);
      GameState.gameOver = true;
    } else {
      UI.enableRow(rowIndex + 1);
      UI.focusFirstCellInRow(rowIndex + 1);
    }

    // GameState.saveState();
  },
};
