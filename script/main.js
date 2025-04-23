import { UI } from "./ui.js";
import { GameState } from "./gameState.js";
import { GameController } from "./gameController.js";
import { DictionaryService } from "./dictionaryService.js";
document.addEventListener("DOMContentLoaded", async function () {
  try {
    await DictionaryService.loadDictionary();
    GameController.initializeGame();
    GameController.refreshAtMidnight();
  } catch (error) {
    console.error("Failed to load dictionary on startup:", error);
    alert("The game could not load. Please try refreshing the page.");
  }

  UI.elements.submitButton.addEventListener("click", function () {
    const activeRow = Array.from(UI.elements.table.rows).findIndex((row) => {
      return !row.querySelector("input").disabled;
    });

    if (activeRow !== -1 && !GameState.gameOver) {
      GameController.checkGuess(activeRow);
    }
  });

  //TODO ADD RESTART BUTTON EVENT LISTENER TO RESTART GAME
});
