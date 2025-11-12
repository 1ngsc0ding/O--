<script>
const video = document.getElementById("webcamVideo");
const canvas = document.getElementById("outputCanvas");
const ctx = canvas.getContext("2d");

async function startCam() {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: {
      width: { ideal: 1920 },
      height: { ideal: 1080 },
      frameRate: { ideal: 30 }
    }
  });
  video.srcObject = stream;
  video.onloadedmetadata = () => drawToCanvas();
}

function drawToCanvas() {
  const fps = 15;
  const interval = 1000 / fps;
  setInterval(() => {
    const vw = video.videoWidth;
    const vh = video.videoHeight;
    const aspect = 16 / 9;
    let sx = 0, sy = 0, sw = vw, sh = vh;
    if (vw / vh > aspect) {
      sw = vh * aspect;
      sx = (vw - sw) / 2;
    } else {
      sh = vw / aspect;
      sy = (vh - sh) / 2;
    }
    ctx.drawImage(video, sx, sy, sw, sh, 0, 0, 1920, 1080);
  }, interval);
}

startCam();
</script>

