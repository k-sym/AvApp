# Audio Visualizer App

A multi-platform audio visualizer application built with Vue.js, Quasar Framework, and audioMotion-analyzer.

## Features

- Real-time audio visualization with multiple modes
- Microphone input support
- Text marquee with customizable settings
- Background video or camera support
- Mobile-friendly interface
- iOS and Android support via Cordova

## Prerequisites

- Node.js 18+ and npm
- Xcode (for iOS development)
- Android Studio (for Android development)
- Cordova CLI (`npm install -g cordova`)

## Installation

```bash
# Install dependencies
npm install
```

## Development

```bash
# Run in development mode in browser
npm run dev

# Run in development mode for iOS
npm run cordova-dev
```

## Building for iOS

1. Make sure you have Xcode installed
2. Add the iOS platform to Cordova:

```bash
npm run cordova-add-ios
```

3. Build the app:

```bash
npm run cordova-build
```

4. Open the Xcode project:

```bash
open src-cordova/platforms/ios/AudioVisualizer.xcworkspace
```

5. In Xcode, select your device or simulator and click the Run button

## Troubleshooting

### iOS Build Issues

If you encounter issues with the iOS build, try the following:

1. Make sure your Xcode command-line tools are up to date:

```bash
xcode-select --install
```

2. Update your CocoaPods:

```bash
sudo gem install cocoapods
```

3. Clean the Cordova project:

```bash
cd src-cordova
cordova clean ios
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.
