# Calculator Project Plan

## Goal
Build a responsive, interactive calculator that runs in the browser.

## Scope
- Static frontend only; no backend, database, authentication, or external services.
- Use plain HTML, CSS, and JavaScript with no runtime dependencies.
- Support addition, subtraction, multiplication, division, percentage, square root, sign toggle, decimal input, clear, and delete-last-digit.
- Support chained calculations, keyboard input, and a visible calculation history.
- Provide light and dark themes and a responsive layout for desktop and mobile.
- Show clear feedback for invalid operations such as division by zero or the square root of a negative number.

## Acceptance criteria
- Core operations work with both calculator buttons and keyboard input.
- Chained operations produce correct results and can be continued from the displayed result.
- History reflects completed calculations and can be cleared.
- Theme and layout work at narrow and wide viewport sizes.
- The app can be opened locally without a build step or external service.

## Validation
- Manually exercise each operation, error state, keyboard interaction, history action, and theme toggle.
- Run any available project checks if the workspace provides them.
