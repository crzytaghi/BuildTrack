import { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Pressable,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const MENU_WIDTH = Math.min(280, Dimensions.get('window').width * 0.8);

export type MenuItem = {
  label: string;
  onPress: () => void;
};

type Props = {
  open: boolean;
  onClose: () => void;
  items: MenuItem[];
};

const SlideMenu = ({ open, onClose, items }: Props) => {
  const translateX = useRef(new Animated.Value(MENU_WIDTH)).current;

  useEffect(() => {
    Animated.timing(translateX, {
      toValue: open ? 0 : MENU_WIDTH,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [open, translateX]);

  if (!open) return null;

  return (
    <View style={{ position: 'absolute', inset: 0, zIndex: 20 }}>
      <Pressable
        onPress={onClose}
        style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(2,6,23,0.6)' }}
      />
      <Animated.View
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          width: MENU_WIDTH,
          backgroundColor: '#0f172a',
          paddingTop: 60,
          paddingHorizontal: 16,
          transform: [{ translateX }],
        }}
      >
        <Text style={{ color: '#94a3b8', fontSize: 12, marginBottom: 16 }}>Menu</Text>
        {items.map((item) => (
          <TouchableOpacity
            key={item.label}
            onPress={() => {
              item.onPress();
              onClose();
            }}
            style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1f2937' }}
          >
            <Text style={{ color: '#e2e8f0', fontSize: 16 }}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </Animated.View>
    </View>
  );
};

export default SlideMenu;
