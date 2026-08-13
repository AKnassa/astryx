// Copyright (c) Meta Platforms, Inc. and affiliates.

import type {Meta, StoryObj} from '@storybook/react';
import {useState} from 'react';
import {InputMask, type InputMaskProps} from '@astryxdesign/lab';
import {VStack} from '@astryxdesign/core/Stack';
import {Text} from '@astryxdesign/core/Text';

const meta: Meta<typeof InputMask> = {
  title: 'Lab/InputMask',
  component: InputMask,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof InputMask>;

function ControlledMask(props: Omit<InputMaskProps, 'value' | 'onChange'>) {
  const [value, setValue] = useState('');
  return <InputMask {...props} value={value} onChange={setValue} />;
}

export const NamedMasks: Story = {
  render: () => (
    <VStack gap={4}>
      <ControlledMask mask="phone-us" label="Phone number" />
      <ControlledMask mask="zip-us" label="ZIP code" />
      <ControlledMask mask="ssn" label="SSN" />
      <ControlledMask mask="credit-card" label="Card number" />
    </VStack>
  ),
};

export const CustomPattern: Story = {
  render: () => (
    <VStack gap={4}>
      <ControlledMask
        mask={{pattern: '###-###', placeholder: '•'}}
        label="Sort code"
        formatHint="Six digits, e.g. 123-456"
      />
      <ControlledMask
        mask={{pattern: '(+1) ### ### ####'}}
        label="Phone with country code"
      />
    </VStack>
  ),
};

export const ValidationAndClear: Story = {
  render: function ValidationStory() {
    const [value, setValue] = useState('55512');
    const incomplete = value.length > 0 && value.length < 10;
    return (
      <VStack gap={4}>
        <InputMask
          mask="phone-us"
          label="Phone number"
          value={value}
          onChange={setValue}
          hasClear
          status={
            incomplete
              ? {type: 'error', message: 'Enter all 10 digits'}
              : undefined
          }
        />
        <Text>Raw value: {value === '' ? '(empty)' : value}</Text>
      </VStack>
    );
  },
};

export const States: Story = {
  render: () => (
    <VStack gap={4}>
      <InputMask
        mask="phone-us"
        label="Disabled"
        value="5551234567"
        isDisabled
      />
      <InputMask
        mask="phone-us"
        label="Disabled with reason"
        value="5551234567"
        isDisabled
        disabledMessage="Verified numbers cannot be edited"
      />
      <InputMask mask="ssn" label="Read-only" value="123456789" isReadOnly />
      <InputMask
        mask="credit-card"
        label="Validating"
        value="4111111111111111"
        isLoading
      />
    </VStack>
  ),
};
