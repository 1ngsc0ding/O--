export function computeDTW(userSequence, templateSequence) {
  const n = userSequence.length;
  const m = templateSequence.length;
  if (n === 0 || m === 0) return Infinity;

  const dtwMatrix = Array.from({length: n + 1}, () => Array(m + 1).fill(Infinity));
  dtwMatrix[0][0] = 0;

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const cost = frameDistance(userSequence[i - 1], templateSequence[j - 1]);
      dtwMatrix[i][j] = cost + Math.min(
        dtwMatrix[i - 1][j],
        dtwMatrix[i][j - 1],
        dtwMatrix[i - 1][j - 1]
      );
    }
  }

  return dtwMatrix[n][m];
}

// advice per frame
export function computeAdvice(userFrame, templateFrame) {
  const advice = {};
  for (let i = 0; i < templateFrame.length; i++) {
    const ux = userFrame[i][0], uy = userFrame[i][1], uz = userFrame[i][2] || 0;
    const tx = templateFrame[i][0], ty = templateFrame[i][1], tz = templateFrame[i][2] || 0;
    let msg = [];
    if (uy < ty - 0.05) msg.push("ยกสูงขึ้น");
    else if (uy > ty + 0.05) msg.push("ลดลง");
    if (ux < tx - 0.05) msg.push("ขยับไปขวา");
    else if (ux > tx + 0.05) msg.push("ขยับไปซ้าย");
    advice[`Joint ${i}`] = msg.join(", ") || "ตำแหน่งดีแล้ว";
  }
  return advice;
}

function frameDistance(frame1, frame2) {
  if (!frame1 || !frame2) return Infinity;
  const n = Math.min(frame1.length, frame2.length);
  let sum = 0;
  for (let k = 0; k < n; k++) {
    const p1 = frame1[k] || [0,0,0];
    const p2 = frame2[k] || [0,0,0];
    const dx = (p1[0] || 0) - (p2[0] || 0);
    const dy = (p1[1] || 0) - (p2[1] || 0);
    const dz = (p1[2] || 0) - (p2[2] || 0);
    sum += Math.sqrt(dx*dx + dy*dy + dz*dz);
  }
  return sum;
}
