import { extendTheme } from "@chakra-ui/react";

const theme = extendTheme({
  colors: {
    brand: {
      50: '#e6f9e5',
      100: '#b8eec1',
      200: '#8ee399',
      300: '#63d872',
      400: '#39cd4b', // main green
      500: '#20b332', // darker green for buttons
      600: '#148324',
      700: '#085315',
      800: '#002405',
      900: '#001200',
      accent: "#71c9ce", // blue accent
      sand: "#fffbe6", // light tan
    },
  },
  fonts: {
    heading: "'Montserrat', sans-serif",
    body: "'Inter', 'Segoe UI', Arial, sans-serif",
  },
  components: {
    Button: {
      baseStyle: {
        borderRadius: "lg",
        fontWeight: "bold",
      },
      variants: {
        solid: (props) => ({
          bg: props.colorScheme === "brand" ? "brand.400" : undefined,
          color: "white",
          _hover: { bg: "brand.500", boxShadow: "md" },
        }),
      },
    },
    Input: {
      baseStyle: {
        field: {
          borderRadius: "md",
        },
      },
    },
    Select: {
      baseStyle: {
        field: {
          borderRadius: "md",
        },
      },
    },
  },
});

export default theme;