const params = new URLSearchParams(window.location.search);
const mode = params.get("mode") || "Cash Game";
const stake = params.get("stake") || "25";
const roomCode = document.getElementById("room-code");
const copyRoomCode = document.getElementById("copy-room-code");

document.getElementById("game-mode").textContent = mode;
document.getElementById("game-stakes").textContent = `Blindes ${stake}`;
roomCode.textContent = `BIN-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

copyRoomCode.addEventListener("click", async () => {
    try {
        await navigator.clipboard.writeText(roomCode.textContent);
    } catch {
        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(roomCode);
        selection.removeAllRanges();
        selection.addRange(range);
    }
    copyRoomCode.textContent = "Code copié";
    window.setTimeout(() => { copyRoomCode.textContent = "Copier le code"; }, 1600);
});
