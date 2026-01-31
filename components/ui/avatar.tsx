import { Image } from "expo-image";
import * as React from "react";
import { StyleSheet, View, ViewStyle } from "react-native";

// React Native Avatar Implementation
// Replaces @radix-ui/react-avatar which is web-only

interface AvatarProps {
  className?: string;
  style?: ViewStyle;
  children?: React.ReactNode;
}

interface AvatarImageProps {
  src?: string;
  alt?: string;
  className?: string;
  style?: ViewStyle;
}

interface AvatarFallbackProps {
  className?: string;
  style?: ViewStyle;
  children?: React.ReactNode;
}

// Parse Tailwind-like className to extract dimensions
const parseClassName = (className?: string): { width?: number; height?: number } => {
  if (!className) return {};

  const widthMatch = className.match(/w-(\d+)/);
  const heightMatch = className.match(/h-(\d+)/);

  const width = widthMatch ? parseInt(widthMatch[1]) * 4 : undefined; // Tailwind units (w-10 = 40px)
  const height = heightMatch ? parseInt(heightMatch[1]) * 4 : undefined;

  return { width, height };
};

const AvatarContext = React.createContext<{
  imageLoaded: boolean;
  setImageLoaded: (loaded: boolean) => void;
}>({
  imageLoaded: false,
  setImageLoaded: () => { },
});

const Avatar = React.forwardRef<View, AvatarProps>(
  ({ className, style, children }, ref) => {
    const [imageLoaded, setImageLoaded] = React.useState(false);
    const dimensions = parseClassName(className);

    return (
      <AvatarContext.Provider value={{ imageLoaded, setImageLoaded }}>
        <View
          ref={ref}
          style={[
            styles.avatar,
            dimensions.width && { width: dimensions.width },
            dimensions.height && { height: dimensions.height },
            style,
          ]}
        >
          {children}
        </View>
      </AvatarContext.Provider>
    );
  }
);
Avatar.displayName = "Avatar";

const AvatarImage = React.forwardRef<View, AvatarImageProps>(
  ({ src, alt, className, style }, ref) => {
    const { setImageLoaded } = React.useContext(AvatarContext);
    const dimensions = parseClassName(className);

    if (!src) return null;

    return (
      <View ref={ref} style={[StyleSheet.absoluteFill, style]}>
        <Image
          source={{ uri: src }}
          style={[
            styles.image,
            dimensions.width && { width: dimensions.width },
            dimensions.height && { height: dimensions.height },
          ]}
          contentFit="cover"
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageLoaded(false)}
          accessibilityLabel={alt}
        />
      </View>
    );
  }
);
AvatarImage.displayName = "AvatarImage";

const AvatarFallback = React.forwardRef<View, AvatarFallbackProps>(
  ({ className, style, children }, ref) => {
    const { imageLoaded } = React.useContext(AvatarContext);
    const dimensions = parseClassName(className);

    // Only show fallback if image hasn't loaded
    if (imageLoaded) return null;

    // Parse bg-primary, bg-muted from className
    const bgPrimary = className?.includes("bg-primary");
    const bgMuted = className?.includes("bg-muted");

    return (
      <View
        ref={ref}
        style={[
          styles.fallback,
          bgPrimary && styles.bgPrimary,
          bgMuted && styles.bgMuted,
          dimensions.width && { width: dimensions.width },
          dimensions.height && { height: dimensions.height },
          style,
        ]}
      >
        {children}
      </View>
    );
  }
);
AvatarFallback.displayName = "AvatarFallback";

const styles = StyleSheet.create({
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 9999, // Fully rounded
    overflow: "hidden",
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: "100%",
    height: "100%",
    borderRadius: 9999,
  },
  fallback: {
    width: "100%",
    height: "100%",
    borderRadius: 9999,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#404040", // Default muted
  },
  bgPrimary: {
    backgroundColor: "#0EA5E9", // Sky blue
  },
  bgMuted: {
    backgroundColor: "#404040", // Dark gray
  },
});

export { Avatar, AvatarFallback, AvatarImage };

