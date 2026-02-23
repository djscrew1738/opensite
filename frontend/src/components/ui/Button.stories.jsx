import { Button } from './Button';
import { Plus, Save, Trash2 } from 'lucide-react';

export default {
  title: 'UI/Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'danger', 'ghost', 'link'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    loading: {
      control: 'boolean',
    },
    disabled: {
      control: 'boolean',
    },
  },
};

// Base template
const Template = (args) => <Button {...args} />;

export const Primary = Template.bind({});
Primary.args = {
  children: 'Primary Button',
  variant: 'primary',
};

export const Secondary = Template.bind({});
Secondary.args = {
  children: 'Secondary Button',
  variant: 'secondary',
};

export const Danger = Template.bind({});
Danger.args = {
  children: 'Danger Button',
  variant: 'danger',
};

export const Ghost = Template.bind({});
Ghost.args = {
  children: 'Ghost Button',
  variant: 'ghost',
};

export const Loading = Template.bind({});
Loading.args = {
  children: 'Loading...',
  variant: 'primary',
  loading: true,
};

export const Disabled = Template.bind({});
Disabled.args = {
  children: 'Disabled',
  variant: 'primary',
  disabled: true,
};

export const WithIcon = Template.bind({});
WithIcon.args = {
  children: 'Add Item',
  variant: 'primary',
  icon: Plus,
};

export const IconOnly = Template.bind({});
IconOnly.args = {
  variant: 'ghost',
  icon: Trash2,
  'aria-label': 'Delete item',
};

export const Sizes = () => (
  <div className="flex items-center gap-4">
    <Button size="sm" variant="primary">Small</Button>
    <Button size="md" variant="primary">Medium</Button>
    <Button size="lg" variant="primary">Large</Button>
  </div>
);

export const AllVariants = () => (
  <div className="flex flex-wrap gap-4">
    <Button variant="primary">Primary</Button>
    <Button variant="secondary">Secondary</Button>
    <Button variant="danger">Danger</Button>
    <Button variant="ghost">Ghost</Button>
    <Button variant="link">Link</Button>
  </div>
);
