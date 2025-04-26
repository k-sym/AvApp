<template>
  <q-page class="visualizer-page" @click="toggleControls">
    <!-- video background -->
    <video id="background-video" ref="backgroundVideo" autoplay muted loop>
      <source src="/media/default.mp4" type="video/mp4">
    </video>

    <!-- camera background -->
    <video id="camera-video" ref="cameraVideo" autoplay muted></video>

    <!-- text marquee -->
    <div id="text-marquee" ref="textMarquee"></div>

    <!-- analyzer container -->
    <div id="container" ref="container"></div>

    <!-- controls panel -->
    <div class="controls" v-show="showControls" @click.stop>
      <div class="control-group">
        <div class="checkbox-control">
          <q-checkbox v-model="useMic" label="🎤 Microphone" />
        </div>
        <div class="range-control" v-show="useMic">
          <label for="mic-sensitivity">Mic Sensitivity:</label>
          <q-slider
            id="mic-sensitivity"
            v-model="micSensitivity"
            :min="1"
            :max="10"
            :step="1"
            :disable="!useMic"
            class="full-width"
          />
        </div>
      </div>

      <div class="control-group">
        <div class="radio-control">
          <q-radio v-model="backgroundSource" val="none" label="None" />
        </div>
        <div class="radio-control">
          <q-radio v-model="backgroundSource" val="video" label="Default Video" />
        </div>
        <div class="radio-control">
          <q-radio v-model="backgroundSource" val="custom" label="Custom Video" />
          <q-btn v-show="backgroundSource === 'custom'" @click="selectVideo" label="Select" dense class="ml-2" />
        </div>
        <div class="radio-control">
          <q-radio v-model="backgroundSource" val="camera" label="Camera" />
        </div>

        <div class="range-control">
          <label for="video-opacity">Opacity:</label>
          <q-slider
            id="video-opacity"
            v-model="videoOpacity"
            :min="0"
            :max="1"
            :step="0.1"
            class="full-width"
          />
        </div>
      </div>

      <div class="control-group">
        <div class="text-input-control">
          <q-input
            v-model="marqueeText"
            placeholder="Enter text to display..."
            dense
            filled
            standout
            bg-color="white"
          >
            <template v-slot:append>
              <q-btn @click="setMarquee" label="Set Text" dense />
            </template>
          </q-input>
        </div>
        <div class="checkbox-control">
          <q-checkbox v-model="showText" label="Show Text" />
        </div>
        <div class="range-control">
          <label for="text-speed">Speed:</label>
          <q-slider
            id="text-speed"
            v-model="textSpeed"
            :min="1"
            :max="40"
            :step="1"
            class="full-width"
          />
        </div>
        <div class="range-control">
          <label for="text-size">Size:</label>
          <q-slider
            id="text-size"
            v-model="textSize"
            :min="80"
            :max="340"
            :step="10"
            class="full-width"
          />
        </div>
      </div>

      <div class="control-group">
        <h3>Visualization Mode</h3>
        <div class="radio-control">
          <q-radio v-model="visualizerMode" val="radial" label="Radial" />
          <q-checkbox v-show="visualizerMode === 'radial'" v-model="radialInvert" label="Invert" class="ml-4" />
        </div>
        <div class="radio-control">
          <q-radio v-model="visualizerMode" val="reflexBars" label="Reflex Bars" />
        </div>

        <div class="select-control">
          <label for="gradient-select">Color Gradient:</label>
          <q-select
            id="gradient-select"
            v-model="selectedGradient"
            :options="gradientOptions"
            dense
            filled
            standout
            bg-color="white"
            text-color="black"
            class="full-width"
          />
        </div>
      </div>

      <div class="control-group">
        <div class="range-control">
          <label for="amplitude">Amplitude:</label>
          <q-slider
            id="amplitude"
            v-model="amplitude"
            :min="50"
            :max="100"
            :step="5"
            class="full-width"
          />
        </div>
      </div>

    </div>

    <!-- module info -->
    <div class="info">
      <a href="https://audiomotion.dev" target="_blank" rel="noopener">audioMotion-analyzer</a>
      <span id="version">{{ version }}</span>
    </div>

    <!-- controls hint -->
    <div class="controls-hint" :class="{'controls-hint-visible': !showControls}">
      Click anywhere to show controls
    </div>
  </q-page>
</template>

<script>
import { defineComponent } from 'vue';
import AudioMotionAnalyzer from 'audiomotion-analyzer';

export default defineComponent({
  name: 'VisualizerPage',
  data() {
    return {
      // AudioMotion instance
      audioMotion: null,
      // Version info
      version: '',
      // Mic settings
      useMic: false,
      micSensitivity: 5,
      micStream: null,
      micGainNode: null,
      // Background settings
      backgroundSource: 'video',
      customVideoFile: null,
      videoOpacity: 0.1,
      cameraStream: null,
      // Text marquee settings
      marqueeText: '',
      showText: false,
      textSpeed: 20,
      textSize: 105,
      marqueeAnimation: null,
      fadeTimeout: null,
      // Radial settings
      radialInvert: true,
      amplitude: 75,
      // Audio context
      audioCtx: null,
      // Controls visibility
      showControls: true,
      // Visualizer mode
      visualizerMode: 'radial',
      // Gradient settings
      selectedGradient: 'rainbow',
      gradientOptions: [
        'rainbow',
        'classic',
        'prism',
        'orangered',
        'steelblue',
      ]
    };
  },
  watch: {
    useMic(newVal) {
      if (newVal) {
        this.startMicInput();
      } else {
        this.stopMicInput();
      }
    },
    micSensitivity(newVal) {
      this.updateMicSensitivity(newVal);
    },
    backgroundSource(newVal) {
      this.updateBackgroundSource(newVal);
    },
    videoOpacity(newVal) {
      this.updateVideoOpacity(newVal);
    },
    showText(newVal) {
      if (newVal && this.marqueeText.trim()) {
        // If text should be visible, start animation
        this.startMarqueeAnimation();
      } else if (!newVal) {
        // If text should be hidden, start the fade-out process
        this.stopMarqueeAnimation();
      }
    },
    textSpeed() {
      // No need to restart animation - speed is calculated dynamically on each frame
    },
    textSize(newVal) {
      this.$refs.textMarquee.style.fontSize = `${newVal}px`;
    },
    radialInvert(newVal) {
      this.audioMotion.setOptions({ radialInvert: newVal });
    },
    amplitude(newVal) {
      this.updateAmplitude(newVal);
    },
    visualizerMode(newVal) {
      this.updateVisualizerMode(newVal);
    },
    selectedGradient(newVal) {
      this.updateSelectedGradient(newVal);
    }
  },
  mounted() {
    // Add global error handler to help debug iOS issues
    window.onerror = (message, source, lineno, colno, error) => {
      if (window.device && window.device.platform === 'iOS') {
        console.error('Global error:', message, 'at', source, lineno, colno);
        // Create visible error message for debugging
        this.showErrorMessage(`Error: ${message} at line ${lineno}`);
      }
    };

    // Add unhandled promise rejection handler
    window.onunhandledrejection = (event) => {
      if (window.device && window.device.platform === 'iOS') {
        console.error('Unhandled promise rejection:', event.reason);
        this.showErrorMessage(`Promise error: ${event.reason}`);
      }
    };

    try {
      this.initAudioMotion();

      // Update text size initially
      this.$refs.textMarquee.style.fontSize = `${this.textSize}px`;

      // Update background opacity initially
      this.updateVideoOpacity(this.videoOpacity);

      // Set version info
      this.version = AudioMotionAnalyzer.version;

      // Apply initial background
      this.updateBackgroundSource(this.backgroundSource);

      // Add mobile-specific event listeners
      this.addMobileListeners();
    } catch (error) {
      console.error('Error in mounted hook:', error);
      this.showErrorMessage(`Mount error: ${error.message}`);
    }
  },
  beforeUnmount() {
    this.cleanup();
  },
  methods: {
    initAudioMotion() {
      // Initialize audio context with iOS workaround
      try {
        // iOS requires user interaction to create audio context
        // Create a dummy audio context first
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.audioCtx = new AudioContext();

        // On iOS, we need to resume the context after a user interaction
        if (this.audioCtx.state === 'suspended') {
          const resumeAudio = () => {
            this.audioCtx.resume();

            // Remove the event listeners once audio is resumed
            document.removeEventListener('touchstart', resumeAudio);
            document.removeEventListener('touchend', resumeAudio);
            document.removeEventListener('click', resumeAudio);
          };

          document.addEventListener('touchstart', resumeAudio);
          document.addEventListener('touchend', resumeAudio);
          document.addEventListener('click', resumeAudio);
        }

        // Instantiate analyzer
        this.audioMotion = new AudioMotionAnalyzer(
          this.$refs.container,
          {
            gradient: this.selectedGradient,
            height: window.innerHeight, // Use full window height
            showScaleY: false,
            showScaleX: false,
            showPeaks: true,
            mode: 3,
            lumiBars: false,
            radial: this.visualizerMode === 'radial',
            radialInvert: this.radialInvert,
            reflexRatio: this.visualizerMode === 'radial' ? 0 : 0.4,
            minDecibels: -150 + this.amplitude, // Calculate from amplitude setting
            maxDecibels: -25, // Default is -25
            source: this.audioCtx.createMediaElementSource(new Audio()),
            audioCtx: this.audioCtx,
            overlay: false, // Disable the overlay
            alphaBars: true, // Use alpha blending instead
            barSpace: 0.1 // Add some space between bars
          }
        );
      } catch (error) {
        console.error('Error initializing AudioMotion:', error);
      }

      // Handle window resize
      window.addEventListener('resize', () => {
        if (this.audioMotion) {
          this.audioMotion.setCanvasSize(window.innerWidth, window.innerHeight); // Use full window dimensions
        }
      });
    },

    startMicInput() {
      // For Cordova on mobile, we need to check if we have the Media plugin
      if (window.cordova && window.device) {
        // Check if we're on Android and need to request permissions
        if (window.device.platform === 'Android' && window.cordova.plugins && window.cordova.plugins.permissions) {
          const permissions = window.cordova.plugins.permissions;

          permissions.checkPermission(permissions.RECORD_AUDIO, (status) => {
            if (!status.hasPermission) {
              permissions.requestPermission(permissions.RECORD_AUDIO,
                (success) => {
                  // Permission granted, proceed with microphone access
                  this.initializeMicrophoneForMobile();
                },
                (error) => {
                  console.error('Microphone permission denied:', error);
                  this.useMic = false;
                });
            } else {
              // Already has permission
              this.initializeMicrophoneForMobile();
            }
          });
        } else {
          // iOS or another platform that doesn't need explicit permission checks
          this.initializeMicrophoneForMobile();
        }
      } else {
        // Web browser implementation (your existing code)
        if (navigator.mediaDevices) {
          navigator.mediaDevices.getUserMedia({ audio: true, video: false })
            .then(stream => {
              this.micStream = stream;

              // Create microphone source
              const micSource = this.audioCtx.createMediaStreamSource(stream);

              // Create gain node for sensitivity control
              this.micGainNode = this.audioCtx.createGain();
              this.micGainNode.gain.value = this.micSensitivity / 5; // Adjust gain based on sensitivity

              // Connect nodes
              micSource.connect(this.micGainNode);

              // Set as audio source for the analyzer
              this.audioMotion.connectInput(this.micGainNode);

              // Resume audioContext if it's suspended
              if (this.audioCtx.state === 'suspended') {
                this.audioCtx.resume();
              }
            })
            .catch(err => {
              console.error('Error accessing microphone:', err);
              this.useMic = false;
            });
        } else {
          console.error('mediaDevices not supported');
          this.useMic = false;
        }
      }
    },

    initializeMicrophoneForMobile() {
      // This method initializes microphone access for mobile devices using the Cordova Media plugin
      // Note: This is a simplified implementation and might need adjustments
      if (navigator.mediaDevices) {
        navigator.mediaDevices.getUserMedia({ audio: true, video: false })
          .then(stream => {
            this.micStream = stream;

            // Create microphone source
            const micSource = this.audioCtx.createMediaStreamSource(stream);

            // Create gain node for sensitivity control
            this.micGainNode = this.audioCtx.createGain();
            this.micGainNode.gain.value = this.micSensitivity / 5;

            // Connect nodes
            micSource.connect(this.micGainNode);

            // Set as audio source for the analyzer
            this.audioMotion.connectInput(this.micGainNode);

            // Resume audioContext if suspended
            if (this.audioCtx.state === 'suspended') {
              this.audioCtx.resume();
            }
          })
          .catch(err => {
            console.error('Error accessing microphone on mobile:', err);
            this.useMic = false;
          });
      }
    },

    stopMicInput() {
      if (this.micStream) {
        // Stop all audio tracks
        this.micStream.getAudioTracks().forEach(track => track.stop());
        this.micStream = null;

        // Disconnect gain node if it exists
        if (this.micGainNode) {
          this.micGainNode.disconnect();
          this.micGainNode = null;
        }
      }
    },

    updateMicSensitivity(value) {
      if (this.micGainNode) {
        this.micGainNode.gain.value = value / 5;
      }
    },

    updateBackgroundSource(source) {
      // Hide all backgrounds
      this.$refs.backgroundVideo.style.opacity = 0;
      this.$refs.cameraVideo.style.opacity = 0;

      // Stop camera if it was active
      if (this.cameraStream) {
        this.cameraStream.getTracks().forEach(track => track.stop());
        this.cameraStream = null;
      }

      // Hide analyzer when no background is selected
      if (source === 'none') {
        this.$refs.container.style.opacity = 0;
      } else {
        this.$refs.container.style.opacity = 1;
      }

      if (source === 'video') {
        this.$refs.backgroundVideo.src = '/media/default.mp4';
        this.$refs.backgroundVideo.style.opacity = this.videoOpacity;
        this.$refs.backgroundVideo.play();
      }
      else if (source === 'custom' && this.customVideoFile) {
        const videoUrl = URL.createObjectURL(this.customVideoFile);
        this.$refs.backgroundVideo.src = videoUrl;
        this.$refs.backgroundVideo.style.opacity = this.videoOpacity;
        this.$refs.backgroundVideo.play();
      }
      else if (source === 'camera') {
        this.startCameraBackground();
      }
    },

    selectVideo() {
      if (window.cordova) {
        this.selectDeviceVideo();
      } else {
        this.selectLocalVideo();
      }
    },

    selectLocalVideo() {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'video/*';

      input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
          this.customVideoFile = file;
          this.updateBackgroundSource('custom');
        }
      };

      input.click();
    },

    selectDeviceVideo() {
      // For Cordova/PhoneGap
      if (navigator.device && navigator.device.capture) {
        navigator.device.capture.captureVideo(
          (mediaFiles) => {
            if (mediaFiles && mediaFiles.length > 0) {
              const videoFile = new File([], mediaFiles[0].fullPath, {
                type: mediaFiles[0].type
              });
              this.customVideoFile = videoFile;
              this.updateBackgroundSource('custom');
            }
          },
          (error) => {
            console.error('Error capturing video:', error);
          },
          { limit: 1 }
        );
      } else {
        console.error('Device capture API not available');
      }
    },

    startCameraBackground() {
      // For Cordova on mobile, we need to check for camera permissions
      if (window.cordova && window.device) {
        // Check if we're on Android and need to request permissions
        if (window.device.platform === 'Android' && window.cordova.plugins && window.cordova.plugins.permissions) {
          const permissions = window.cordova.plugins.permissions;

          permissions.checkPermission(permissions.CAMERA, (status) => {
            if (!status.hasPermission) {
              permissions.requestPermission(permissions.CAMERA,
                (success) => {
                  // Permission granted, proceed with camera access
                  this.initializeCameraForBackground();
                },
                (error) => {
                  console.error('Camera permission denied:', error);
                  this.backgroundSource = 'none';
                });
            } else {
              // Already has permission
              this.initializeCameraForBackground();
            }
          });
        } else {
          // iOS or another platform that doesn't need explicit permission checks
          this.initializeCameraForBackground();
        }
      } else {
        // Web browser implementation (existing code)
        if (navigator.mediaDevices) {
          navigator.mediaDevices.getUserMedia({ video: true })
            .then(stream => {
              this.cameraStream = stream;
              this.$refs.cameraVideo.srcObject = stream;
              this.$refs.cameraVideo.style.opacity = this.videoOpacity;
            })
            .catch(err => {
              console.error('Error accessing camera:', err);
              this.backgroundSource = 'none';
            });
        } else {
          console.error('mediaDevices not supported');
          this.backgroundSource = 'none';
        }
      }
    },

    initializeCameraForBackground() {
      // This method initializes camera access for mobile devices
      if (navigator.mediaDevices) {
        navigator.mediaDevices.getUserMedia({ video: true })
          .then(stream => {
            this.cameraStream = stream;
            this.$refs.cameraVideo.srcObject = stream;
            this.$refs.cameraVideo.style.opacity = this.videoOpacity;
          })
          .catch(err => {
            console.error('Error accessing camera on mobile:', err);
            this.backgroundSource = 'none';
          });
      }
    },

    updateVideoOpacity(value) {
      if (this.backgroundSource === 'video') {
        this.$refs.backgroundVideo.style.opacity = value;
      }
      else if (this.backgroundSource === 'camera') {
        this.$refs.cameraVideo.style.opacity = value;
      }

      // Update analyzer opacity based on background opacity
      if (this.backgroundSource !== 'none') {
        this.$refs.container.style.opacity = value;
      }
    },

    setMarquee() {
      // Trim whitespace from text
      this.marqueeText = this.marqueeText.trim();

      if (this.marqueeText) {
        // Set text content
        this.$refs.textMarquee.innerText = this.marqueeText;

        // Force set showText to true
        this.showText = true;

        // Make text visible immediately (don't wait for the watcher)
        this.$refs.textMarquee.style.display = 'block';

        // Start the animation directly
        this.stopMarqueeAnimation(); // Clear any existing animation
        this.startMarqueeAnimation();
      }
    },

    startMarqueeAnimation() {
      // Make sure we have text to display
      if (!this.marqueeText.trim()) {
        console.log('No text to display');
        return;
      }

      // If there's a pending fade-out, cancel it
      if (this.fadeTimeout) {
        clearTimeout(this.fadeTimeout);
        this.fadeTimeout = null;
      }

      // Set text content
      this.$refs.textMarquee.innerText = this.marqueeText;

      // Get viewport width
      const viewportWidth = window.innerWidth;

      // Set initial position (start from right edge)
      let position = viewportWidth;

      // Make visible and ensure no fade-out class
      this.$refs.textMarquee.classList.remove('fade-out');
      // Don't set opacity directly - let CSS handle it
      this.$refs.textMarquee.style.display = 'block';
      this.$refs.textMarquee.style.left = `${position}px`;

      // If animation is already running, just return (keep it running)
      if (this.marqueeAnimation) {
        return;
      }

      // Animation function
      const animate = () => {
        // Calculate speed factor dynamically (pixels per frame)
        // This makes speed changes take effect immediately
        const speedFactor = this.textSpeed / 1.25;

        // Move text to the left
        position -= speedFactor;

        // Reset position when text is completely off the left edge
        const textWidth = this.$refs.textMarquee.offsetWidth;
        if (position < -textWidth) {
          position = viewportWidth;
        }

        // Update position
        this.$refs.textMarquee.style.left = `${position}px`;

        // Request next frame
        this.marqueeAnimation = requestAnimationFrame(animate);
      };

      // Start animation
      this.marqueeAnimation = requestAnimationFrame(animate);
    },

    stopMarqueeAnimation() {
      // Only proceed if there's an animation running
      if (!this.marqueeAnimation) {
        return;
      }

      // Add fade-out class
      this.$refs.textMarquee.classList.add('fade-out');

      // If there's already a timeout, clear it
      if (this.fadeTimeout) {
        clearTimeout(this.fadeTimeout);
      }

      // Wait for transition to complete before stopping animation
      this.fadeTimeout = setTimeout(() => {
        // Cancel the animation
        cancelAnimationFrame(this.marqueeAnimation);
        this.marqueeAnimation = null;

        // Hide the text
        this.$refs.textMarquee.style.display = 'none';
        this.$refs.textMarquee.classList.remove('fade-out');

        // Clear the timeout reference
        this.fadeTimeout = null;
      }, 500); // Should match the CSS transition duration
    },

    updateAmplitude(value) {
      // Convert slider value (50-100) to minDecibels range (-100 to -50)
      // Higher values = less negative = more sensitivity
      const minDb = -150 + value;
      this.audioMotion.setOptions({ minDecibels: minDb });
    },

    updateVisualizerMode(mode) {
      if (mode === 'radial') {
        this.audioMotion.setOptions({
          mode: 3,
          radial: true,
          reflexRatio: 0
        });
      } else { // reflex bars mode
        this.audioMotion.setOptions({
          mode: 3,
          radial: false,
          reflexRatio: 0.4
        });
      }
    },

    updateSelectedGradient(value) {
      this.audioMotion.setOptions({ gradient: value });
    },

    cleanup() {
      // Stop animations
      this.stopMarqueeAnimation();

      // Stop mic input
      this.stopMicInput();

      // Stop camera if active
      if (this.cameraStream) {
        this.cameraStream.getTracks().forEach(track => track.stop());
        this.cameraStream = null;
      }

      // Clean up audio context
      if (this.audioCtx) {
        this.audioCtx.close();
        this.audioCtx = null;
      }

      // Destroy AudioMotion instance
      if (this.audioMotion) {
        this.audioMotion.destroy();
        this.audioMotion = null;
      }

      // Remove event listeners
      window.removeEventListener('resize', this.handleResize);

      // Remove Cordova event listeners
      if (window.cordova) {
        document.removeEventListener('deviceready', this.onDeviceReady);
        document.removeEventListener('pause', this.onPause);
        document.removeEventListener('resume', this.onResume);

        // Allow screen to sleep again
        if (window.plugins && window.plugins.insomnia) {
          window.plugins.insomnia.allowSleepAgain();
        }
      }
    },

    toggleControls() {
      this.showControls = !this.showControls;
    },

    addMobileListeners() {
      // Check if we're running in Cordova
      if (window.cordova) {
        document.addEventListener('deviceready', this.onDeviceReady, false);
        document.addEventListener('pause', this.onPause, false);
        document.addEventListener('resume', this.onResume, false);

        // Prevent screen from sleeping
        if (window.plugins && window.plugins.insomnia) {
          window.plugins.insomnia.keepAwake();
        }
      }
    },

    onDeviceReady() {
      console.log('Device is ready');

      // Log platform for debugging
      if (window.device) {
        console.log('Platform:', window.device.platform);
        console.log('Version:', window.device.version);
        console.log('Model:', window.device.model);
      }

      // iOS-specific fixes
      if (window.device && window.device.platform === 'iOS') {
        // Add a small delay to ensure all plugins are properly initialized
        setTimeout(() => {
          console.log('Applying iOS-specific fixes');

          try {
            // Set status bar appearance
            if (window.StatusBar) {
              window.StatusBar.overlaysWebView(true);
              window.StatusBar.styleBlackTranslucent();
              window.StatusBar.hide();
            }

            // Force a redraw on iOS
            document.body.style.display = 'none';
            setTimeout(() => {
              document.body.style.display = 'block';
            }, 50);

            document.body.classList.add('ios-device');

            // Force layout recalculation
            window.dispatchEvent(new Event('resize'));
          } catch (error) {
            console.error('Error applying iOS fixes:', error);
            this.showErrorMessage(`iOS fixes error: ${error.message}`);
          }
        }, 100);
      } else {
        // Non-iOS devices
        // Set status bar appearance
        if (window.StatusBar) {
          window.StatusBar.overlaysWebView(true);
          window.StatusBar.styleBlackTranslucent();
          window.StatusBar.hide();
        }
      }

      // Lock to landscape orientation
      if (window.screen && window.screen.orientation) {
        try {
          window.screen.orientation.lock('landscape');
        } catch (error) {
          console.error('Error locking orientation:', error);
        }
      }
    },

    onPause() {
      // App is going to background
      if (this.audioCtx) {
        this.audioCtx.suspend();
      }

      // Stop animations to save battery
      if (this.audioMotion) {
        this.audioMotion.stop();
      }
    },

    onResume() {
      // App is coming back to foreground
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      // Restart animations
      if (this.audioMotion) {
        this.audioMotion.start();
      }
    },

    showErrorMessage(message) {
      // Create a visible error div for debugging on iOS
      const errorDiv = document.createElement('div');
      errorDiv.style.position = 'fixed';
      errorDiv.style.top = '50%';
      errorDiv.style.left = '50%';
      errorDiv.style.transform = 'translate(-50%, -50%)';
      errorDiv.style.backgroundColor = 'rgba(255, 0, 0, 0.8)';
      errorDiv.style.color = 'white';
      errorDiv.style.padding = '20px';
      errorDiv.style.borderRadius = '10px';
      errorDiv.style.zIndex = '10000';
      errorDiv.style.maxWidth = '80%';
      errorDiv.style.textAlign = 'center';
      errorDiv.innerText = message;
      document.body.appendChild(errorDiv);

      // Auto-remove after 8 seconds
      setTimeout(() => {
        document.body.removeChild(errorDiv);
      }, 8000);
    }
  }
});
</script>

<style>
.visualizer-page {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  background-color: #000;
  font-family: sans-serif;
  padding: 0;
  margin: 0;
}

#container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 10;
  opacity: 0; /* Start with opacity 0 */
  transition: opacity 0.3s ease-in-out; /* Add smooth transition */
}

#background-video,
#camera-video {
  position: absolute;
  top: 0;
  left: 0;
  min-width: 100%;
  min-height: 100%;
  width: auto;
  height: auto;
  z-index: 1;
  opacity: 0.5;
  object-fit: cover;
}

#text-marquee {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 20;
  display: none;
  color: #fff;
  font-family: 'Orbitron', sans-serif;
  font-size: 105px;
  font-weight: 900;
  text-shadow: 0 0 7px #3498db, 0 0 10px #3498db, 0 0 21px #3498db, 0 0 42px #0099ff;
  white-space: nowrap;
  pointer-events: none; /* Make sure text doesn't interfere with clicks */
  opacity: 0.7; /* 70% opacity */
  transition: opacity 0.5s ease-out;
}

#text-marquee.fade-out {
  opacity: 0;
}

.controls {
  position: absolute;
  top: 0;
  right: 0;
  z-index: 30;
  background-color: rgba(0, 0, 0, 0.7);
  color: #fff;
  padding: 10px;
  border-radius: 5px;
  width: 350px;
  height: 100vh;
  overflow-y: auto;
  transition: opacity 0.3s ease-in-out, transform 0.3s ease-in-out;
}

.controls-hint {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 25;
  background-color: rgba(0, 0, 0, 0.5);
  color: #fff;
  padding: 5px 10px;
  border-radius: 5px;
  font-size: 14px;
  opacity: 0;
  transition: opacity 0.3s ease-in-out;
  pointer-events: none;
}

.controls-hint-visible {
  opacity: 1;
  transition-delay: 0.5s;
}

.control-group {
  margin-bottom: 15px;
  padding-bottom: 15px;
  border-bottom: 1px solid #444;
}

.control-group h3 {
  margin-top: 0;
  margin-bottom: 10px;
  font-size: 16px;
  color: #aaa;
}

.range-control {
  margin: 10px 0;
  display: flex;
  align-items: center;
}

.range-control label {
  min-width: 120px;
  margin-right: 10px;
  white-space: nowrap;
}

/* Text input field styling */
.text-input-control .q-field__native,
.text-input-control .q-field__input {
  color: #000 !important;
  background-color: rgba(255, 255, 255, 0.9) !important;
  border-radius: 4px;
}

.text-input-control .q-field__control {
  background-color: rgba(255, 255, 255, 0.9) !important;
}

/* Placeholder styling */
.text-input-control .q-field__native::placeholder,
.text-input-control .q-field__input::placeholder {
  color: rgba(0, 0, 0, 0.7) !important;
  opacity: 1;
}

.info {
  position: absolute;
  bottom: 5px;
  left: 10px;
  z-index: 30;
  color: #888;
  font-size: 12px;
}

.info a {
  color: #aaf;
  text-decoration: none;
}

.info a:hover {
  text-decoration: underline;
}

/* Additional utility classes */
.full-width {
  width: 100%;
}

.checkbox-control,
.radio-control {
  margin: 5px 0;
  display: flex;
  align-items: center;
}

.radio-control + .radio-control {
  margin-top: 8px;
}

.select-control {
  margin: 10px 0;
  display: flex;
  align-items: center;
}

.select-control label {
  min-width: 120px;
  margin-right: 10px;
  white-space: nowrap;
}

.ml-4 {
  margin-left: 16px;
}

/* Mobile-specific styles */
@media (max-width: 767px) {
  .controls {
    width: 80%;
    max-width: 300px;
  }

  .range-control label {
    min-width: 90px;
    font-size: 14px;
  }

  #text-marquee {
    font-size: 60px !important;
  }

  .control-group h3 {
    font-size: 14px;
  }

  .checkbox-control,
  .radio-control {
    font-size: 14px;
  }
}

/* iOS-specific styles */
.ios-device {
  /* Prevent iOS overscroll/bounce effect */
  position: fixed;
  overflow: hidden;
  width: 100%;
  height: 100%;
  -webkit-overflow-scrolling: touch;
}

/* Prevent text selection on mobile */
.visualizer-page {
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
  touch-action: manipulation;
}
</style>
