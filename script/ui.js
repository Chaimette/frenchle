import { GameConfig } from "./config.js";
import { GameState } from "./gameState.js";
import { GameController } from "./gameController.js";

export const UI = {
  elements: {
    guessedWord: document.getElementById("guessed-word"),
    attempts: document.querySelector(".attempts"),
    score: document.querySelector(".score"),
    table: document.getElementById("word-grid"),
    submitButton: document.getElementById("submit-button"),
    wordLength: document.getElementById("word-length"),
  },

  updateWordLength(length) {
    if (this.elements.wordLength) {
      this.elements.wordLength.textContent = `Word length: ${length} letters`;
    }
  },

  updateAttempts() {
    this.elements.attempts.textContent = `Attempts left: ${
      GameConfig.MAX_ATTEMPTS - GameState.attempts
    }`;
  },

  updateScore() {
    const baseScore =
      GameState.secretWord.length * GameConfig.SCORE.BASE_PER_LETTER;
    const attemptsBonus =
      (GameConfig.MAX_ATTEMPTS - GameState.attempts + 1) *
      GameConfig.SCORE.BONUS_PER_ATTEMPT_LEFT;
    const totalScore = baseScore + attemptsBonus;

    const existingScore = parseInt(localStorage.getItem("totalScore") || "0");
    const newTotalScore = existingScore + totalScore;

    // localStorage.setItem("totalScore", newTotalScore.toString());

    this.elements.score.textContent = `Score: ${newTotalScore}`;
  },

  createGrid(wordLength) {
    const table = this.elements.table;
    table.innerHTML = "";

    if (!table) {
      console.error("Table element not found when creating grid");
      return;
    }

    console.log(
      `Creating grid with ${GameConfig.MAX_ATTEMPTS} rows and ${wordLength} columns`
    );

    for (let i = 0; i < GameConfig.MAX_ATTEMPTS; i++) {
      const row = table.insertRow();
      row.dataset.rowIndex = i;

      for (let j = 0; j < wordLength; j++) {
        const cell = row.insertCell();
        const input = document.createElement("input");
        input.type = "text";
        input.maxLength = 1;
        input.className = "letter-input";
        input.dataset.row = i;
        input.dataset.col = j;


        input.addEventListener("input", function (e) {
          this.value = this.value.toUpperCase();
          if (this.value.length === 1 && j < wordLength - 1) {
            const nextInput = row.cells[j + 1].querySelector("input");
            nextInput.focus();
          }
        });

        input.addEventListener("keydown", function (e) {
          if (e.key === "Enter" && !GameState.gameOver) {
            GameController.checkGuess(parseInt(this.dataset.row));
          } else if (e.key === "Backspace" && this.value === "" && j > 0) {
            const prevInput = row.cells[j - 1].querySelector("input");
            prevInput.focus();
          }
        });

        cell.appendChild(input);
      }
    }

    this.enableRow(0);
    this.focusFirstCellInRow(1);
  },

  enableRow(rowIndex) {
    const rows = this.elements.table.rows;
    for (let i = 0; i < rows.length; i++) {
      const inputs = rows[i].querySelectorAll("input");
      inputs.forEach((input, j) => {
        if (i === rowIndex) {
          input.disabled = false;
          if (j === 0) {
            const firstLetter = GameState.secretWord.charAt(0).toUpperCase();
            input.value = firstLetter;
            input.setAttribute("readonly", true);
          } else {
            input.value = "";
            input.removeAttribute("readonly");
          }
        } else {
          input.disabled = true;
        }
      });
    }
  },

  focusFirstCellInRow(rowIndex) {
    setTimeout(() => {
      try {
        const table = this.elements.table;
        if (table && table.rows && table.rows.length > rowIndex) {
          const row = table.rows[rowIndex];
          if (row && row.cells && row.cells.length > 1) {
            const firstInput = row.cells[1].querySelector("input");
            if (firstInput) {
              firstInput.focus();
            } else {
              console.warn(
                `No input found in the first cell of row ${rowIndex}`
              );
            }
          } else {
            console.warn(`Row ${rowIndex} has no cells`);
          }
        } else {
          console.warn(
            `Row ${rowIndex} not found, table has ${
              table ? (table.rows ? table.rows.length : 0) : 0
            } rows`
          );
        }
      } catch (e) {
        console.warn(`Could not focus first cell in row ${rowIndex}:`, e);
      }
    }, 100); // Delay to ensure the DOM is updated
  },
};
