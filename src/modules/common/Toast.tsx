import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Platform,
  Dimensions,
} from 'react-native';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react-native';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextType {
  showToast: (type: ToastType, title: string, message?: string, duration?: number) => void;
  hideToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType>({
  showToast: () => {},
  hideToast: () => {},
});

let globalShowToast: ((type: ToastType, title: string, message?: string, duration?: number) => void) | null = null;

/**
 * Standalone global Toast helper that can be called anywhere in the app
 * without requiring hooks!
 */
export function showToast(type: ToastType, title: string, message?: string, duration?: number) {
  if (globalShowToast) {
    globalShowToast(type, title, message, duration);
  } else {
    console.log(`[Toast Fallback - ${type.toUpperCase()}] ${title}: ${message || ''}`);
  }
}

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const hideToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToastCallback = useCallback(
    (type: ToastType, title: string, message?: string, duration = 3500) => {
      const id = `${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      const newToast: ToastMessage = { id, type, title, message, duration };
      
      setToasts((prev) => [...prev.slice(-2), newToast]); // keep max 3 toasts

      if (duration > 0) {
        setTimeout(() => {
          hideToast(id);
        }, duration);
      }
    },
    [hideToast]
  );

  useEffect(() => {
    globalShowToast = showToastCallback;
    return () => {
      globalShowToast = null;
    };
  }, [showToastCallback]);

  return (
    <ToastContext.Provider value={{ showToast: showToastCallback, hideToast }}>
      {children}
      <View style={styles.toastContainer} pointerEvents="box-none">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onClose={() => hideToast(toast.id)} />
        ))}
      </View>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onClose }: { toast: ToastMessage; onClose: () => void }) {
  const translateY = useRef(new Animated.Value(-60)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, translateY]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -40,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  const getToastConfig = () => {
    switch (toast.type) {
      case 'success':
        return {
          bgColor: '#10B981',
          borderColor: '#059669',
          icon: <CheckCircle2 size={22} color="#FFFFFF" />,
        };
      case 'error':
        return {
          bgColor: '#EF4444',
          borderColor: '#DC2626',
          icon: <AlertCircle size={22} color="#FFFFFF" />,
        };
      case 'warning':
        return {
          bgColor: '#F59E0B',
          borderColor: '#D97706',
          icon: <AlertTriangle size={22} color="#FFFFFF" />,
        };
      case 'info':
      default:
        return {
          bgColor: '#3B82F6',
          borderColor: '#2563EB',
          icon: <Info size={22} color="#FFFFFF" />,
        };
    }
  };

  const config = getToastConfig();

  return (
    <Animated.View
      style={[
        styles.toastCard,
        {
          backgroundColor: config.bgColor,
          borderColor: config.borderColor,
          transform: [{ translateY }],
          opacity,
        },
      ]}
    >
      <View style={styles.iconContainer}>{config.icon}</View>
      <View style={styles.textContainer}>
        <Text style={styles.toastTitle} numberOfLines={1}>
          {toast.title}
        </Text>
        {Boolean(toast.message) && (
          <Text style={styles.toastMessage} numberOfLines={2}>
            {toast.message}
          </Text>
        )}
      </View>
      <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
        <X size={18} color="#FFFFFF" />
      </TouchableOpacity>
    </Animated.View>
  );
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 999999,
    elevation: 999999,
    paddingHorizontal: 16,
    gap: 8,
  },
  toastCard: {
    width: '100%',
    maxWidth: 480,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  iconContainer: {
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
    gap: 2,
  },
  toastTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  toastMessage: {
    color: 'rgba(255, 255, 255, 0.92)',
    fontSize: 12,
    lineHeight: 16,
  },
  closeBtn: {
    padding: 4,
    marginLeft: 8,
  },
});
