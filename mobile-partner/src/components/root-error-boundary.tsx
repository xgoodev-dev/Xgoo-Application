import { Component, type ErrorInfo, type PropsWithChildren, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type State = { error: Error | null };

export class RootErrorBoundary extends Component<PropsWithChildren, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.warn('XGoo Pickup render error', error, info.componentStack);
  }

  render(): ReactNode {
    if (!this.state.error) return this.props.children;

    return (
      <View style={styles.wrap}>
        <Text style={styles.title}>XGoo Pickup could not open</Text>
        <Text style={styles.copy}>
          The last screen hit an error. Close Expo Go fully, then reopen the project.
        </Text>
        <Text style={styles.detail}>{this.state.error.message}</Text>
        <Pressable style={styles.button} onPress={() => this.setState({ error: null })}>
          <Text style={styles.buttonText}>Try again</Text>
        </Pressable>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    justifyContent: 'center',
    padding: 28,
    backgroundColor: '#0E0F11',
  },
  title: { color: '#FAFAFA', fontSize: 22, fontWeight: '800' },
  copy: { color: '#A1A1AA', fontSize: 14, lineHeight: 20, marginTop: 10 },
  detail: { color: '#F87171', fontSize: 12, marginTop: 16 },
  button: {
    marginTop: 24,
    backgroundColor: '#FF4907',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});
