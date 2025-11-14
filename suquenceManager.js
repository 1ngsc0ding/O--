const MAX_FRAMES = 30;
let userSequence = [];

export function addFrame(frameLandmarks){
  // Skip empty frames from MediaPipe
  if (!frameLandmarks || !Array.isArray(frameLandmarks)) {
    console.warn("No landmarks detected in this frame");
    return;
  }
  const frameArray = frameLandmarks.map(l=>[l.x, l.y, l.z||0]);
  userSequence.push(frameArray);
  if(userSequence.length>MAX_FRAMES) userSequence.shift();
}

export function getUserSequence(){
  return userSequence;
}

export function resetSequence(){
  userSequence = [];
}
