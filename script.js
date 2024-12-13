const canvas = document.getElementById('paintCanvas');
const ctx = canvas.getContext('2d');
const darkModeToggle = document.getElementById('darkModeToggle');

// Set canvas size and disable resizing
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Initialize drawing state
let painting = false;
let brushColor = document.getElementById('colorPicker').value;
let brushSize = document.getElementById('brushSize').value;

// Stack for undo and redo (max 5 steps)
let undoStack = [];
let redoStack = [];

// Maximum number of undo steps
const maxUndoRedoSteps = 11;

// Variable to store the previous state (for resizing purposes)
let savedState = ctx.createImageData(canvas.width, canvas.height);

// Save the current state of the canvas to the undo stack
function saveState() {
    const currentState = ctx.getImageData(0, 0, canvas.width, canvas.height);

    // If the undo stack exceeds the max limit, remove the oldest state
    if (undoStack.length >= maxUndoRedoSteps) {
        undoStack.shift();
    }

    undoStack.push(currentState);
    redoStack = []; // Clear the redo stack after new drawing
    savedState = currentState; // Save the current state to restore later
}

// Initialize the canvas by saving the initial empty state
saveState();  // Save the initial state for the first stroke

// Start drawing
canvas.addEventListener('mousedown', startPosition);
canvas.addEventListener('mouseup', stopPosition);
canvas.addEventListener('mousemove', draw);

function startPosition(e) {
    painting = true;
    draw(e);  // Draw a dot where the mouse is pressed
}

function stopPosition() {
    painting = false;
    ctx.beginPath();  // Begin a new path so lines don't connect
    saveState();  // Save the canvas state after each stroke
}

function draw(e) {
    if (!painting) return;

    const { x, y } = getMousePos(e);  // Get corrected mouse position

    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.strokeStyle = brushColor;

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();  // Start a new path after each stroke
    ctx.moveTo(x, y);
}

// Fix cursor offset by getting the mouse position relative to the canvas
function getMousePos(e) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
    };
}

// Change brush color and size
document.getElementById('colorPicker').addEventListener('input', (e) => {
    brushColor = e.target.value;
});

document.getElementById('brushSize').addEventListener('input', (e) => {
    brushSize = e.target.value;
});

// Clear canvas
document.getElementById('clearBtn').addEventListener('click', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    undoStack = []; // Clear undo stack when clearing the canvas
    redoStack = []; // Clear redo stack
});

// Save canvas as image
document.getElementById('saveBtn').addEventListener('click', () => {
    const image = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = image;
    link.download = 'drawing.png';
    link.click();
});

// Dark Mode Toggle Functionality
darkModeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    darkModeToggle.textContent = document.body.classList.contains('dark-mode') ? 'Light Mode' : 'Dark Mode';
});

// Undo function
function undo() {
    if (undoStack.length > 1) {  // Ensure there is at least one state to undo
        const lastState = undoStack.pop();
        redoStack.push(lastState);  // Save the current state to redo stack

        // Cap the redo stack at the max limit
        if (redoStack.length > maxUndoRedoSteps) {
            redoStack.shift();  // Remove the oldest state if the redo stack exceeds the limit
        }

        const prevState = undoStack[undoStack.length - 1];  // Get the previous state
        ctx.putImageData(prevState, 0, 0);
        saveState();
    }
}

// Redo function
function redo() {
    if (redoStack.length > 0) {
        const lastState = redoStack.pop();
        undoStack.push(lastState);  // Save the current state to undo stack

        // Cap the undo stack at the max limit
        if (undoStack.length > maxUndoRedoSteps) {
            undoStack.shift();  // Remove the oldest state if the undo stack exceeds the limit
        }

        ctx.putImageData(lastState, 0, 0);
        saveState();
    }
}

// Event listener for undo (Ctrl + Z)
window.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'z') {
        e.preventDefault(); // Prevent default browser undo behavior
        undo();
    }
});

// Event listener for redo (Ctrl + Y)
window.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'y') {
        e.preventDefault(); // Prevent default redo behavior
        redo();
    }
});

// Resize the canvas and preserve the content
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Re-render the previous content after resize
    ctx.putImageData(savedState, 0, 0); // Restore the previous drawing after resizing
});

// Add event listener for the beforeunload event to show a confirmation dialog
window.addEventListener('beforeunload', (event) => {
    // Custom message to warn the user
    const message = "Are you sure? Unsaved changes will be cleared.";

    // Standard way to set up the message for most browsers
    event.returnValue = message; 

    // Some browsers still use `return` for the message
    return message; 
});
