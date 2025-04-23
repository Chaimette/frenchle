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
            // Always display the first letter of the secret word // MIGHT CHANGE THAT LATER
            const firstLetter = GameState.secretWord.charAt(0).toUpperCase();
            input.value = firstLetter;
            input.setAttribute("readonly", true);
          } else {
            // Display correctly guessed letters from previous rows
            const correctLetter = Array.from(rows)
              .slice(0, rowIndex)
              .map((row) => row.cells[j].querySelector("input"))
              .find(
                (prevInput) =>
                  prevInput && prevInput.classList.contains("correct")
              );

            if (correctLetter) {
              input.value = correctLetter.value; // Set the correct letter
              input.dataset.prefilled = "true";
            } else {
              input.value = ""; // Clear the input if no correct letter
              input.dataset.prefilled = "false";
            }

            input.removeAttribute("readonly");
            this.setupInputListener(input, j, rowIndex);
          }
        } else {
          input.disabled = true;
        }
      });
    }

    // Focus on the first empty cell
    this.focusFirstCellInRow(rowIndex);
  },

  // New method to set up proper input handling
  setupInputListener(input, colIndex, rowIndex) {
    // Remove existing listeners first to avoid duplicates
    const newInput = input.cloneNode(true);
    //remplace l'og avec le clone
    input.parentNode.replaceChild(newInput, input);
    //on redirige vers l'input cloné
    input = newInput;

    const wordLength = GameState.secretWord.length;
    const row = this.elements.table.rows[rowIndex];

    input.addEventListener("focus", function () {
      // Sélectionne la lettre correcte pré-remplie (surlignée en bleu)
      if (this.dataset.prefilled === "true") {
        this.select();
      }
    });

    input.addEventListener("input", function (e) {
      this.value = this.value.toUpperCase();

      // If this was a pre-filled field, we've now changed it
      if (this.dataset.prefilled === "true") {
        this.dataset.prefilled = "changed";
      }

      if (this.value.length === 1 && colIndex < wordLength - 1) {
        const nextInput = row.cells[colIndex + 1].querySelector("input");
        nextInput.focus();
      }
    });

    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && !GameState.gameOver) {
        GameController.checkGuess(rowIndex);
      } else if (e.key === "Backspace" && this.value === "" && colIndex > 0) {
        const prevInput = row.cells[colIndex - 1].querySelector("input");
        prevInput.focus();
      } else if (
        this.dataset.prefilled === "true" &&
        e.key.length === 1 &&
        e.key.match(/[a-zA-Z]/)
      ) {
        // If this is a pre-filled field and user types a letter,
        // clear the field first so the new letter replaces the old one
        this.value = "";
        this.dataset.prefilled = "changed";
      }
    });

    return input;
  },
  focusFirstCellInRow(rowIndex) {
    setTimeout(() => {
      try {
        const table = this.elements.table;
        if (table && table.rows && table.rows.length > rowIndex) {
          const row = table.rows[rowIndex];
          if (row && row.cells) {
            const firstEditableInput = Array.from(row.cells)
              .map((cell) => cell.querySelector("input"))
              .find((input) => input && input.value === "");
            if (firstEditableInput) {
              firstEditableInput.focus();
            } else {
              console.warn(
                `No input found in the second cell of row ${rowIndex}`
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
        console.warn(`Could not focus second cell in row ${rowIndex}:`, e);
      }
    }, 100); // Delay to ensure the DOM is updated
  },
};
