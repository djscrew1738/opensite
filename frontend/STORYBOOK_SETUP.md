# Storybook Setup Guide

## Prerequisites

The Vite config has been temporarily simplified to remove Storybook Vitest integration until packages are installed. The original config is backed up in the git history.

## Installation

After npm permissions are resolved, install Storybook dependencies:

```bash
cd frontend
npm install --save-dev \
  @storybook/react \
  @storybook/react-vite \
  @storybook/addon-essentials \
  @storybook/addon-a11y \
  storybook
```

## Scripts

Add to `package.json`:

```json
{
  "scripts": {
    "storybook": "storybook dev -p 6006",
    "build-storybook": "storybook build"
  }
}
```

## Running Storybook

```bash
npm run storybook
```

Access at: http://localhost:6006

## Configuration

### Main Config (`.storybook/main.js`)

- Stories pattern: `../src/components/**/*.stories.@(js|jsx|ts|tsx)`
- Framework: `@storybook/react-vite`
- Addons: essentials, a11y

### Preview Config (`.storybook/preview.js`)

- Dark mode default background (#0A0B0D)
- Centered layout
- Dark theme wrapper

## Available Stories

### UI Components

- **Button** - All variants, sizes, states
- **AccessibleCard** - Interactive, keyboard navigation demo

### Documentation

- **Design System/Overview** - Design tokens, patterns, best practices

## Writing Stories

### Basic Story

```jsx
import { Button } from './Button';

export default {
  title: 'UI/Button',
  component: Button,
};

export const Primary = {
  args: {
    variant: 'primary',
    children: 'Click me',
  },
};
```

### Story with Interactions

```jsx
export const Interactive = {
  args: {
    isInteractive: true,
    ariaLabel: 'Clickable card',
  },
  parameters: {
    docs: {
      description: {
        story: 'This card can be clicked and receives keyboard focus.',
      },
    },
  },
};
```

## Accessibility Testing

Storybook includes the a11y addon for automated accessibility checks:

- View accessibility panel in Storybook UI
- Tests for color contrast, ARIA, keyboard navigation
- Violations displayed per story

## Building Static Storybook

```bash
npm run build-storybook
```

Output: `storybook-static/` directory

## Deployment

Deploy to GitHub Pages, Netlify, or Vercel:

```bash
# Build
npm run build-storybook

# Deploy (example with netlify)
netlify deploy --dir=storybook-static
```

## Post-Installation

After installing Storybook packages, restore the Vitest integration in `vite.config.js`:

```javascript
/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from '@vitest/browser-playwright';

const dirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  // ... existing config
  test: {
    projects: [{
      extends: true,
      plugins: [
        storybookTest({
          configDir: path.join(dirname, '.storybook')
        })
      ],
      test: {
        name: 'storybook',
        browser: {
          enabled: true,
          headless: true,
          provider: playwright({}),
          instances: [{ browser: 'chromium' }]
        },
        setupFiles: ['.storybook/vitest.setup.js']
      }
    }]
  }
});
```

## Next Steps

1. Install dependencies when permissions allow
2. Add more component stories
3. Set up visual regression testing with Chromatic
4. Document custom hooks with Storybook
5. Create interaction tests with `@storybook/test`
