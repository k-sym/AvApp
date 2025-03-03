/**
 * audioMotion-analyzer creative overlay demo
 * Based on https://audiomotion.dev/demo/overlay.html
 * Features: microphone input, video/camera background, and text marquee
 * Default visualization: Radial mode with peaks, no scales
 */

// load module from Skypack CDN
import AudioMotionAnalyzer from 'https://cdn.skypack.dev/audiomotion-analyzer?min';

// global variables
let micStream;
let audioCtx;
let cameraStream;
let marqueeAnimation;
let currentBackground = 'video';
let micGainNode; // Add gain node for microphone sensitivity

// DOM elements
const micButton = document.getElementById('mic');
const micSensitivitySlider = document.getElementById('mic-sensitivity');
const micSensitivityValue = document.getElementById('mic-sensitivity-value');
const backgroundRadios = document.querySelectorAll('input[name="background-source"]');
const videoOpacitySlider = document.getElementById('video-opacity');
const videoOpacityValue = document.getElementById('video-opacity-value');
const backgroundVideo = document.getElementById('background-video');
const cameraVideo = document.getElementById('camera-video');
const textMarquee = document.getElementById('text-marquee');
const marqueeTextInput = document.getElementById('marquee-text');
const setMarqueeButton = document.getElementById('set-marquee');
const textToggle = document.getElementById('text-toggle');
const textSpeedSlider = document.getElementById('text-speed');
const textSpeedValue = document.getElementById('text-speed-value');
const textSizeSlider = document.getElementById('text-size');
const textSizeValue = document.getElementById('text-size-value');
const overlayToggle = document.getElementById('overlay-toggle');
const bgAlphaSlider = document.getElementById('bg-alpha');
const bgAlphaValue = document.getElementById('bg-alpha-value');
const fullscreenButton = document.getElementById('fullscreen');

// instantiate analyzer
const audioMotion = new AudioMotionAnalyzer(
  document.getElementById('container'),
  {
    gradient: 'rainbow',
    height: window.innerHeight - 50,
    showScaleY: false, // don't show Y scale
    showPeaks: true,   // show peaks
    mode: 5, // 1/4th octave mode
    lumiBars: true,
    reflexRatio: 0.2,
    reflexAlpha: 0.25,
    showBgColor: true, // enable background color for overlay
    bgAlpha: 0.7,      // set initial overlay intensity
    fontSize: 14,
    fontFamily: 'Orbitron, sans-serif',
    responsive: true,
    maxFreq: 16000,
    minFreq: 20,
    radial: true, // set radial mode by default
    showScaleX: false, // don't show X scale
    alphaBars: true, // make bars semi-transparent to see the video
    bgColor: 'transparent', // transparent background to see the video
    overlay: true // enable overlay mode
  }
);

// display module version
document.getElementById('version').innerText = `v${AudioMotionAnalyzer.version}`;

// Initialize display values
videoOpacityValue.textContent = videoOpacitySlider.value;
bgAlphaValue.textContent = bgAlphaSlider.value;
textSpeedValue.textContent = textSpeedSlider.value;
textSizeValue.textContent = textSizeSlider.value;
micSensitivityValue.textContent = micSensitivitySlider.value;

// Set initial text size
const initialScreenHeight = window.innerHeight;
const initialTextSizePixels = Math.floor((initialScreenHeight * parseInt(textSizeSlider.value)) / 100);
textMarquee.style.fontSize = `${initialTextSizePixels}px`;

// Set initial background (video)
backgroundVideo.style.display = 'block';
backgroundVideo.style.opacity = videoOpacitySlider.value;

// handle window resize
window.addEventListener('resize', () => {
  audioMotion.height = window.innerHeight - 50;
  
  // Update text size on window resize
  if (textToggle.checked) {
    const screenHeight = window.innerHeight;
    const textSizePixels = Math.floor((screenHeight * parseInt(textSizeSlider.value)) / 100);
    textMarquee.style.fontSize = `${textSizePixels}px`;
  }
});

// toggle microphone on/off
micButton.addEventListener('change', () => {
  if (micButton.checked) {
    if (navigator.mediaDevices) {
      navigator.mediaDevices.getUserMedia({ audio: true, video: false })
      .then(stream => {
        // create stream using audioMotion audio context
        micStream = audioMotion.audioCtx.createMediaStreamSource(stream);
        
        // Create gain node for sensitivity control
        micGainNode = audioMotion.audioCtx.createGain();
        micGainNode.gain.value = parseInt(micSensitivitySlider.value) / 5; // Convert 1-10 to gain (normalized around 1)
        
        // Connect microphone -> gain node -> analyzer
        micStream.connect(micGainNode);
        audioMotion.connectInput(micGainNode);
        
        // Enable sensitivity slider
        micSensitivitySlider.disabled = false;
        
        // mute output to prevent feedback loops from the speakers
        audioMotion.volume = 0;
      })
      .catch(err => {
        alert('Microphone access denied by user');
        micButton.checked = false;
      });
    }
    else {
      alert('User mediaDevices not available');
      micButton.checked = false;
    }
  }
  else {
    // disconnect and release microphone stream
    if (micStream) {
      if (micGainNode) {
        micStream.disconnect(micGainNode);
        audioMotion.disconnectInput(micGainNode, true);
        micGainNode = null;
      } else {
        audioMotion.disconnectInput(micStream, true);
      }
      micStream = undefined;
      
      // Disable sensitivity slider
      micSensitivitySlider.disabled = true;
    }
  }
});

// handle microphone sensitivity change
micSensitivitySlider.addEventListener('input', () => {
  const value = parseInt(micSensitivitySlider.value);
  micSensitivityValue.textContent = value;
  
  // Update gain value if microphone is active
  if (micGainNode) {
    // Convert slider value (1-10) to gain value
    // Using a non-linear scale to make the control more useful
    // Value of 5 = gain of 1 (neutral), 10 = gain of 4, 1 = gain of 0.2
    micGainNode.gain.value = Math.pow(2, (value - 5) / 2);
  }
});

// handle background source change
backgroundRadios.forEach(radio => {
  radio.addEventListener('change', () => {
    // Hide all backgrounds first
    backgroundVideo.style.display = 'none';
    cameraVideo.style.display = 'none';
    
    // Stop camera if it was active
    if (cameraStream && currentBackground === 'camera') {
      cameraStream.getTracks().forEach(track => track.stop());
      cameraStream = null;
    }
    
    currentBackground = radio.value;
    
    switch (currentBackground) {
      case 'video':
        backgroundVideo.style.display = 'block';
        backgroundVideo.play();
        break;
        
      case 'camera':
        if (navigator.mediaDevices) {
          navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
          .then(stream => {
            cameraStream = stream;
            cameraVideo.srcObject = stream;
            cameraVideo.style.display = 'block';
          })
          .catch(err => {
            alert('Camera access denied or not available');
            document.getElementById('bg-none').checked = true;
            currentBackground = 'none';
          });
        } else {
          alert('Camera not available on this device');
          document.getElementById('bg-none').checked = true;
          currentBackground = 'none';
        }
        break;
        
      case 'none':
      default:
        // Nothing to do, all backgrounds are already hidden
        break;
    }
  });
});

// handle background opacity change
videoOpacitySlider.addEventListener('input', () => {
  const value = parseFloat(videoOpacitySlider.value);
  if (currentBackground === 'video') {
    backgroundVideo.style.opacity = value;
  } else if (currentBackground === 'camera') {
    cameraVideo.style.opacity = value;
  }
  videoOpacityValue.textContent = value.toFixed(1);
});

// Text marquee functions
function startMarqueeAnimation() {
  if (marqueeAnimation) {
    cancelAnimationFrame(marqueeAnimation);
  }
  
  const speed = parseInt(textSpeedSlider.value) * 3; // Triple the speed
  let position = window.innerWidth;
  
  // Store the original text
  const originalText = textMarquee.textContent;
  
  // Calculate margin based on text size - larger text gets larger margin
  const fontSize = parseInt(textMarquee.style.fontSize);
  const marginSize = Math.max(fontSize * 4, 100); // At least 100px, or 4x the font size
  
  // Create a second copy of the text for continuous scrolling
  const secondText = document.createElement('span');
  secondText.textContent = originalText;
  secondText.style.marginLeft = `${marginSize}px`; // Dynamic margin based on text size
  textMarquee.innerHTML = '';
  
  const firstText = document.createElement('span');
  firstText.textContent = originalText;
  
  textMarquee.appendChild(firstText);
  textMarquee.appendChild(secondText);
  
  function animate() {
    position -= speed;
    
    // When the first text is completely off-screen, reset position
    // This creates a continuous loop effect
    if (position < -(firstText.offsetWidth + marginSize)) {
      position += firstText.offsetWidth + marginSize;
    }
    
    textMarquee.style.left = `${position}px`;
    marqueeAnimation = requestAnimationFrame(animate);
  }
  
  animate();
}

// handle set marquee text button
setMarqueeButton.addEventListener('click', () => {
  const text = marqueeTextInput.value.trim();
  if (text) {
    textMarquee.textContent = text;
    if (textToggle.checked) {
      // Apply current text size
      const screenHeight = window.innerHeight;
      const textSizePixels = Math.floor((screenHeight * parseInt(textSizeSlider.value)) / 100);
      textMarquee.style.fontSize = `${textSizePixels}px`;
      
      // Show with fade in
      textMarquee.style.display = 'block';
      // Trigger reflow to ensure the transition works
      void textMarquee.offsetWidth;
      textMarquee.style.opacity = '1';
      
      startMarqueeAnimation();
    }
  }
});

// handle text toggle
textToggle.addEventListener('change', () => {
  if (textToggle.checked) {
    if (marqueeTextInput.value.trim()) {
      textMarquee.textContent = marqueeTextInput.value.trim();
      // Apply current text size
      const screenHeight = window.innerHeight;
      const textSizePixels = Math.floor((screenHeight * parseInt(textSizeSlider.value)) / 100);
      textMarquee.style.fontSize = `${textSizePixels}px`;
      
      // Show with fade in
      textMarquee.style.display = 'block';
      // Trigger reflow to ensure the transition works
      void textMarquee.offsetWidth;
      textMarquee.style.opacity = '1';
      
      startMarqueeAnimation();
    } else {
      alert('Please enter text first');
      textToggle.checked = false;
    }
  } else {
    // Fade out
    textMarquee.style.opacity = '0';
    
    // Wait for fade out to complete before hiding
    setTimeout(() => {
      textMarquee.style.display = 'none';
      if (marqueeAnimation) {
        cancelAnimationFrame(marqueeAnimation);
        marqueeAnimation = null;
      }
    }, 500); // Match the transition duration (0.5s)
  }
});

// handle text speed change
textSpeedSlider.addEventListener('input', () => {
  const value = parseInt(textSpeedSlider.value);
  textSpeedValue.textContent = value;
  if (textToggle.checked) {
    startMarqueeAnimation();
  }
});

// handle text size change
textSizeSlider.addEventListener('input', () => {
  const value = parseInt(textSizeSlider.value);
  textSizeValue.textContent = value;
  // Set text size as percentage of screen height
  const screenHeight = window.innerHeight;
  const textSizePixels = Math.floor((screenHeight * value) / 100);
  textMarquee.style.fontSize = `${textSizePixels}px`;
  
  // Restart marquee animation if text is visible to update the margin
  if (textToggle.checked && textMarquee.style.display === 'block') {
    startMarqueeAnimation();
  }
});

// handle overlay toggle
overlayToggle.addEventListener('change', () => {
  // Toggle the background color visibility
  audioMotion.showBgColor = overlayToggle.checked;
  
  if (overlayToggle.checked) {
    // Apply the current alpha value when enabled
    audioMotion.bgAlpha = parseFloat(bgAlphaSlider.value);
  }
});

// handle background alpha change
bgAlphaSlider.addEventListener('input', () => {
  const value = parseFloat(bgAlphaSlider.value);
  audioMotion.bgAlpha = value;
  bgAlphaValue.textContent = value.toFixed(1);
});

// handle fullscreen button
fullscreenButton.addEventListener('click', () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(err => {
      alert(`Error attempting to enable fullscreen: ${err.message}`);
    });
  } else {
    document.exitFullscreen();
  }
});

// handle fullscreen change
document.addEventListener('fullscreenchange', () => {
  if (document.fullscreenElement) {
    // we're in fullscreen mode
    audioMotion.height = window.innerHeight;
    document.querySelector('.controls').style.display = 'none';
    document.querySelector('.info').style.display = 'none';
  } else {
    // exited fullscreen
    audioMotion.height = window.innerHeight - 50;
    document.querySelector('.controls').style.display = 'flex';
    document.querySelector('.info').style.display = 'block';
  }
});

// handle window unload - clean up resources
window.addEventListener('beforeunload', () => {
  // Stop camera stream if active
  if (cameraStream) {
    cameraStream.getTracks().forEach(track => track.stop());
  }
  
  // Stop microphone stream if active
  if (micStream) {
    audioMotion.disconnectInput(micStream, true);
  }
  
  // Cancel any animations
  if (marqueeAnimation) {
    cancelAnimationFrame(marqueeAnimation);
  }
});
