export function computeDTW(userSequence, templateSequence) {
  const n = userSequence.length;
  const m = templateSequence.length;
  if (n === 0 || m === 0) {
    console.warn("Empty sequence - user:", n, "template:", m);
    return { score: Infinity, normalizedScore: 100, similarity: 0, advice: null };
  }

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

  const rawScore = dtwMatrix[n][m];
  
  // Normalize score: divide by path length and scale to 0-100 range
  // Lower score = better match
  const pathLength = Math.max(n, m);
  const avgCost = rawScore / pathLength;
  
  // Debug logging
  console.log("DTW Debug:", {
    userFrames: n,
    templateFrames: m,
    rawScore: rawScore.toFixed(2),
    avgCost: avgCost.toFixed(2),
    lastUserFrame: userSequence[n - 1],
    firstTemplateFrame: templateSequence[0]
  });
  
  // More lenient normalization for choking pose detection
  // For pose matching, typical distances are:
  // - Perfect/exact match: avgCost < 2 (should give ~90-100% similarity)
  // - Very good match: avgCost < 5
  // - Good match: avgCost 5-15
  // - Poor match: avgCost > 15
  let normalizedScore;
  if (avgCost < 2) {
    // Perfect or near-perfect match - should give 90-100% similarity
    normalizedScore = (avgCost / 2) * 10; // 0-10 for perfect matches
  } else if (avgCost < 5) {
    normalizedScore = 10 + ((avgCost - 2) / 3) * 15; // 10-25 for very good matches
  } else if (avgCost < 15) {
    normalizedScore = 25 + ((avgCost - 5) / 10) * 35; // 25-60 for decent matches
  } else if (avgCost < 30) {
    normalizedScore = 60 + ((avgCost - 15) / 15) * 20; // 60-80 for poor matches
  } else {
    normalizedScore = 80 + Math.min(20, ((avgCost - 30) / 50) * 20); // 80-100 for very poor matches
  }
  normalizedScore = Math.min(100, Math.max(0, normalizedScore));
  
  // Find the best matching frame for advice
  let bestMatchIdx = 0;
  let minCost = Infinity;
  if (n > 0 && m > 0) {
    const lastUserFrame = userSequence[n - 1];
    for (let j = 0; j < m; j++) {
      const cost = frameDistance(lastUserFrame, templateSequence[j]);
      if (cost < minCost) {
        minCost = cost;
        bestMatchIdx = j;
      }
    }
  }
  
  // Compute advice using the best matching frame
  let advice = null;
  if (n > 0 && m > 0) {
    advice = computeAdvice(userSequence[n - 1], templateSequence[bestMatchIdx]);
  }

  return { 
    score: rawScore, 
    normalizedScore: normalizedScore,
    similarity: 100 - normalizedScore, // Convert to similarity (higher = better)
    advice: advice
  };
}

// advice per frame - show only wrong parts with advice
export function computeAdvice(userFrame, templateFrame) {
  const advice = {};
  const jointNames = ["Shoulder", "Elbow", "Wrist"];
  
  // Frames are stored as [[shoulderValue, elbowAngle, wristValue]]
  const userValues = userFrame[0] || [0, 0, 0];
  const templateValues = templateFrame[0] || [0, 0, 0];
  
  // Compare each joint value - only add to advice if wrong
  for (let i = 0; i < Math.min(userValues.length, templateValues.length); i++) {
    const ux = userValues[i] || 0;
    const tx = templateValues[i] || 0;
    
    // Original format: check if value is different
    let msg = [];
    if (ux < tx - 0.05) msg.push("ยกสูงขึ้น");
    else if (ux > tx + 0.05) msg.push("ลดลง");
    
    // Only add to advice if there's a problem
    if (msg.length > 0) {
      advice[jointNames[i]] = msg.join(", ");
    }
  }
  return advice;
}

function frameDistance(frame1, frame2) {
  if (!frame1 || !frame2) return Infinity;
  const n = Math.min(frame1.length, frame2.length);
  if (n === 0) return Infinity;
  
  let sum = 0;
  for (let k = 0; k < n; k++) {
    const p1 = frame1[k] || [0,0,0];
    const p2 = frame2[k] || [0,0,0];
    
    // Calculate weighted distance - balanced weights for choking pose detection
    // Shoulder (index 0): typically 0-15, weight = 1.5 (important for pose)
    // Elbow (index 1): typically 67-102 degrees, weight = 0.08 (critical angle for choking pose)
    // Wrist (index 2): typically 122-176 degrees, weight = 0.08 (critical angle for choking pose)
    // Balanced weights: strict enough to reject wrong poses, lenient enough for correct pose
    const weight = k === 0 ? 1.5 : 0.08;
    
    // Use only the first value (index 0) since we're storing [value] not [x,y,z]
    const v1 = p1[0] || 0;
    const v2 = p2[0] || 0;
    const diff = Math.abs(v1 - v2);
    
    // Apply moderate penalty for larger differences (balanced strictness)
    // Only penalize significantly when difference is very large
    const penalty = diff > 10 ? diff * diff * 0.05 : diff;
    sum += penalty * weight;
  }
  return sum;
}