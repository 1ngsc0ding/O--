const MAX_FRAMES = 30;
let userSequence = [];

// Calculate angle between three points (in degrees)
function calculateAngle(p1, p2, p3) {
  const v1 = { x: p1.x - p2.x, y: p1.y - p2.y, z: (p1.z || 0) - (p2.z || 0) };
  const v2 = { x: p3.x - p2.x, y: p3.y - p2.y, z: (p3.z || 0) - (p2.z || 0) };
  
  const dot = v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;
  const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y + v1.z * v1.z);
  const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y + v2.z * v2.z);
  
  if (mag1 === 0 || mag2 === 0) return 0;
  const cosAngle = dot / (mag1 * mag2);
  const angle = Math.acos(Math.max(-1, Math.min(1, cosAngle)));
  return angle * (180 / Math.PI);
}

// Calculate distance between two points
function calculateDistance(p1, p2) {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  const dz = (p1.z || 0) - (p2.z || 0);
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

export function addFrame(frameLandmarks){
  //skip empty frames
  if (!frameLandmarks || !Array.isArray(frameLandmarks) || frameLandmarks.length < 24) {
    return;
  }
  
  // Extract landmarks: 
  // 11 (left shoulder), 13 (left elbow), 15 (left wrist), 23 (left hip)
  const shoulder = frameLandmarks[11];
  const elbow = frameLandmarks[13];
  const wrist = frameLandmarks[15];
  const hip = frameLandmarks[23]; // Left hip for shoulder angle reference
  
  if (!shoulder || !elbow || !wrist) {
    return;
  }
  
  // Calculate measurements to match template format
  // Template format appears to be:
  // - Shoulder: distance measurement (normalized, scaled) - using shoulder-to-elbow distance scaled
  // - Elbow: angle in degrees (shoulder-elbow-wrist)
  // - Wrist: angle in degrees or distance - using wrist angle (elbow-wrist relative to horizontal)
  
  // Shoulder measurement: distance from shoulder to elbow, scaled to match template range (0-15)
  const shoulderElbowDist = calculateDistance(shoulder, elbow);
  // Normalize and scale: MediaPipe coordinates are 0-1, so distances are typically 0-0.5
  // Scale to match template range (0-15)
  const shoulderValue = shoulderElbowDist * 30; // Scale factor to match template range
  
  // Elbow angle: angle at elbow between shoulder-elbow-wrist (in degrees)
  const elbowAngle = calculateAngle(shoulder, elbow, wrist);
  
  // Wrist measurement: angle of elbow-wrist segment relative to vertical
  // Template values are 122-176 degrees
  // Calculate the angle of the forearm (elbow to wrist) relative to vertical
  const dx = wrist.x - elbow.x;
  const dy = wrist.y - elbow.y;
  // Calculate angle in degrees (0 = pointing right, 90 = pointing down, 180 = pointing left, 270 = pointing up)
  let angle = Math.atan2(dy, dx) * (180 / Math.PI);
  // Convert to 0-360 range
  if (angle < 0) angle += 360;
  // For choking pose, the arm is typically extended forward/down
  // Map to template range: try using the angle directly, or add an offset
  // Since template is 122-176, and typical arm angles might be different,
  // let's use: 180 - angle (if angle < 180) or angle (if angle >= 180)
  let wristValue;
  if (angle <= 180) {
    wristValue = 180 - angle; // Invert for downward/forward arms
  } else {
    wristValue = angle - 180;
  }
  // Scale to match template range better - template seems to be 122-176
  // If our value is 0-90, map to 122-176
  if (wristValue < 90) {
    wristValue = 122 + (wristValue / 90) * 54; // Map 0-90 to 122-176
  } else {
    wristValue = Math.min(176, wristValue + 32); // Shift larger values
  }
  
  // Create frame matching template format: [shoulder_value, elbow_value, wrist_value]
  const frame = [[shoulderValue, elbowAngle, wristValue]];
  userSequence.push(frame);
  if(userSequence.length > MAX_FRAMES) userSequence.shift();
}

export function getUserSequence(){
  return userSequence;
}

export function resetSequence(){
  userSequence = [];
}