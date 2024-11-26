import { Text } from "./text.jsx";

export const Digits = ({ children, ...props }) => {
  return (
    <Text
      size={7}
      color="white"
      fontFamily="goblin"
      // weight="bold"
      outlineColor="black"
      letterSpacing={2}
      lineHeight={1.4}
      {...props}
    >
      {children}
    </Text>
  );
};
