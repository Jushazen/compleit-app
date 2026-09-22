import React, { useRef } from 'react';
import { TextInput, TextInputProps } from 'react-native';

export interface ConfirmInputProps
  extends Omit<TextInputProps, 'onChangeText' | 'value'> {
  value: string;
  onChangeText: (text: string) => void;
}

/**
 * A text input that rejects paste-sized insertions, used when the app
 * wants to prevent large bulk edits from a single paste action.
 */
export function ConfirmInput({
  value,
  onChangeText,
  ...rest
}: ConfirmInputProps) {
  const previousValueRef = useRef(value);

  const handleChangeText = (next: string) => {
    const previous = previousValueRef.current;
    const grew = next.length - previous.length;
    if (grew > 1) {
      // Reject: don't update our tracked value, don't call onChangeText.
      // The input visually stays at its previous value.
      return;
    }
    previousValueRef.current = next;
    onChangeText(next);
  };

  return (
    <TextInput
      {...rest}
      value={value}
      onChangeText={handleChangeText}
      contextMenuHidden
      autoCorrect={false}
      autoCapitalize="none"
      accessibilityLabel={rest.accessibilityLabel ?? 'Confirmation text input'}
    />
  );
}
