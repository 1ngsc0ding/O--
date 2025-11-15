export function displayScore(ctx, dtwResult, advice=null) {
  // Handle both old format (number) and new format (object)
  let similarity, score, finalAdvice;
  if (typeof dtwResult === 'object' && dtwResult !== null) {
    similarity = dtwResult.similarity || (100 - dtwResult.normalizedScore);
    score = dtwResult.score;
    finalAdvice = dtwResult.advice || advice;
  } else {
    // Legacy format - convert old score to similarity
    similarity = Math.max(0, 100 - (dtwResult / 100));
    score = dtwResult;
    finalAdvice = advice;
  }
  
  // Handle invalid/Infinity scores
  if (!isFinite(similarity) || isNaN(similarity)) {
    similarity = 0;
  }
  similarity = Math.max(0, Math.min(100, similarity));
  
  const threshold = 75; // Similarity threshold (balanced: strict enough to reject wrong poses, lenient enough for correct pose)
  const isMatch = similarity >= threshold;
  
  // Larger, more visible text
  ctx.fillStyle = isMatch ? "#00FF00" : "#FF0000";
  ctx.font = "bold 40px Arial";
  ctx.fillText(`Similarity: ${similarity.toFixed(1)}%`, 30, 60);
  
  ctx.font = "bold 36px Arial";
  ctx.fillText(isMatch ? "Matched ✅" : "Try again ❌", 30, 110);

  // Display advice when pose is incorrect
  if (!isMatch) {
    let y = 160;
    ctx.font = "bold 28px Arial";
    ctx.fillStyle = "#FFFF00";
    
    if (finalAdvice && Object.keys(finalAdvice).length > 0) {
      ctx.fillText("คำแนะนำ:", 30, y);
      y += 40;
      ctx.font = "24px Arial";
      let hasAdvice = false;
      for (let joint in finalAdvice) {
        if (finalAdvice[joint] && finalAdvice[joint] !== "ตำแหน่งดีแล้ว") {
          ctx.fillText(`${joint}: ${finalAdvice[joint]}`, 30, y);
          y += 35;
          hasAdvice = true;
        }
      }
      if (!hasAdvice) {
        ctx.fillText("ปรับปรุงท่าทางให้ตรงกับเทมเพลต", 30, y);
      }
    } else {
      ctx.fillText("กำลังรวบรวมข้อมูล...", 30, y);
    }
  }
}
