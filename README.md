# AI Design Linter

A comprehensive Figma plugin that automatically analyses your designs against design system standards and provides intelligent linting for consistency, accessibility, and best practices.

## 🎯 Features

- **Design Token Validation**: Automatically detects hardcoded colours, typography, and spacing that should use design tokens
- **Component Usage Analysis**: Ensures proper component usage and instance overrides
- **Typography Consistency**: Validates font sizes, weights, and line heights against design system standards
- **Colour System Checks**: Identifies non-standard colours and suggests design token replacements
- **Spacing Validation**: Ensures consistent spacing using design system spacing tokens
- **Auto-Fix Capabilities**: Automatically applies design tokens and fixes common issues
- **Real-time Analysis**: Instant feedback on selected layers with detailed issue reporting

## 🚀 Getting Started

### Prerequisites

- Node.js (download from https://nodejs.org/)
- Figma Desktop App

### Installation

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the plugin:
   ```bash
   npm run build
   ```

4. In Figma, go to Plugins → Development → Import plugin from manifest
5. Select the `manifest.json` file from this directory

### Development

To develop and test the plugin:

1. Run the TypeScript compiler in watch mode:
   ```bash
   npm run watch
   ```

2. In Figma, reload the plugin to see changes

## 🛠️ How to Use

1. **Select Layers**: Choose the layers, frames, or components you want to analyse
2. **Run Analysis**: Click "Analyse Selection" in the plugin panel
3. **Review Issues**: The plugin will show all design inconsistencies found
4. **Apply Fixes**: Use "Apply Fix" buttons to automatically correct issues where possible
5. **Navigate**: Use "Zoom to Layer" to quickly locate problematic elements

## 📋 Design Rules

The linter checks for:

- **Colour Tokens**: Hardcoded colours that should use design system tokens
- **Typography**: Non-standard font sizes, weights, and line heights
- **Component Usage**: Proper use of design system components
- **Spacing**: Consistent spacing using design tokens
- **Button Styles**: Correct primary/secondary button styling
- **Accessibility**: Colour contrast and text sizing standards

## 🔧 Configuration

The plugin automatically reads your Figma file's design system:
- Colour styles and tokens
- Text styles and typography
- Component definitions
- Spacing and layout tokens

## 🐛 Troubleshooting

- **Plugin not loading**: Ensure you've built the plugin with `npm run build`
- **Analysis errors**: Check that selected layers are not locked or in read-only components
- **Font loading issues**: Some text layers with mixed fonts cannot be auto-fixed

## 📚 Development

This plugin is built with:
- TypeScript for type safety
- Figma Plugin API for design analysis
- Modern ES6+ features for optimal performance

### Building

```bash
# Build once
npm run build

# Watch for changes
npm run watch

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🔗 References

Inspired by design linting best practices and the [design-lint](https://github.com/destefanis/design-lint) project.
