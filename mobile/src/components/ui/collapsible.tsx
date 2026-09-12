import { type PropsWithChildren } from 'react';
import { View } from 'react-native';

export function Collapsible({ children }: PropsWithChildren & { title: string }) {
  return <View>{children}</View>;
}
