export function displayScore(ctx, score, advice=null) {
  const threshold = 50;
  ctx.fillStyle = score < threshold ? "green" : "red";
  ctx.font = "25px Arial";
  ctx.fillText("Similarity: " + score.toFixed(2), 50, 50);
  ctx.fillText(score < threshold ? "Matched ✅" : "Try again ❌", 50, 80);

  if (advice) {
    let y = 120;
    ctx.font = "20px Arial";
    for (let joint in advice) {
      ctx.fillText(`${joint}: ${advice[joint]}`, 50, y);
      y += 25;
    }
  }
}
