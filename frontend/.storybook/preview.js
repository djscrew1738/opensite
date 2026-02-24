// .storybook/preview.js

import '../src/index.css'; // Import Tailwind CSS

export const parameters = {
  backgrounds: {
    default: 'dark',
    values: [
      { name: 'dark', value: '#0A0B0D' },
      { name: 'light', value: '#F1F5F9' },
    ],
  },
  layout: 'centered',
};

// Wrap all stories in a div with the dark theme class
export const decorators = [
  (Story) => (
    <div className="dark">
      <Story />
    </div>
  ),
];
