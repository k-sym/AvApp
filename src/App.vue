<template>
  <router-view />
</template>

<script>
import { defineComponent } from 'vue';
import { useQuasar } from 'quasar';

export default defineComponent({
  name: 'App',
  setup() {
    const $q = useQuasar();

    // Set a flag to control Cordova initialization
    let cordovaInitialized = false;

    // Handle cordova initialization
    const onDeviceReady = () => {
      console.log('Cordova deviceready in App.vue');
      cordovaInitialized = true;

      // Hide splash screen after a delay to ensure app is rendered
      if (window.navigator && window.navigator.splashscreen) {
        setTimeout(() => {
          window.navigator.splashscreen.hide();
        }, 1000);
      }

      // Log platform info for debugging
      if (window.device) {
        console.log('Platform:', window.device.platform);
        console.log('Version:', window.device.version);
      }

      // Apply iOS specific fixes
      if (window.device && window.device.platform === 'iOS') {
        // Set status bar appearance
        if (window.StatusBar) {
          window.StatusBar.overlaysWebView(true);
          window.StatusBar.styleBlackTranslucent();
          window.StatusBar.hide();
        }
      }
    };

    // Add global error handler for debugging
    window.onerror = (message, source, lineno, colno, error) => {
      console.error('Global error:', message, source, lineno, colno);
      // Create visible error message for debugging on mobile
      if ($q.platform.is.mobile) {
        const errorDiv = document.createElement('div');
        errorDiv.style.position = 'fixed';
        errorDiv.style.top = '10px';
        errorDiv.style.left = '10px';
        errorDiv.style.right = '10px';
        errorDiv.style.backgroundColor = 'rgba(255, 0, 0, 0.8)';
        errorDiv.style.color = 'white';
        errorDiv.style.padding = '15px';
        errorDiv.style.borderRadius = '5px';
        errorDiv.style.zIndex = '10000';
        errorDiv.style.fontSize = '12px';
        errorDiv.innerText = `Error: ${message}\nAt: ${source}:${lineno}`;
        document.body.appendChild(errorDiv);

        // Auto-remove after 10 seconds
        setTimeout(() => {
          if (document.body.contains(errorDiv)) {
            document.body.removeChild(errorDiv);
          }
        }, 10000);
      }
    };

    // Set up mobile-specific settings
    if ($q.platform.is.mobile) {
      // Prevent browser's default touch actions
      document.addEventListener('touchmove', (e) => {
        if (e.target.classList.contains('no-scroll')) {
          e.preventDefault();
        }
      }, { passive: false });

      // Prevent pinch zoom
      document.addEventListener('gesturestart', (e) => {
        e.preventDefault();
      });

      // For Cordova, add deviceready listener
      if (window.cordova) {
        document.addEventListener('deviceready', onDeviceReady, false);
      }
    }

    return {};
  }
});
</script>

<style>
/* Global styles */
html, body {
  margin: 0;
  padding: 0;
  height: 100%;
  width: 100%;
  overflow: hidden;
  background-color: #000;
}

/* Prevent pull-to-refresh on mobile */
body {
  overscroll-behavior-y: none;
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  -khtml-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
  -webkit-tap-highlight-color: rgba(0,0,0,0);
  -webkit-tap-highlight-color: transparent;
}

/* iOS specific fixes */
.ios-device {
  position: fixed;
  width: 100%;
  height: 100%;
  overflow: hidden;
  -webkit-overflow-scrolling: touch;
}
</style>
